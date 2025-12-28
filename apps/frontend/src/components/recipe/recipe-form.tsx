'use client';
import { useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/form/form';
import { Input } from '@/components/ui/input';
import { IngredientAutocomplete } from '@/components/ui/ingredient-autocomplete';
import { UnitAutocomplete } from '@/components/ui/unit-autocomplete';

import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { FC, useCallback, useState, useRef } from 'react';

import { toast } from 'sonner';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
} from '@/components/ui/file-uploader';
import { PlusIcon, Upload, X } from 'lucide-react';
import { StepsEditor } from '@/components/steps-editor/steps-editor';
import { countries } from './countries';
import { Separator } from '../ui/separator';

export interface RecipeFormProps {
  defaultValues: RecipeFormValues;
  onSubmit: (data: RecipeFormValues, files: File[]) => Promise<void>;
  defaultFiles?: File[];
  onRemoveImage?: (url: string) => void;
  onCancel?: () => void;
  dict: Record<string, string>;
}

export type Ingredient = {
  name: string;
  quantity: string;
  unit?: string;
  ingredientId?: string;
  unitId?: string; // store selected unit's id
};

export type RecipeFormValues = {
  title: string;
  description: string;
  country: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
};

function getFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' }),
  country: z.string().min(1, { message: 'Country is required.' }),
  prepTime: z.coerce
    .number()
    .min(0, { message: 'Prep time must be 0 or more.' })
    .max(1440, { message: 'Prep time must be less than 24 hours.' }),
  cookTime: z.coerce
    .number()
    .min(0, { message: 'Cook time must be 0 or more.' })
    .max(1440, { message: 'Cook time must be less than 24 hours.' }),
  servings: z.coerce
    .number()
    .min(1, { message: 'Servings must be at least 1.' })
    .max(100, { message: 'Servings must be less than 100.' }),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, { message: 'Ingredient name required.' }),
        quantity: z.string().min(1, { message: 'Quantity required.' }),
        ingredientId: z.string().optional(),
        unit: z.string().optional(),
        unitId: z.string().optional(), // unit id if selected
      })
    )
    .min(1, { message: 'At least one ingredient is required.' }),
  instructions: z
    .array(
      z
        .string()
        .min(5, { message: 'Instruction must be at least 5 characters.' })
    )
    .min(1, { message: 'At least one instruction is required.' }),
});

const RecipeForm: FC<RecipeFormProps> = ({
  defaultValues,
  onSubmit,
  defaultFiles,
  onRemoveImage,
  onCancel,
  dict = {},
}) => {
  // Scroll to top on mount with smooth transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Refs for focusing ingredient inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [files, setFiles] = useState<File[]>(defaultFiles || []);
  const [removingIdx, setRemovingIdx] = useState<number | null>(null);
  const onFileReject = (file: File, message: string) => {
    // You can show a toast or error message here
    toast.error(`${file.name}: ${message}`);
  };

  const onFormSubmit = useCallback(
    async (data: RecipeFormValues) => {
      onSubmit(data, files);
    },
    [files, onSubmit]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onFormSubmit)}
        className="space-y-8 mx-auto w-full"
        encType="multipart/form-data"
      >
        <div className="flex flex-row gap-4 w-full items-end">
          <div className="flex-1 min-w-0">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel id="recipe-title-label">{dict.title}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={dict.title}
                      aria-label={dict.title}
                      aria-labelledby="recipe-title-label"
                      aria-required="true"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="min-w-[180px] max-w-xs">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.country}</FormLabel>
                  <FormControl>
                    <Combobox
                      options={countries.map((country) => ({
                        value: country.name,
                        label: country.name,
                        icon: getFlagEmoji(country.code),
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      triggerClassName="hover:bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dict.description}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={dict.descriptionPlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <FormField
            control={form.control}
            name="prepTime"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0">
                <FormLabel>{dict.prepTime}</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cookTime"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0">
                <FormLabel>{dict.cookTime}</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="servings"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0">
                <FormLabel>{dict.servings}</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Ingredients */}
        <FormField
          control={form.control}
          name="ingredients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dict.ingredients}</FormLabel>
              <FormDescription>{dict.ingredientsDescription}</FormDescription>
              <div className="space-y-2">
                {field.value.map(
                  (ing: Ingredient & { image?: string }, idx: number) => (
                    <div
                      key={idx}
                      className={`flex gap-2 items-center transition-all duration-300 ${
                        removingIdx === idx
                          ? 'opacity-0 -translate-x-8 pointer-events-none'
                          : 'opacity-100 translate-x-0'
                      }`}
                    >
                      <IngredientAutocomplete
                        loadingLabel={dict.loading}
                        noIngredientsFoundLabel={dict.noIngredientsFound}
                        value={ing.name}
                        onChange={(val) => {
                          const newArr = [...field.value];
                          newArr[idx].name = val;
                          delete newArr[idx].ingredientId; // clear id when user types new name
                          field.onChange(newArr);
                        }}
                        onSelect={(option) => {
                          const newArr = [...field.value];
                          newArr[idx].ingredientId = option.id; // store id when selected
                          newArr[idx].name = option.name;
                          field.onChange(newArr);
                        }}
                        placeholder={dict.ingredientNamePlaceholder}
                        inputRef={(el: HTMLInputElement | null) => {
                          inputRefs.current[idx] = el;
                        }}
                      />
                      <UnitAutocomplete
                        value={
                          ing.quantity && ing.unit
                            ? `${ing.quantity} ${ing.unit}`
                            : ing.unit || ''
                        }
                        onChange={(val, parsedValues) => {
                          const newArr = [...field.value];

                          if (parsedValues) {
                            // Update both quantity and unit if parsing is available
                            if (parsedValues.quantity) {
                              newArr[idx].quantity = parsedValues.quantity;
                            }
                            newArr[idx].unit = parsedValues.unit || val;
                            // clear unitId when user freeforms
                            delete newArr[idx].unitId;
                          } else {
                            // Fallback to just updating unit
                            newArr[idx].unit = val;
                          }

                          field.onChange(newArr);
                        }}
                        onSelect={(option) => {
                          const newArr = [...field.value];
                          newArr[idx].unitId = option.id; // store selected unit id
                          newArr[idx].unit = option.name;
                          field.onChange(newArr);
                        }}
                        placeholder={dict.unitPlaceholder || 'Unit'}
                        loadingLabel={dict.loading || 'Loading…'}
                        noUnitsFoundLabel={
                          dict.noUnitsFound || 'No units found.'
                        }
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        aria-label={dict.removeIngredient}
                        onClick={() => {
                          setRemovingIdx(idx);
                          setTimeout(() => {
                            const newArr = field.value.filter(
                              (_: Ingredient, i: number) => i !== idx
                            );
                            field.onChange(newArr);
                            setRemovingIdx(null);
                          }, 300); // match duration-300
                        }}
                        className="cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="cursor-pointer mt-2"
                  onClick={() => {
                    field.onChange([
                      ...field.value,
                      { name: '', quantity: '', unit: '' },
                    ]);
                    setTimeout(() => {
                      // Focus the last input after render using refs
                      if (inputRefs.current && inputRefs.current.length > 0) {
                        const last =
                          inputRefs.current[inputRefs.current.length - 1];
                        if (last) last.focus();
                      }
                    }, 0);
                  }}
                >
                  <PlusIcon className="w-6 h-6" /> {dict.addIngredient}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Instructions */}
        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dict.instructions}</FormLabel>
              <FormDescription>{dict.instructionsDescription}</FormDescription>
              <StepsEditor value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Images Upload */}
        <FormItem>
          <FormLabel>{dict.images}</FormLabel>
          <FormDescription>{dict.imagesDescription}</FormDescription>
          <FileUpload
            maxFiles={2}
            maxSize={5 * 1024 * 1024}
            accept="image/*"
            value={files}
            onValueChange={setFiles}
            onFileReject={onFileReject}
            multiple
          >
            <FileUploadDropzone>
              <div className="flex flex-col items-center gap-1 sm:gap-1 md:gap-2 w-full max-w-xs sm:max-w-xs md:max-w-sm px-2 py-2 sm:px-4 sm:py-4 md:px-6 md:py-6">
                <div className="flex items-center justify-center rounded-full border p-2 sm:p-2.5 md:p-3">
                  <Upload className="size-5 sm:size-6 md:size-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-xs sm:text-sm">
                  {dict.dragDrop}
                </p>
                <p className="text-muted-foreground text-[10px] sm:text-xs">
                  {dict.orClickToBrowse}
                </p>
              </div>
              <FileUploadTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full max-w-[120px] sm:max-w-[160px] md:max-w-[200px] text-xs sm:text-sm py-1 sm:py-2"
                >
                  {dict.browseFiles}
                </Button>
              </FileUploadTrigger>
            </FileUploadDropzone>
            <FileUploadList className="space-y-1 sm:space-y-2">
              {files.map((file, index) => (
                <FileUploadItem
                  key={index}
                  value={file}
                  className="min-h-8 sm:min-h-10"
                >
                  <FileUploadItemPreview className="size-8 sm:size-10" />
                  <FileUploadItemMetadata className="text-xs sm:text-sm" />
                  <FileUploadItemDelete asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 sm:size-7 cursor-pointer"
                      onClick={() => onRemoveImage?.(file.name)}
                    >
                      <X />
                    </Button>
                  </FileUploadItemDelete>
                </FileUploadItem>
              ))}
            </FileUploadList>
          </FileUpload>
        </FormItem>
        <Separator />
        <div className="flex justify-end gap-2 mt-6">
          {typeof onCancel === 'function' && (
            <Button
              size="lg"
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              {dict.cancel || 'Cancel'}
            </Button>
          )}
          <Button size="lg" className="cursor-pointer" type="submit">
            {defaultValues.title !== '' ? dict.saveRecipe : dict.createRecipe}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RecipeForm;
