'use client';
import { FC } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import type { Recipe } from '@/types/recipe';
import { apiClient } from '@/app/api-client';
import { toApiClientError } from '@/lib/api-error';
import { FiltersCard } from './FiltersCard';
import { Headline } from './Headline';
import { RecipeGrid } from './RecipeGrid';
import {
  buildDiscoverSearchParams,
  parseDiscoverFiltersFromSearchParams,
  type DiscoverFilters,
} from './discoverFilters';

interface DiscoverInnerProps {
  dictionary: Record<string, string>;
}

export const DiscoverInner: FC<DiscoverInnerProps> = ({ dictionary }) => {
  const { language } = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultValues = useMemo(
    () => parseDiscoverFiltersFromSearchParams(searchParams),
    [searchParams],
  );
  const returnTo = useMemo(() => {
    const currentQuery = searchParams.toString();

    return currentQuery ? `${pathname}?${currentQuery}` : pathname;
  }, [pathname, searchParams]);

  // Recipe state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(
    async (filters: DiscoverFilters) => {
      setLoading(true);
      setError(null);
      try {
        const params = buildDiscoverSearchParams(filters);
        const res = await apiClient.get<Recipe[]>(
          `/recipes/${language}/filter?${params.toString()}`,
        );
        setRecipes(Array.isArray(res.data) ? res.data : []);
      } catch (e: unknown) {
        const apiError = toApiClientError(e);
        setError(
          apiError.message ||
            dictionary.failedToLoadRecipes ||
            'Failed to load recipes.',
        );
      } finally {
        setLoading(false);
      }
    },
    [dictionary.failedToLoadRecipes, language],
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
        sourceContext="discover"
        returnTo={returnTo}
        loadingText={dictionary['Loading recipes...'] || 'Loading recipes...'}
        emptyText={
          dictionary.noRecipesFound ||
          'No recipes found. Try adjusting filters.'
        }
      />
    </div>
  );
};
