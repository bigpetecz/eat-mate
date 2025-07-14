'use client';
import { Card } from '@/components/ui/card';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { RecipeFilters } from './RecipeFilters';
import { Spinner } from '@/components/ui/spinner';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { useSearchParams } from 'next/navigation';
import type { Recipe } from '@/types/recipe';

const DiscoverPage = () => {
  const searchParams = useSearchParams();

  // Read initial search from query param
  const initialSearch = searchParams.get('search') || '';
  const defaultValues = useMemo(
    () => ({
      search: initialSearch,
      mealType: '',
      diets: [],
      techniques: [],
      difficulty: '',
      country: '',
      cookTime: [0, 240],
      calories: [0, 2000],
    }),
    [initialSearch]
  );

  // Recipe state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async (filters: any) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search as string }),
        ...(filters.mealType && { mealType: filters.mealType as string }),
        ...(filters.diets &&
          (filters.diets as string[]).length && {
            diets: (filters.diets as string[]).join(','),
          }),
        ...(filters.techniques &&
          (filters.techniques as string[]).length && {
            techniques: (filters.techniques as string[]).join(','),
          }),
        ...(filters.difficulty && {
          difficulty: filters.difficulty as string,
        }),
        ...(filters.country && { country: filters.country as string }),
        cookTimeMin: (filters.cookTime as number[])[0]?.toString() ?? '0',
        cookTimeMax: (filters.cookTime as number[])[1]?.toString() ?? '240',
        caloriesMin: (filters.calories as number[])[0]?.toString() ?? '0',
        caloriesMax: (filters.calories as number[])[1]?.toString() ?? '2000',
      });
      const res = await fetch(`/api/recipes/filter?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch recipes');
      const data = await res.json();
      setRecipes(data);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch recipes on mount (with current filters, debounced)
  useEffect(() => {
    fetchRecipes(defaultValues);
  }, [defaultValues, fetchRecipes]);

  // Update URL query param when search changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (initialSearch) {
      params.set('search', initialSearch);
    } else {
      params.delete('search');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [initialSearch]);

  const handleFiltersSubmit = (values: Record<string, unknown>) => {
    fetchRecipes(values);
  };

  const handleSearchSubmit = (values: Record<string, unknown>) => {
    fetchRecipes({ ...defaultValues, search: values.search });
  };

  return (
    <div className="bg-muted min-h-[calc(100vh-8rem)] w-full">
      <div className="py-8 max-w-5xl mx-auto px-2 md:px-0">
        <Card className="p-4 md:p-8 bg-background">
          <RecipeFilters
            defaultValues={defaultValues}
            onReset={() => fetchRecipes(defaultValues)}
            onSearchSubmit={handleSearchSubmit}
            onFiltersSubmit={handleFiltersSubmit}
          />
        </Card>
      </div>

      {/* Headline between filters and recipes */}
      <div className="max-w-5xl mx-auto px-2 md:px-0">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-primary py-4 mb-2">
          Discover Recipes Tailored to Your Taste
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          Browse delicious ideas below, or adjust filters to find your perfect
          meal.
        </p>
      </div>

      {/* Bottom: Recipes grid */}
      <div className="max-w-5xl mx-auto px-2 md:px-0 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <Spinner />
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12 text-destructive">
              {error}
            </div>
          ) : recipes.length === 0 ? (
            <Card className="col-span-full text-center py-12 text-muted-foreground">
              No recipes found. Try adjusting your filters.
            </Card>
          ) : (
            recipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
