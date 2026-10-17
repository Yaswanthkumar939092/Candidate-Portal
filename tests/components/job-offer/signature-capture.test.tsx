import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SignatureCapture } from "@/components/job-offer/signature-capture"

function pick(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })
}

describe("SignatureCapture", () => {
  it("offers both methods only when both are allowed", () => {
    const { rerender } = render(
      <SignatureCapture allowDraw allowUpload value={null} onChange={vi.fn()} />
    )
    expect(screen.getByRole("tab", { name: /draw/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /upload/i })).toBeInTheDocument()

    rerender(<SignatureCapture allowDraw allowUpload={false} value={null} onChange={vi.fn()} />)
    expect(screen.queryByRole("tab")).not.toBeInTheDocument()
    expect(screen.getByLabelText(/draw your signature/i)).toBeInTheDocument()
  })

  it("Upload Only starts on the upload box", () => {
    render(<SignatureCapture allowDraw={false} allowUpload value={null} onChange={vi.fn()} />)
    expect(screen.getByText(/upload an image of your signature/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/draw your signature/i)).not.toBeInTheDocument()
  })

  it("hands back an uploaded image as a data URL", async () => {
    const onChange = vi.fn()
    render(<SignatureCapture allowDraw={false} allowUpload value={null} onChange={onChange} />)
    pick(new File([new Uint8Array([137, 80, 78, 71])], "sig.png", { type: "image/png" }))
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        dataUrl: expect.stringMatching(/^data:image\/png;base64,/),
        method: "Uploaded",
      })
    )
  })

  it("refuses a file that is not an image", () => {
    const onChange = vi.fn()
    render(<SignatureCapture allowDraw={false} allowUpload value={null} onChange={onChange} />)
    pick(new File(["%PDF"], "sig.pdf", { type: "application/pdf" }))
    expect(screen.getByText(/png or jpg image/i)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it("refuses an image over 5 MB", () => {
    const onChange = vi.fn()
    render(<SignatureCapture allowDraw={false} allowUpload value={null} onChange={onChange} />)
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" })
    pick(big)
    expect(screen.getByText(/larger than 5 mb/i)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it("switching method drops the signature given the other way", () => {
    const onChange = vi.fn()
    render(
      <SignatureCapture
        allowDraw
        allowUpload
        value={{ dataUrl: "data:image/png;base64,AAAA", method: "Drawn" }}
        onChange={onChange}
      />
    )
    onChange.mockClear()
    fireEvent.click(screen.getByRole("tab", { name: /upload/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("shows an uploaded signature and lets it be removed", () => {
    const onChange = vi.fn()
    render(
      <SignatureCapture
        allowDraw={false}
        allowUpload
        value={{ dataUrl: "data:image/png;base64,AAAA", method: "Uploaded" }}
        onChange={onChange}
      />
    )
    expect(screen.getByAltText(/your uploaded signature/i)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/remove signature/i))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
