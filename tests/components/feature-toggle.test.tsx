import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FeatureToggle } from "@/components/feature-toggle"
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
})
