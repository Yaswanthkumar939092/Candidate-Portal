 
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FeatureToggle, SimpleFeatureToggle } from "@/components/feature-toggle"
import { FeatureFlag } from "@/types/database"

// Mock lucide-react icons
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    Settings: () => <div data-testid="icon-settings" />,
    Edit: () => <div data-testid="icon-edit" />,
    Trash2: () => <div data-testid="icon-trash" />,
    Users: () => <div data-testid="icon-users" />,
    Percent: () => <div data-testid="icon-percent" />,
    Tag: () => <div data-testid="icon-tag" />,
  }
})

// Define accessible interactions for testing form behaviors and simulations
vi.mock("@/components/ui/slider", () => ({
   
  Slider: ({ onValueChange, disabled }: any) => (
    <input
      type="range"
      data-testid="slider-mock"
      disabled={disabled}
      onChange={(e) => onValueChange?.([parseInt(e.target.value)])}
    />
  )
}))

vi.mock("@/components/ui/select", () => ({
   
  Select: ({ onValueChange, value, children }: any) => (
    <select data-testid="select-mock" value={value} onChange={(e: any) => onValueChange(e.target.value)}>{children}</select>
  ),
  SelectTrigger: ({ children }: any) => children,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => children,
   
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}))

describe("FeatureToggle", () => {
  const user = userEvent.setup()

  const mockFlag: FeatureFlag = {
    id: "flag-1",
    name: "New UI",
    key: "new-ui",
    description: "Enable the new dashboard UI",
    is_enabled: true,
    value_type: "boolean",
    default_value: true,
    rollout_percentage: 100,
    tags: ["frontend", "ui"],
    environments: ["production"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    created_by: "admin"
  }

  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders feature flag information", () => {
    render(<FeatureToggle flag={mockFlag} onUpdate={mockOnUpdate} />)
    expect(screen.getByText("New UI")).toBeTruthy()
    expect(screen.getByText("Enable the new dashboard UI")).toBeTruthy()
    expect(screen.getByText("new-ui")).toBeTruthy()
    expect(screen.getByText("Enabled")).toBeTruthy()
    expect(screen.getByText("boolean")).toBeTruthy()
  })

  it("calls onUpdate when switch is toggled", async () => {
    render(<FeatureToggle flag={mockFlag} onUpdate={mockOnUpdate} />)
    const toggle = screen.getByRole("switch")

    await user.click(toggle)

    expect(mockOnUpdate).toHaveBeenCalledWith(mockFlag.id, { is_enabled: false })
  })

  it("shows rollout percentage slider when enabled and < 100%", () => {
    const partialRolloutFlag = { ...mockFlag, rollout_percentage: 50 }
    render(<FeatureToggle flag={partialRolloutFlag} onUpdate={mockOnUpdate} />)

    expect(screen.getByText("50% Rollout")).toBeTruthy()
    expect(screen.getByText("Rollout Percentage")).toBeTruthy()
  })

  it("opens edit dialog when clicking edit button", async () => {
    render(<FeatureToggle flag={mockFlag} onUpdate={mockOnUpdate} />)
    const editButton = screen.getByText("Edit")

    await user.click(editButton)

    expect(screen.getByText("Edit Feature Flag")).toBeTruthy()
    expect(screen.getByLabelText("Name")).toHaveValue("New UI")
  })

  it("calls onDelete when clicking delete and confirming", async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true)
    render(<FeatureToggle flag={mockFlag} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const deleteButton = screen.getByTestId("icon-trash").parentElement!
    await user.click(deleteButton)

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockOnDelete).toHaveBeenCalledWith(mockFlag.id)
    confirmSpy.mockRestore()
  })

  it("renders tags correctly", () => {
    render(<FeatureToggle flag={mockFlag} onUpdate={mockOnUpdate} />)
    expect(screen.getByText("frontend")).toBeTruthy()
    expect(screen.getByText("ui")).toBeTruthy()
  })

  it("triggers direct payout/rollout mutation hooks via the interaction component", () => {
    const partialRolloutFlag = { ...mockFlag, rollout_percentage: 50 }
    render(<FeatureToggle flag={partialRolloutFlag} onUpdate={mockOnUpdate} />)

    const slider = screen.getByTestId("slider-mock")
    fireEvent.change(slider, { target: { value: "80" } })

    // Confirms hook callback logic applied derived data payload (Line 47)
    expect(mockOnUpdate).toHaveBeenCalledWith(mockFlag.id, { rollout_percentage: 80 })
  })

  it("completes detailed lifecycle edit procedures and handles inputs verification", async () => {
    render(<FeatureToggle flag={mockFlag} onUpdate={mockOnUpdate} />)
    fireEvent.click(screen.getByText("Edit"))

    // Enter alternate form payload properties sequentially (covering line 188-238 onChange functions)
    const nameInput = screen.getByLabelText("Name")
    fireEvent.change(nameInput, { target: { value: "Brand New UI" } })

    const descInput = screen.getByLabelText("Description")
    fireEvent.change(descInput, { target: { value: "Modified info box text" } })

    const rollInput = screen.getByLabelText("Rollout %")
    fireEvent.change(rollInput, { target: { value: "40" } })

    const tagInput = screen.getByLabelText("Tags (comma-separated)")
    fireEvent.change(tagInput, { target: { value: "alpha, beta, canary" } })

    // Change explicit type selector (covers select block lines 205+)
    const selectComp = screen.getByTestId("select-mock")
    fireEvent.change(selectComp, { target: { value: "json" } })

    // Execute primary action submit confirmation (Line 51)
    fireEvent.click(screen.getByText("Save Changes"))

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockFlag.id,
        expect.objectContaining({
          name: "Brand New UI",
          description: "Modified info box text",
          rollout_percentage: 40,
          tags: ["alpha", "beta", "canary"],
          value_type: "json"
        })
      )
    })
  })

  it("branches successfully for differing badge rendering conditional states", () => {
    const stringFlag: FeatureFlag = { ...mockFlag, is_enabled: false, value_type: "string" }
    const { rerender } = render(<FeatureToggle flag={stringFlag} onUpdate={mockOnUpdate} />)

    // Hits explicit text branch for !is_enabled (Line 73) and style logic for string type (Line 64)
    expect(screen.getByText("Disabled")).toBeTruthy()
    expect(screen.getByText("string")).toBeTruthy()

    const numberFlag: FeatureFlag = { ...mockFlag, value_type: "number" }
    rerender(<FeatureToggle flag={numberFlag} onUpdate={mockOnUpdate} />)
    expect(screen.getByText("number")).toBeTruthy() // Covers numeric badge condition

    const jsonFlag: FeatureFlag = { ...mockFlag, value_type: "json" }
    rerender(<FeatureToggle flag={jsonFlag} onUpdate={mockOnUpdate} />)
    expect(screen.getByText("json")).toBeTruthy() // Covers data JSON type
  })
})

describe("SimpleFeatureToggle", () => {
  const mockFlag: FeatureFlag = {
    id: "f-s",
    name: "Barebones",
    key: "bare",
    is_enabled: true,
    value_type: "boolean",
    default_value: false,
    rollout_percentage: 100,
    created_at: "",
    updated_at: "",
    created_by: "",
    description: "Short details",
    tags: [],
    environments: []
  }

  it("operates normally when explicitly specified for constrained layouts", async () => {
    const onToggle = vi.fn()
    // Fully executes implementation code starting line 280
    render(<SimpleFeatureToggle flag={mockFlag} onToggle={onToggle} size="sm" />)

    expect(screen.getByText("Barebones")).toBeTruthy()
    expect(screen.getByText("Short details")).toBeTruthy()

    // Test interactions
    const s = screen.getByRole("switch")
    fireEvent.click(s)
    expect(onToggle).toHaveBeenCalled()
  })
})
