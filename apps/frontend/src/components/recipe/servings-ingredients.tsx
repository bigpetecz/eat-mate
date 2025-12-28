'use client';
import { FC, useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

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
  const [servings, setServings] = useState(initialServings);
  const scale = servings / initialServings;

  return (
    <div>
      <div className="flex">
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
        <div className="flex items-center mb-4 ml-auto">
          <span>{labels.servings}:</span>
          <Select
            value={String(servings)}
            onValueChange={(v) => setServings(Number(v))}
          >
            <SelectTrigger className="w-16 h-7 ml-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...Array(12)].map((_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
