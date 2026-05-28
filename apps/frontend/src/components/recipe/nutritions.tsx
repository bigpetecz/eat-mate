'use client';

import { NutritionBar } from '@/components/recipe/nutrition-bar';
import { Button } from '@/components/ui/button';
import { Recipe } from '@/types/recipe';
import { FC, useEffect, useState } from 'react';

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

  useEffect(() => {
    if (userGender) {
      setGender(userGender);
    }
  }, [userGender]);

  return (
    <div className="w-full md:pr-6">
      <div className="mb-4 space-y-2">
        <h3 className="font-medium">{dict.nutritionPerServing}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {dict.basedOn || 'Based on'}
          </span>
          <div className="inline-flex rounded-lg border bg-background p-1 shadow-sm">
            <Button
              type="button"
              size="sm"
              variant={gender === 'male' ? 'secondary' : 'ghost'}
              className="h-7 px-3"
              onClick={() => setGender('male')}
              aria-pressed={gender === 'male'}
            >
              {dict.male || 'Male'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={gender === 'female' ? 'secondary' : 'ghost'}
              className="h-7 px-3"
              onClick={() => setGender('female')}
              aria-pressed={gender === 'female'}
            >
              {dict.female || 'Female'}
            </Button>
          </div>
        </div>
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
