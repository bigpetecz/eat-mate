'use client';
import { useEffect, useState } from 'react';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import apiClient from '../apiClient';
import { Spinner } from '@/components/ui/spinner';

export default function MyRecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyRecipes() {
      setLoading(true);
      try {
        const res = await apiClient.get('/users/my-recipes');
        setRecipes(res.data.recipes || []);
      } catch (error) {
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMyRecipes();
  }, []);

  if (loading) {
    return (
      <div className="bg-muted min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!recipes.length) {
    return (
      <div className="bg-muted min-h-screen">
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="rounded-lg p-6 flex flex-col items-center bg-muted min-h-[15rem]">
            <h1 className="text-3xl font-bold mb-2">Your Recipes</h1>
            <p className="text-muted-foreground">
              You have not created any recipes yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted min-h-[calc(100vh-8rem)]">
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="rounded-lg p-6 flex flex-col items-center bg-muted">
          <h1 className="text-3xl font-bold mb-2">Your Recipes</h1>
          <p className="text-muted-foreground mb-6">
            All recipes you have authored.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  );
}
