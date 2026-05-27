import { describe, it, expect, vi, beforeEach } from "vitest";
import { candidateBrandingService } from "@/lib/services/candidate-branding";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
  },
}));

describe("candidateBrandingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCandidateBranding calls FrappeAPI.get correctly", async () => {
    const mockBranding = { title_prefix: "My Portal", app_logo: "logo.png" };
    (FrappeAPI.get as any).mockResolvedValue(mockBranding);

    const result = await candidateBrandingService.getCandidateBranding();

    expect(result).toEqual(mockBranding);
    expect(FrappeAPI.get).toHaveBeenCalledWith("recruitment.api.candidate_portal.get_website_branding");
  });
});
