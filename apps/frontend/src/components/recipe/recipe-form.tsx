'use client';
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
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { FC, useCallback } from 'react';

import { toast } from 'sonner';
import { useState } from 'react';
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
import { Upload, X } from 'lucide-react';

export interface RecipeFormProps {
  defaultValues: RecipeFormValues;
  onSubmit: (data: RecipeFormValues, files: File[]) => Promise<void>;
  defaultFiles?: File[];
  onRemoveImage?: (url: string) => void;
  dict: Record<string, string>;
}

// Move RecipeFormValues type export to RecipeForm.tsx if not already exported
// If not exported, define locally for now
export type RecipeFormValues = {
  title: string;
  description: string;
  country?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
};

export type Ingredient = {
  name: string;
  quantity: string;
};

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' }),
  country: z.string().optional(),
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

// List of countries with codes for flags
const countries = [
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'US', name: 'United States' },
  { code: 'IT', name: 'Italy' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'CN', name: 'China' },
  { code: 'BR', name: 'Brazil' },
  { code: 'RU', name: 'Russia' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TR', name: 'Turkey' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  // ...add all other countries as needed
];

const RecipeForm: FC<RecipeFormProps> = ({
  defaultValues,
  onSubmit,
  defaultFiles,
  onRemoveImage,
  dict = {},
}) => {
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [files, setFiles] = useState<File[]>(defaultFiles || []);
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
        className="space-y-8 mx-auto w-full max-w-2xl"
        encType="multipart/form-data"
      >
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <div className="flex-1 min-w-0">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.title}</FormLabel>
                  <FormControl>
                    <Input placeholder={dict.title} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
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
                {field.value.map((ing: Ingredient, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={dict.ingredientNamePlaceholder}
                      value={ing.name}
                      onChange={(e) => {
                        const newArr = [...field.value];
                        newArr[idx].name = e.target.value;
                        field.onChange(newArr);
                      }}
                    />
                    <Input
                      placeholder={dict.ingredientQuantityPlaceholder}
                      value={ing.quantity}
                      onChange={(e) => {
                        const newArr = [...field.value];
                        newArr[idx].quantity = e.target.value;
                        field.onChange(newArr);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const newArr = field.value.filter(
                          (_: Ingredient, i: number) => i !== idx
                        );
                        field.onChange(newArr);
                      }}
                    >
                      {dict.removeIngredient}
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    field.onChange([...field.value, { name: '', quantity: '' }])
                  }
                >
                  {dict.addIngredient}
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
              <div className="space-y-2">
                {field.value.map((step: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={`${dict.stepPlaceholder} ${idx + 1}`}
                      value={step}
                      onChange={(e) => {
                        const newArr = [...field.value];
                        newArr[idx] = e.target.value;
                        field.onChange(newArr);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="cursor-pointer"
                      onClick={() => {
                        const newArr = field.value.filter(
                          (_: string, i: number) => i !== idx
                        );
                        field.onChange(newArr);
                      }}
                    >
                      {dict.removeStep}
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => field.onChange([...field.value, ''])}
                >
                  {dict.addStep}
                </Button>
              </div>
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
        <Button className="cursor-pointer" type="submit">
          {defaultValues.title !== '' ? dict.saveRecipe : dict.createRecipe}
        </Button>
      </form>
    </Form>
  );
};

export default RecipeForm;
