import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recipe } from '../recipes/schema/recipe.schema';
import { GoogleTranslateService } from './google-translate.service';
import slugify from 'slugify';
import * as mongoose from 'mongoose';

@Injectable()
export class TranslationScheduler {
  private readonly logger = new Logger(TranslationScheduler.name);

  constructor(
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>,
    private readonly googleTranslate: GoogleTranslateService
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async ensureRecipeTranslations() {
    const recipes = await this.recipeModel.find();
    let translatedEnCount = 0;
    let translatedCsCount = 0;
    for (const recipe of recipes) {
      try {
        // Check for English translation
        const hasEn =
          recipe.language === 'en' ||
          (recipe.translations || []).some((t) => t.language === 'en');
        // Check for Czech translation
        const hasCs =
          recipe.language === 'cs' ||
          (recipe.translations || []).some((t) => t.language === 'cs');

        // Helper to generate unique slug
        const getUniqueSlug = async (title: string, lang: string) => {
          const baseSlug = slugify(title, {
            lower: true,
            strict: true,
            locale: lang,
          });
          let slug = baseSlug;
          let i = 2;
          while (await this.recipeModel.exists({ slug })) {
            slug = `${baseSlug}-${i}`;
            i++;
          }
          return slug;
        };

        // Helper to check if translation already exists by slug and language
        const translationExists = async (slug: string, lang: string) => {
          return await this.recipeModel.exists({ slug, language: lang });
        };

        // Helper for retry logic
        const retry = async <T>(
          fn: () => Promise<T>,
          retries = 3,
          delay = 500
        ): Promise<T> => {
          let lastError;
          for (let i = 0; i < retries; i++) {
            try {
              return await fn();
            } catch (err) {
              lastError = err;
              await new Promise((res) =>
                setTimeout(res, delay * Math.pow(2, i))
              );
            }
          }
          throw lastError;
        };

        // If missing English translation, create it
        if (!hasEn) {
          let translatedTitle,
            translatedDescription,
            translatedSlug,
            translatedInstructions,
            translatedIngredients;
          try {
            translatedTitle = await retry(() =>
              this.googleTranslate.translateText(recipe.title, 'en')
            );
            translatedDescription = await retry(() =>
              this.googleTranslate.translateText(recipe.description, 'en')
            );
            translatedSlug = await getUniqueSlug(translatedTitle, 'en');
            // Translate instructions array
            translatedInstructions = await Promise.all(
              (recipe.instructions || []).map((instr) =>
                retry(() => this.googleTranslate.translateText(instr, 'en'))
              )
            );
            // Translate ingredients array
            translatedIngredients = (recipe.ingredients || []).map(
              async (ingredient) => {
                const newIngredient = { ...ingredient };
                if (ingredient.name) {
                  newIngredient.name = await retry(() =>
                    this.googleTranslate.translateText(ingredient.name, 'en')
                  );
                }
                return newIngredient;
              }
            );
            translatedIngredients = await Promise.all(translatedIngredients);
          } catch (err) {
            this.logger.error(
              `Translation failed for recipe ${recipe._id} to EN:`,
              err
            );
            continue;
          }
          if (await translationExists(translatedSlug, 'en')) {
            this.logger.warn(
              `EN translation already exists for recipe ${recipe._id}, skipping. Slug: ${translatedSlug}`
            );
            continue;
          }
          this.logger.log(
            `Saving EN translation for recipe ${recipe._id} with slug ${translatedSlug}`
          );
          const newRecipe = new this.recipeModel({
            ...recipe.toObject(),
            _id: undefined,
            language: 'en',
            title: translatedTitle,
            description: translatedDescription,
            slug: translatedSlug,
            instructions: translatedInstructions,
            ingredients: translatedIngredients,
            translations: [
              ...(recipe.translations || []),
              { language: recipe.language, recipeId: recipe._id },
            ],
          });
          try {
            await newRecipe.save();
            this.logger.log(
              `EN translation saved for recipe ${recipe._id} as ${newRecipe._id}`
            );
            translatedEnCount++;
          } catch (saveErr) {
            this.logger.error(
              `Failed to save EN translation for recipe ${recipe._id}:`,
              saveErr
            );
          }
          // Prevent duplicate translation references
          if (!(recipe.translations || []).some((t) => t.language === 'en')) {
            recipe.translations = [
              ...(recipe.translations || []),
              {
                language: 'en',
                recipeId: newRecipe._id as mongoose.Types.ObjectId,
              },
            ];
            try {
              await recipe.save();
              this.logger.log(
                `Updated original recipe ${recipe._id} with EN translation reference.`
              );
            } catch (saveErr) {
              this.logger.error(
                `Failed to update original recipe ${recipe._id} with EN translation reference:`,
                saveErr
              );
            }
          }
        }

        // If missing Czech translation, create it
        if (!hasCs) {
          // Check for existing Czech translation referencing this recipe
          const existingCs = await this.recipeModel.findOne({
            language: 'cs',
            translations: {
              $elemMatch: { recipeId: recipe._id },
            },
          });
          if (existingCs) {
            this.logger.warn(
              `CS translation already exists for recipe ${recipe._id} (by reference), skipping.`
            );
            continue;
          }
          let translatedTitle,
            translatedDescription,
            translatedSlug,
            translatedInstructions,
            translatedIngredients;
          try {
            translatedTitle = await retry(() =>
              this.googleTranslate.translateText(recipe.title, 'cs')
            );
            translatedDescription = await retry(() =>
              this.googleTranslate.translateText(recipe.description, 'cs')
            );
            translatedSlug = await getUniqueSlug(translatedTitle, 'cs');
            // Translate instructions array
            translatedInstructions = await Promise.all(
              (recipe.instructions || []).map((instr) =>
                retry(() => this.googleTranslate.translateText(instr, 'cs'))
              )
            );
            // Translate ingredients array
            translatedIngredients = (recipe.ingredients || []).map(
              async (ingredient) => {
                const newIngredient = { ...ingredient };
                if (ingredient.name) {
                  newIngredient.name = await retry(() =>
                    this.googleTranslate.translateText(ingredient.name, 'cs')
                  );
                }
                return newIngredient;
              }
            );
            translatedIngredients = await Promise.all(translatedIngredients);
          } catch (err) {
            this.logger.error(
              `Translation failed for recipe ${recipe._id} to CS:`,
              err
            );
            continue;
          }
          if (await translationExists(translatedSlug, 'cs')) {
            this.logger.warn(
              `CS translation already exists for recipe ${recipe._id}, skipping. Slug: ${translatedSlug}`
            );
            continue;
          }
          this.logger.log(
            `Saving CS translation for recipe ${recipe._id} with slug ${translatedSlug}`
          );
          const newRecipe = new this.recipeModel({
            ...recipe.toObject(),
            _id: undefined,
            language: 'cs',
            title: translatedTitle,
            description: translatedDescription,
            slug: translatedSlug,
            instructions: translatedInstructions,
            ingredients: translatedIngredients,
            translations: [
              ...(recipe.translations || []),
              { language: recipe.language, recipeId: recipe._id },
            ],
          });
          try {
            await newRecipe.save();
            this.logger.log(
              `CS translation saved for recipe ${recipe._id} as ${newRecipe._id}`
            );
            translatedCsCount++;
          } catch (saveErr) {
            this.logger.error(
              `Failed to save CS translation for recipe ${recipe._id}:`,
              saveErr
            );
          }
          // Prevent duplicate translation references
          if (!(recipe.translations || []).some((t) => t.language === 'cs')) {
            recipe.translations = [
              ...(recipe.translations || []),
              {
                language: 'cs',
                recipeId: newRecipe._id as mongoose.Types.ObjectId,
              },
            ];
            try {
              await recipe.save();
              this.logger.log(
                `Updated original recipe ${recipe._id} with CS translation reference.`
              );
            } catch (saveErr) {
              this.logger.error(
                `Failed to update original recipe ${recipe._id} with CS translation reference:`,
                saveErr
              );
            }
          }
        }
      } catch (err) {
        this.logger.error(`Error processing recipe ${recipe._id}: ${err}`);
      }
    }
    this.logger.log(
      `Batch translation complete: ${translatedEnCount} recipes translated to EN, ${translatedCsCount} recipes translated to CS.`
    );
    this.logger.log('Recipe translations ensured.');
  }
}
