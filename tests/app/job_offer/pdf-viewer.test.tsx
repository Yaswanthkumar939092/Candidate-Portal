/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import PdfViewer from "@/app/(portal)/job_offer/PdfViewer";

describe("PdfViewer", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:http://localhost:3000/some-uuid"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the PDF as a blob and renders it with the object URL on success", async () => {
    const mockBlob = new Blob(["pdf content"], { type: "application/pdf" });
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<PdfViewer pdfUrl="http://example.com/test.pdf" />);
    });

    // Verify fetch was called with credentials
    expect(global.fetch).toHaveBeenCalledWith("http://example.com/test.pdf", {
      credentials: "include",
    });

    // Verify URL.createObjectURL was called with the blob
    expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);

    // Verify the iframe src is set to the blob URL
    const iframe = screen.getByTitle("Offer Letter");
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute("src")).toBe("blob:http://localhost:3000/some-uuid#toolbar=0&navpanes=0");
  });

  it("falls back to the direct pdfUrl if the fetch fails", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    await act(async () => {
      render(<PdfViewer pdfUrl="http://example.com/test.pdf" />);
    });

    // Verify the iframe src falls back to the original URL
    const iframe = screen.getByTitle("Offer Letter");
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute("src")).toBe("http://example.com/test.pdf#toolbar=0&navpanes=0");
  });

  it("falls back to the direct pdfUrl if the response is not ok", async () => {
    const mockResponse = {
      ok: false,
      statusText: "Forbidden",
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<PdfViewer pdfUrl="http://example.com/test.pdf" />);
    });

    // Verify the iframe src falls back to the original URL
    const iframe = screen.getByTitle("Offer Letter");
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute("src")).toBe("http://example.com/test.pdf#toolbar=0&navpanes=0");
  });
});

