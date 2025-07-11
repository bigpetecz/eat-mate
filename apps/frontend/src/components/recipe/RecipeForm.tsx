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
import { FC } from 'react';
import apiClient from '@/app/apiClient';
import { toast } from 'sonner';
import { User } from '@/app/auth/authStore';
import { useRouter } from 'next/navigation';
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
  user: User;
}

type Ingredient = {
  name: string;
  quantity: string;
};

type RecipeFormValues = {
  title: string;
  description: string;
  country?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
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

const RecipeForm: FC<RecipeFormProps> = ({ defaultValues, user }) => {
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const onFileReject = (file: File, message: string) => {
    // You can show a toast or error message here
    toast.error(`${file.name}: ${message}`);
  };

  function getFlagEmoji(countryCode: string) {
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  }

  const onSubmit = async (data: RecipeFormValues) => {
    try {
      // 1. Create recipe (without images)
      const res = await apiClient.post('/recipes', {
        ...data,
        author: user._id,
      });
      const recipeId = res.data._id || res.data.id;
      // 2. Upload images if any
      if (files.length > 0 && recipeId) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        await apiClient.post(`/recipes/${recipeId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast('Recipe saved!');
      router.push('/');
    } catch (error) {
      toast.error('Failed to save recipe.');
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 mx-auto"
        encType="multipart/form-data"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Recipe title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Short description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Combobox
                  options={countries.map((country) => ({
                    value: country.name,
                    label: country.name,
                    icon: getFlagEmoji(country.code),
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="prepTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Prep Time (min)</FormLabel>
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
              <FormItem className="flex-1">
                <FormLabel>Cook Time (min)</FormLabel>
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
              <FormItem className="flex-1">
                <FormLabel>Servings</FormLabel>
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
              <FormLabel>Ingredients</FormLabel>
              <FormDescription>
                List all ingredients and their quantities.
              </FormDescription>
              <div className="space-y-2">
                {field.value.map((ing: Ingredient, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Name"
                      value={ing.name}
                      onChange={(e) => {
                        const newArr = [...field.value];
                        newArr[idx].name = e.target.value;
                        field.onChange(newArr);
                      }}
                    />
                    <Input
                      placeholder="Quantity"
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
                      Remove
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
                  Add Ingredient
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
              <FormLabel>Instructions</FormLabel>
              <FormDescription>
                Step-by-step cooking instructions.
              </FormDescription>
              <div className="space-y-2">
                {field.value.map((step: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={`Step ${idx + 1}`}
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
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => field.onChange([...field.value, ''])}
                >
                  Add Step
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Images Upload */}
        <FormItem>
          <FormLabel>Images</FormLabel>
          <FormDescription>
            Upload 2 great photos of your finished recipe. <br />
            Good photos make your recipe more appealing and help others try it!
          </FormDescription>
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
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center justify-center rounded-full border p-2.5">
                  <Upload className="size-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">Drag & drop files here</p>
                <p className="text-muted-foreground text-xs">
                  Or click to browse (max 2 files, up to 5MB each)
                </p>
              </div>
              <FileUploadTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2 w-fit">
                  Browse files
                </Button>
              </FileUploadTrigger>
            </FileUploadDropzone>
            <FileUploadList>
              {files.map((file, index) => (
                <FileUploadItem key={index} value={file}>
                  <FileUploadItemPreview />
                  <FileUploadItemMetadata />
                  <FileUploadItemDelete asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 cursor-pointer"
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
          Submit
        </Button>
      </form>
    </Form>
  );
};

export default RecipeForm;
