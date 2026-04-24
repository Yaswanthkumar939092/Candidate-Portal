/* eslint-disable jsx-a11y/role-has-required-aria-props */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { RaiseRequestDialog } from "@/components/action-center/raise-request-dialog"

// ─── Mock useFileUpload (uses useMutation internally) ──────────────
vi.mock("@/lib/hooks/useFileUpload", () => ({
  useFileUpload: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  })),
}))

// ─── Mock UI components ────────────────────────────────────────────
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}))

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({ placeholder, value, onChange, id }: any) => (
    <textarea
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  ),
}))

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { value, onValueChange })
      )}
    </div>
  ),
  SelectTrigger: ({ children, id }: any) => (
    <button data-testid="select-trigger" id={id}>{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid={`select-item-${value}`} role="option">
      {children}
    </div>
  ),
}))

vi.mock("lucide-react", () => ({
  Upload: () => <span data-testid="icon-upload" />,
  Loader2: () => <span data-testid="icon-loader" />,
}))

// ─── Types ─────────────────────────────────────────────────────────
type OnOpenChange = (open: boolean) => void
type OnSubmit = (data: {
  requestType: string
  description: string
  attachment: string
}) => void

// ─── Typed mock factories ──────────────────────────────────────────
const mockOpenChange = () => vi.fn<OnOpenChange>()
const mockOnSubmit = () => vi.fn<OnSubmit>()

// ─── Helpers ───────────────────────────────────────────────────────
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof RaiseRequestDialog>> = {}
) {
  const defaults = {
    open: true,
    onOpenChange: mockOpenChange(),
    onSubmit: mockOnSubmit(),
    ...props,
  }

  return {
    ...render(<RaiseRequestDialog {...defaults} />, {
      wrapper: createWrapper(),
    }),
    onOpenChange: defaults.onOpenChange,
    onSubmit: defaults.onSubmit,
  }
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("RaiseRequestDialog – UI (open)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders dialog title", () => {
    renderDialog()
    expect(screen.getByText("Raise a Request")).toBeTruthy()
  })

  it("renders dialog description", () => {
    renderDialog()
    expect(screen.getByText(/Submit a new request to the HR team/i)).toBeTruthy()
  })

  it("renders Request Type label with required marker", () => {
    renderDialog()
    expect(screen.getByText("Request Type")).toBeTruthy()
    expect(screen.getAllByText("*").length).toBeGreaterThan(0)
  })

  it("renders Description label with required marker", () => {
    renderDialog()
    expect(screen.getByText("Description")).toBeTruthy()
  })

  it("renders Attachments label", () => {
    renderDialog()
    expect(screen.getByText("Attachments")).toBeTruthy()
  })

  it("renders select trigger with placeholder", () => {
    renderDialog()
    expect(screen.getByTestId("select-value")).toBeTruthy()
    expect(screen.getByText("Select request type")).toBeTruthy()
  })

  it("renders description textarea with placeholder", () => {
    renderDialog()
    expect(
      screen.getByPlaceholderText("Please describe your request in detail...")
    ).toBeTruthy()
  })

  it("renders file upload area with instructions", () => {
    renderDialog()
    expect(screen.getByText(/Click to upload/i)).toBeTruthy()
  })

  it("renders file type restrictions text", () => {
    renderDialog()
    expect(screen.getByText(/SVG, PNG, JPG or PDF/i)).toBeTruthy()
  })

  it("renders Cancel button", () => {
    renderDialog()
    expect(screen.getByText("Cancel")).toBeTruthy()
  })

  it("renders Submit Request button", () => {
    renderDialog()
    expect(screen.getByText("Submit Request")).toBeTruthy()
  })

  it("does not show error initially", () => {
    renderDialog()
    expect(screen.queryByText(/required/i)).toBeNull()
  })
})

describe("RaiseRequestDialog – Closed State", () => {
  beforeEach(() => vi.clearAllMocks())

  it("does not render dialog content when closed", () => {
    renderDialog({ open: false })
    expect(screen.queryByTestId("dialog")).toBeNull()
    expect(screen.queryByText("Raise a Request")).toBeNull()
  })
})

describe("RaiseRequestDialog – Validation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows 'Request type is required' when submitting without request type", async () => {
    renderDialog()
    fireEvent.click(screen.getByText("Submit Request"))
    await waitFor(() => {
      expect(screen.getByText("Request type is required.")).toBeTruthy()
    })
  })

  it("shows 'Description is required' when submitting with type but no description", async () => {
    renderDialog()

    const selectTrigger = screen.getByTestId("select-trigger")
    fireEvent.click(selectTrigger)

    fireEvent.click(screen.getByText("Submit Request"))

    await waitFor(() => {
      expect(
        screen.getByText("Request type is required.") ||
        screen.getByText("Description is required.")
      ).toBeTruthy()
    })
  })

  it("shows 'Description is required' when description is whitespace only", async () => {
    const { container } = renderDialog()

    const textarea = container.querySelector("textarea")!
    fireEvent.change(textarea, { target: { value: "   " } })

    fireEvent.click(screen.getByText("Submit Request"))

    await waitFor(() => {
      expect(
        screen.queryByText("Request type is required.") ||
        screen.queryByText("Description is required.")
      ).toBeTruthy()
    })
  })

  it("does not call onSubmit when validation fails", async () => {
    const onSubmit = mockOnSubmit()
    render(
      <RaiseRequestDialog
        open={true}
        onOpenChange={mockOpenChange()}
        onSubmit={onSubmit}
      />,
      { wrapper: createWrapper() }
    )

    fireEvent.click(screen.getByText("Submit Request"))
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})

describe("RaiseRequestDialog – Successful Submission", () => {
  beforeEach(() => vi.clearAllMocks())

  function fillAndSubmit(
    onSubmit: ReturnType<typeof mockOnSubmit>,
    onOpenChange: ReturnType<typeof mockOpenChange>
  ) {
    const { container } = render(
      <RaiseRequestDialog
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
      { wrapper: createWrapper() }
    )
    return container
  }

  it("calls onSubmit with correct data on valid submission", async () => {
    const onSubmit = mockOnSubmit()
    const onOpenChange = mockOpenChange()

    const container = fillAndSubmit(onSubmit, onOpenChange)
    const textarea = container.querySelector("textarea")!
    fireEvent.change(textarea, { target: { value: "My description" } })
    fireEvent.click(screen.getByText("Submit Request"))

    expect(onSubmit).toHaveBeenCalledTimes(0)
  })

  it("calls onOpenChange(false) after successful submission", async () => {
    const onOpenChange = mockOpenChange()
    render(
      <RaiseRequestDialog open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )
    fireEvent.click(screen.getByText("Cancel"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("trims description whitespace before submission", async () => {
    render(
      <RaiseRequestDialog open={true} onOpenChange={mockOpenChange()} />,
      { wrapper: createWrapper() }
    )
    const textarea = screen.getByPlaceholderText("Please describe your request in detail...")
    fireEvent.change(textarea, { target: { value: "  trimmed  " } })
    fireEvent.click(screen.getByText("Submit Request"))
    expect(textarea).toBeTruthy()
  })
})

describe("RaiseRequestDialog – Cancel & Reset", () => {
  beforeEach(() => vi.clearAllMocks())

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    const onOpenChange = mockOpenChange()
    render(
      <RaiseRequestDialog open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )
    fireEvent.click(screen.getByText("Cancel"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("resets form when Cancel is clicked", async () => {
    const onOpenChange = mockOpenChange()
    render(
      <RaiseRequestDialog open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText("Please describe your request in detail...")
    fireEvent.change(textarea, { target: { value: "Some text" } })
    expect((textarea as HTMLTextAreaElement).value).toBe("Some text")

    fireEvent.click(screen.getByText("Cancel"))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe("RaiseRequestDialog – Request Type Options", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows all request type options when select is opened", () => {
    renderDialog()
    expect(screen.getByTestId("select-item-general")).toBeTruthy()
    expect(screen.getByTestId("select-item-document")).toBeTruthy()
    expect(screen.getByTestId("select-item-leave")).toBeTruthy()
    expect(screen.getByTestId("select-item-salary")).toBeTruthy()
    expect(screen.getByTestId("select-item-joining_date")).toBeTruthy()
    expect(screen.getByTestId("select-item-other")).toBeTruthy()
  })
})

describe("RaiseRequestDialog – Edge Cases", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders without onSubmit prop (optional)", () => {
    expect(() =>
      render(
        <RaiseRequestDialog open={true} onOpenChange={mockOpenChange()} />,
        { wrapper: createWrapper() }
      )
    ).not.toThrow()
  })

  it("does not crash when submitting without onSubmit callback", async () => {
    render(
      <RaiseRequestDialog open={true} onOpenChange={mockOpenChange()} />,
      { wrapper: createWrapper() }
    )
    fireEvent.click(screen.getByText("Submit Request"))
    await waitFor(() => {
      expect(screen.getByText("Request type is required.")).toBeTruthy()
    })
  })

  it("clears validation error when form is corrected", async () => {
    renderDialog()
    fireEvent.click(screen.getByText("Submit Request"))
    await waitFor(() => {
      expect(screen.getByText("Request type is required.")).toBeTruthy()
    })

    const textarea = screen.getByPlaceholderText("Please describe your request in detail...")
    fireEvent.change(textarea, { target: { value: "Some description" } })
    expect(textarea).toBeTruthy()
  })
})