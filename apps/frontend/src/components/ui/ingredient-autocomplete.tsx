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

interface IngredientAutocompleteOption {
  id: string;
  name: string;
  image?: string | null;
}

interface IngredientAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: IngredientAutocompleteOption) => void;
  placeholder?: string;
  loadingLabel: string;
  noIngredientsFoundLabel?: string;
}

export const IngredientAutocomplete: React.FC<
  IngredientAutocompleteProps & {
    inputRef?: (el: HTMLInputElement | null) => void;
  }
> = ({
  value,
  onChange,
  onSelect,
  placeholder,
  loadingLabel,
  noIngredientsFoundLabel,
  inputRef,
}) => {
  const [input, setInput] = useState(value);
  const [options, setOptions] = useState<IngredientAutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { language: lang } = useParams();

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    if (!input || input.length < 1) {
      setOptions([]);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(
        `/api/ingredients/autocomplete?q=${encodeURIComponent(input)}${
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
      <Command className="relative w-full bg-white dark:bg-input/30 border border-input rounded-md focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50">
        <CommandInput
          value={input}
          onValueChange={(val) => {
            setInput(val);
            onChange(val);
          }}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          className="z-10" // lower than list
          ref={inputRef}
          data-ingredient-autocomplete-input
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
                  noIngredientsFoundLabel
                )}
              </CommandEmpty>
              {options.length > 0 &&
                options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => {
                      setInput(option.name);
                      onChange(option.name);
                      onSelect?.(option);
                      setFocused(false);
                    }}
                    className="cursor-pointer px-3 py-2 hover:bg-accent"
                  >
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
