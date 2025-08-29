'use client';
import { FC } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Recipe } from '@/types/recipe';
import { FiltersCard } from './FiltersCard';
import { Headline } from './Headline';
import { RecipeGrid } from './RecipeGrid';

interface DiscoverInnerProps {
  dictionary: Record<string, string>;
}

export const DiscoverInner: FC<DiscoverInnerProps> = ({ dictionary }) => {
  const { language } = useParams();
  const searchParams = useSearchParams();

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
      const res = await fetch(
        `/api/recipes/${language}/filter?${params.toString()}`
      );
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
      <FiltersCard
        defaultValues={defaultValues}
        onReset={() => fetchRecipes(defaultValues)}
        onSearchSubmit={handleSearchSubmit}
        onFiltersSubmit={handleFiltersSubmit}
        dict={dictionary}
      />
      <Headline dict={dictionary} />
      <RecipeGrid recipes={recipes} loading={loading} error={error} />
    </div>
  );
};
