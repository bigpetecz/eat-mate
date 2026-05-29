'use client';
import { FC } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Recipe, RecipeSourceType } from '@/types/recipe';
import { apiClient } from '@/app/api-client';
import { toApiClientError } from '@/lib/api-error';
import { FiltersCard } from './FiltersCard';
import { Headline } from './Headline';
import { RecipeGrid } from './RecipeGrid';

interface DiscoverInnerProps {
  dictionary: Record<string, string>;
}

interface DiscoverFilters {
  search: string;
  mealType: string;
  sourceType: '' | RecipeSourceType;
  diets: string[];
  techniques: string[];
  difficulty: string;
  country: string;
  cookTime: [number, number];
  calories: [number, number];
  estimatedCost: [number, number];
  specialAttributes: string[];
}

export const DiscoverInner: FC<DiscoverInnerProps> = ({ dictionary }) => {
  const { language } = useParams();
  const searchParams = useSearchParams();

  const getDefaultValuesFromParams = (): DiscoverFilters => {
    const getArray = (key: string) => {
      const val = searchParams.get(key);
      if (!val) return [];
      return val.split(',').filter(Boolean);
    };
    const getRange = (
      key: string,
      defMin: number,
      defMax: number
    ): [number, number] => {
      const min = Number(searchParams.get(key + 'Min') ?? defMin);
      const max = Number(searchParams.get(key + 'Max') ?? defMax);

      return [min, max] as [number, number];
    };
    return {
      search: searchParams.get('search') || '',
      mealType: searchParams.get('mealType') || '',
      sourceType:
        (searchParams.get('sourceType') as '' | RecipeSourceType | null) || '',
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

  const buildSearchParams = (filters: DiscoverFilters) => {
    return new URLSearchParams({
      ...(filters.search && { search: filters.search }),
      ...(filters.mealType && { mealType: filters.mealType }),
      ...(filters.sourceType && { sourceType: filters.sourceType }),
      ...(filters.diets.length && { diets: filters.diets.join(',') }),
      ...(filters.techniques.length && {
        techniques: filters.techniques.join(','),
      }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.country && { country: filters.country }),
      cookTimeMin: filters.cookTime[0].toString(),
      cookTimeMax: filters.cookTime[1].toString(),
      caloriesMin: filters.calories[0].toString(),
      caloriesMax: filters.calories[1].toString(),
      estimatedCostMin: filters.estimatedCost[0].toString(),
      estimatedCostMax: filters.estimatedCost[1].toString(),
      ...(filters.specialAttributes.length && {
        specialAttributes: filters.specialAttributes.join(','),
      }),
    });
  };

  const fetchRecipes = useCallback(
    async (filters: DiscoverFilters) => {
      setLoading(true);
      setError(null);
      try {
        const params = buildSearchParams(filters);
        const res = await apiClient.get<Recipe[]>(
          `/recipes/${language}/filter?${params.toString()}`
        );
        setRecipes(Array.isArray(res.data) ? res.data : []);
      } catch (e: unknown) {
        const apiError = toApiClientError(e);
        setError(
          apiError.message ||
            dictionary.failedToLoadRecipes ||
            'Failed to load recipes.'
        );
      } finally {
        setLoading(false);
      }
    },
    [dictionary.failedToLoadRecipes, language]
  );

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
  const updateUrlWithFilters = (filters: DiscoverFilters) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.mealType) params.set('mealType', filters.mealType);
    if (filters.sourceType) params.set('sourceType', filters.sourceType);
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
      params.set('cookTimeMin', filters.cookTime[0].toString());
      params.set('cookTimeMax', filters.cookTime[1].toString());
    }
    if (
      filters.calories &&
      (filters.calories[0] !== 0 || filters.calories[1] !== 2000)
    ) {
      params.set('caloriesMin', filters.calories[0].toString());
      params.set('caloriesMax', filters.calories[1].toString());
    }
    if (
      filters.estimatedCost &&
      (filters.estimatedCost[0] !== 0 || filters.estimatedCost[1] !== 30)
    ) {
      params.set('estimatedCostMin', filters.estimatedCost[0].toString());
      params.set('estimatedCostMax', filters.estimatedCost[1].toString());
    }
    if (filters.specialAttributes && filters.specialAttributes.length) {
      params.set('specialAttributes', filters.specialAttributes.join(','));
    }
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
  };

  const handleFiltersSubmit = (values: Record<string, unknown>) => {
    const typedValues = values as unknown as DiscoverFilters;
    updateUrlWithFilters(typedValues);
    fetchRecipes(typedValues);
  };

  const handleSearchSubmit = (values: Record<string, unknown>) => {
    const merged: DiscoverFilters = {
      ...defaultValues,
      search: (values.search as string) || '',
    };
    updateUrlWithFilters(merged);
    fetchRecipes(merged);
  };

  return (
    <div className="bg-muted min-h-[calc(100vh-8rem)] w-full">
      <FiltersCard
        defaultValues={defaultValues}
        onReset={(values) => {
          updateUrlWithFilters(values);
          fetchRecipes(values);
        }}
        onSearchSubmit={handleSearchSubmit}
        onFiltersSubmit={handleFiltersSubmit}
        dict={dictionary}
      />
      <Headline dict={dictionary} />
      <RecipeGrid
        recipes={recipes}
        loading={loading}
        error={error}
        loadingText={dictionary['Loading recipes...'] || 'Loading recipes...'}
        emptyText={
          dictionary.noRecipesFound ||
          'No recipes found. Try adjusting filters.'
        }
      />
    </div>
  );
};
