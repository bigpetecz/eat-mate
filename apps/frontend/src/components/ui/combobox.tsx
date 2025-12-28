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
import { FC, ReactNode } from 'react';

interface ComboboxProps {
  searchPlaceholder?: string;
  selectPlaceholder?: string;
  noOptionsText?: string;
  options: { label: string; value: string; icon?: ReactNode }[];
  value?: string;
  onChange: (value: string) => void;
  triggerClassName?: string; // Optional custom class for trigger button
}
export const Combobox: FC<ComboboxProps> = ({
  searchPlaceholder,
  selectPlaceholder,
  noOptionsText = 'No options found.',
  options,
  value,
  onChange,
  triggerClassName,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn('w-[200px] justify-between', triggerClassName)}
        >
          {value ? (
            <span className="text-foreground">
              {options.find((option) => option.value === value)?.icon}{' '}
              {options.find((option) => option.value === value)?.label}
            </span>
          ) : (
            <span className="text-muted-foreground">{selectPlaceholder}</span>
          )}
          <ChevronsUpDown className="ml-2 text-foreground opacity-50" />
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
                  {option?.icon && <span>{option.icon}</span>}
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
