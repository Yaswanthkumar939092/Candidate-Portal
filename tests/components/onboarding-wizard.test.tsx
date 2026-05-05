import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { OnboardingWizard } from "@/components/onboarding-wizard"

describe("OnboardingWizard", () => {
  const mockUser = { id: "1", email: "test@example.com" }
  const mockProfile = { id: "1", email: "test@example.com", full_name: "Test User" }
  const mockOnComplete = vi.fn()

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
