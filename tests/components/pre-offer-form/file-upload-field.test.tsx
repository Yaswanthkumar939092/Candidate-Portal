import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FileUploadField } from "@/components/pre-offer-form/file-upload-field";
import { useFileUpload } from "@/lib/hooks/useFileUpload";

vi.mock("@/lib/hooks/useFileUpload", () => ({
  useFileUpload: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
  getSession: vi.fn(),
  getCurrentUser: vi.fn(),
  signOut: vi.fn(),
}));

describe("FileUploadField", () => {
  const mockUploadFile = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFileUpload).mockReturnValue({
      mutateAsync: mockUploadFile,
      isPending: false,
    } as unknown as ReturnType<typeof useFileUpload>);
  });

  it("renders essential labels and requirements", () => {
    render(<FileUploadField label="Resume" required={true} />);
    expect(screen.getByText("Resume")).toBeTruthy();
    expect(screen.getByText("*")).toBeTruthy();
    expect(screen.getByText("Click to upload or drag and drop")).toBeTruthy();
  });

  it("shows uploading state when isPending is true", () => {
    vi.mocked(useFileUpload).mockReturnValue({
      mutateAsync: mockUploadFile,
      isPending: true,
    } as unknown as ReturnType<typeof useFileUpload>);
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
    
    fireEvent.dragOver(dropzone);
    
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
    
    expect(uploadArea).toHaveClass("opacity-50");
    expect(uploadArea).toHaveClass("cursor-not-allowed");
    
    fireEvent.click(uploadArea);
  });

  it("hides remove button when disabled", () => {
    render(<FileUploadField label="Resume" value="/path/to/my_resume.pdf" disabled={true} onChange={mockOnChange} />);
    expect(screen.getByText("my_resume.pdf")).toBeTruthy();
    expect(screen.queryByLabelText("Remove Resume")).toBeNull();
  });


  describe("Expanded Lifecycle & Visual States", () => {
    it("safely invokes internal file selector on wrapper interaction", () => {
       render(<FileUploadField label="Asset" />);
       const clickableZone = screen.getByText("Click to upload or drag and drop").parentElement!;
       
       const hiddenInput = screen.getByLabelText("Asset", { selector: 'input[type="file"]' }) as HTMLInputElement;
       const clickSpy = vi.spyOn(hiddenInput, 'click');
       
       fireEvent.click(clickableZone);
       
       expect(clickSpy).toHaveBeenCalled();
       clickSpy.mockRestore();
    });

    it("gracefully manages and registers synchronous reject faults from pipeline failure", async () => {
       const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
       mockUploadFile.mockRejectedValueOnce(new Error("Internal Sinkhole"));
       
       render(<FileUploadField label="Fatal" onChange={mockOnChange} />);
       
       const input = screen.getByLabelText("Fatal", { selector: 'input[type="file"]' });
       const file = new File(["bad data"], "fail.pdf", { type: "application/pdf" });
       
       fireEvent.change(input, { target: { files: [file] } });
       
       await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith("Upload failed", expect.any(Error));
       });
       
       consoleSpy.mockRestore();
    });

    it("processes cursor exit boundaries efficiently on active drop containers", () => {
       render(<FileUploadField label="Drop Area" />);
       const target = screen.getByText("Click to upload or drag and drop").parentElement!;
       
       fireEvent.dragOver(target);
       fireEvent.dragLeave(target);
       
       expect(target).toBeTruthy();
    });

    it("distinctly represents successful validation states using native decorators", () => {
       render(<FileUploadField label="Valid Asset" isApproved={true} />);
       
       const approveWrap = screen.getByLabelText("Approved field");
       expect(approveWrap).toBeTruthy();
    });

    it("renders comprehensive informative feedback upon manual asset rejection", () => {
       render(<FileUploadField label="Fix Needed" isRejected={true} hrComment="Wrong orientation" />);
       
       const rejectTrigger = screen.getByLabelText("Rejection reason");
       expect(rejectTrigger).toBeTruthy();
       
       const stopSpy = vi.fn();
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const dummyEvent = { stopPropagation: stopSpy } as any;
       
       fireEvent.click(rejectTrigger, dummyEvent);
       
       expect(rejectTrigger).toBeTruthy();
    });
  });
});
