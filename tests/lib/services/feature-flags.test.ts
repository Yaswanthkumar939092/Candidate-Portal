import { describe, it, expect, vi, beforeEach } from "vitest";
import { featureFlagsService } from "@/lib/services/feature-flags";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
  },
}));

describe("featureFlagsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getFeatureFlags calls FrappeAPI.get correctly", async () => {
    const mockFlags = { "feature-1": 1 };
    (FrappeAPI.get as any).mockResolvedValue(mockFlags);

    const result = await featureFlagsService.getFeatureFlags();

    expect(result).toEqual(mockFlags);
    expect(FrappeAPI.get).toHaveBeenCalledWith("recruitment.api.candidate_portal.get_candidate_feature_flags");
  });
});
