"use client"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/contexts/auth-context"
import { Badge } from "@/components/ui/badge"

interface WelcomeHeaderProps {
  /** The user's display name (first name is extracted automatically). */
  name?: string
  /** Override the default greeting text. */
  greeting?: string
  className?: string
}

/**
 * Returns a time-of-day greeting based on the current local hour.
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

/**
 * Extracts the first name from a full name string.
 */
function getFirstName(name?: string): string {
  if (!name) return "User"
  return name.split(" ")[0] || name
}

/**
 * Dashboard welcome header matching the PW Candidate Portal design.
 *
 * Shows a personalised greeting with a wave emoji, an onboarding subtitle,
 * and a "Profile Active" badge on the right when the user profile exists.
 */
export function WelcomeHeader({ name, greeting, className }: WelcomeHeaderProps) {
  const { profile } = useAuth()

  const resolvedGreeting = greeting || getGreeting()
  const firstName = getFirstName(name)

  const isProfileActive = Boolean(profile)

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {resolvedGreeting}, {firstName}!{" "}
          <span role="img" aria-label="wave">
            👋
          </span>
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Here is your onboarding snapshot. You are all set for your first day.
        </p>
      </div>
      <div className="flex flex-col items-end gap-3 shrink-0">
        {isProfileActive && (
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/30 bg-accent px-3 py-1 text-sm font-medium text-accent-foreground rounded-2xl"
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            Profile Active
          </Badge>
        )}
      </div>
    </div>
  )
}
