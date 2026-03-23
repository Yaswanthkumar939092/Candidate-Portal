import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RaiseRequestDialog } from "./raise-request-dialog";

// ─── Helpers ────────────────────────────────────────────────────────
// Use pointerEventsCheck: 0 because Radix Select renders spans with
// pointer-events: none that jsdom incorrectly blocks.
const user = userEvent.setup({ pointerEventsCheck: 0 });

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onSubmit: vi.fn(),
};

// =====================================================================
//  DIALOG UI – WHEN OPEN
// =====================================================================
describe("RaiseRequestDialog – UI (open)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog title", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.getByText("Raise a Request")).toBeTruthy();
  });

  it("renders dialog description", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(
      screen.getByText("Submit a new request to the HR team.")
    ).toBeTruthy();
  });

  it("renders Request Type label with required marker", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.getByText(/Request Type/)).toBeTruthy();
  });

  it("renders Description label with required marker", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.getByText(/Description/)).toBeTruthy();
  });

  it("renders Attachments label", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.getByText("Attachments")).toBeTruthy();
  });

  it("renders select trigger with placeholder", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.getByText("Select request type")).toBeTruthy();
  });

  it("renders description textarea with placeholder", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("Please describe your request in detail...")
    ).toBeTruthy();
  });

  it("renders file upload area with instructions", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.getByText(/Click to upload/)).toBeTruthy();
    expect(screen.getByText(/or drag and drop/)).toBeTruthy();
  });

  it("renders file type restrictions text", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.getByText(/SVG, PNG, JPG or PDF/)).toBeTruthy();
  });

  it("renders Cancel button", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("renders Submit Request button", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.getByText("Submit Request")).toBeTruthy();
  });

  it("does not show error initially", () => {
    render(<RaiseRequestDialog {...defaultProps} />);
    expect(screen.queryByText(/is required/)).toBeNull();
  });
});

// =====================================================================
//  DIALOG – CLOSED STATE
// =====================================================================
describe("RaiseRequestDialog – Closed State", () => {
  it("does not render dialog content when closed", () => {
    render(<RaiseRequestDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Raise a Request")).toBeNull();
  });
});

// =====================================================================
//  DIALOG – VALIDATION
// =====================================================================
describe("RaiseRequestDialog – Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Request type is required' when submitting without request type", async () => {
    render(<RaiseRequestDialog {...defaultProps} />);

    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "Some text"
    );
    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(screen.getByText("Request type is required.")).toBeTruthy();
    });
  });

  it("shows 'Description is required' when submitting with type but no description", async () => {
    render(<RaiseRequestDialog {...defaultProps} />);

    // Select a request type
    await user.click(screen.getByText("Select request type"));
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });
    await user.click(screen.getByText("General"));

    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(screen.getByText("Description is required.")).toBeTruthy();
    });
  });

  it("shows 'Description is required' when description is whitespace only", async () => {
    render(<RaiseRequestDialog {...defaultProps} />);

    await user.click(screen.getByText("Select request type"));
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });
    await user.click(screen.getByText("General"));

    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "   "
    );
    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(screen.getByText("Description is required.")).toBeTruthy();
    });
  });

  it("does not call onSubmit when validation fails", async () => {
    const onSubmit = vi.fn();
    render(<RaiseRequestDialog {...defaultProps} onSubmit={onSubmit} />);

    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(screen.getByText("Request type is required.")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// =====================================================================
//  DIALOG – SUCCESSFUL SUBMISSION
// =====================================================================
describe("RaiseRequestDialog – Successful Submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSubmit with correct data on valid submission", async () => {
    const onSubmit = vi.fn();
    render(<RaiseRequestDialog {...defaultProps} onSubmit={onSubmit} />);

    // Select type
    await user.click(screen.getByText("Select request type"));
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });
    await user.click(screen.getByText("General"));

    // Type description
    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "I need help"
    );

    // Submit
    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        requestType: "general",
        description: "I need help",
        attachments: [],
      });
    });
  });

  it("calls onOpenChange(false) after successful submission", async () => {
    const onOpenChange = vi.fn();
    render(
      <RaiseRequestDialog
        {...defaultProps}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByText("Select request type"));
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });
    await user.click(screen.getByText("General"));

    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "Test desc"
    );

    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("trims description whitespace before submission", async () => {
    const onSubmit = vi.fn();
    render(<RaiseRequestDialog {...defaultProps} onSubmit={onSubmit} />);

    await user.click(screen.getByText("Select request type"));
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });
    await user.click(screen.getByText("General"));

    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "  Hello World  "
    );

    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Hello World",
        })
      );
    });
  });
});

// =====================================================================
//  DIALOG – CANCEL / RESET
// =====================================================================
describe("RaiseRequestDialog – Cancel & Reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const onOpenChange = vi.fn();
    render(
      <RaiseRequestDialog {...defaultProps} onOpenChange={onOpenChange} />
    );

    await user.click(screen.getByText("Cancel"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets form when Cancel is clicked", async () => {
    const onOpenChange = vi.fn();
    render(
      <RaiseRequestDialog {...defaultProps} onOpenChange={onOpenChange} />
    );

    // Type some text
    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "Some text"
    );

    await user.click(screen.getByText("Cancel"));

    // Check onOpenChange was called
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

// =====================================================================
//  DIALOG – REQUEST TYPE SELECT OPTIONS
// =====================================================================
describe("RaiseRequestDialog – Request Type Options", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows all request type options when select is opened", async () => {
    render(<RaiseRequestDialog {...defaultProps} />);

    await user.click(screen.getByText("Select request type"));

    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
      expect(screen.getByText("Document Request")).toBeTruthy();
      expect(screen.getByText("Leave Request")).toBeTruthy();
      expect(screen.getByText("Salary Related")).toBeTruthy();
      expect(screen.getByText("Extension of Joining Date")).toBeTruthy();
      expect(screen.getByText("Other")).toBeTruthy();
    });
  });
});

// =====================================================================
//  DIALOG – EDGE CASES
// =====================================================================
describe("RaiseRequestDialog – Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without onSubmit prop (optional)", () => {
    const { container } = render(
      <RaiseRequestDialog open={true} onOpenChange={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it("does not crash when submitting without onSubmit callback", async () => {
    render(
      <RaiseRequestDialog open={true} onOpenChange={vi.fn()} />
    );

    await user.click(screen.getByText("Select request type"));
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });
    await user.click(screen.getByText("General"));

    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "Test"
    );

    // Should not throw
    await user.click(screen.getByText("Submit Request"));
  });

  it("clears validation error when form is corrected", async () => {
    render(<RaiseRequestDialog {...defaultProps} />);

    // Submit without type → error
    await user.click(screen.getByText("Submit Request"));
    await waitFor(() => {
      expect(screen.getByText("Request type is required.")).toBeTruthy();
    });

    // Now select a type and submit without description → different error
    await user.click(screen.getByText("Select request type"));
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });
    await user.click(screen.getByText("General"));
    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(screen.getByText("Description is required.")).toBeTruthy();
      // The previous error should be gone
      expect(screen.queryByText("Request type is required.")).toBeNull();
    });
  });
});
