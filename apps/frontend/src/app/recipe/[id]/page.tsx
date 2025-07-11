import { notFound } from 'next/navigation';

import Image from 'next/image';
import { RecipeActions } from './RecipeActions';

import apiClient from '../../apiClient';

interface Recipe {
  _id: string;
  title: string;
  country?: string;
  createdAt: string;
  images?: { url: string; description?: string }[];
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients?: { name: string; quantity: string }[];
  instructions?: string[];
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
        <div className="rounded-lg p-6 flex flex-col md:flex-row gap-8 items-start bg-muted">
          {/* Image left, content right */}
          {recipe.images?.[0]?.url ? (
            <Image
              src={recipe.images[0].url}
              alt={recipe.images[0].description || recipe.title}
              width={320}
              height={256}
              className="rounded-lg w-full md:w-80 h-64 object-cover mb-4 md:mb-0 bg-white"
              priority
            />
          ) : (
            <div className="rounded-lg w-full md:w-80 h-64 object-cover mb-4 md:mb-0 bg-white flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          {/* Content and actions */}
          <div className="flex-1 flex flex-col gap-3 w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
              <h1 className="text-3xl font-bold flex-1">{recipe.title}</h1>
              <RecipeActions />
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
              <span className="flex items-center gap-1 text-sm">
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 0 0 2-2v-7H3v7a2 2 0 0 0 2 2z" />
                </svg>
                {new Date(recipe.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 21v-7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Servings: {recipe.servings ?? '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Full-width white section for ingredients and instructions */}
      <div className="bg-white w-full py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 21v-7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Ingredients
            </h2>
            <ul className="list-disc list-inside space-y-1">
              {recipe.ingredients?.map((ing, idx) => (
                <li key={idx}>
                  <span className="font-medium">{ing.name}</span>:{' '}
                  {ing.quantity}
                </li>
              ))}
            </ul>
          </div>
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
