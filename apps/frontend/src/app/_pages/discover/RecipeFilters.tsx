import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
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
import type { RecipeSourceType } from '@/types/recipe';
import {
  countries,
  difficulties,
  mealTypes,
} from './components/discoverFilterOptions';
import {
  CurvedRangeSlider,
  RangeSummary,
} from './components/discoverRangeSlider';

interface RecipeFiltersProps {
  defaultValues: {
    search: string;
    mealType: string;
    sourceType: '' | RecipeSourceType;
    diets: string[];
    techniques: string[];
    specialAttributes: string[];
    difficulty: string;
    country: string;
    cookTime: [number, number];
    calories: [number, number];
    estimatedCost: [number, number];
  };
  onReset: (values: RecipeFiltersProps['defaultValues']) => void;
  onSearchSubmit: (values: Record<string, unknown>) => void;
  onFiltersSubmit: (values: Record<string, unknown>) => void;
  dict: Record<string, string>;
}

export const RecipeFilters: React.FC<RecipeFiltersProps> = ({
  defaultValues,
  onReset,
  onSearchSubmit,
  onFiltersSubmit,
  dict,
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
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      const trimmedQuery = query.trim();
      if (trimmedQuery && trimmedQuery !== lastSearchedQuery.current) {
        lastSearchedQuery.current = trimmedQuery;
        onSearchSubmit({ search: query });
      }
    }, 500);
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
    defaultValues.sourceType ||
    defaultValues.difficulty ||
    defaultValues.country ||
    (defaultValues.diets && defaultValues.diets.length) ||
    (defaultValues.techniques && defaultValues.techniques.length) ||
    (defaultValues.specialAttributes &&
      defaultValues.specialAttributes.length) ||
    (defaultValues.cookTime &&
      (defaultValues.cookTime[0] !== 0 || defaultValues.cookTime[1] !== 240)) ||
    (defaultValues.calories &&
      (defaultValues.calories[0] !== 0 ||
        defaultValues.calories[1] !== 2000)) ||
    (defaultValues.estimatedCost &&
      (defaultValues.estimatedCost[0] !== 0 ||
        defaultValues.estimatedCost[1] !== 30)),
  );

  // Determine if any advanced filter is set
  const hasAdvancedFilters = Boolean(
    (defaultValues.diets && defaultValues.diets.length) ||
    (defaultValues.techniques && defaultValues.techniques.length) ||
    (defaultValues.specialAttributes &&
      defaultValues.specialAttributes.length) ||
    (defaultValues.cookTime &&
      (defaultValues.cookTime[0] !== 0 || defaultValues.cookTime[1] !== 240)) ||
    (defaultValues.calories &&
      (defaultValues.calories[0] !== 0 ||
        defaultValues.calories[1] !== 2000)) ||
    (defaultValues.estimatedCost &&
      (defaultValues.estimatedCost[0] !== 0 ||
        defaultValues.estimatedCost[1] !== 30)),
  );

  // State for active tab and advanced filters
  const [activeTab, setActiveTab] = useState(
    hasActiveFilters ? 'filters' : 'search',
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
    filterValues.sourceType,
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
    const clearedValues: RecipeFiltersProps['defaultValues'] = {
      ...defaultValues,
      search: '',
      calories: [0, 2000],
      cookTime: [0, 240],
      estimatedCost: [0, 30],
      diets: [],
      techniques: [],
      specialAttributes: [],
      mealType: '',
      sourceType: '',
      difficulty: '',
      country: '',
    };

    filtersForm.reset(clearedValues);
    onReset(clearedValues);
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
            {dict['Search']}
          </TabsTrigger>
          <TabsTrigger
            value="filters"
            onClick={() => {
              searchForm.reset({ search: '' });
              searchForm.handleSubmit(onSearchSubmit)();
            }}
            className="cursor-pointer"
          >
            {dict['Filters']}
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
                        placeholder={dict['What do you want to cook?']}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="default">
                {dict['Search']}
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
                            <FormLabel>{dict['Meal Type']}</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full md:w-40">
                                  <SelectValue
                                    placeholder={dict['Meal Type']}
                                  />
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
                    <div className="flex flex-col w-full md:w-40">
                      <FormField
                        name="sourceType"
                        control={filtersForm.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{dict['Source']}</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full md:w-40">
                                  <SelectValue placeholder={dict['Source']} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user_original">
                                    {dict['Original']}
                                  </SelectItem>
                                  <SelectItem value="inspired_by_chef">
                                    {dict['Inspired by chef']}
                                  </SelectItem>
                                  <SelectItem value="adapted_from_external">
                                    {dict['Adapted']}
                                  </SelectItem>
                                  <SelectItem value="licensed_partner">
                                    {dict['Licensed']}
                                  </SelectItem>
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
                            <FormLabel>{dict['Difficulty']}</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full md:w-32">
                                  <SelectValue
                                    placeholder={dict['Difficulty']}
                                  />
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
                            <FormLabel>{dict['Cuisine']}</FormLabel>
                            <FormControl>
                              <Combobox
                                options={countries.map((c) => ({
                                  value: c,
                                  label: c,
                                }))}
                                value={field.value}
                                onChange={field.onChange}
                                selectPlaceholder={dict['Cuisine']}
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
                    {dict['Advanced Filters']}
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
                              <FormLabel>{dict['Diets']}</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={dietLabels.map((opt) => ({
                                    value: opt.value,
                                    label: dict[opt.value] || opt.label,
                                  }))}
                                  value={field.value || []}
                                  onValueChange={field.onChange}
                                  placeholder={dict['Diets']}
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
                              <FormLabel>{dict['Techniques']}</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={techniquesOptions.map((opt) => ({
                                    value: opt.value,
                                    label: dict[opt.value] || opt.label,
                                  }))}
                                  value={field.value || []}
                                  onValueChange={field.onChange}
                                  placeholder={dict['Techniques']}
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
                              <FormLabel>
                                {dict['Special Attributes']}
                              </FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={specialAttributes.map((opt) => ({
                                    value: opt.value,
                                    label: dict[opt.value] || opt.label,
                                  }))}
                                  value={field.value || []}
                                  onValueChange={field.onChange}
                                  placeholder={dict['Special Attributes']}
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
                                  {dict['Calories (kcal) per serving']}
                                </FormLabel>
                                <FormControl>
                                  <CurvedRangeSlider
                                    min={0}
                                    max={2000}
                                    step={50}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    defaultValue={[0, 2000]}
                                  />
                                </FormControl>
                                <RangeSummary
                                  value={filterValues.calories}
                                  maxValue={2000}
                                  defaultLabel={dict['Any']}
                                  suffix=" kcal"
                                />
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
                                <FormLabel>{dict['Cook Time (min)']}</FormLabel>
                                <FormControl>
                                  <CurvedRangeSlider
                                    min={0}
                                    max={240}
                                    step={5}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    defaultValue={[0, 240]}
                                  />
                                </FormControl>
                                <RangeSummary
                                  value={filterValues.cookTime}
                                  maxValue={240}
                                  defaultLabel={dict['Any']}
                                  suffix=" min"
                                />
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
                                  {dict['Estimated Cost (€) per serving']}
                                </FormLabel>
                                <FormControl>
                                  <CurvedRangeSlider
                                    min={0}
                                    max={30}
                                    step={1}
                                    value={field.value || [0, 30]}
                                    onValueChange={field.onChange}
                                    defaultValue={[0, 30]}
                                  />
                                </FormControl>
                                <RangeSummary
                                  value={filterValues.estimatedCost}
                                  maxValue={30}
                                  defaultLabel={dict['Any']}
                                  prefix="€"
                                  suffix=""
                                />
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
                <div className="flex flex-col items-end md:items-center gap-2 md:gap-2 md:w-auto">
                  <Button
                    type="submit"
                    className="w-full md:w-28 cursor-pointer"
                  >
                    {dict['Apply']}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full md:w-28 cursor-pointer"
                    onClick={handleClearAll}
                  >
                    {dict['Clear All']}
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
