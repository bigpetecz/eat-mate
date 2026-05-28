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
    private readonly openaiService: OpenAIService
  ) {}

  private mapFavoriteIds(ids: Types.ObjectId[]): string[] {
    return ids.map((fav) => fav.toString());
  }

  async getMyRecipes(
    user: JwtUser,
    language: string
  ): Promise<{ recipes: Recipe[] }> {
    const recipes = await this.recipeModel
      .find({ author: user.userId, language })
      .lean()
      .exec();

    return { recipes };
  }

  async updateSettings(
    user: JwtUser,
    dto: UpdateUserSettingsDto
  ): Promise<{
    displayName: string;
    theme: string;
    gender: 'male' | 'female' | null;
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
    };
  }

  async generateFunnyName(
    displayName: string,
    email: string
  ): Promise<{ displayName: string }> {
    if (!displayName || !email) {
      throw new BadRequestException(
        'Both displayName and email must be provided in query parameters.'
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

  async addFavorite(
    user: JwtUser,
    recipeId: string
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

    if (userDoc.favorites.some((fav) => fav.toString() === recipeId)) {
      throw new BadRequestException('Recipe already in favorites.');
    }

    userDoc.favorites.push(new Types.ObjectId(recipeId));
    await userDoc.save();

    return { favorites: this.mapFavoriteIds(userDoc.favorites) };
  }

  async removeFavorite(
    user: JwtUser,
    recipeId: string
  ): Promise<{ favorites: string[] }> {
    if (!isValidObjectId(recipeId)) {
      throw new BadRequestException('Invalid recipe ID');
    }

    const userDoc = await this.userModel.findById(user.userId).exec();
    if (!userDoc) {
      throw new NotFoundException('User not found');
    }

    const index = userDoc.favorites.findIndex(
      (fav) => fav.toString() === recipeId
    );

    if (index === -1) {
      throw new BadRequestException('Recipe not in favorites.');
    }

    userDoc.favorites.splice(index, 1);
    await userDoc.save();

    return { favorites: this.mapFavoriteIds(userDoc.favorites) };
  }

  async getFavorites(
    user: JwtUser,
    language: string
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

    const recipes = await this.recipeModel
      .find({ _id: { $in: favoriteIds }, language })
      .lean()
      .exec();

    return { recipes };
  }
}
