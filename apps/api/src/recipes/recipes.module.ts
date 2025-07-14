import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Recipe, RecipeSchema } from './recipe.schema';
import { RecipesController } from './recipes.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { RecipeAiAuditService } from './recipe-ai-audit.service';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenAIService } from '../openai/openai.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Recipe.name, schema: RecipeSchema }]),
    CloudinaryModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [RecipesController],
  providers: [RecipeAiAuditService, OpenAIService],
})
export class RecipesModule {}
