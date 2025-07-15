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

  // Parse all filters from query params
  const getDefaultValuesFromParams = () => {
    const getArray = (key: string) => {
      const val = searchParams.get(key);
      if (!val) return [];
      return val.split(',').filter(Boolean);
    };
    const getRange = (key: string, defMin: number, defMax: number) => {
      const min = Number(searchParams.get(key + 'Min') ?? defMin);
      const max = Number(searchParams.get(key + 'Max') ?? defMax);

      return [min, max];
    };
    return {
      search: searchParams.get('search') || '',
      mealType: searchParams.get('mealType') || '',
      diets: getArray('diets'),
      techniques: getArray('techniques'),
      difficulty: searchParams.get('difficulty') || '',
      country: searchParams.get('country') || '',
      cookTime: getRange('cookTime', 0, 240),
      calories: getRange('calories', 0, 2000),
      estimatedCost: getRange('estimatedCost', 0, 30),
      specialAttributes: getArray('specialAttributes'),
    };
  };
  const defaultValues = useMemo(getDefaultValuesFromParams, [searchParams]);

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
        estimatedCostMin:
          (filters.estimatedCost as number[])[0]?.toString() ?? '0',
        estimatedCostMax:
          (filters.estimatedCost as number[])[1]?.toString() ?? '30',
        ...(filters.specialAttributes &&
          (filters.specialAttributes as string[]).length && {
            specialAttributes: (filters.specialAttributes as string[]).join(
              ','
            ),
          }),
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
    if (defaultValues.search) {
      params.set('search', defaultValues.search);
    } else {
      params.delete('search');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [defaultValues.search]);

  // Helper to update URL with all filters
  const updateUrlWithFilters = (filters: any) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.mealType) params.set('mealType', filters.mealType);
    if (filters.diets && filters.diets.length)
      params.set('diets', filters.diets.join(','));
    if (filters.techniques && filters.techniques.length)
      params.set('techniques', filters.techniques.join(','));
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.country) params.set('country', filters.country);
    if (
      filters.cookTime &&
      (filters.cookTime[0] !== 0 || filters.cookTime[1] !== 240)
    ) {
      params.set('cookTimeMin', filters.cookTime[0]);
      params.set('cookTimeMax', filters.cookTime[1]);
    }
    if (
      filters.calories &&
      (filters.calories[0] !== 0 || filters.calories[1] !== 2000)
    ) {
      params.set('caloriesMin', filters.calories[0]);
      params.set('caloriesMax', filters.calories[1]);
    }
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
  };

  const handleFiltersSubmit = (values: Record<string, unknown>) => {
    updateUrlWithFilters(values);
    fetchRecipes(values);
  };

  const handleSearchSubmit = (values: Record<string, unknown>) => {
    const merged = { ...defaultValues, search: values.search };
    updateUrlWithFilters(merged);
    fetchRecipes(merged);
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
