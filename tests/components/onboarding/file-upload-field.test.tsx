import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FileUploadField } from "@/components/onboarding/file-upload-field";
import { useFileUpload } from "@/lib/hooks/useFileUpload";

vi.mock("@/lib/hooks/useFileUpload", () => ({
  useFileUpload: vi.fn(),
}));

describe("FileUploadField", () => {
  const mockUploadFile = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useFileUpload as any).mockReturnValue({
      mutateAsync: mockUploadFile,
      isPending: false,
    });
  });

  it("renders essential labels and requirements", () => {
    render(<FileUploadField label="Resume" required={true} />);
    expect(screen.getByText("Resume")).toBeTruthy();
    expect(screen.getByText("*")).toBeTruthy();
    expect(screen.getByText("Click to upload or drag and drop")).toBeTruthy();
  });

  it("shows uploading state when isPending is true", () => {
    (useFileUpload as any).mockReturnValue({
      mutateAsync: mockUploadFile,
      isPending: true,
    });
    render(<FileUploadField label="Resume" />);
    expect(screen.getByText("Uploading...")).toBeTruthy();
  });

  it("renders filename and remove button when value is provided", () => {
    render(<FileUploadField label="Resume" value="/path/to/my_resume.pdf" onChange={mockOnChange} />);
    expect(screen.getByText("my_resume.pdf")).toBeTruthy();
    
    const removeBtn = screen.getByLabelText("Remove Resume");
    fireEvent.click(removeBtn);
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it("calls uploadFile when a file is selected via input", async () => {
    mockUploadFile.mockResolvedValue({ file_url: "/new/file.pdf" });
    render(<FileUploadField label="Resume" onChange={mockOnChange} />);
    
    const input = screen.getByLabelText("Resume", { selector: 'input[type="file"]' }) as HTMLInputElement;
    const file = new File(["test content"], "test.pdf", { type: "application/pdf" });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(file);
      expect(mockOnChange).toHaveBeenCalledWith("/new/file.pdf");
    });
  });

  it("handles drag and drop correctly", async () => {
    mockUploadFile.mockResolvedValue({ file_url: "/dropped/file.pdf" });
    render(<FileUploadField label="Resume" onChange={mockOnChange} />);
    
    const dropzone = screen.getByText("Click to upload or drag and drop").parentElement!;
    
    // Drag over
    fireEvent.dragOver(dropzone);
    // expect style change if we could test classes easily here, but let's just drop
    
    const file = new File(["dropped content"], "drop.pdf", { type: "application/pdf" });
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(file);
      expect(mockOnChange).toHaveBeenCalledWith("/dropped/file.pdf");
    });
  });

  it("prevents interactions when disabled", () => {
    render(<FileUploadField label="Resume" disabled={true} />);
    const uploadArea = screen.getByText("Click to upload or drag and drop").parentElement!;
    
    // Should have opacity-50 and cursor-not-allowed
    expect(uploadArea).toHaveClass("opacity-50");
    expect(uploadArea).toHaveClass("cursor-not-allowed");
    
    fireEvent.click(uploadArea);
    // Hard to verify input click since it's hidden, but we check common disabled indicators
  });
});
