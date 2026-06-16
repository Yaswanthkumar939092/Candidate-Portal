import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SectionCardProps {
  title?: string
  sectionTitle?: string
  children: React.ReactNode
  className?: string
  id?: string
  counts?: { filled: number; total: number }
}

export function SectionCard({ title, sectionTitle, children, className, id, counts }: SectionCardProps) {
  return (
    <Card 
      id={id}
      data-section-title={sectionTitle || title}
      className={cn("shadow-sm border-none overflow-hidden bg-white dark:bg-card scroll-mt-24", className)}
    >
      {title && (
        <CardHeader className="pt-2 px-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground">
              {title}
            </CardTitle>
            {counts && (
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary select-none transition-all duration-300">
                {counts.filled}/{counts.total}
              </span>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="px-4 pb-2">
        {children}
      </CardContent>
    </Card>
  )
}
