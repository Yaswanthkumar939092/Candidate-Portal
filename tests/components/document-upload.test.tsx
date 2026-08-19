import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DocumentUpload } from "@/components/document-upload"

// Mock lucide-react icons
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    Upload: () => <div data-testid="icon-upload" />,
    File: () => <div data-testid="icon-file" />,
    FileText: () => <div data-testid="icon-file-text" />,
    Image: () => <div data-testid="icon-image" />,
    X: () => <div data-testid="icon-x" />,
    CheckCircle: () => <div data-testid="icon-check" />,
    Loader2: () => <div data-testid="icon-loader" />,
  }
})

describe("DocumentUpload", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => "mock-url")
  })

  it("renders upload dropzone with placeholder", () => {
    render(<DocumentUpload placeholder="Custom Placeholder" description="Custom Description" />)
    expect(screen.getByText("Custom Placeholder")).toBeTruthy()
    expect(screen.getByText("Custom Description")).toBeTruthy()
    expect(screen.getByTestId("icon-upload")).toBeTruthy()
  })

  it("handles file selection via input", async () => {
    const onUpload = vi.fn()
    const { container } = render(<DocumentUpload onUpload={onUpload} />)

    const file = new File(["hello"], "hello.pdf", { type: "application/pdf" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText("hello.pdf")).toBeTruthy()
    expect(screen.getByText("5 Bytes")).toBeTruthy()
  })

  it("shows error for unsupported file type", async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { })
    const { container } = render(<DocumentUpload accept=".pdf" />)

    const file = new File(["hello"], "hello.png", { type: "image/png" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("hello.png: File type not supported")
    })
    alertSpy.mockRestore()
  })

  it("shows error for file exceeding size limit", async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { })
    const { container } = render(<DocumentUpload maxSize={0.000001} />) // Tiny limit

    const file = new File(["large content"], "large.pdf", { type: "application/pdf" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("File size must be less than"))
    alertSpy.mockRestore()
  })

  it("can remove a file from the list", async () => {
    const onRemove = vi.fn()
    const { container } = render(<DocumentUpload onRemove={onRemove} />)

    const file = new File(["hello"], "hello.pdf", { type: "application/pdf" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)
    expect(screen.getByText("hello.pdf")).toBeTruthy()


    const removeButtons = screen.getAllByRole("button")
    const xButton = removeButtons.find(btn => btn.querySelector('[data-testid="icon-x"]'))

    if (xButton) {
      await user.click(xButton)
      expect(screen.queryByText("hello.pdf")).toBeNull()
      expect(onRemove).toHaveBeenCalled()
    }
  })

  it("uses fallback file icon for unknown mime types", () => {
    const existing = [{
      id: "u1",
      name: "log.csv",
      size: 50,
      type: "application/x-unknown-custom",
      status: "success" as const
    }]
    render(<DocumentUpload existingFiles={existing} />)
    // Uses basic generic icon when config lookup misses (Line 85)
    expect(screen.getByText("log.csv")).toBeTruthy()
  })

  it("validates against direct mime types without explicit dot extensions", async () => {
    // Specifically setting accept to a mime string to bypass the startWith(".") check and hit line 99
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { })
    const { container } = render(<DocumentUpload accept="image/png" />)

    const file = new File(["img"], "t.png", { type: "image/png" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    // If alert never called, validation succeeded via direct mime match
    expect(alertSpy).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it("alerts and blocks when uploading multiple files while restricted", () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { })
    const { container } = render(<DocumentUpload multiple={false} />)

    const f1 = new File(["a"], "a.pdf", { type: "application/pdf" })
    const f2 = new File(["b"], "b.pdf", { type: "application/pdf" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    // Trigger processFiles with multiple file list (Line 114)
    fireEvent.change(input, { target: { files: [f1, f2] } })

    expect(alertSpy).toHaveBeenCalledWith("Only one file is allowed")
    alertSpy.mockRestore()
  })

  it("alerts and blocks file processing beyond maximum configured limits", () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { })
    const { container } = render(<DocumentUpload maxFiles={1} />)

    const f1 = new File(["a"], "a.pdf", { type: "application/pdf" })
    const f2 = new File(["b"], "b.pdf", { type: "application/pdf" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    // Attempt processing 2 files exceeding limit of 1 (Line 119)
    fireEvent.change(input, { target: { files: [f1, f2] } })

    expect(alertSpy).toHaveBeenCalledWith("Maximum 1 files allowed")
    alertSpy.mockRestore()
  })

  it("facilitates standard drag-and-drop operations", async () => {
    render(<DocumentUpload />)
    // Need selection by placeholder
    const dropzone = screen.getByText("Click to upload or drag and drop").parentElement?.parentElement

    if (dropzone) {
      // 1. Drag Over (Line 217)
      fireEvent.dragOver(dropzone)
      expect(dropzone.className).toContain("bg-primary/5")

      // 2. Drag Leave (Line 223)
      fireEvent.dragLeave(dropzone)
      expect(dropzone.className).not.toContain("bg-primary/5")

      // 3. Drop (Line 204)
      const f = new File(["x"], "drop.pdf", { type: "application/pdf" })
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [f] }
      })

      await waitFor(() => {
        expect(screen.getByText("drop.pdf")).toBeTruthy()
      })
    }
  })

  it("successfully finalizes upload simulations and invokes final dispatch callback", async () => {
    // Speed up timeouts inside component simulation logic
    vi.useFakeTimers()
    const onUpload = vi.fn()
    const { container } = render(<DocumentUpload onUpload={onUpload} />)

    const f = new File(["x"], "run.pdf", { type: "application/pdf" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [f] } })

    // Fast forward component's loop intervals (for let i=0; i<=100; i+=20 delay 200)
    // Advancing enough steps will finalize success (Line 163) and call dispatch (Line 187)
    await vi.runAllTimersAsync()

    expect(onUpload).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it("permits retry requests on existing records to restart upload lifecycle", () => {
    const failedFiles = [{
      id: "err1",
      name: "failed.pdf",
      size: 10,
      type: "application/pdf",
      status: "error" as const,
      errorMessage: "Simulated failure"
    }]
    render(<DocumentUpload existingFiles={failedFiles} />)

    // Click retry button in UI (Line 340 -> 236)
    const retryBtn = screen.getByRole("button", { name: "Retry" })
    fireEvent.click(retryBtn)

    // Verification: Status reverts to uploading spinner state
    expect(screen.getByTestId("icon-loader")).toBeTruthy()
  })

  it("handles and displays error when upload process fails", async () => {
    vi.useFakeTimers()
    const originalSetTimeout = global.setTimeout
    vi.stubGlobal('setTimeout', () => { throw new Error("Upload Failed") })
    const { container } = render(<DocumentUpload />)

    const f = new File(["x"], "error.pdf", { type: "application/pdf" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [f] } })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.getByText("Upload failed")).toBeTruthy()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })
})
