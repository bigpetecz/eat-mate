import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Recipe } from '../schema/recipe.schema';
import { OpenAIService } from '../../openai/openai.service';
import crypto from 'crypto';

@Injectable()
export class RecipeAiAuditService {
  private readonly logger = new Logger(RecipeAiAuditService.name);

  constructor(
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>,
    private readonly openaiService: OpenAIService
  ) {}

  /**
   * Compute a hash of the recipe's relevant fields.
   */
  computeRecipeHash(recipe: Recipe): string {
    const data = JSON.stringify({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      country: recipe.country,
      servings: recipe.servings,
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Finds all recipes missing the 'ai' field, with empty ai fields, or with outdated hash.
   */
  async findRecipesMissingAi(): Promise<Recipe[]> {
    const all = await this.recipeModel.find({}).exec();
    return all.filter((recipe) => {
      const hash = this.computeRecipeHash(recipe);
      return (
        !recipe.ai ||
        !recipe.ai.keywords ||
        !recipe.ai.dietLabels ||
        !recipe.ai.nutrition ||
        recipe.ai.hash !== hash
      );
    });
  }

  /**
   * Cron job: runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async auditRecipesMissingAi() {
    const missing = await this.findRecipesMissingAi();
    const batch = missing.slice(0, 1); // Only process up to 10 recipes per run
    this.logger.log(
      `Found ${missing.length} recipes missing or needing AI fields. Processing ${batch.length} in this batch.`
    );
    for (const recipe of batch) {
      try {
        const aiFields = await this.openaiService.generateAiFields(recipe);
        if (!aiFields || typeof aiFields !== 'object') {
          this.logger.error(
            `generateAiFields returned invalid value for recipe ${recipe._id}:`,
            aiFields
          );
          continue;
        }
        const hash = this.computeRecipeHash(recipe);
        // Build dot notation update for each ai field (only those present in aiFields)
        const update: Record<string, any> = {};
        if (aiFields.keywords) update['ai.keywords'] = aiFields.keywords;
        if (aiFields.dietLabels) update['ai.dietLabels'] = aiFields.dietLabels;
        if (aiFields.nutrition) update['ai.nutrition'] = aiFields.nutrition;
        if (aiFields.techniques) update['ai.techniques'] = aiFields.techniques;
        // Only set extra fields if they exist on aiFields
        if ('specialAttributes' in aiFields)
          update['ai.specialAttributes'] = (aiFields as any).specialAttributes;
        if ('winePairing' in aiFields)
          update['ai.winePairing'] = (aiFields as any).winePairing;
        if ('difficulty' in aiFields)
          update['ai.difficulty'] = (aiFields as any).difficulty;
        if ('estimatedCost' in aiFields)
          update['ai.estimatedCost'] = (aiFields as any).estimatedCost;
        if ('flavour' in aiFields && aiFields.flavour) {
          update['ai.flavour'] = aiFields.flavour;
        }
        update['ai.hash'] = hash;
        const updateResult = await this.recipeModel.updateOne(
          { _id: recipe._id },
          { $set: update }
        );
        this.logger.log(
          `Update result for recipe ${recipe._id}:`,
          JSON.stringify(updateResult)
        );
        this.logger.log(`Filled AI fields for recipe: ${recipe._id}`);
      } catch (err) {
        this.logger.error(
          `Failed to fill AI fields for recipe ${recipe._id}: ${err}`
        );
      }
    }
  }
}
