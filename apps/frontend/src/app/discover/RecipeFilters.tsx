import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Slider } from '@/components/ui/slider';
import { MultiSelect } from '@/components/ui/multiselect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  dietLabels,
  techniquesOptions,
  specialAttributes,
} from '@/lib/recipe-labels';

interface RecipeFiltersProps {
  defaultValues: {
    search: string;
    mealType: string;
    diets: string[];
    techniques: string[];
    specialAttributes: string[];
    difficulty: string;
    country: string;
    cookTime: number[];
    calories: number[];
    estimatedCost: number[];
  };
  onReset: () => void;
  onSearchSubmit: (values: Record<string, unknown>) => void;
  onFiltersSubmit: (values: Record<string, unknown>) => void;
}

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
const difficulties = ['Easy', 'Medium', 'Hard'];

// List of countries with their own cuisine, all European, major Latin American, Asian, and Arab countries, ordered alphabetically
const countries = [
  // Europe
  'Albania',
  'Andorra',
  'Armenia',
  'Austria',
  'Azerbaijan',
  'Belarus',
  'Belgium',
  'Bosnia and Herzegovina',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Georgia',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Italy',
  'Kazakhstan',
  'Kosovo',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Moldova',
  'Monaco',
  'Montenegro',
  'Netherlands',
  'North Macedonia',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'Russia',
  'San Marino',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'Turkey',
  'Ukraine',
  'United Kingdom',
  // Latin America
  'Argentina',
  'Bolivia',
  'Brazil',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Dominican Republic',
  'Ecuador',
  'El Salvador',
  'Guatemala',
  'Honduras',
  'Mexico',
  'Nicaragua',
  'Panama',
  'Paraguay',
  'Peru',
  'Uruguay',
  'Venezuela',
  // Asia
  'Bangladesh',
  'Cambodia',
  'China',
  'India',
  'Indonesia',
  'Japan',
  'Laos',
  'Malaysia',
  'Mongolia',
  'Myanmar',
  'Nepal',
  'Pakistan',
  'Philippines',
  'Singapore',
  'South Korea',
  'Sri Lanka',
  'Taiwan',
  'Thailand',
  'Vietnam',
  // Middle East / Arab World
  'Algeria',
  'Bahrain',
  'Egypt',
  'Iraq',
  'Jordan',
  'Kuwait',
  'Lebanon',
  'Libya',
  'Morocco',
  'Oman',
  'Palestine',
  'Qatar',
  'Saudi Arabia',
  'Sudan',
  'Syria',
  'Tunisia',
  'United Arab Emirates',
  'Yemen',
  // Africa (selected)
  'Ethiopia',
  'Ghana',
  'Kenya',
  'Nigeria',
  'Senegal',
  'South Africa',
  'Tanzania',
  // Oceania
  'Australia',
  'Fiji',
  'New Zealand',
  // North America
  'Canada',
  'United States',
];

export const RecipeFilters: React.FC<RecipeFiltersProps> = ({
  defaultValues,
  onReset,
  onSearchSubmit,
  onFiltersSubmit,
}) => {
  const searchForm = useForm({
    defaultValues: { search: defaultValues.search },
    mode: 'onChange',
  });

  const query = searchForm.watch('search');

  // Keep a ref to store the timeout ID
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const lastSearchedQuery = useRef<string>('');

  useEffect(() => {
    // Clear the previous timeout if query changes
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new timeout
    debounceTimeout.current = setTimeout(() => {
      const trimmedQuery = query.trim();
      if (trimmedQuery && trimmedQuery !== lastSearchedQuery.current) {
        console.log('Searching for:', trimmedQuery);
        lastSearchedQuery.current = trimmedQuery;
        onSearchSubmit({ search: query });
      }
    }, 500);

    // Cleanup if component unmounts or value changes
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [onSearchSubmit, query]);

  const filtersForm = useForm({
    defaultValues,
  });
  // Determine if any filter (other than search) is set
  const hasActiveFilters = Boolean(
    defaultValues.mealType ||
      defaultValues.difficulty ||
      defaultValues.country ||
      (defaultValues.diets && defaultValues.diets.length) ||
      (defaultValues.techniques && defaultValues.techniques.length) ||
      (defaultValues.specialAttributes &&
        defaultValues.specialAttributes.length) ||
      (defaultValues.cookTime &&
        (defaultValues.cookTime[0] !== 0 ||
          defaultValues.cookTime[1] !== 240)) ||
      (defaultValues.calories &&
        (defaultValues.calories[0] !== 0 ||
          defaultValues.calories[1] !== 2000)) ||
      (defaultValues.estimatedCost &&
        (defaultValues.estimatedCost[0] !== 0 ||
          defaultValues.estimatedCost[1] !== 30))
  );

  // Determine if any advanced filter is set
  const hasAdvancedFilters = Boolean(
    (defaultValues.diets && defaultValues.diets.length) ||
      (defaultValues.techniques && defaultValues.techniques.length) ||
      (defaultValues.specialAttributes &&
        defaultValues.specialAttributes.length) ||
      (defaultValues.cookTime &&
        (defaultValues.cookTime[0] !== 0 ||
          defaultValues.cookTime[1] !== 240)) ||
      (defaultValues.calories &&
        (defaultValues.calories[0] !== 0 ||
          defaultValues.calories[1] !== 2000)) ||
      (defaultValues.estimatedCost &&
        (defaultValues.estimatedCost[0] !== 0 ||
          defaultValues.estimatedCost[1] !== 30))
  );

  // State for active tab and advanced filters
  const [activeTab, setActiveTab] = useState(
    hasActiveFilters ? 'filters' : 'search'
  );
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedFilters);

  const filterValues = filtersForm.watch();
  const isCaloriesDefault =
    filterValues.calories[0] === 0 && filterValues.calories[1] === 2000;
  const isCookTimeDefault =
    filterValues.cookTime[0] === 0 && filterValues.cookTime[1] === 240;
  const isEstimatedCostDefault =
    !filterValues.estimatedCost ||
    (filterValues.estimatedCost[0] === 0 &&
      filterValues.estimatedCost[1] === 30);
  const activeCount = [
    filterValues.mealType,
    filterValues.difficulty,
    filterValues.country,
    ...(filterValues.diets || []),
    ...(filterValues.techniques || []),
    ...(filterValues.specialAttributes || []),
    !isCookTimeDefault ? 'cook' : '',
    !isCaloriesDefault ? 'cal' : '',
    !isEstimatedCostDefault ? 'cost' : '',
  ].filter(Boolean).length;

  const handleClearAll = () => {
    // Explicitly reset all fields to their default values, including calories
    filtersForm.reset({
      ...defaultValues,
      calories: [0, 2000],
      cookTime: [0, 240],
      estimatedCost: [0, 30],
      diets: [],
      techniques: [],
      specialAttributes: [],
      mealType: '',
      difficulty: '',
      country: '',
    });
    onReset();
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue={hasActiveFilters ? 'filters' : 'search'}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger
            value="search"
            onClick={() => {
              filtersForm.reset({ ...defaultValues, search: '' });
              filtersForm.handleSubmit(onSearchSubmit)();
            }}
            className="cursor-pointer"
          >
            Search
          </TabsTrigger>
          <TabsTrigger
            value="filters"
            onClick={() => {
              searchForm.reset({ search: '' });
              searchForm.handleSubmit(onSearchSubmit)();
            }}
            className="cursor-pointer"
          >
            Filters
            {activeCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                {activeCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="search">
          <Form {...searchForm}>
            <form
              className="flex flex-row gap-2"
              onSubmit={searchForm.handleSubmit(onSearchSubmit)}
            >
              <FormField
                name="search"
                control={searchForm.control}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        placeholder="What do you want to cook today?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="default">
                Search
              </Button>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="filters">
          <Form {...filtersForm}>
            <form
              className="flex flex-col md:flex-row gap-4 items-stretch md:top-4 md:z-10"
              onSubmit={filtersForm.handleSubmit(onFiltersSubmit)}
            >
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex flex-col gap-4 flex-1">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex flex-col w-full md:w-40">
                      <FormField
                        name="mealType"
                        control={filtersForm.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meal Type</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full md:w-40">
                                  <SelectValue placeholder="Meal Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mealTypes.map((m) => (
                                    <SelectItem key={m} value={m}>
                                      {m}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex flex-col w-full md:w-32">
                      <FormField
                        name="difficulty"
                        control={filtersForm.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full md:w-32">
                                  <SelectValue placeholder="Difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                  {difficulties.map((d) => (
                                    <SelectItem key={d} value={d}>
                                      {d}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex flex-col w-full md:w-40">
                      <FormField
                        name="country"
                        control={filtersForm.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cuisine</FormLabel>
                            <FormControl>
                              <Combobox
                                options={countries.map((c) => ({
                                  value: c,
                                  label: c,
                                }))}
                                value={field.value}
                                onChange={field.onChange}
                                selectPlaceholder="Cuisine"
                                triggerClassName="w-full md:w-40 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary/30 focus:border-primary/30 shadow-sm transition-colors hover:bg-background hover:border-input focus:bg-background focus:border-primary/30"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {/* Advanced Filters Toggle */}
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition w-fit mt-2 mb-1 cursor-pointer"
                    onClick={() => setShowAdvanced((v) => !v)}
                    aria-expanded={showAdvanced}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showAdvanced ? 'rotate-180' : ''
                      }`}
                    />
                    Advanced Filters
                  </button>
                  {/* Advanced Filters Collapsible */}
                  <div
                    className={`${
                      showAdvanced ? 'block' : 'hidden'
                    } animate-fade-in`}
                  >
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <div className="flex flex-col w-full md:w-1/3 md:flex-1">
                        <FormField
                          name="diets"
                          control={filtersForm.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Diets</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={dietLabels}
                                  value={field.value || []}
                                  onValueChange={field.onChange}
                                  placeholder="Diets"
                                  className="w-full"
                                  maxCount={1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col w-full md:w-1/3 md:flex-1">
                        <FormField
                          name="techniques"
                          control={filtersForm.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Techniques</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={techniquesOptions}
                                  value={field.value || []}
                                  onValueChange={field.onChange}
                                  placeholder="Techniques"
                                  className="w-full"
                                  maxCount={1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col w-full md:w-1/3 md:flex-1">
                        <FormField
                          name="specialAttributes"
                          control={filtersForm.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Attributes</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={specialAttributes}
                                  value={field.value || []}
                                  onValueChange={field.onChange}
                                  placeholder="Special Attributes"
                                  className="w-full"
                                  maxCount={1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 mt-4 md:pt-2">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex flex-col w-full md:w-1/3 gap-2">
                          <FormField
                            name="calories"
                            control={filtersForm.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Calories (kcal) per serving
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    min={0}
                                    max={2000}
                                    step={50}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    defaultValue={[0, 2000]}
                                  />
                                </FormControl>
                                <div className="text-xs text-muted-foreground">
                                  {isCaloriesDefault
                                    ? 'Any'
                                    : `${filterValues.calories[0]}–${filterValues.calories[1]} kcal`}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex flex-col w-full md:w-1/3 gap-2">
                          <FormField
                            name="cookTime"
                            control={filtersForm.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cook Time (min)</FormLabel>
                                <FormControl>
                                  <Slider
                                    min={0}
                                    max={240}
                                    step={5}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    defaultValue={[0, 240]}
                                  />
                                </FormControl>
                                <div className="text-xs text-muted-foreground">
                                  {isCookTimeDefault
                                    ? 'Any'
                                    : `${filterValues.cookTime[0]}–${filterValues.cookTime[1]} min`}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex flex-col w-full md:w-1/3 gap-2">
                          <FormField
                            name="estimatedCost"
                            control={filtersForm.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Estimated Cost (€) per serving
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    min={0}
                                    max={30}
                                    step={1}
                                    value={field.value || [0, 30]}
                                    onValueChange={field.onChange}
                                    defaultValue={[0, 30]}
                                  />
                                </FormControl>
                                <div className="text-xs text-muted-foreground">
                                  {isEstimatedCostDefault
                                    ? 'Any'
                                    : `€${
                                        filterValues.estimatedCost?.[0] ?? 0
                                      }–€${
                                        filterValues.estimatedCost?.[1] ?? 30
                                      }`}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Vertical separator for desktop */}
                <div className="hidden md:flex flex-col justify-center items-center mx-2">
                  <div
                    className="w-px h-full bg-border/40"
                    style={{ minHeight: 120 }}
                  />
                </div>
                {/* Action button area */}
                <div className="flex flex-row md:flex-col items-end md:items-center gap-2 md:gap-2 md:w-auto md:self-start">
                  <Button
                    type="submit"
                    className="w-full md:w-28 cursor-pointer"
                  >
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full md:w-28 cursor-pointer"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </>
  );
};
