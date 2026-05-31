'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SelectProps {
  children?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
}

interface SelectContextValue {
  value?: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
  options: SelectOption[];
  highlightedValue?: string;
  setHighlightedValue: (value?: string) => void;
  labels: Map<string, string>;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext(componentName: string) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error(`${componentName} must be used within Select`);
  }

  return context;
}

function getNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (!node || typeof node === 'boolean') {
    return '';
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join(' ').replace(/\s+/g, ' ').trim();
  }

  if (React.isValidElement(node)) {
    return getNodeText((node.props as { children?: React.ReactNode }).children);
  }

  return '';
}

function collectSelectItems(node: React.ReactNode, options: SelectOption[]) {
  if (!node || typeof node === 'boolean') {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((childNode) => collectSelectItems(childNode, options));
    return;
  }

  if (!React.isValidElement(node)) {
    return;
  }

  const props = node.props as {
    value?: string;
    textValue?: string;
    disabled?: boolean;
    children?: React.ReactNode;
  };

  if (node.type === SelectItem && typeof props.value === 'string') {
    options.push({
      value: props.value,
      label: props.textValue || getNodeText(props.children),
      disabled: Boolean(props.disabled),
    });
  }

  collectSelectItems(props.children, options);
}

function getEnabledOptions(options: SelectOption[]) {
  return options.filter((option) => !option.disabled);
}

function getNextOptionValue(
  options: SelectOption[],
  currentValue: string | undefined,
  direction: 'next' | 'prev',
) {
  const enabledOptions = getEnabledOptions(options);

  if (!enabledOptions.length) {
    return undefined;
  }

  const currentIndex = enabledOptions.findIndex(
    (option) => option.value === currentValue,
  );

  if (currentIndex < 0) {
    return direction === 'next'
      ? enabledOptions[0].value
      : enabledOptions[enabledOptions.length - 1].value;
  }

  const nextIndex =
    direction === 'next'
      ? (currentIndex + 1) % enabledOptions.length
      : (currentIndex - 1 + enabledOptions.length) % enabledOptions.length;

  return enabledOptions[nextIndex].value;
}

function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  disabled,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const [highlightedValue, setHighlightedValue] = React.useState<
    string | undefined
  >();

  const options = React.useMemo(() => {
    const nextOptions: SelectOption[] = [];
    collectSelectItems(children, nextOptions);
    return nextOptions;
  }, [children]);

  const labels = React.useMemo(() => {
    const nextLabels = new Map<string, string>();
    options.forEach((option) => {
      nextLabels.set(option.value, option.label);
    });
    return nextLabels;
  }, [options]);

  const selectedValue = value ?? uncontrolledValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
      setOpen(false);
    },
    [onValueChange, value],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const enabledOptions = getEnabledOptions(options);

    if (!enabledOptions.length) {
      setHighlightedValue(undefined);
      return;
    }

    const isCurrentValueEnabled = enabledOptions.some(
      (option) => option.value === selectedValue,
    );
    const nextHighlightedValue = isCurrentValueEnabled
      ? selectedValue
      : enabledOptions[0].value;

    setHighlightedValue(nextHighlightedValue);
  }, [open, options, selectedValue]);

  return (
    <SelectContext.Provider
      value={{
        value: selectedValue,
        setValue,
        open,
        setOpen,
        disabled,
        options,
        highlightedValue,
        setHighlightedValue,
        labels,
      }}
    >
      <PopoverPrimitive.Root
        data-slot="select"
        open={open}
        onOpenChange={setOpen}
      >
        {children}
      </PopoverPrimitive.Root>
    </SelectContext.Provider>
  );
}

function SelectGroup({ ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="select-group" {...props} />;
}

function SelectValue({
  placeholder,
  ...props
}: React.ComponentProps<'span'> & {
  placeholder?: React.ReactNode;
}) {
  const { value, labels } = useSelectContext('SelectValue');
  const label = value ? labels.get(value) : '';

  return (
    <span data-slot="select-value" {...props}>
      {label || placeholder}
    </span>
  );
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<'button'> & {
  size?: 'sm' | 'default';
}) {
  const { value, open, setOpen, disabled, options, setHighlightedValue } =
    useSelectContext('SelectTrigger');

  return (
    <PopoverPrimitive.Trigger
      type="button"
      data-slot="select-trigger"
      data-size={size}
      role="combobox"
      aria-expanded={open}
      disabled={disabled || props.disabled}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const nextValue = getNextOptionValue(
            options,
            value,
            event.key === 'ArrowDown' ? 'next' : 'prev',
          );
          setHighlightedValue(nextValue);
          setOpen(true);
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen(!open);
        }
      }}
      {...props}
    >
      {children}
      <ChevronDownIcon className="size-4 opacity-50" />
    </PopoverPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const {
    open,
    setOpen,
    setValue,
    options,
    highlightedValue,
    setHighlightedValue,
  } = useSelectContext('SelectContent');
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const focusItem = React.useCallback((valueToFocus?: string) => {
    if (!contentRef.current || !valueToFocus) {
      return;
    }

    const selector = `[data-select-item-value="${CSS.escape(valueToFocus)}"]`;
    const item = contentRef.current.querySelector<HTMLButtonElement>(selector);
    item?.focus();
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    focusItem(highlightedValue);
  }, [focusItem, highlightedValue, open]);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="select-content"
        sideOffset={4}
        align="start"
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) w-[var(--radix-popover-trigger-width)] min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md',
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        ref={(node) => {
          contentRef.current = node;
          if (typeof props.ref === 'function') {
            props.ref(node);
          } else if (props.ref) {
            (
              props.ref as React.MutableRefObject<HTMLDivElement | null>
            ).current = node;
          }
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          focusItem(highlightedValue);
          props.onOpenAutoFocus?.(event);
        }}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);

          if (event.defaultPrevented) {
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const nextValue = getNextOptionValue(
              options,
              highlightedValue,
              event.key === 'ArrowDown' ? 'next' : 'prev',
            );
            setHighlightedValue(nextValue);
            focusItem(nextValue);
            return;
          }

          if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            const enabledOptions = getEnabledOptions(options);
            const edgeValue =
              event.key === 'Home'
                ? enabledOptions[0]?.value
                : enabledOptions[enabledOptions.length - 1]?.value;

            setHighlightedValue(edgeValue);
            focusItem(edgeValue);
            return;
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (highlightedValue) {
              setValue(highlightedValue);
            }
            return;
          }

          if (event.key === 'Escape' || event.key === 'Tab') {
            setOpen(false);
          }
        }}
        {...props}
      >
        <div className="p-1">{children}</div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="select-label"
      className={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  value,
  textValue,
  disabled,
  ...props
}: React.ComponentProps<'button'> & {
  value: string;
  textValue?: string;
}) {
  const {
    value: selectedValue,
    setValue,
    highlightedValue,
    setHighlightedValue,
  } = useSelectContext('SelectItem');
  const isSelected = selectedValue === value;
  const isHighlighted = highlightedValue === value;
  const isDisabled = Boolean(disabled);

  return (
    <button
      type="button"
      data-slot="select-item"
      data-select-item-value={value}
      role="option"
      aria-selected={isSelected}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      tabIndex={isHighlighted ? 0 : -1}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      onMouseMove={() => {
        if (!isDisabled) {
          setHighlightedValue(value);
        }
      }}
      onFocus={() => {
        if (!isDisabled) {
          setHighlightedValue(value);
        }
      }}
      onClick={() => {
        if (!isDisabled) {
          setValue(value);
        }
      }}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="size-4" />}
      </span>
      <span>{children}</span>
    </button>
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="select-separator"
      className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ ..._props }: React.ComponentProps<'div'>) {
  return null;
}

function SelectScrollDownButton({ ..._props }: React.ComponentProps<'div'>) {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
