import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
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
})
