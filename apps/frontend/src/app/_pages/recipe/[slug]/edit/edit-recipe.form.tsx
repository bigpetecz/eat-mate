'use client';

import { apiClient } from '@/app/api-client';
import { User } from '@/app/auth/authStore';
import { RecipeFormValues } from '@/components/recipe/recipe-form';
import RecipeForm from '@/components/recipe/recipe-form';
import { Spinner } from '@/components/ui/spinner';
import { getLocalizedRoute, Locale } from '@/i18n';
import { Recipe } from '@/types/recipe';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface EditRecipeFormProps {
  language: Locale;
  user: User | null;
  dict: Record<string, string>;
}

const EditRecipeForm: React.FC<EditRecipeFormProps> = ({
  user,
  dict,
  language,
}) => {
  const { slug } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  // Track removed image URLs
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  // Track which files are from original images
  const [originalFileNames, setOriginalFileNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await apiClient.get(`/recipes/${language}/recipe/${slug}`);
        const recipeData = res.data;
        // Fetch each image as a File
        const fetchedFiles = await Promise.all(
          (recipeData.images || []).map(async (url: string, idx: number) => {
            const response = await fetch(url);
            const blob = await response.blob();
            const name = url.split('/').pop() || `image${idx}.jpg`;
            return new File([blob], name, { type: blob.type });
          })
        );
        setRecipe(recipeData);
        setFiles(fetchedFiles);
        setOriginalFileNames(fetchedFiles.map((file) => file.name));
      } catch {
        toast.error('Failed to load recipe.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [slug]);

  // Helper: map file name to image URL for originals
  const fileNameToUrl = (name: string) => {
    if (!recipe?.images) return undefined;
    return recipe.images.find((url) => url.split('/').pop() === name);
  };

  const handleRemoveImage = (fileName: string) => {
    const url = fileNameToUrl(fileName);
    if (url) {
      setRemovedImages((prev) => [...prev, url]);
    }
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const onSubmit = async (data: RecipeFormValues, newFiles: File[]) => {
    try {
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      // 1. Update recipe (without images)
      const response = await apiClient.put(`/recipes/${recipe?._id}`, {
        ...data,
        author: user._id,
        images: [],
      });
      // 2. Delete removed images
      for (const url of removedImages) {
        await apiClient.delete(`/recipes/${recipe?._id}/images`, {
          data: { url },
        });
      }
      // 3. Upload new images (those not in originalFileNames)
      const newUploads = newFiles.filter(
        (file) => !originalFileNames.includes(file.name)
      );
      if (newUploads.length > 0) {
        const formData = new FormData();
        newUploads.forEach((file) => formData.append('files', file));
        await apiClient.post(`/recipes/${recipe?._id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast('Recipe updated!');
      router.push(
        getLocalizedRoute('recipeDetail', language, response.data.slug)
      );
    } catch (error) {
      toast.error('Failed to update recipe.');
      console.error(error);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[20rem]">
        <Spinner />
      </div>
    );
  if (!recipe) return notFound();

  return (
    <RecipeForm
      dict={dict}
      onCancel={() =>
        router.push(getLocalizedRoute('recipeDetail', language, recipe.slug))
      }
      onSubmit={onSubmit}
      defaultValues={{
        title: recipe.title,
        description: recipe.description ?? '',
        country: recipe.country ?? '',
        prepTime: recipe.prepTime ?? 0,
        cookTime: recipe.cookTime ?? 0,
        servings: recipe.servings ?? 0,
        ingredients: recipe.ingredients ?? [],
        instructions: recipe.instructions ?? [],
      }}
      defaultFiles={files}
      onRemoveImage={handleRemoveImage}
    />
  );
};

export default EditRecipeForm;
