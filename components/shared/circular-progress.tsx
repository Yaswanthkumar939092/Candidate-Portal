"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  /** Progress value from 0 to 100 */
  value: number
  /** Diameter of the SVG in pixels (default: 120) */
  size?: number
  /** Width of the progress stroke in pixels (default: 8) */
  strokeWidth?: number
  className?: string
}

/**
 * A reusable SVG circular progress indicator.
 *
 * Renders two concentric circles: a muted background track and a primary-colored
 * arc representing the current progress. The percentage is displayed as text in
 * the center. The arc animates smoothly from 0 on mount.
 */
export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  className,
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  // Clamp the value between 0 and 100.
  const clampedValue = Math.min(100, Math.max(0, value))

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedValue / 100) * circumference

  // Animate from 0 to the target value on mount or when value changes.
  useEffect(() => {
    // Use a small delay so the initial render shows 0, then transitions.
    const timer = setTimeout(() => {
      setAnimatedValue(clampedValue)
    }, 50)
    return () => clearTimeout(timer)
  }, [clampedValue])

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="text-muted stroke-current"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary stroke-current transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {/* Percentage label */}
      <span className="absolute text-lg font-bold text-foreground">
        {Math.round(clampedValue)}%
      </span>
    </div>
  )
}
