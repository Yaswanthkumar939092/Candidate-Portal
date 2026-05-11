import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OAuthConfig } from "@/components/oauth-config"

describe("OAuthConfig", () => {
  const mockOnNext = vi.fn()
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
  })

  it("renders defaults and initializes appropriately", () => {
    render(<OAuthConfig onNext={mockOnNext} />)
    
    expect(screen.getByText("Google OAuth Configuration")).toBeTruthy()
    expect(screen.getByLabelText("Enable Google Login")).toBeChecked()
  })

  it("handles explicit skip logic", () => {
    render(<OAuthConfig onNext={mockOnNext} />)
    
    fireEvent.click(screen.getByRole("button", { name: /Skip for Now/i }))
    expect(mockOnNext).toHaveBeenCalledWith(undefined)
  })

  it("manages password reveal states natively through the toggle", async () => {
    const { container } = render(<OAuthConfig onNext={mockOnNext} />)
    
    // Target specifically by unique static ID to prevent overlap collision
    const secretInput = container.querySelector("#google-client-secret") as HTMLInputElement
    expect(secretInput).toBeTruthy()
    expect(secretInput).toHaveAttribute("type", "password")
    
    // Locates action toggle next to relevant input
    const toggle = secretInput.parentElement?.querySelector("button")
    expect(toggle).toBeTruthy()
    
    fireEvent.click(toggle!)
    expect(secretInput).toHaveAttribute("type", "text")
    
    fireEvent.click(toggle!)
    expect(secretInput).toHaveAttribute("type", "password")
  })

  it("navigates cross-provider tabs to access alternative properties", async () => {
    render(<OAuthConfig onNext={mockOnNext} />)
    
    const linkedInTab = screen.getByRole("tab", { name: /LinkedIn/i })
    // Leverage user-event to accurately propagate focus and state signals required by Radix
    await user.click(linkedInTab)
    
    await waitFor(() => {
      expect(screen.getByText("LinkedIn OAuth Configuration")).toBeTruthy()
    })
  })

  it("enforces blocking validations when explicitly enabled inputs remain blank", async () => {
    const { container } = render(<OAuthConfig onNext={mockOnNext} />)
    
    // Default state has Google Enabled, submitting empty yields error
    const continueBtn = screen.getByRole("button", { name: /Continue/i })
    
    // The HTML button naturally disables itself based on isFormValid() result!
    expect(continueBtn).toBeDisabled()
    
    // Force bypass to fully coverage validation hook!
    const form = container.querySelector("#google-client-id")!.closest("form")
    fireEvent.submit(form!)
    
    await waitFor(() => {
      expect(screen.getByText(/Google Client ID is required/)).toBeTruthy()
      expect(screen.getByText(/Google Client Secret is required/)).toBeTruthy()
    })
  })

  it("clears active validation artifacts upon subsequent input correction", async () => {
    const { container } = render(<OAuthConfig onNext={mockOnNext} />)
    
    const form = container.querySelector("#google-client-id")!.closest("form")
    fireEvent.submit(form!) // Trigger failures first
    
    await waitFor(() => expect(screen.getByText(/Google Client ID is required/)).toBeTruthy())
    
    // Rectify and verify clearance
    const idInput = container.querySelector("#google-client-id") as HTMLInputElement
    fireEvent.change(idInput, { target: { value: "fixed_id" } })
    
    expect(screen.queryByText(/Google Client ID is required/)).toBeNull()
  })

  it("permits flawless bypass if all providers are deactivated", async () => {
    render(<OAuthConfig onNext={mockOnNext} />)
    
    // 1. Disable Google
    await user.click(screen.getByLabelText("Enable Google Login"))
    
    // 2. Switch to LinkedIn & Disable
    await user.click(screen.getByRole("tab", { name: /LinkedIn/i }))
    await waitFor(() => expect(screen.getByLabelText("Enable LinkedIn Login")).toBeTruthy())
    await user.click(screen.getByLabelText("Enable LinkedIn Login"))
    
    // 3. Warning alert should manifest when 0 active
    await waitFor(() => {
      expect(screen.getByText(/Both OAuth providers are disabled/)).toBeTruthy()
    })
    
    // Continue button activates as isFormValid is satisfied with 0 constraints
    const continueBtn = screen.getByRole("button", { name: /Continue/i })
    expect(continueBtn).not.toBeDisabled()
    
    fireEvent.click(continueBtn)
    expect(mockOnNext).toHaveBeenCalledWith({
      oauth: expect.objectContaining({ google_enabled: false, linkedin_enabled: false })
    })
  })

  it("dispatches total populated configurations successfully on positive submission", async () => {
     const { container } = render(<OAuthConfig onNext={mockOnNext} initialData={{ google_client_id: "init_g", google_client_secret: "init_gs" }} />)
     
     // Move to LinkedIn and populate it using advanced event sequencing
     await user.click(screen.getByRole("tab", { name: /LinkedIn/i }))
     await waitFor(() => expect(container.querySelector("#linkedin-client-id")).toBeTruthy())
     
     fireEvent.change(container.querySelector("#linkedin-client-id")!, { target: { value: "link_id" } })
     fireEvent.change(container.querySelector("#linkedin-client-secret")!, { target: { value: "link_secret" } })
     
     const continueBtn = screen.getByRole("button", { name: /Continue/i })
     
     // Validation satisfies both branches -> Button Enables
     expect(continueBtn).not.toBeDisabled()
     
     fireEvent.click(continueBtn)
     
     expect(mockOnNext).toHaveBeenCalledWith({
       oauth: {
         google_client_id: "init_g",
         google_client_secret: "init_gs",
         google_enabled: true,
         linkedin_client_id: "link_id",
         linkedin_client_secret: "link_secret",
         linkedin_enabled: true
       }
     })
  })
})
