import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ssoService, FrappeSSOProvider } from "@/lib/services/sso";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Mock supabaseAdmin
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn(),
          }),
          single: vi.fn(),
        }),
        order: vi.fn().mockResolvedValue({ data: [] }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      admin: {
        listUsers: vi.fn(),
        createUser: vi.fn(),
      },
    },
  },
}));

describe("SSO Services", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("FrappeSSOProvider", () => {
    const provider = new FrappeSSOProvider("http://frappe.url", "client_id", "client_secret");

    it("generateAuthUrl returns correct URL", () => {
      const url = provider.generateAuthUrl("state123", "http://redirect.uri");
      expect(url).toContain("client_id=client_id");
      expect(url).toContain("state=state123");
      expect(url).toContain("redirect_uri=http%3A%2F%2Fredirect.uri");
    });

    it("handleCallback exchanges code for user info", async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: "token123" }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ email: "user@test.com", name: "John" }) });

      const result = await provider.handleCallback({ code: "code123" });

      expect(result.email).toBe("user@test.com");
      expect(result.name).toBe("John");
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("SSOService", () => {
    it("getProvider returns strategy for frappe_sso", async () => {
      const mockProvider = {
        id: "p1",
        provider_type: "frappe_sso",
        config: { frappe_url: "http://test", client_id: "id", client_secret: "secret" },
        is_enabled: true
      };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProvider, error: null });
      ;(supabaseAdmin.from as any).mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ single: mockSingle }) }) }) });

      const result = await ssoService.getProvider("p1");
      expect(result?.strategy).toBeInstanceOf(FrappeSSOProvider);
    });

    it("createOrLinkUser returns existing user ID", async () => {
      const mockUsers = { users: [{ id: "u1", email: "test@test.com" }] };
      (supabaseAdmin.auth.admin.listUsers as any).mockResolvedValue({ data: mockUsers });

      const result = await ssoService.createOrLinkUser({ email: "test@test.com", name: "John", provider: "p1", isNewUser: false });
      expect(result.userId).toBe("u1");
      expect(result.isNewUser).toBe(false);
    });

    it("validateEmailDomain checks domain correctly", async () => {
      const mockProvider = { email_domain_restriction: ["test.com"] };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProvider, error: null });
      ;(supabaseAdmin.from as any).mockReturnValue({ select: () => ({ eq: () => ({ single: mockSingle }) }) });

      expect(await ssoService.validateEmailDomain("user@test.com", "p1")).toBe(true);
      expect(await ssoService.validateEmailDomain("user@other.com", "p1")).toBe(false);
    });
  });
});
