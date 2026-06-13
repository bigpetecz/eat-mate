import type { RecipeSourceType } from '@/types/recipe';

export interface DiscoverFilters {
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

const DEFAULT_COOK_TIME: [number, number] = [0, 240];
const DEFAULT_CALORIES: [number, number] = [0, 2000];
const DEFAULT_ESTIMATED_COST: [number, number] = [0, 30];

function getArrayValue(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);

  if (!value) {
    return [];
  }

  return value.split(',').filter(Boolean);
}

function getRangeValue(
  searchParams: URLSearchParams,
  key: string,
  defaultRange: [number, number],
  singleValueFallback = false,
): [number, number] {
  const minValue = searchParams.get(`${key}Min`);
  const maxValue = searchParams.get(`${key}Max`);

  if (minValue !== null || maxValue !== null) {
    return [
      Number(minValue ?? defaultRange[0]),
      Number(maxValue ?? defaultRange[1]),
    ];
  }

  if (singleValueFallback) {
    const singleValue = searchParams.get(key);

    if (singleValue !== null) {
      const parsedValue = Number(singleValue);

      if (Number.isFinite(parsedValue)) {
        return [parsedValue, parsedValue];
      }
    }
  }

  return defaultRange;
}

export function parseDiscoverFiltersFromSearchParams(
  searchParams: URLSearchParams,
): DiscoverFilters {
  return {
    search: searchParams.get('search') || '',
    mealType: searchParams.get('mealType') || '',
    sourceType:
      (searchParams.get('sourceType') as '' | RecipeSourceType | null) || '',
    diets: getArrayValue(searchParams, 'diets'),
    techniques: getArrayValue(searchParams, 'techniques'),
    difficulty: searchParams.get('difficulty') || '',
    country: searchParams.get('country') || '',
    cookTime: getRangeValue(searchParams, 'cookTime', DEFAULT_COOK_TIME, true),
    calories: getRangeValue(searchParams, 'calories', DEFAULT_CALORIES),
    estimatedCost: getRangeValue(
      searchParams,
      'estimatedCost',
      DEFAULT_ESTIMATED_COST,
    ),
    specialAttributes: getArrayValue(searchParams, 'specialAttributes'),
  };
}

export function buildDiscoverSearchParams(filters: DiscoverFilters) {
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
}
