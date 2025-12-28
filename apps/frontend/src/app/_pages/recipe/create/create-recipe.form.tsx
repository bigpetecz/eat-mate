'use client';

import { apiClient } from '@/app/api-client';
import { User } from '@/app/auth/authStore';
import RecipeForm from '@/components/recipe/recipe-form';
import { getLocalizedRoute, Locale } from '@/i18n';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { toast } from 'sonner';

interface CreateRecipeFormProps {
  language: Locale;
  user: User | null;
  dict: Record<string, string>;
}

export const CreateRecipeForm: FC<CreateRecipeFormProps> = ({
  user,
  dict,
  language,
}) => {
  const router = useRouter();

  const onSubmit = async (data: any, newFiles: File[]) => {
    try {
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      // 1. Create recipe (without images)
      const res = await apiClient.post('/recipes', {
        ...data,
        author: user._id,
      });
      const recipeId = res.data._id || res.data.id;
      // 2. Upload images if any
      if (newFiles.length > 0 && recipeId) {
        const formData = new FormData();
        newFiles.forEach((file) => formData.append('files', file));
        await apiClient.post(`/recipes/${recipeId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast('Recipe saved!');
      router.push(getLocalizedRoute('recipeDetail', language, res.data.slug));
    } catch (error) {
      toast.error('Failed to save recipe.');
      console.error(error);
    }
  };
  return (
    <RecipeForm
      dict={dict}
      onSubmit={onSubmit}
      onCancel={() => router.push(getLocalizedRoute('myRecipes', language))}
      defaultValues={{
        title: '',
        description: '',
        country: '',
        prepTime: 0,
        cookTime: 0,
        servings: 0,
        ingredients: [{ name: '', quantity: '', unit: '' }],
        instructions: [''],
      }}
    />
  );
};
