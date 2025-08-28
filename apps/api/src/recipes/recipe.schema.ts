// Translation reference type
export interface RecipeTranslationRef {
  language: RecipeLanguage;
  recipeId: mongoose.Types.ObjectId;
}
import slugify from 'slugify';
// Supported languages for recipes (expand as needed)
export type RecipeLanguage = 'en' | 'cs';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from '../users/user.schema';

export enum WinePairing {
  CabernetSauvignon = 'cabernet-sauvignon',
  PinotNoir = 'pinot-noir',
  Merlot = 'merlot',
  Chardonnay = 'chardonnay',
  SauvignonBlanc = 'sauvignon-blanc',
  Riesling = 'riesling',
  Syrah = 'syrah',
  Zinfandel = 'zinfandel',
  Rosé = 'rosé',
  Sparkling = 'sparkling',
  DessertWine = 'dessert-wine',
}

export enum Technique {
  Boiling = 'boiling',
  Blanching = 'blanching',
  Steaming = 'steaming',
  Poaching = 'poaching',
  Simmering = 'simmering',
  Stewing = 'stewing',
  Braising = 'braising',
  Roasting = 'roasting',
  Baking = 'baking',
  Grilling = 'grilling',
  Broiling = 'broiling',
  Sauteing = 'sauteing',
  StirFrying = 'stir-frying',
  DeepFrying = 'deep-frying',
  PanFrying = 'pan-frying',
  Smoking = 'smoking',
  Pickling = 'pickling',
  Fermenting = 'fermenting',
  SousVide = 'sous-vide',
  Raw = 'raw',
}

export enum DietLabel {
  Vegetarian = 'vegetarian',
  Vegan = 'vegan',
  Pescatarian = 'pescatarian',
  GlutenFree = 'gluten-free',
  DairyFree = 'dairy-free',
  NutFree = 'nut-free',
  SoyFree = 'soy-free',
  LowCarb = 'low-carb',
  LowFat = 'low-fat',
  Paleo = 'paleo',
  Keto = 'keto',
  Whole30 = 'whole30',
  Halal = 'halal',
  Kosher = 'kosher',
}

export enum SpecialAttribute {
  OnePot = 'one-pot',
  OnePan = 'one-pan',
  SlowCooker = 'slow-cooker',
  InstantPot = 'instant-pot',
  AirFryer = 'air-fryer',
  NoCook = 'no-cook',
  FreezerFriendly = 'freezer-friendly',
  MealPrep = 'meal-prep',
  ThirtyMinute = '30-minute',
  FiveIngredients = '5-ingredients',
  KidFriendly = 'kid-friendly',
}

@Schema({ _id: false })
class Ingredient {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  quantity: string;
}

@Schema({ _id: false })
class Nutrition {
  @Prop() calories: number;
  @Prop() protein: number;
  @Prop() fat: number;
  @Prop() carbs: number;
  @Prop() fiber: number;
  @Prop() sugar: number;
  @Prop() sodium: number;
}

@Schema({ _id: false, timestamps: true })
class AIInfo {
  @Prop() nutrition: Nutrition; // full breakdown
  @Prop({ type: [String], enum: DietLabel, default: [] })
  dietLabels: DietLabel[];
  @Prop() winePairing: string;
  @Prop({ type: [String] }) keywords: string[]; // e.g., "quick lunch", "low carb"
  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Recipe' })
  relatedRecipes: mongoose.Types.ObjectId[];
  @Prop({ type: [String], enum: Technique, default: [] })
  techniques: Technique[];
  @Prop({ enum: ['Easy', 'Medium', 'Hard'] })
  difficulty: string;
  @Prop()
  estimatedCost: number;
  @Prop() hash: string;
  @Prop({ type: [String], enum: SpecialAttribute, default: [] })
  specialAttributes: SpecialAttribute[];
}

const AIInfoSchema = SchemaFactory.createForClass(AIInfo);

class Rating {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  value: number;
}

const RatingSchema = SchemaFactory.createForClass(Rating);

@Schema({ timestamps: true })
export class Recipe extends mongoose.Document {
  // === USER-ENTERED ===
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  author: User;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, default: 'en' })
  language: RecipeLanguage;

  // SEO-friendly, unique, English slug
  @Prop({ required: true, unique: true, trim: true })
  slug: string;

  // References to the same recipe in other languages
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

  @Prop({ type: [Ingredient], required: true })
  ingredients: Ingredient[];

  @Prop({ type: [String], required: true })
  instructions: string[];

  @Prop()
  country: string;

  @Prop({ type: [String], enum: Technique, default: [] })
  techniques: Technique[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  // === AI-ENRICHED ===
  @Prop({ type: AIInfoSchema, default: {} })
  ai: AIInfo;

  // === RATINGS ===
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
