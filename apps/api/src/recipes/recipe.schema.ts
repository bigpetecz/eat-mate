import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { User } from '../users/user.schema';
import { WinePairing, Technique } from './recipe.enums';
import {
  RecipeIngredient,
  RecipeIngredientSchema,
  Nutrition,
} from './schema/recipe-ingredient.schema';
import { Flavour, FlavourSchema } from './schema/flavour.schema';
import { AIInfo, AIInfoSchema } from './schema/recipe-ai-info.schema';
import { Rating, RatingSchema } from './schema/recipe-rating.schema';
import type { RecipeLanguage } from './recipe.enums';
import slugify from 'slugify';

// References for translations to other language versions
export interface RecipeTranslationRef {
  language: RecipeLanguage;
  recipeId: mongoose.Types.ObjectId;
}

@Schema({ timestamps: true })
export class Recipe extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  author: User;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true, enum: ['en', 'cs'], default: 'en' })
  language: RecipeLanguage;

  @Prop({ required: true, unique: true, trim: true })
  slug: string;

  @Prop({
    type: [
      {
        language: { type: String, required: true },
        recipeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Recipe',
          required: true,
        },
      },
    ],
    default: [],
  })
  translations: RecipeTranslationRef[];

  @Prop({ required: true })
  description: string;

  @Prop({ enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'] })
  mealType: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop()
  prepTime: number;

  @Prop({ required: true })
  cookTime: number;

  @Prop()
  servings: number;

  @Prop({ type: [RecipeIngredientSchema], default: [] })
  ingredients: RecipeIngredient[];

  @Prop({ type: [String], required: true })
  instructions: string[];

  @Prop()
  country: string;

  @Prop({ type: String, enum: WinePairing, required: false })
  winePairing?: WinePairing;

  @Prop({ type: [String], enum: Technique, default: [] })
  techniques: Technique[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Nutrition, required: false })
  nutritionInfo?: Nutrition;

  @Prop({ type: FlavourSchema })
  flavour?: Flavour;

  @Prop({ type: AIInfoSchema, default: {} })
  ai: AIInfo;

  @Prop({ type: [RatingSchema], default: [] })
  ratings: Rating[];

  @Prop({ type: Number, default: 0 })
  averageRating: number;

  @Prop({ type: Number, default: 0 })
  ratingCount: number;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);

// Pre-save hook to auto-generate slug from title (in English) if not set
RecipeSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    // Use slugify to generate a URL-safe slug in English
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      locale: 'en',
    });
  }
  // Ensure language is set
  if (!this.language) {
    this.language = 'en';
  }
  next();
});
