"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface JourneyCountdownProps {
  /** ISO date string for the joining date. */
  joiningDate?: string | null
  className?: string
}

/**
 * Calculates the number of full days remaining until the target date.
 * Returns 0 if the date has already passed.
 */
function getDaysUntil(isoDate: string): number {
  const now = new Date()
  const target = new Date(isoDate)
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  )
  const diff = targetDay.getTime() - nowDay.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * A lightweight countdown display that shows how many days remain until
 * the candidate's joining date. Designed to be rendered inline within an
 * info card or alongside other dashboard elements.
 *
 * Computes the day count on the client to avoid hydration mismatches.
 */
export function JourneyCountdown({ joiningDate, className }: JourneyCountdownProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!joiningDate) {
      setDaysLeft(null)
      return
    }
    setDaysLeft(getDaysUntil(joiningDate))
  }, [joiningDate])

  if (daysLeft === null || !joiningDate) return null

  return (
    <span
      className={cn(
        "text-xs font-medium text-green-600 dark:text-green-400",
        className
      )}
    >
      In {daysLeft} {daysLeft === 1 ? "Day" : "Days"}
    </span>
  )
}
