import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLinkFieldOptions } from "@/lib/hooks/useLinkFieldOptions";
import { linkFieldService } from "@/lib/services/link-field";
import React from "react";

// Mock linkFieldService
vi.mock("@/lib/services/link-field", () => ({
  linkFieldService: {
    getLinkFieldOptions: vi.fn(),
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

describe("useLinkFieldOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches link field options correctly", async () => {
    const mockRes = {
      status: "success" as const,
      doctype: "Designation",
      title_field: "custom_designation_title",
      total: 2,
      results: [
        { id: "ID_1", label: "Label 1" },
        { id: "ID_2", label: "Label 2" },
      ],
    };
    vi.mocked(linkFieldService.getLinkFieldOptions).mockResolvedValue(mockRes);

    const { result } = renderHook(() => useLinkFieldOptions("Designation", "searchQuery"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRes);
    expect(linkFieldService.getLinkFieldOptions).toHaveBeenCalledWith("Designation", "searchQuery");
  });

  it("does not fetch if doctype is missing", () => {
    const { result } = renderHook(() => useLinkFieldOptions(""), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(linkFieldService.getLinkFieldOptions).not.toHaveBeenCalled();
  });
});
