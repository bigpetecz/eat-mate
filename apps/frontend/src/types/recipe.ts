// Central Recipe type for frontend
export interface Recipe {
  _id: string;
  title: string;
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
