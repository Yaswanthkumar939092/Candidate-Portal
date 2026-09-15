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
