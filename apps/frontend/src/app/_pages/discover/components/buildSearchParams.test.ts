/**
 * Unit tests for the URL search-param builder logic used in DiscoverInner.
 * The builder is a pure function so we inline an equivalent here to keep
 * the test file free of Next.js client-only dependencies.
 */

interface DiscoverFilters {
  search: string;
  mealType: string;
  diets: string[];
  techniques: string[];
  difficulty: string;
  country: string;
  cookTime: [number, number];
  calories: [number, number];
  estimatedCost: [number, number];
  specialAttributes: string[];
}

function buildSearchParams(filters: DiscoverFilters): URLSearchParams {
  return new URLSearchParams({
    ...(filters.search && { search: filters.search }),
    ...(filters.mealType && { mealType: filters.mealType }),
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

const defaults: DiscoverFilters = {
  search: '',
  mealType: '',
  diets: [],
  techniques: [],
  difficulty: '',
  country: '',
  cookTime: [0, 240],
  calories: [0, 2000],
  estimatedCost: [0, 30],
  specialAttributes: [],
};

describe('buildSearchParams', () => {
  it('always includes range params even on defaults', () => {
    const params = buildSearchParams(defaults);
    expect(params.get('cookTimeMin')).toBe('0');
    expect(params.get('cookTimeMax')).toBe('240');
    expect(params.get('caloriesMin')).toBe('0');
    expect(params.get('caloriesMax')).toBe('2000');
    expect(params.get('estimatedCostMin')).toBe('0');
    expect(params.get('estimatedCostMax')).toBe('30');
  });

  it('omits empty string / empty array optional params', () => {
    const params = buildSearchParams(defaults);
    expect(params.has('search')).toBe(false);
    expect(params.has('mealType')).toBe(false);
    expect(params.has('diets')).toBe(false);
    expect(params.has('techniques')).toBe(false);
    expect(params.has('difficulty')).toBe(false);
    expect(params.has('country')).toBe(false);
    expect(params.has('specialAttributes')).toBe(false);
  });

  it('joins multi-value arrays with commas', () => {
    const params = buildSearchParams({
      ...defaults,
      diets: ['vegan', 'glutenFree'],
      techniques: ['grilling'],
      specialAttributes: ['lowCarb', 'dairyFree'],
    });
    expect(params.get('diets')).toBe('vegan,glutenFree');
    expect(params.get('techniques')).toBe('grilling');
    expect(params.get('specialAttributes')).toBe('lowCarb,dairyFree');
  });

  it('includes search and mealType when provided', () => {
    const params = buildSearchParams({
      ...defaults,
      search: 'pizza',
      mealType: 'dinner',
    });
    expect(params.get('search')).toBe('pizza');
    expect(params.get('mealType')).toBe('dinner');
  });

  it('respects narrowed cookTime ranges', () => {
    const params = buildSearchParams({
      ...defaults,
      cookTime: [15, 45],
      calories: [300, 800],
      estimatedCost: [5, 20],
    });
    expect(params.get('cookTimeMin')).toBe('15');
    expect(params.get('cookTimeMax')).toBe('45');
    expect(params.get('caloriesMin')).toBe('300');
    expect(params.get('caloriesMax')).toBe('800');
    expect(params.get('estimatedCostMin')).toBe('5');
    expect(params.get('estimatedCostMax')).toBe('20');
  });
});
