"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatIndianAmount, formatIndianAmountInWords } from "@/lib/utils";

interface AmountDisplayProps {
  value: unknown;
  /** Use for salary bands or other values whose unit is not rupees. */
  words?: string;
  className?: string;
}

/** Indian-grouped amount with its value in words available on hover and focus. */
export function AmountDisplay({ value, words, className }: AmountDisplayProps) {
  const amount = typeof value === "number" || typeof value === "string" ? value : value == null ? null : String(value);
  const formatted = formatIndianAmount(amount);
  const amountInWords = words ?? formatIndianAmountInWords(amount);

  if (!formatted || !amountInWords) return <>{formatted}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn("cursor-help underline decoration-dotted underline-offset-3", className)}>
          {formatted}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{amountInWords}</TooltipContent>
    </Tooltip>
  );
}

function normalizeAmountInput(value: string): string {
  const numeric = value.replace(/[^0-9.]/g, "");
  const [integer, ...decimals] = numeric.split(".");
  return decimals.length ? `${integer}.${decimals.join("")}` : integer;
}

interface AmountInputProps extends Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> {
  value: string | number | null | undefined;
  onValueChange: (value: string) => void;
  words?: string;
}

/** Controlled numeric text input that shows Indian grouping without leaking separators to form state. */
export function AmountInput({ value, onValueChange, words, className, ...props }: AmountInputProps) {
  const rawValue = value === null || value === undefined ? "" : normalizeAmountInput(String(value));
  const formatted = formatIndianAmount(rawValue);
  const amountInWords = words ?? formatIndianAmountInWords(rawValue);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-muted-foreground">
            ₹
          </span>
          <Input
            {...props}
            type="text"
            inputMode="decimal"
            value={formatted}
            onChange={(event) => onValueChange(normalizeAmountInput(event.target.value))}
            className={cn("pl-8", className)}
          />
        </div>
      </TooltipTrigger>
      {amountInWords && <TooltipContent side="top">{amountInWords}</TooltipContent>}
    </Tooltip>
  );
}

const NUMBER = /\d[\d,]*(\.\d+)?/g;

/** Salary text such as "10 - 15 LPA" or "120,000 - 150,000": every figure grouped, range read out in words. */
export function SalaryDisplay({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return null;
  const text = value.replace(NUMBER, (figure) => formatIndianAmount(figure));
  const figures = Array.from(value.matchAll(NUMBER), (m) => Number(m[0].replace(/,/g, "")));
  // "120k" / "1.5M" shorthand is ambiguous without the author's intent, so it gets no reading.
  const ambiguous = /\d\s*[kKmM]\b/.test(value);
  const lpa = /\blpa\b/i.test(value);
  const words = ambiguous || figures.length === 0
    ? ""
    : figures.map((n) => formatIndianAmountInWords(lpa ? n * 100000 : n)).join(" to ") + (lpa ? " per annum" : "");
  return <AmountDisplay value={text} words={words} className={className} />;
}
