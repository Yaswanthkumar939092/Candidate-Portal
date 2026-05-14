import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { FrappeConfig } from "@/components/frappe-config"

describe("FrappeConfig", () => {
  const mockOnNext = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // cleanup
  })

  it("renders with initial data correctly", () => {
    render(
      <FrappeConfig 
        onNext={mockOnNext} 
        initialData={{ url: "https://test.com", api_key: "k1", api_secret: "s1" }} 
      />
    )
    expect(screen.getByLabelText(/Frappe URL/)).toHaveValue("https://test.com")
    expect(screen.getByLabelText(/API Key/)).toHaveValue("k1")
    expect(screen.getByLabelText(/API Secret/)).toHaveValue("s1")
  })

  it("triggers skip action by invoking onNext with undefined", () => {
    render(<FrappeConfig onNext={mockOnNext} />)
    const skipBtn = screen.getByRole("button", { name: /Skip for Now/i })
    fireEvent.click(skipBtn)
    expect(mockOnNext).toHaveBeenCalledWith(undefined)
  })

  it("toggles visibility of the api secret field", () => {
    render(<FrappeConfig onNext={mockOnNext} />)
    const secretInput = screen.getByLabelText(/API Secret/)
    
    // Initially password type
    expect(secretInput).toHaveAttribute("type", "password")

    // Click visibility button (rendered via svg in button)
    const toggleBtn = secretInput.parentElement?.querySelector("button")
    expect(toggleBtn).toBeTruthy()

    fireEvent.click(toggleBtn!)
    expect(secretInput).toHaveAttribute("type", "text")

    fireEvent.click(toggleBtn!)
    expect(secretInput).toHaveAttribute("type", "password")
  })

  it("validates empty and invalid inputs preventing submissions", async () => {
    render(<FrappeConfig onNext={mockOnNext} />)
    
    // Submit empty form
    const submitBtn = screen.getByText("Continue")
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText("Frappe URL is required")).toBeTruthy()
      expect(screen.getByText("API Key is required")).toBeTruthy()
      expect(screen.getByText("API Secret is required")).toBeTruthy()
    })

    // Fill with invalid URL
    const form = screen.getByLabelText(/Frappe URL/).closest("form")!
    const urlInput = screen.getByLabelText(/Frappe URL/)
    fireEvent.change(urlInput, { target: { value: "not-a-url" } })
    
    // Bypass potentially disabled dynamic button label and submit native form context
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid URL (including http:// or https://)")).toBeTruthy()
    })
  })

  it("clears errors and previous test results when typing input changes", async () => {
    render(<FrappeConfig onNext={mockOnNext} />)
    const urlInput = screen.getByLabelText(/Frappe URL/)
    const submitBtn = screen.getByText("Continue")

    // Create error
    fireEvent.click(submitBtn)
    expect(screen.getByText("Frappe URL is required")).toBeTruthy()

    // Type to clear (Line 58)
    fireEvent.change(urlInput, { target: { value: "h" } })
    expect(screen.queryByText("Frappe URL is required")).toBeNull()
  })

  it("simulates successful connection and enables direct submit navigation", async () => {
    // Force success simulation (Line 102: Math.random() > 0.3, making it 1.0 always succeeds)
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0)
    
    render(<FrappeConfig onNext={mockOnNext} />)
    
    fireEvent.change(screen.getByLabelText(/Frappe URL/), { target: { value: "https://api.site.com" } })
    fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: "my-key" } })
    fireEvent.change(screen.getByLabelText(/API Secret/), { target: { value: "my-secret" } })

    // Perform connection test
    const testBtn = screen.getByText("Test Connection")
    fireEvent.click(testBtn)

    // Component contains 2000ms await setTimeout (Line 99)
    await new Promise(r => setTimeout(r, 2500))

    await waitFor(() => {
      expect(screen.getByText(/Successfully connected/)).toBeTruthy()
    })

    // Submit now that connection passed
    const contBtn = screen.getByText("Continue")
    fireEvent.click(contBtn)

    expect(mockOnNext).toHaveBeenCalledWith({
      frappe: {
        url: "https://api.site.com",
        api_key: "my-key",
        api_secret: "my-secret"
      }
    })
    mathSpy.mockRestore()
  })

  it("handles mock connection failure scenarios correctly", async () => {
    // Force failure simulation (Line 102: making random < 0.3 triggers fail branch)
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1)

    render(<FrappeConfig onNext={mockOnNext} />)
    
    fireEvent.change(screen.getByLabelText(/Frappe URL/), { target: { value: "https://fail.site.com" } })
    fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: "f-key" } })
    fireEvent.change(screen.getByLabelText(/API Secret/), { target: { value: "f-sec" } })

    fireEvent.click(screen.getByText("Test Connection"))
    await new Promise(r => setTimeout(r, 2500))

    await waitFor(() => {
      expect(screen.getByText(/Connection failed/)).toBeTruthy()
    })
    mathSpy.mockRestore()
  })

  it("auto-triggers connection verification when submitting without testing", async () => {
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0)

    render(<FrappeConfig onNext={mockOnNext} />)
    
    fireEvent.change(screen.getByLabelText(/Frappe URL/), { target: { value: "https://direct.com" } })
    fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: "d-key" } })
    fireEvent.change(screen.getByLabelText(/API Secret/), { target: { value: "d-sec" } })

    // Direct click Test & Continue is disabled, but we bypass and submit form natively (Line 134)
    const form = screen.getByLabelText(/Frappe URL/).closest("form")
    fireEvent.submit(form!)
    
    // Verifies it switches into testing loader logic
    expect(screen.getByText("Testing Connection...")).toBeTruthy()
    
    await new Promise(r => setTimeout(r, 2500))
    
    await waitFor(() => {
      expect(screen.getByText(/Successfully connected/)).toBeTruthy()
    })
    mathSpy.mockRestore()
  })
})
