import { describe, it, expect, vi, beforeEach } from "vitest";
import { featureFlagsService } from "@/lib/services/feature-flags";

describe("featureFlagsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("getFeatureFlags calls the server-side proxy route", async () => {
    const mockFlags = { "feature-1": 1 };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ flags: mockFlags }),
    } as Response);

    const result = await featureFlagsService.getFeatureFlags();

    expect(result).toEqual(mockFlags);
    expect(fetch).toHaveBeenCalledWith("/api/candidate-feature-flags", {
      method: "GET",
      credentials: "include",
    });
  });
});
