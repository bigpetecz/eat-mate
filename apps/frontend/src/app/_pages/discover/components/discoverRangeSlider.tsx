import React from 'react';

import { Slider } from '@/components/ui/slider';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalize(value: number, min: number, max: number) {
  if (max === min) {
    return 0;
  }

  return (value - min) / (max - min);
}

function denormalize(value: number, min: number, max: number) {
  return min + value * (max - min);
}

function getCurveExponent(value: [number, number], maxValue: number) {
  const spanRatio = (value[1] - value[0]) / maxValue;

  if (spanRatio <= 0.1) {
    return 0.55;
  }

  if (spanRatio <= 0.25) {
    return 0.7;
  }

  return 1;
}

function toDisplayValue(
  value: number,
  min: number,
  max: number,
  exponent: number,
) {
  return denormalize(Math.pow(normalize(value, min, max), exponent), 0, 100);
}

function toActualValue(
  value: number,
  min: number,
  max: number,
  exponent: number,
) {
  return denormalize(
    Math.pow(normalize(value, 0, 100), 1 / exponent),
    min,
    max,
  );
}

function snapToStep(value: number, min: number, step: number) {
  return Math.round((value - min) / step) * step + min;
}

interface CurvedRangeSliderProps extends Omit<
  React.ComponentProps<typeof Slider>,
  'min' | 'max' | 'step' | 'value' | 'onValueChange'
> {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function CurvedRangeSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  ...props
}: CurvedRangeSliderProps) {
  const exponent = getCurveExponent(value, max - min);
  const displayValue: [number, number] = [
    toDisplayValue(value[0], min, max, exponent),
    toDisplayValue(value[1], min, max, exponent),
  ];

  return (
    <Slider
      min={0}
      max={100}
      step={1}
      value={displayValue}
      onValueChange={(nextValue) => {
        onValueChange([
          clamp(
            snapToStep(
              toActualValue(nextValue[0], min, max, exponent),
              min,
              step,
            ),
            min,
            max,
          ),
          clamp(
            snapToStep(
              toActualValue(nextValue[1], min, max, exponent),
              min,
              step,
            ),
            min,
            max,
          ),
        ]);
      }}
      {...props}
    />
  );
}

interface RangeSummaryProps {
  value: [number, number];
  maxValue: number;
  defaultLabel: string;
  prefix?: string;
  suffix?: string;
}

export function RangeSummary({
  value,
  maxValue,
  defaultLabel,
  prefix,
  suffix = '',
}: RangeSummaryProps) {
  const rangeLabel = `${prefix || ''}${value[0]}–${prefix || ''}${value[1]}${suffix}`;
  const isDefault = value[0] === 0 && value[1] === maxValue;

  return (
    <div className="text-xs text-muted-foreground">
      {isDefault ? defaultLabel : rangeLabel}
    </div>
  );
}
