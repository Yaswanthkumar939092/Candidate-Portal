import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { OnboardingWizard } from "@/components/onboarding-wizard"

describe("OnboardingWizard", () => {
  const mockUser = { id: "1", email: "test@example.com" }
  const mockProfile = { id: "1", email: "test@example.com", full_name: "Test User" }
  const mockOnComplete = vi.fn()

  // Spec: CAND-06-A10.1A (docs/spec/clauses/06-onboarding-components.md#cand-06-a10-1a)
  it("renders placeholder text", () => {
    render(
      <OnboardingWizard 
        user={mockUser} 
        profile={mockProfile} 
        onComplete={mockOnComplete} 
      />
    )
    expect(screen.getByText("Onboarding Wizard Placeholder")).toBeTruthy()
  })

  // Spec: CAND-06-A10.1B (docs/spec/clauses/06-onboarding-components.md#cand-06-a10-1b)
  it("calls onComplete when button is clicked", () => {
    render(
      <OnboardingWizard 
        user={mockUser} 
        profile={mockProfile} 
        onComplete={mockOnComplete} 
      />
    )
    const button = screen.getByText("Complete")
    fireEvent.click(button)
    expect(mockOnComplete).toHaveBeenCalledTimes(1)
  })
})
