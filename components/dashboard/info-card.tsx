import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface InfoCardProps {
  /** Icon element rendered inside a blue circle. */
  icon: React.ReactNode;
  /** Short label describing the value (e.g. "Joining Date"). */
  label: string;
  /** The primary display value (e.g. "Mon, 8 Sep 2025"). */
  value: string;
  /** Optional secondary text below the value (e.g. address details). */
  subtitle?: string;
  /** Optional tag or React node displayed in the top-right corner (e.g. "Full Time", "In 24 Days"). */
  tag?: React.ReactNode;
  /** Visual style of the tag. */
  tagVariant?: "default" | "green" | "link";
  className?: string;
}

/**
 * A compact information card for the dashboard.
 *
 * Shows an icon in a blue circle, a label, a primary value, an optional
 * subtitle, and an optional tag/badge in the top-right area. Used to display
 * data points like Joining Date, Office Location, and Role & Department.
 */
export function InfoCard({
  icon,
  label,
  value,
  subtitle,
  tag,
  tagVariant = "default",
  className,
}: InfoCardProps) {
  return (
    <Card className={cn("relative shadow-sm", className)}>
      <CardContent className="space-y-3 py-3">
        {/* Top row: icon + tag */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {tag && (
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                tagVariant === "green" && "text-green-600 dark:text-green-400",
                tagVariant === "link" &&
                  "cursor-pointer text-primary hover:underline",
                tagVariant === "default" &&
                  "rounded-md bg-muted px-2 py-0.5 text-muted-foreground",
              )}
            >
              {tag}
            </span>
          )}
        </div>

        {/* Label */}
        <p className="text-xs font-medium text-muted-foreground">{label}</p>

        {/* Value */}
        <p className="text-base font-bold text-foreground">{value}</p>

        {/* Optional subtitle */}
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
