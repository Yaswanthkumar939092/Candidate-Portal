/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import PdfViewer from "@/app/job_offer/PdfViewer";

// Mock react-pdf CSS imports
vi.mock("react-pdf/dist/esm/Page/AnnotationLayer.css", () => ({}));
vi.mock("react-pdf/dist/esm/Page/TextLayer.css", () => ({}));

// Mock react-pdf
vi.mock("react-pdf", () => ({
  Document: ({ children, onLoadSuccess, file }: any) => {
    // Simulate successful load
    if (onLoadSuccess) {
      onLoadSuccess({ numPages: 2 });
    }
    return <div data-testid="pdf-document" data-file={file}>{children}</div>;
  },
  Page: ({ pageNumber }: any) => <div data-testid={`pdf-page-${pageNumber}`}>Page {pageNumber}</div>,
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: ""
    },
    version: "1.2.3"
  }
}));

describe("PdfViewer", () => {
  it("renders correctly and shows pages after loading", () => {
    render(<PdfViewer pdfUrl="http://example.com/test.pdf" />);
    
    expect(screen.getByTestId("pdf-document")).toBeTruthy();
    expect(screen.getByTestId("pdf-document").getAttribute("data-file")).toBe("http://example.com/test.pdf");
    
    // Check if 2 pages are rendered (as mocked)
    expect(screen.getByTestId("pdf-page-1")).toBeTruthy();
    expect(screen.getByTestId("pdf-page-2")).toBeTruthy();
  });
});
