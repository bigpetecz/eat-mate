import { notFound } from 'next/navigation';

import Image from 'next/image';
import { RecipeActions } from './RecipeActions';
import apiClient from '../../apiClient';
import { Card } from '@/components/ui/card';
import ServingsIngredients from './ServingsIngredients';
import { RecipeRating } from './RecipeRating';
import {
  dietLabels,
  techniquesOptions,
  specialAttributes,
} from '@/lib/recipe-labels';
import { Badge } from '@/components/ui/badge';

interface Recipe {
  _id: string;
  title: string;
  country?: string;
  createdAt: string;
  images?: string[];
  description?: string;
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

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  let recipe: Recipe | null = null;
  try {
    const res = await apiClient.get(`/recipes/${(await params).id}`);
    recipe = res.data;
  } catch (error) {
    console.error('Failed to fetch recipe:', error);
    notFound();
  }

  if (!recipe) return notFound();

  return (
    <div className="bg-muted">
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Hero section */}
        <div className="rounded-lg p-6 flex flex-col md:flex-row gap-8 items-center bg-muted min-h-[25rem]">
          {/* Image left, content right */}
          {recipe.images?.[0] ? (
            <Image
              src={recipe.images[0]}
              alt={recipe.title}
              width={320}
              height={256}
              className="rounded-lg w-full md:w-80 h-64 object-cover mb-4 md:mb-0 bg-background"
              priority
            />
          ) : (
            <div className="rounded-lg w-full md:w-80 h-64 object-cover mb-4 md:mb-0 flex items-center justify-center text-muted-foreground bg-background">
              No image
            </div>
          )}
          {/* Content and actions */}
          <div className="flex-1 flex flex-col gap-3 w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
              <h1 className="text-3xl font-bold flex-1">{recipe.title}</h1>
              <RecipeActions recipeId={recipe._id} authorId={recipe.author} />
            </div>
            <p className="text-lg text-muted-foreground mt-1">
              {recipe.description}
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              {recipe.country && (
                <span className="flex items-center gap-1 text-sm">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {recipe.country}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm">
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Prep: {recipe.prepTime ?? '-'} min
              </span>
              <span className="flex items-center gap-1 text-sm">
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Cook: {recipe.cookTime ?? '-'} min
              </span>
            </div>
            {/* Rating section */}
            <RecipeRating
              recipeId={recipe._id}
              authorId={recipe.author}
              averageRating={recipe.averageRating}
              ratingCount={recipe.ratingCount}
            />
          </div>
        </div>
        {/* AI-enriched info section */}
        <Card className="py-8">
          <div className="px-8">
            <h2 className="text-xl font-semibold mb-4">
              Additional Information
            </h2>
            <div className="flex flex-row flex-wrap md:flex-nowrap gap-6">
              <div className="w-full md:w-1/2 flex-shrink-0 flex-grow-0 gap-6">
                <div>
                  <h3 className="font-medium mb-2">
                    Difficulty, Cost & Wine Pairing
                  </h3>
                  <p>
                    Difficulty: <b>{recipe.ai?.difficulty ?? '-'}</b>
                  </p>
                  <p>
                    Estimated Cost:{' '}
                    <b>
                      {recipe.ai?.estimatedCost != null
                        ? `€${recipe.ai.estimatedCost}`
                        : '-'}{' '}
                      per serving
                    </b>
                  </p>
                  <p>
                    Wine Pairing: <b>{recipe.ai?.winePairing ?? '-'}</b>
                  </p>
                </div>
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Diet Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.ai?.dietLabels?.length
                      ? recipe.ai.dietLabels.map((d) => {
                          const label =
                            dietLabels.find((l) => l.value === d)?.label || d;
                          return (
                            <Badge key={d} variant="secondary">
                              {label}
                            </Badge>
                          );
                        })
                      : '-'}
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Techniques</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.ai?.techniques?.length
                      ? recipe.ai.techniques.map((t) => {
                          const label =
                            techniquesOptions.find((l) => l.value === t)
                              ?.label || t;
                          return (
                            <Badge key={t} variant="outline">
                              {label}
                            </Badge>
                          );
                        })
                      : '-'}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2 flex-shrink-0 flex-grow-0">
                <div>
                  <h3 className="font-medium mb-2">Nutrition per serving</h3>
                  <ul className="list-disc list-inside">
                    <li>
                      Calories:{' '}
                      {recipe.ai?.nutrition?.calories != null
                        ? `${recipe.ai.nutrition.calories} kcal`
                        : '-'}
                    </li>
                    <li>
                      Protein:{' '}
                      {recipe.ai?.nutrition?.protein != null
                        ? `${recipe.ai.nutrition.protein} g`
                        : '-'}
                    </li>
                    <li>
                      Fat:{' '}
                      {recipe.ai?.nutrition?.fat != null
                        ? `${recipe.ai.nutrition.fat} g`
                        : '-'}
                    </li>
                    <li>
                      Carbs:{' '}
                      {recipe.ai?.nutrition?.carbs != null
                        ? `${recipe.ai.nutrition.carbs} g`
                        : '-'}
                    </li>
                    <li>
                      Fiber:{' '}
                      {recipe.ai?.nutrition?.fiber != null
                        ? `${recipe.ai.nutrition.fiber} g`
                        : '-'}
                    </li>
                    <li>
                      Sugar:{' '}
                      {recipe.ai?.nutrition?.sugar != null
                        ? `${recipe.ai.nutrition.sugar} g`
                        : '-'}
                    </li>
                    <li>
                      Sodium:{' '}
                      {recipe.ai?.nutrition?.sodium != null
                        ? `${recipe.ai.nutrition.sodium} mg`
                        : '-'}
                    </li>
                  </ul>
                </div>
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Special Attributes</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.ai?.specialAttributes?.length
                      ? recipe.ai.specialAttributes.map((s) => {
                          const label =
                            specialAttributes.find((l) => l.value === s)
                              ?.label || s;
                          return (
                            <Badge key={s} variant="outline">
                              {label}
                            </Badge>
                          );
                        })
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        {/* ...existing ingredients/instructions... */}
      </div>
      {/* Full-width white section for ingredients and instructions */}
      <div className="bg-background w-full py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ServingsIngredients
            servings={recipe.servings}
            ingredients={recipe.ingredients}
          />
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              Instructions
            </h2>
            <ol className="list-decimal list-inside space-y-1">
              {recipe.instructions?.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
