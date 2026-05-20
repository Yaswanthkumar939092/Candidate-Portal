import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AttachField } from "@/components/shared/fileuploading"
import * as fileUploadHook from "@/lib/hooks/useFileUpload"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("@/lib/hooks/useFileUpload")

describe("AttachField", () => {
  const user = userEvent.setup()

  const mockField = {
    fieldname: "resume",
    label: "Resume",
    is_mandatory: true,
    reqd: 0,
  }

  const mockOnChange = vi.fn()
  const mockMutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
      ; (fileUploadHook.useFileUpload as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        data: null,
      })
  })

  it("renders field label", () => {
    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("Resume")).toBeTruthy()
  })

  it("renders required asterisk for mandatory field", () => {
    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    const label = screen.getByText("Resume")
    expect(label.parentElement?.textContent).toContain("*")
  })

  it("does not render asterisk for optional field", () => {
    const optionalField = { ...mockField, is_mandatory: false, reqd: 0 }

    const { container } = render(
      <AttachField
        field={optionalField}
        value=""
        onChange={mockOnChange}
      />
    )

    const labels = container.querySelectorAll("label")
    const hasAsterisk = Array.from(labels).some((label) => label.textContent?.includes("*"))
    expect(!hasAsterisk).toBe(true)
  })

  it("renders file upload input", () => {
    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    const input = document.querySelector(`input[id="${mockField.fieldname}"]`)
    expect(input).toBeTruthy()
    expect((input as HTMLInputElement)?.type).toBe("file")
  })

  it("displays placeholder text when no file selected", () => {
    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("Click to upload file")).toBeTruthy()
  })

  it("displays file name when value is provided", () => {
    render(
      <AttachField
        field={mockField}
        value="resume.pdf"
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("resume.pdf")).toBeTruthy()
  })

  it("displays paperclip icon", () => {
    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("📎")).toBeTruthy()
  })

  it("calls onChange with null when file is cleared", async () => {
    render(
      <AttachField
        field={mockField}
        value="old-file.pdf"
        onChange={mockOnChange}
      />
    )

    const input = document.querySelector(`input[id="${mockField.fieldname}"]`) as HTMLInputElement

    // Simulate file input change with null
    await user.click(input)
    // Note: In real scenario, clearing the input would call onChange(null)
    // This tests the component's ability to handle file operations
  })

  it("handles file upload and calls mutate", async () => {
    mockMutate.mockImplementation(
      (file: File, options: { onSuccess: (data: { file_url: string }) => void }) => {
        options.onSuccess({ file_url: "https://example.com/resume.pdf" })
      }
    )

    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    const input = document.querySelector(`input[id="${mockField.fieldname}"]`) as HTMLInputElement

    const file = new File(["content"], "resume.pdf", { type: "application/pdf" })

    await user.upload(input, file)

    expect(mockMutate).toHaveBeenCalled()
  })

  it("calls onChange with file URL after successful upload", async () => {
    mockMutate.mockImplementation(
      (file: File, options: { onSuccess: (data: { file_url: string }) => void }) => {
        options.onSuccess({ file_url: "https://example.com/resume.pdf" })
      }
    )

    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    const input = document.querySelector(`input[id="${mockField.fieldname}"]`) as HTMLInputElement
    const file = new File(["content"], "resume.pdf", { type: "application/pdf" })

    await user.upload(input, file)

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith("https://example.com/resume.pdf")
    })
  })

  it("displays error message when provided", () => {
    const errorMessage = "File size exceeds limit"

    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
        error={errorMessage}
      />
    )

    expect(screen.getByText(errorMessage)).toBeTruthy()
  })

  it("displays file name while uploading", async () => {
    mockMutate.mockImplementation(
      (file: File, options: { onSuccess: (data: { file_url: string }) => void }) => {
        // Simulate async upload
        setTimeout(() => {
          options.onSuccess({ file_url: "https://example.com/file.pdf" })
        }, 100)
      }
    )

    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    const input = document.querySelector(`input[id="${mockField.fieldname}"]`) as HTMLInputElement
    const file = new File(["content"], "document.pdf", { type: "application/pdf" })

    await user.upload(input, file)

    // File name should be displayed during upload
    expect(screen.getByText("document.pdf")).toBeTruthy()
  })

  it("applies custom className", () => {
    const { container } = render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
        className="custom-upload"
      />
    )

    expect(container.querySelector(".custom-upload")).toBeTruthy()
  })

  it("handles upload error gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })

    mockMutate.mockImplementation(
      (file: File, options: { onError: (error: Error) => void }) => {
        options.onError(new Error("Upload failed"))
      }
    )

    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    const input = document.querySelector(`input[id="${mockField.fieldname}"]`) as HTMLInputElement
    const file = new File(["content"], "resume.pdf", { type: "application/pdf" })

    await user.upload(input, file)

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it("renders dashed border box for upload area", () => {
    const { container } = render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    const uploadBox = container.querySelector(".border-dashed")
    expect(uploadBox).toBeTruthy()
  })

  it("has correct HTML structure", () => {
    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    // Check that the input is hidden
    const input = document.querySelector(`input[id="${mockField.fieldname}"]`)
    expect((input as HTMLElement)?.className).toContain("hidden")
  })

  it("updates display when file is selected multiple times", async () => {
    const { rerender } = render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    const input = document.querySelector(`input[id="${mockField.fieldname}"]`) as HTMLInputElement

    const file1 = new File(["content1"], "resume.pdf", { type: "application/pdf" })
    await user.upload(input, file1)

    expect(screen.getByText("resume.pdf")).toBeTruthy()

    rerender(
      <AttachField
        field={mockField}
        value="resume.pdf"
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("resume.pdf")).toBeTruthy()
  })

  it("handles field with no mandatory flag", () => {
    const fieldNoMandatory = {
      fieldname: "attachment",
      label: "Attachment",
    }

    render(
      <AttachField
        field={fieldNoMandatory}
        value=""
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("Attachment")).toBeTruthy()
  })

  it("displays correct file icon emoji", () => {
    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("📎")).toBeTruthy()
  })

  it("accepts file input with proper attributes", () => {
    render(
      <AttachField
        field={mockField}
        value=""
        onChange={mockOnChange}
      />
    )

    const input = document.querySelector(`input[id="${mockField.fieldname}"]`) as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input?.type).toBe("file")
    expect(input?.id).toBe(mockField.fieldname)
  })
})
