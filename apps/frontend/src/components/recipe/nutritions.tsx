'use client';

import { NutritionBar } from '@/components/recipe/nutrition-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Recipe } from '@/types/recipe';
import { FC, useState } from 'react';

interface NutritionsProps {
  recipe: Recipe;
  dict: Record<string, string>;
  userGender?: 'male' | 'female' | null;
}

export const Nutritions: FC<NutritionsProps> = ({
  dict,
  recipe,
  userGender,
}) => {
  const [gender, setGender] = useState<'male' | 'female'>(userGender ?? 'male');
  const DAILY_VALUES_BY_GENDER = {
    male: {
      calories: 2500,
      protein: 56,
      fat: 70,
      carbs: 300,
      fiber: 30,
      sugar: 50,
      sodium: 2300,
    },
    female: {
      calories: 2000,
      protein: 46,
      fat: 70,
      carbs: 260,
      fiber: 25,
      sugar: 50,
      sodium: 2300,
    },
  };
  const dailyValues = DAILY_VALUES_BY_GENDER[gender];
  return (
    <div className="w-full md:pr-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium mb-2">{dict.nutritionPerServing}</h3>
        <Select
          value={gender}
          onValueChange={(value) => setGender(value as 'male' | 'female')}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">{dict.male || 'Male'}</SelectItem>
            <SelectItem value="female">{dict.female || 'Female'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        {recipe.ai?.nutrition?.calories != null && (
          <NutritionBar
            label={dict.calories}
            value={recipe.ai.nutrition.calories}
            unit="kcal"
            dayValueLabel={dict.dayValue}
            percent={Math.round(
              (recipe.ai.nutrition.calories / dailyValues.calories) * 100
            )}
          />
        )}
        {recipe.ai?.nutrition?.protein != null && (
          <NutritionBar
            label={dict.protein}
            value={recipe.ai.nutrition.protein}
            unit="g"
            dayValueLabel={dict.dayValue}
            percent={Math.round(
              (recipe.ai.nutrition.protein / dailyValues.protein) * 100
            )}
          />
        )}
        {recipe.ai?.nutrition?.fat != null && (
          <NutritionBar
            label={dict.fat}
            value={recipe.ai.nutrition.fat}
            unit="g"
            dayValueLabel={dict.dayValue}
            percent={Math.round(
              (recipe.ai.nutrition.fat / dailyValues.fat) * 100
            )}
          />
        )}
        {recipe.ai?.nutrition?.carbs != null && (
          <NutritionBar
            label={dict.carbs}
            value={recipe.ai.nutrition.carbs}
            unit="g"
            dayValueLabel={dict.dayValue}
            percent={Math.round(
              (recipe.ai.nutrition.carbs / dailyValues.carbs) * 100
            )}
          />
        )}
        {recipe.ai?.nutrition?.fiber != null && (
          <NutritionBar
            label={dict.fiber}
            value={recipe.ai.nutrition.fiber}
            unit="g"
            dayValueLabel={dict.dayValue}
            percent={Math.round(
              (recipe.ai.nutrition.fiber / dailyValues.fiber) * 100
            )}
          />
        )}
        {recipe.ai?.nutrition?.sugar != null && (
          <NutritionBar
            label={dict.sugar}
            value={recipe.ai.nutrition.sugar}
            unit="g"
            dayValueLabel={dict.dayValue}
            percent={Math.round(
              (recipe.ai.nutrition.sugar / dailyValues.sugar) * 100
            )}
          />
        )}
        {recipe.ai?.nutrition?.sodium != null && (
          <NutritionBar
            label={dict.sodium}
            value={recipe.ai.nutrition.sodium}
            unit="mg"
            dayValueLabel={dict.dayValue}
            percent={Math.round(
              (recipe.ai.nutrition.sodium / dailyValues.sodium) * 100
            )}
          />
        )}
      </div>
    </div>
  );
};
