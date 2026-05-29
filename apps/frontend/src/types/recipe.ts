// Central Recipe type for frontend
export interface RecipeTranslationRef {
  language: string;
  recipeId: string;
}

export type RecipeSourceType =
  | 'user_original'
  | 'inspired_by_chef'
  | 'adapted_from_external'
  | 'licensed_partner';

export type RecipeRightsStatus = 'unknown' | 'attributed' | 'licensed';

export type RecipePublicationEligibility =
  | 'public_allowed'
  | 'review_required'
  | 'blocked';

export interface Recipe {
  _id?: string;
  id?: string;
  slug: string;
  title: string;
  country?: string;
  createdAt: string;
  images?: string[];
  description?: string;
  mealType?: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  ingredients: { name: string; quantity: string; unit: string }[];
  instructions?: string[];
  author: string;
  sourceType?: RecipeSourceType;
  sourceName?: string;
  sourceUrl?: string;
  attributionText?: string;
  rightsStatus?: RecipeRightsStatus;
  publicationEligibility?: RecipePublicationEligibility;
  averageRating: number;
  ratingCount: number;
  ai?: {
    nutrition?: {
      calories?: number;
      protein?: number;
      fat?: number;
      carbs?: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
    difficulty?: string;
    estimatedCost?: number;
    dietLabels?: string[];
    keywords?: string[];
    relatedRecipes?: string[];
    techniques?: string[];
    specialAttributes?: string[];
    winePairing?: string;
    createdAt?: string;
    updatedAt?: string;
    hash?: string;
  };
  translations?: RecipeTranslationRef[];
}
