import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

const h = vi.hoisted(() => ({ upload: vi.fn(), pending: { value: false } }))

vi.mock("@/lib/hooks/useFileUpload", () => ({
  useFileUpload: () => ({ mutateAsync: h.upload, isPending: h.pending.value }),
}))

import { FileUploadField } from "@/components/onboarding/file-upload-field"

const onChange = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  h.pending.value = false
  h.upload.mockResolvedValue({ file_url: "/files/cand-test-0001.pdf" })
})

describe("FileUploadField size and type handling", () => {
  // Spec: CAND-06-A5.2A (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("refuses a file larger than 5 MB with an inline message and makes no upload call", async () => {
    render(<FileUploadField label="Address proof" onChange={onChange} />)
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "CAND-TEST-0001-big.pdf", {
      type: "application/pdf",
    })
    fireEvent.change(screen.getByLabelText("Address proof", { selector: 'input[type="file"]' }), {
      target: { files: [big] },
    })
    expect(await screen.findByText("File size must be less than 5MB")).toBeTruthy()
    expect(h.upload).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  // Spec: CAND-06-A5.2B (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("shows Upload failed. Please try again. in the field when the upload rejects", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    h.upload.mockRejectedValueOnce(new Error("backend stub refused"))
    render(<FileUploadField label="Address proof" onChange={onChange} />)
    const file = new File(["x"], "CAND-TEST-0001.pdf", { type: "application/pdf" })
    fireEvent.change(screen.getByLabelText("Address proof", { selector: 'input[type="file"]' }), {
      target: { files: [file] },
    })
    expect(await screen.findByText("Upload failed. Please try again.")).toBeTruthy()
    expect(onChange).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  // Spec: CAND-06-A5.2C (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-2c)
  // Characterization: pins current behaviour, not endorsed.
  it("uploads a dropped executable because only the file size is checked, never the type", async () => {
    render(<FileUploadField label="Address proof" onChange={onChange} />)
    const exe = new File(["MZ"], "CAND-TEST-0001.exe", { type: "application/x-msdownload" })
    const zone = screen.getByText("Click to upload or drag and drop").parentElement as HTMLElement
    fireEvent.drop(zone, { dataTransfer: { files: [exe] } })
    await waitFor(() => expect(h.upload).toHaveBeenCalledWith(exe))
    expect(onChange).toHaveBeenCalledWith("/files/cand-test-0001.pdf")
    const input = screen.getByLabelText("Address proof", {
      selector: 'input[type="file"]',
    }) as HTMLInputElement
    expect(input.getAttribute("accept")).toBe(".svg,.png,.jpg,.jpeg,.pdf")
  })
})

describe("FileUploadField stored value", () => {
  // Spec: CAND-06-A5.3A (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("opens a stored relative file path through the same-origin backend prefix in a new tab", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null)
    render(<FileUploadField label="Address proof" value="/files/cand-test-0001.pdf" onChange={onChange} />)
    fireEvent.click(screen.getByText("cand-test-0001.pdf"))
    expect(open).toHaveBeenCalledWith("/backend/files/cand-test-0001.pdf", "_blank", "noopener,noreferrer")
    open.mockRestore()
  })

  // Spec: CAND-06-A5.3B (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("keeps an absolute stored URL as it is instead of prefixing it", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null)
    render(
      <FileUploadField
        label="Address proof"
        value="https://files.example.invalid/cand-test-0001.pdf"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByText("cand-test-0001.pdf"))
    expect(open).toHaveBeenCalledWith(
      "https://files.example.invalid/cand-test-0001.pdf",
      "_blank",
      "noopener,noreferrer",
    )
    open.mockRestore()
  })
})

describe("FileUploadField guards and messages", () => {
  // Spec: CAND-06-A5.5B (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-5b)
  // Characterization: pins current behaviour, not endorsed.
  it("shows a stored value that holds no slash unchanged as the file name", () => {
    render(<FileUploadField label="Address proof" value="cand-test-0001.pdf" onChange={onChange} />)
    expect(screen.getByText("cand-test-0001.pdf")).toBeTruthy()
    expect(screen.queryByText("Click to upload or drag and drop")).toBeNull()
  })

  // Spec: CAND-06-A5.5C (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-5c)
  // Characterization: pins current behaviour, not endorsed.
  it("uploads nothing for a change event with an empty file list and for a drop with an empty file list", () => {
    render(<FileUploadField label="Address proof" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Address proof", { selector: 'input[type="file"]' }), {
      target: { files: [] },
    })
    const zone = screen.getByText("Click to upload or drag and drop").parentElement as HTMLElement
    fireEvent.drop(zone, { dataTransfer: { files: [] } })
    expect(h.upload).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  // Spec: CAND-06-A5.5D (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-5d)
  // Characterization: pins current behaviour, not endorsed.
  it("ignores a drop while an upload is already running and while the field is disabled", () => {
    const file = new File(["x"], "CAND-TEST-0001.pdf", { type: "application/pdf" })

    h.pending.value = true
    const pending = render(<FileUploadField label="Address proof" onChange={onChange} />)
    const pendingZone = screen.getByText("Click to upload or drag and drop").parentElement as HTMLElement
    fireEvent.drop(pendingZone, { dataTransfer: { files: [file] } })
    expect(h.upload).not.toHaveBeenCalled()
    pending.unmount()

    h.pending.value = false
    render(<FileUploadField label="Address proof" onChange={onChange} disabled />)
    const disabledZone = screen.getByText("Click to upload or drag and drop").parentElement as HTMLElement
    fireEvent.drop(disabledZone, { dataTransfer: { files: [file] } })
    expect(h.upload).not.toHaveBeenCalled()
  })

  // Spec: CAND-06-A5.5F (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-5f)
  // Characterization: pins current behaviour, not endorsed.
  it("prefers the caller's error text over the internal one in the message line", async () => {
    render(<FileUploadField label="Address proof" error="Caller says no" onChange={onChange} />)
    expect(screen.getByText("Caller says no")).toBeTruthy()

    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "CAND-TEST-0001-big.pdf", {
      type: "application/pdf",
    })
    fireEvent.change(screen.getByLabelText("Address proof", { selector: 'input[type="file"]' }), {
      target: { files: [big] },
    })
    await waitFor(() => expect(h.upload).not.toHaveBeenCalled())
    expect(screen.getByText("Caller says no")).toBeTruthy()
    expect(screen.queryByText("File size must be less than 5MB")).toBeNull()
  })

  // Spec: CAND-06-A5.6C (docs/spec/clauses/06-onboarding-components.md#cand-06-a5-6c)
  // Characterization: pins current behaviour, not endorsed.
  it("borders a stored value green when approved and red when rejected", () => {
    const { rerender } = render(
      <FileUploadField label="Address proof" value="cand-test-0001.pdf" isApproved onChange={onChange} />,
    )
    expect(screen.getByText("cand-test-0001.pdf").parentElement).toHaveClass("border-success")

    rerender(
      <FileUploadField label="Address proof" value="cand-test-0001.pdf" isRejected onChange={onChange} />,
    )
    expect(screen.getByText("cand-test-0001.pdf").parentElement).toHaveClass("border-destructive")
  })
})
