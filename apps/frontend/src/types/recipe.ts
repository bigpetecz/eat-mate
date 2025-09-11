// Central Recipe type for frontend
export interface RecipeTranslationRef {
  language: string;
  recipeId: string;
}

export interface Recipe {
  _id: string;
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
  ingredients: { name: string; quantity: string }[];
  instructions?: string[];
  author: string;
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
}
