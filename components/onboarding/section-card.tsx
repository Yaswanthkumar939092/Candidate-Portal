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
  children: React.ReactNode
  className?: string
}

export function SectionCard({ title, children, className }: SectionCardProps) {
  return (
    <Card className={cn("shadow-sm border-none overflow-hidden bg-white dark:bg-card", className)}>
      {title && (
        <CardHeader className="pt-2 px-6">
          <CardTitle className="text-lg font-bold text-foreground">
            {title}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="px-4 pb-2">
        {children}
      </CardContent>
    </Card>
  )
}
