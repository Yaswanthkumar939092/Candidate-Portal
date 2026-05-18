"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
  // For server side search
  searchValue?: string;
  onSearchValueChange?: (search: string) => void;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  disabled = false,
  className,
  loading = false,
  searchValue,
  onSearchValueChange,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState("");

  const isServerSearch = onSearchValueChange !== undefined;
  const searchQuery = isServerSearch ? (searchValue ?? "") : localSearch;

  // Reset local search when closing
  React.useEffect(() => {
    if (!open) {
      setLocalSearch("");
    }
  }, [open]);

  const filteredOptions = React.useMemo(() => {
    if (isServerSearch) return options;
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery, isServerSearch]);

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isServerSearch) {
      onSearchValueChange?.(val);
    } else {
      setLocalSearch(val);
    }
  };

  // Group the options dynamically
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, ComboboxOption[]> = {};
    filteredOptions.forEach((opt) => {
      const groupName = opt.group || "";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(opt);
    });
    return Object.entries(groups);
  }, [filteredOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal bg-muted text-left border-input text-sm relative h-9 px-3 py-2 shadow-xs disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate pr-6">
            {value ? (selectedOption ? selectedOption.label : value) : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 absolute right-3 top-1/2 -translate-y-1/2 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-[var(--radix-popover-trigger-width)] overflow-hidden"
        align="start"
      >
        <div className="flex flex-col w-full max-h-80">
          <div className="flex items-center px-3 border-b h-9 relative shrink-0">
            <Search className="h-4 w-4 mr-2 opacity-50 shrink-0" />
            <input
              className="flex h-full w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus-visible:ring-0"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearch}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 py-1">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-sm text-center text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              groupedOptions.map(([groupName, groupItems]) => (
                <React.Fragment key={groupName}>
                  {groupName && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-y border-border/40 select-none">
                      {groupName}
                    </div>
                  )}
                  {groupItems.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          onValueChange(option.value);
                          setOpen(false);
                        }}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                          isSelected && "bg-accent/50 font-medium"
                        )}
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          {isSelected && <Check className="h-4 w-4" />}
                        </span>
                        <span className="truncate">{option.label}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
