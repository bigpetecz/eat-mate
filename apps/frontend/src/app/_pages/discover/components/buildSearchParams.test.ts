import {
  buildDiscoverSearchParams,
  parseDiscoverFiltersFromSearchParams,
  type DiscoverFilters,
} from './discoverFilters';

const defaults: DiscoverFilters = {
  search: '',
  mealType: '',
  sourceType: '',
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
    const params = buildDiscoverSearchParams(defaults);
    expect(params.get('cookTimeMin')).toBe('0');
    expect(params.get('cookTimeMax')).toBe('240');
    expect(params.get('caloriesMin')).toBe('0');
    expect(params.get('caloriesMax')).toBe('2000');
    expect(params.get('estimatedCostMin')).toBe('0');
    expect(params.get('estimatedCostMax')).toBe('30');
  });

  it('omits empty string / empty array optional params', () => {
    const params = buildDiscoverSearchParams(defaults);
    expect(params.has('search')).toBe(false);
    expect(params.has('mealType')).toBe(false);
    expect(params.has('sourceType')).toBe(false);
    expect(params.has('diets')).toBe(false);
    expect(params.has('techniques')).toBe(false);
    expect(params.has('difficulty')).toBe(false);
    expect(params.has('country')).toBe(false);
    expect(params.has('specialAttributes')).toBe(false);
  });

  it('joins multi-value arrays with commas', () => {
    const params = buildDiscoverSearchParams({
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
    const params = buildDiscoverSearchParams({
      ...defaults,
      search: 'pizza',
      mealType: 'dinner',
      sourceType: 'licensed_partner',
    });
    expect(params.get('search')).toBe('pizza');
    expect(params.get('mealType')).toBe('dinner');
    expect(params.get('sourceType')).toBe('licensed_partner');
  });

  it('respects narrowed cookTime ranges', () => {
    const params = buildDiscoverSearchParams({
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

  it('hydrates a single cookTime query value as a range', () => {
    const values = parseDiscoverFiltersFromSearchParams(
      new URLSearchParams('cookTime=30'),
    );

    expect(values.cookTime).toEqual([30, 30]);
  });
});
