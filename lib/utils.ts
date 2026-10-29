import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateDDMMYYYY(dateInput: Date | string | number, separator: string = "-"): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}${separator}${month}${separator}${year}`;
}

/**
 * Formats an amount using the Indian numbering system (e.g. 12,34,567.00).
 * Accepts numbers or pre-formatted strings like "₹ 1,234,567.00" / "$10000",
 * preserving any currency symbol and the original number of decimal places.
 */
export function formatIndianAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString("en-IN") : String(value);
  }

  const match = value.match(/-?\d[\d,]*(\.\d+)?/);
  if (!match) return value;

  const numeric = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return value;

  const decimals = match[1] ? match[1].length - 1 : 0;
  const formatted = numeric.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return value.slice(0, match.index) + formatted + value.slice(match.index! + match[0].length);
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function wordsBelowThousand(value: number): string {
  const parts: string[] = [];
  if (value >= 100) {
    parts.push(`${ONES[Math.floor(value / 100)]} Hundred`);
    value %= 100;
  }
  if (value >= 20) {
    parts.push(TENS[Math.floor(value / 10)]);
    value %= 10;
  }
  if (value) parts.push(ONES[value]);
  return parts.join(" ");
}

function indianIntegerInWords(value: number): string {
  if (value === 0) return "Zero";
  const units: Array<[number, string]> = [
    [10_000_000, "Crore"],
    [100_000, "Lakh"],
    [1_000, "Thousand"],
  ];
  const parts: string[] = [];
  for (const [divisor, label] of units) {
    if (value >= divisor) {
      parts.push(`${indianIntegerInWords(Math.floor(value / divisor))} ${label}`);
      value %= divisor;
    }
  }
  if (value) parts.push(wordsBelowThousand(value));
  return parts.join(" ");
}

/**
 * Returns an Indian amount in English words, preserving paise when present.
 * Non-numeric values deliberately return an empty string so callers do not
 * attach a misleading tooltip to arbitrary text.
 */
export function formatIndianAmountInWords(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const match = String(value).match(/-?\d[\d,]*(\.\d+)?/);
  if (!match) return "";

  const numeric = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(numeric) || Math.abs(numeric) >= 1_000_000_000_000) return "";

  const absolute = Math.abs(numeric);
  const totalPaise = Math.round(absolute * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  const prefix = numeric < 0 ? "Minus " : "";
  const fractional = paise ? ` and ${indianIntegerInWords(paise)} Paise` : "";
  return `${prefix}${indianIntegerInWords(rupees)} Rupees${fractional}`;
}

/** Identifies monetary schema fields without treating counts or percentages as amounts. */
export function isMonetaryField(field: {
  fieldname?: string;
  label?: string;
  fieldtype?: string;
}): boolean {
  if (field.fieldtype === "Currency") return true;
  const text = `${field.fieldname || ""} ${field.label || ""}`.toLowerCase().replace(/_/g, " ");
  return (
    /\b(amount|salary|ctc|compensation|stipend|remuneration|fee|price)\b/.test(text) &&
    !/percent|percentage|rate|count|number/.test(text)
  );
}
