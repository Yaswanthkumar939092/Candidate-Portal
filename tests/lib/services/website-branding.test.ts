import { describe, it, expect, vi, beforeEach } from "vitest";
import { websiteBrandingService } from "@/lib/services/website-branding";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
  },
}));

describe("websiteBrandingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getWebsiteBranding calls FrappeAPI.get correctly", async () => {
    const mockBranding = { title_prefix: "My Portal", app_logo: "logo.png" };
    (FrappeAPI.get as any).mockResolvedValue(mockBranding);

    const result = await websiteBrandingService.getWebsiteBranding();

    expect(result).toEqual(mockBranding);
    expect(FrappeAPI.get).toHaveBeenCalledWith("cn_hrms_core.api.get_website_branding");
  });
});
