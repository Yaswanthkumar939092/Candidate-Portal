import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { profileService } from "@/lib/services/uploadProofFile";
import React from "react";

// Mock profileService
vi.mock("@/lib/services/uploadProofFile", () => ({
  profileService: {
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

  it("uploads file successfully", async () => {
    const mockResponse = { url: "https://example.com/file.pdf" };
    (profileService.uploadFile as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useFileUpload(), { wrapper });

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(profileService.uploadFile).toHaveBeenCalledWith(file);
  });

  it("handles upload error", async () => {
    const mockError = new Error("Upload failed");
    (profileService.uploadFile as any).mockRejectedValue(mockError);
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
