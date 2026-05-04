import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCurrentUser } from "@/lib/hooks/useUser";
import { getCurrentUser } from "@/lib/supabase";

// Mock supabase
vi.mock("@/lib/supabase", () => ({
  getCurrentUser: vi.fn(),
}));

describe("useCurrentUser Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user email when logged in", async () => {
    (getCurrentUser as any).mockResolvedValue({ email: "test@example.com" });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.userEmail).toBe("test@example.com");
  });

  it("returns fallback email when not logged in", async () => {
    (getCurrentUser as any).mockResolvedValue(null);

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.userEmail).toBe("deepakrajput0006@gmail.com");
  });

  it("returns fallback email on error", async () => {
    (getCurrentUser as any).mockRejectedValue(new Error("Supabase error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.userEmail).toBe("deepakrajput0006@gmail.com");
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
