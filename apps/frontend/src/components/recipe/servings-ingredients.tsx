'use client';
import { FC, useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

function parseQuantity(q: string): { value: number; unit: string } | null {
  const match = q.match(/^([\d./]+)\s*(.*)$/);
  if (!match) return null;
  const valueStr = match[1];
  let value: number;
  if (valueStr.includes('/')) {
    const [num, denom] = valueStr.split('/').map(Number);
    if (!isNaN(num) && !isNaN(denom) && denom !== 0) value = num / denom;
    else return null;
  } else {
    value = parseFloat(valueStr);
  }
  if (isNaN(value)) return null;
  return { value, unit: match[2] };
}

function formatQuantity(value: number, unit: string): string {
  return `${parseFloat(value.toFixed(2))} ${unit}`.trim();
}

interface ServingsIngredientsProps {
  ingredients: { name: string; quantity: string }[];
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
      <ul className="list-disc list-inside space-y-1">
        {ingredients?.map((ing, idx) => {
          const parsed = parseQuantity(ing.quantity);
          if (parsed) {
            const scaled = formatQuantity(parsed.value * scale, parsed.unit);
            return (
              <li key={idx}>
                <span>{ing.name}</span>: {scaled}
              </li>
            );
          } else {
            return (
              <li key={idx}>
                <span>{ing.name}</span>: {ing.quantity}
              </li>
            );
          }
        })}
      </ul>
    </div>
  );
};
