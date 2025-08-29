'use client';

import apiClient from '@/app/apiClient';
import { User } from '@/app/auth/authStore';
import RecipeForm from '@/components/recipe/recipe-form';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { toast } from 'sonner';

interface CreateRecipeFormProps {
  user: User;
  dict: Record<string, string>;
}

export const CreateRecipeForm: FC<CreateRecipeFormProps> = ({ user, dict }) => {
  const router = useRouter();
  const onSubmit = async (data: any, newFiles: File[]) => {
    try {
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
      router.push(`/recipes/${recipeId}`);
    } catch (error) {
      toast.error('Failed to save recipe.');
      console.error(error);
    }
  };
  return (
    <RecipeForm
      dict={dict}
      onSubmit={onSubmit}
      defaultValues={{
        title: '',
        description: '',
        country: '',
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        ingredients: [{ name: '', quantity: '' }],
        instructions: [''],
      }}
    />
  );
};
