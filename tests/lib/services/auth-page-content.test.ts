import { describe, it, expect, vi, beforeEach } from "vitest";
import { authPageContentService } from "@/lib/services/auth-page-content";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
  },
}));

describe("authPageContentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAuthPageContent calls FrappeAPI.get correctly", async () => {
    const mockContent = {
      logo: "/files/logo.png",
      footer: "© 2026 Acme. All rights reserved.",
      login: { heading: "Welcome", points: [{ title: "Point", description: "" }] },
      signup: { heading: "Join", points: [] },
    };
    vi.mocked(FrappeAPI.get).mockResolvedValue(mockContent);

    const result = await authPageContentService.getAuthPageContent();

    expect(result).toEqual(mockContent);
    expect(FrappeAPI.get).toHaveBeenCalledWith(
      "recruitment.api.candidate_auth.get_auth_page_content",
    );
  });
});
