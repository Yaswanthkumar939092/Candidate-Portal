'use client'

interface OnboardingWizardProps {
  user: { id: string; email?: string }
  profile: {
    id: string
    full_name?: string | null
    email: string
    role?: string
  }
  onComplete: () => void
}

export function OnboardingWizard({ user, profile, onComplete }: OnboardingWizardProps) {
  return (
    <div>
      <p>Onboarding Wizard Placeholder</p>
      <button onClick={onComplete}>Complete</button>
    </div>
  )
}
