import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoogleTranslateService } from './google-translate.service';
import { TranslationScheduler } from './translation.scheduler';
import {
  TranslationUsage,
  TranslationUsageSchema,
} from './translation-usage.schema';
import { Recipe, RecipeSchema } from '../recipes/schema/recipe.schema';
import {
  TranslationUsageTotal,
  TranslationUsageTotalSchema,
} from './translation-usage-total.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recipe.name, schema: RecipeSchema },
      { name: TranslationUsage.name, schema: TranslationUsageSchema },
      { name: TranslationUsageTotal.name, schema: TranslationUsageTotalSchema },
    ]),
  ],
  providers: [GoogleTranslateService, TranslationScheduler],
})
export class TranslationModule {}
