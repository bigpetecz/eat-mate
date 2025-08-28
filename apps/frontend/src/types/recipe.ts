// Central Recipe type for frontend
export interface RecipeTranslationRef {
  language: string;
  recipeId: string;
}

export interface Recipe {
  _id: string;
  title: string;
  slug: string;
  language: string;
  translations?: RecipeTranslationRef[];
  country?: string;
  createdAt: string;
  images?: string[];
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients?: { name: string; quantity: string }[];
  instructions?: string[];
  author: string;
  mealType?: string;
  ai: {
    nutrition: {
      calories?: number;
    };
    difficulty?: string;
    techniques?: string[];
    dietLabels?: string[];
    specialAttributes?: string[];
    estimatedCost?: number;
  };
}
