'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { Spinner } from '@/components/ui/spinner';
import { useParams } from 'next/navigation';
import { createPortal } from 'react-dom';

interface UnitAutocompleteOption {
  id: string;
  name: string;
  symbol?: string | null;
}

interface UnitAutocompleteProps {
  value: string;
  onChange: (
    value: string,
    parsedValues?: { quantity: string; unit: string }
  ) => void;
  onSelect?: (option: UnitAutocompleteOption) => void;
  placeholder?: string;
  loadingLabel: string;
  noUnitsFoundLabel?: string;
  inputRef?: (el: HTMLInputElement | null) => void;
}

export const UnitAutocomplete: React.FC<UnitAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder,
  loadingLabel,
  noUnitsFoundLabel,
  inputRef,
}) => {
  const [input, setInput] = useState(value);
  const [options, setOptions] = useState<UnitAutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { language: lang } = useParams();

  // Only update internal input when the external value changes significantly
  // and there's no current user input focus
  useEffect(() => {
    if (!focused && value !== input) {
      setInput(value);
    }
  }, [value, focused, input]);

  // Extract unit part from input (remove numbers and spaces from beginning)
  const extractUnitQuery = (input: string): string => {
    // Remove leading numbers, decimals, fractions, and spaces
    return input.replace(/^[\d\s.,/-]+/, '').trim();
  };

  // Extract quantity part from input (numbers, decimals, fractions at the beginning)
  const extractQuantityPart = (input: string): string => {
    const match = input.match(/^[\d\s.,/-]+/);
    return match ? match[0].trim() : '';
  };

  // Combine quantity with selected unit
  const combineQuantityAndUnit = (
    input: string,
    selectedUnit: string
  ): string => {
    const quantityPart = extractQuantityPart(input);
    if (quantityPart) {
      return `${quantityPart} ${selectedUnit}`;
    }
    return selectedUnit;
  };

  useEffect(() => {
    if (!input || input.length < 1) {
      setOptions([]);
      return;
    }

    const unitQuery = extractUnitQuery(input);
    if (!unitQuery || unitQuery.length < 1) {
      setOptions([]);
      return;
    }

    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(
        `/api/units/autocomplete?q=${encodeURIComponent(unitQuery)}${
          lang ? `&lang=${lang}` : ''
        }`
      )
        .then((res) => res.json())
        .then((data) => setOptions(data))
        .finally(() => setLoading(false));
    }, 200);
  }, [input, lang]);

  // click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    }
    if (focused) {
      document.addEventListener('click', handleClick);
    } else {
      document.removeEventListener('click', handleClick);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [focused]);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (focused && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    } else {
      setCoords(null);
    }
  }, [focused, input]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Command
        className="relative w-full bg-white dark:bg-input/30 border border-input rounded-md focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50"
        shouldFilter={false}
      >
        <CommandInput
          value={input}
          onValueChange={(val) => {
            setInput(val);
            const quantity = extractQuantityPart(val);
            const unit = extractUnitQuery(val);
            onChange(val, { quantity, unit });
          }}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          className="z-10"
          ref={inputRef}
          data-unit-autocomplete-input
        />

        {focused &&
          input.length >= 1 &&
          coords &&
          createPortal(
            <CommandList
              className="absolute z-50 max-h-56 overflow-y-auto rounded-md border bg-white dark:bg-input shadow-md"
              style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
              }}
            >
              <CommandEmpty>
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Spinner size="small" />
                    <span>{loadingLabel}</span>
                  </span>
                ) : (
                  noUnitsFoundLabel
                )}
              </CommandEmpty>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    const combinedValue = combineQuantityAndUnit(
                      input,
                      option.name
                    );
                    const quantity = extractQuantityPart(combinedValue);
                    const unit = option.name;

                    setInput(combinedValue);
                    onChange(combinedValue, { quantity, unit });
                    onSelect?.(option);
                    setFocused(false);
                  }}
                  className="cursor-pointer px-3 py-2 hover:bg-accent"
                >
                  {option.symbol ? (
                    <span className="mr-2 text-muted-foreground">
                      {option.symbol}
                    </span>
                  ) : null}
                  {option.name}
                </CommandItem>
              ))}
            </CommandList>,
            document.body
          )}
      </Command>
    </div>
  );
};
