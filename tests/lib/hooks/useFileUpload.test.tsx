import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { fileUploadService } from "@/lib/services/uploadProofFile";
import React from "react";

// Mock fileUploadService
vi.mock("@/lib/services/uploadProofFile", () => ({
  fileUploadService: {
    uploadFile: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useFileUpload Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  // Spec: CAND-05-A10.4A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a10-4a)
  it("uploads file successfully", async () => {
    const mockResponse = { url: "https://example.com/file.pdf" };
    (fileUploadService.uploadFile as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useFileUpload(), { wrapper });

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(fileUploadService.uploadFile).toHaveBeenCalledWith(file);
  });

  // Spec: CAND-05-A10.4B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a10-4b)
  it("handles upload error", async () => {
    const mockError = new Error("Upload failed");
    (fileUploadService.uploadFile as any).mockRejectedValue(mockError);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useFileUpload(), { wrapper });

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
    expect(consoleSpy).toHaveBeenCalledWith("Error uploading file:", mockError);
    
    consoleSpy.mockRestore();
  });
});

