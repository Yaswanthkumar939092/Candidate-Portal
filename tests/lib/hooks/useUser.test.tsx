import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCurrentUser } from "@/lib/hooks/useUser";

const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    getCurrentUser: mockGetCurrentUser,
  },
}));

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the logged-in user's email", async () => {
    mockGetCurrentUser.mockResolvedValue({
      email: "ava@example.com",
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.userEmail).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.userEmail).toBe("ava@example.com");
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default email when no user is returned", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.userEmail).toBe("deepakrajput0006@gmail.com");
  });

  it("falls back to the default email when fetching the user fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetCurrentUser.mockRejectedValue(new Error("session failed"));

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.userEmail).toBe("deepakrajput0006@gmail.com");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching user:", expect.any(Error));

    consoleErrorSpy.mockRestore();
  });
});
