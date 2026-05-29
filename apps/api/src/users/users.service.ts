import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { OpenAIService } from '../openai/openai.service';
import { Recipe } from '../recipes/schema/recipe.schema';
import type { JwtUser } from '../auth/jwt-user.interface';
import { User } from './user.schema';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>,
    private readonly openaiService: OpenAIService,
  ) {}

  private mapFavoriteIds(ids: Types.ObjectId[]): string[] {
    return ids.map((fav) => fav.toString());
  }

  async getMyRecipes(
    user: JwtUser,
    language: string,
  ): Promise<{ recipes: Recipe[] }> {
    const recipes = await this.recipeModel
      .find({ author: user.userId, language })
      .lean()
      .exec();

    return { recipes: recipes as unknown as Recipe[] };
  }

  async updateSettings(
    user: JwtUser,
    dto: UpdateUserSettingsDto,
  ): Promise<{
    displayName: string;
    theme: string;
    gender: 'male' | 'female' | null;
    language: 'en' | 'cs';
  }> {
    const userDoc = await this.userModel.findById(user.userId).exec();
    if (!userDoc) {
      throw new NotFoundException('User not found');
    }

    if (dto.displayName !== undefined) {
      userDoc.displayName = dto.displayName;
    }

    if (dto.theme !== undefined) {
      userDoc.theme = dto.theme;
    }

    if (dto.gender !== undefined) {
      userDoc.gender = dto.gender;
    }

    if (dto.language !== undefined) {
      userDoc.language = dto.language;
    }

    try {
      await userDoc.save();
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: unknown }).code === 11000 &&
        'keyPattern' in err &&
        typeof (err as { keyPattern?: unknown }).keyPattern === 'object' &&
        (err as { keyPattern?: { displayName?: unknown } }).keyPattern
          ?.displayName
      ) {
        throw new BadRequestException('Display name is already taken.');
      }
      throw err;
    }

    return {
      displayName: userDoc.displayName,
      theme: userDoc.theme,
      gender: userDoc.gender,
      language: userDoc.language || 'en',
    };
  }

  async generateFunnyName(
    displayName: string,
    email: string,
  ): Promise<{ displayName: string }> {
    if (!displayName || !email) {
      throw new BadRequestException(
        'Both displayName and email must be provided in query parameters.',
      );
    }

    let attempt = 0;
    const maxAttempts = 5;
    let generatedDisplayName = '';

    while (attempt < maxAttempts) {
      generatedDisplayName = await this.openaiService.generateUsername({
        name: displayName,
        email,
      });

      const exists = await this.userModel.exists({
        displayName: generatedDisplayName,
      });

      if (!exists) {
        break;
      }
      attempt++;
    }

    if (!generatedDisplayName) {
      throw new BadRequestException('Failed to generate username');
    }

    return { displayName: generatedDisplayName };
  }

  /**
   * Collect all recipe IDs that belong to the same translation family as the
   * given recipe (forward translation refs + reverse translation refs).
   */
  private async resolveTranslationFamilyIds(
    recipeId: string,
  ): Promise<Set<string>> {
    const knownIds = new Set<string>([recipeId]);
    let changed = true;

    while (changed) {
      changed = false;
      const objectIds = [...knownIds].map((id) => new Types.ObjectId(id));
      const linked = await this.recipeModel
        .find({
          $or: [
            { _id: { $in: objectIds } },
            { 'translations.recipeId': { $in: objectIds } },
          ],
        })
        .select('_id translations')
        .lean()
        .exec();

      for (const doc of linked) {
        const docId = String(doc._id);
        if (!knownIds.has(docId)) {
          knownIds.add(docId);
          changed = true;
        }
        for (const ref of (doc.translations as {
          recipeId: Types.ObjectId;
        }[]) || []) {
          const refId = String(ref.recipeId);
          if (!knownIds.has(refId)) {
            knownIds.add(refId);
            changed = true;
          }
        }
      }
    }

    return knownIds;
  }

  async addFavorite(
    user: JwtUser,
    recipeId: string,
  ): Promise<{ favorites: string[] }> {
    if (!isValidObjectId(recipeId)) {
      throw new BadRequestException('Invalid recipe ID');
    }

    const recipe = await this.recipeModel.findById(recipeId).lean().exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const userDoc = await this.userModel.findById(user.userId).exec();
    if (!userDoc) {
      throw new NotFoundException('User not found');
    }

    // Check if any translation sibling of this recipe is already favorited
    const familyIds = await this.resolveTranslationFamilyIds(recipeId);
    const alreadyFavorited = userDoc.favorites.some((fav) =>
      familyIds.has(fav.toString()),
    );
    if (alreadyFavorited) {
      throw new BadRequestException('Recipe already in favorites.');
    }

    userDoc.favorites.push(new Types.ObjectId(recipeId));
    await userDoc.save();

    return { favorites: this.mapFavoriteIds(userDoc.favorites) };
  }

  async removeFavorite(
    user: JwtUser,
    recipeId: string,
  ): Promise<{ favorites: string[] }> {
    if (!isValidObjectId(recipeId)) {
      throw new BadRequestException('Invalid recipe ID');
    }

    const userDoc = await this.userModel.findById(user.userId).exec();
    if (!userDoc) {
      throw new NotFoundException('User not found');
    }

    // Try exact match first, then fall back to any translation family member
    let index = userDoc.favorites.findIndex(
      (fav) => fav.toString() === recipeId,
    );

    if (index === -1) {
      const familyIds = await this.resolveTranslationFamilyIds(recipeId);
      index = userDoc.favorites.findIndex((fav) =>
        familyIds.has(fav.toString()),
      );
    }

    if (index === -1) {
      throw new BadRequestException('Recipe not in favorites.');
    }

    userDoc.favorites.splice(index, 1);
    await userDoc.save();

    return { favorites: this.mapFavoriteIds(userDoc.favorites) };
  }

  async getFavorites(
    user: JwtUser,
    language: string,
  ): Promise<{ recipes: Recipe[] }> {
    const userDoc = await this.userModel.findById(user.userId).lean().exec();
    if (!userDoc) {
      throw new NotFoundException('User not found');
    }

    const favoriteIds = Array.isArray(userDoc.favorites)
      ? userDoc.favorites.map((fav: Types.ObjectId) => fav.toString())
      : [];

    if (!favoriteIds.length) {
      return { recipes: [] };
    }

    // Fetch all favorited recipes regardless of language
    const favoredRecipes = await this.recipeModel
      .find({ _id: { $in: favoriteIds } })
      .lean()
      .exec();

    const result: Recipe[] = [];
    const seenIds = new Set<string>();

    for (const recipe of favoredRecipes) {
      if (recipe.language === language) {
        const id = String(recipe._id);
        if (!seenIds.has(id)) {
          seenIds.add(id);
          result.push(recipe as unknown as Recipe);
        }
      } else {
        // Look for a translation in the requested language
        const translationRef = (
          recipe.translations as
            | { language: string; recipeId: Types.ObjectId }[]
            | undefined
        )?.find((t) => t.language === language);

        if (translationRef) {
          const translatedId = String(translationRef.recipeId);
          if (!seenIds.has(translatedId)) {
            seenIds.add(translatedId);
            const translated = await this.recipeModel
              .findById(translationRef.recipeId)
              .lean()
              .exec();
            if (translated) {
              result.push(translated as unknown as Recipe);
            }
          }
        } else {
          // No translation available for this language — also try reverse lookup
          const reverseLinked = await this.recipeModel
            .findOne({
              language,
              'translations.recipeId': recipe._id,
            })
            .lean()
            .exec();

          if (reverseLinked) {
            const reverseId = String(reverseLinked._id);
            if (!seenIds.has(reverseId)) {
              seenIds.add(reverseId);
              result.push(reverseLinked as unknown as Recipe);
            }
          } else {
            // No translation exists at all — include the original
            const originalId = String(recipe._id);
            if (!seenIds.has(originalId)) {
              seenIds.add(originalId);
              result.push(recipe as unknown as Recipe);
            }
          }
        }
      }
    }

    return { recipes: result };
  }
}
