import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { Recipe, RecipeSchema } from './schema/recipe.schema';
import { UnitSchema } from '../units/schema/unit.schema';
import { RecipesController } from './recipes.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { IngredientSchema } from '../ingredients/schema/ingredient.schema';
import { IngredientVariantSchema } from '../ingredients/schema/ingredient-variant.schema';
import { RecipeAiAuditService } from './service/recipe-ai-audit.service';
import { OpenAIService } from '../openai/openai.service';
import { IngredientNormalizerService } from '../ingredients/service/ingredient-normalizer.service';
import { RecipesQueryService } from './service/recipes-query.service';

@Module({
  imports: [
    CacheModule.register({ ttl: 60 }),
    // existing imports
    MongooseModule.forFeature([
      { name: Recipe.name, schema: RecipeSchema },
      { name: 'Unit', schema: UnitSchema },
      { name: 'Ingredient', schema: IngredientSchema },
      { name: 'IngredientVariant', schema: IngredientVariantSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [RecipesController],
  providers: [
    RecipeAiAuditService,
    OpenAIService,
    IngredientNormalizerService,
    RecipesQueryService,
  ],
})
export class RecipesModule {}
