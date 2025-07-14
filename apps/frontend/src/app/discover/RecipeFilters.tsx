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

interface RecipeFiltersProps {
  defaultValues: {
    search: string;
    mealType: string;
    diets: string[];
    techniques: string[];
    difficulty: string;
    country: string;
    cookTime: number[];
    calories: number[];
  };
  onReset: () => void;
  onSearchSubmit: (values: Record<string, unknown>) => void;
  onFiltersSubmit: (values: Record<string, unknown>) => void;
}

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
const difficulties = ['Easy', 'Medium', 'Hard'];

const techniques = [
  'boiling',
  'blanching',
  'steaming',
  'poaching',
  'simmering',
  'stewing',
  'braising',
  'roasting',
  'baking',
  'grilling',
  'broiling',
  'sauteing',
  'stir-frying',
  'deep-frying',
  'pan-frying',
  'smoking',
  'pickling',
  'fermenting',
  'sous-vide',
  'raw',
];
const dietLabels = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'soy-free',
  'low-carb',
  'low-fat',
  'paleo',
  'keto',
  'whole30',
  'halal',
  'kosher',
];

const countries = [
  'Czech Republic',
  'United States',
  'Italy',
  'France',
  'India',
  'Japan',
  'United Kingdom',
  'Germany',
  'Spain',
  'China',
  'Brazil',
  'Russia',
  'Canada',
  'Australia',
  'Mexico',
  'South Korea',
  'Turkey',
  'Argentina',
  'South Africa',
  'Egypt',
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filterValues = filtersForm.watch();
  const isCaloriesDefault =
    filterValues.calories[0] === 0 && filterValues.calories[1] === 2000;
  const isCookTimeDefault =
    filterValues.cookTime[0] === 0 && filterValues.cookTime[1] === 240;
  const activeCount = [
    filterValues.mealType,
    filterValues.difficulty,
    filterValues.country,
    ...(filterValues.diets || []),
    ...(filterValues.techniques || []),
    !isCookTimeDefault ? 'cook' : '',
    !isCaloriesDefault ? 'cal' : '',
  ].filter(Boolean).length;

  const handleClearAll = () => {
    filtersForm.reset(defaultValues);
    onReset();
  };

  return (
    <>
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger
            value="search"
            onClick={() => {
              filtersForm.reset({ ...defaultValues, search: '' });
              filtersForm.handleSubmit(onSearchSubmit)();
            }}
          >
            Search
          </TabsTrigger>
          <TabsTrigger
            value="filters"
            onClick={() => {
              searchForm.reset({ search: '' });
              searchForm.handleSubmit(onSearchSubmit)();
            }}
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
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition w-fit mt-2 mb-1"
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
                      <div className="flex flex-col w-full md:w-1/2 md:flex-1">
                        <FormField
                          name="diets"
                          control={filtersForm.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Diets</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={dietLabels.map((d) => ({
                                    value: d,
                                    label: d,
                                  }))}
                                  value={field.value || []}
                                  onValueChange={field.onChange}
                                  placeholder="Diets"
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col w-full md:w-1/2 md:flex-1">
                        <FormField
                          name="techniques"
                          control={filtersForm.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Techniques</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={techniques.map((t) => ({
                                    value: t,
                                    label: t,
                                  }))}
                                  value={field.value || []}
                                  onValueChange={field.onChange}
                                  placeholder="Techniques"
                                  className="w-full"
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
                        <div className="flex flex-col w-full md:w-1/2 gap-2">
                          <FormField
                            name="calories"
                            control={filtersForm.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Calories</FormLabel>
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
                        <div className="flex flex-col w-full md:w-1/2 gap-2">
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
                  <Button type="submit" className="w-full md:w-28">
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full md:w-28"
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
