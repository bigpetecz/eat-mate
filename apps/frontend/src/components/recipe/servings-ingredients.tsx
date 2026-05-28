'use client';
import { FC, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;

function toMixedFraction(value: number): string {
  const tolerance = 1e-4;
  const denominators = [2, 3, 4, 8];
  const whole = Math.floor(value);
  const frac = value - whole;
  for (const denom of denominators) {
    const num = Math.round(frac * denom);
    if (Math.abs(frac - num / denom) < tolerance && num !== 0) {
      if (whole === 0) return `${num}/${denom}`;
      return `${whole} ${num}/${denom}`;
    }
  }
  return value % 1 === 0 ? String(value) : value.toFixed(2);
}

function formatQuantity(
  value: number,
  unit: string
): { main: string; unit: string } {
  return {
    main: toMixedFraction(value),
    unit: unit,
  };
}

interface ServingsIngredientsProps {
  ingredients: { name: string; quantity: string; unit: string }[];
  servings: number;
  labels: {
    ingredients: string;
    servings: string;
  };
}

export const ServingsIngredients: FC<ServingsIngredientsProps> = ({
  ingredients,
  servings: initialServings,
  labels,
}) => {
  const safeInitialServings = Math.max(initialServings, MIN_SERVINGS);
  const [servings, setServings] = useState(safeInitialServings);
  const scale = servings / safeInitialServings;

  useEffect(() => {
    setServings(safeInitialServings);
  }, [safeInitialServings]);

  function updateServings(nextServings: number) {
    const clampedServings = Math.min(
      MAX_SERVINGS,
      Math.max(MIN_SERVINGS, nextServings)
    );

    setServings(clampedServings);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 21v-7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {labels.ingredients}
        </h2>
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-sm text-muted-foreground">
            {labels.servings}
          </span>
          <div
            className="inline-flex items-center rounded-lg border bg-background shadow-sm"
            aria-label={labels.servings}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => updateServings(servings - 1)}
              disabled={servings <= MIN_SERVINGS}
              aria-label={`Decrease ${labels.servings}`}
            >
              <span aria-hidden="true">−</span>
            </Button>
            <span className="min-w-10 px-3 text-center text-sm font-medium">
              {servings}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => updateServings(servings + 1)}
              disabled={servings >= MAX_SERVINGS}
              aria-label={`Increase ${labels.servings}`}
            >
              <span aria-hidden="true">+</span>
            </Button>
          </div>
        </div>
      </div>
      <ul className="space-y-1">
        {ingredients?.map((ing, idx) => {
          if (ing.quantity) {
            const scaled = formatQuantity(
              Number(ing.quantity) * scale,
              ing.unit
            );
            return (
              <li key={idx} className="flex gap-2 items-baseline">
                <span className="ml-1">{ing.name}:</span>
                <span className="font-mono font-semibold text-base">
                  {scaled.main}
                </span>
                {scaled.unit && (
                  <span className="text-muted-foreground text-sm">
                    {scaled.unit}
                  </span>
                )}
              </li>
            );
          }
          return (
            <li key={idx} className="flex gap-2 items-baseline">
              <span className="ml-1">{ing.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
