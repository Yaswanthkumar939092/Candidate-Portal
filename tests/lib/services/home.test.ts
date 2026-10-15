import { beforeEach, describe, expect, it, vi } from "vitest";
import { FrappeAPI } from "@/lib/frappe-api";
import { homeService } from "@/lib/services/home";

vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
  },
}));

describe("homeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets guest home content through the Frappe API", async () => {
    const content = {
      hero: { enabled: false },
      carousel: { enabled: false },
      values: { enabled: false },
    };
    vi.mocked(FrappeAPI.get).mockResolvedValue(content);

    await expect(homeService.getHomeContent()).resolves.toEqual(content);
    expect(FrappeAPI.get).toHaveBeenCalledWith(
      "recruitment.api.candidate_home.get_home_content",
    );
  });
});
