import { describe, it, expect, vi, beforeEach } from "vitest";
import { dashboardService } from "@/lib/services/dashboard";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
  },
}));

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Spec: CAND-04-A6.1A (docs/spec/clauses/04-dashboard.md#cand-04-a6-1a)
  it("fetches dashboard data correctly", async () => {
    const mockRes = {
      success: true,
      data: { stats: [], recent_activities: [] },
    };
    (FrappeAPI.get as any).mockResolvedValue(mockRes);

    const result = await dashboardService.getDashboardData("test@example.com");

    expect(result).toEqual(mockRes.data);
    expect(FrappeAPI.get).toHaveBeenCalledWith(expect.any(String), { email: "test@example.com" });
  });

  // Spec: CAND-04-A6.1B (docs/spec/clauses/04-dashboard.md#cand-04-a6-1b)
  it("throws error if email is missing", async () => {
    await expect(dashboardService.getDashboardData("")).rejects.toThrow("Email is required");
  });

  // Spec: CAND-04-A6.1C (docs/spec/clauses/04-dashboard.md#cand-04-a6-1c)
  it("throws error if API returns failure", async () => {
    (FrappeAPI.get as any).mockResolvedValue({ success: false, message: "No data" });
    await expect(dashboardService.getDashboardData("test@example.com")).rejects.toThrow("No data");
  });
});
