import React from 'react';

type NutritionBarProps = {
  label: string;
  value: number; // actual nutrient (e.g. 27 g protein)
  unit: string;
  percent: number; // % of recommended daily intake
  dayValueLabel: string;
};

const getBarColor = (percent: number) => {
  if (percent <= 50) return 'bg-accent';
  if (percent <= 100) return 'bg-primary';
  return 'bg-destructive';
};

export function NutritionBar({
  label,
  value,
  dayValueLabel,
  unit,
  percent,
}: NutritionBarProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>
          {value}
          {unit}{' '}
          <span className="text-muted-foreground">
            ({percent}% {dayValueLabel})
          </span>
        </span>
      </div>
      <div className="w-full h-3 rounded-lg bg-muted overflow-hidden">
        <div
          className={`h-full ${getBarColor(percent)}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
