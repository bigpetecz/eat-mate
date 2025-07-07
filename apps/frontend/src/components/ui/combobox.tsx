'use client';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FC } from 'react';

interface ComboboxProps {
  searchPlaceholder?: string;
  selectPlaceholder?: string;
  noOptionsText?: string;
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
}
export const Combobox: FC<ComboboxProps> = ({
  searchPlaceholder,
  selectPlaceholder,
  noOptionsText = 'No options found.',
  options,
  value,
  onChange,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'w-[200px] justify-between',
            !value && 'text-muted-foreground'
          )}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : selectPlaceholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{noOptionsText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  value={option.label}
                  key={option.value}
                  onSelect={() => onChange(option.value)}
                >
                  {option.label}
                  <Check
                    className={cn(
                      'ml-auto',
                      option.value === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
