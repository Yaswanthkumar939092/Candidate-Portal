import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRoles, withOwnership, withRateLimit, getUserFromRequest, isAdmin, combineMiddleware } from "@/lib/middleware/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Mock supabaseAdmin
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn(),
        }),
      }),
    }),
  },
}));

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("withAuth", () => {
    it("returns 401 if no token", async () => {
      const req = {
        cookies: { get: () => null },
        headers: { get: () => null },
      } as any;

      const response = await withAuth(req, async () => new Response());
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Authentication required");
    });

    it("attaches user and calls handler if token valid", async () => {
      const mockUser = { id: "u1" };
      (supabaseAdmin.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });

      const req = {
        cookies: { get: () => ({ value: "token" }) },
        headers: { get: () => null },
      } as any;

      const handler = vi.fn().mockResolvedValue(new Response("ok"));
      const response = await withAuth(req, handler);

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
    });
  });

  describe("withRoles", () => {
    it("returns 401 if user lacks admin role", async () => {
      const req = {} as any;
      const response = await withRoles(["admin"])(req, async () => new Response());
      expect(response.status).toBe(401);
    });

    it("returns 404 if user profile not found", async () => {
      const req = { user: { id: "u1" } } as any;
      (supabaseAdmin.from as any)().select().eq().single.mockResolvedValueOnce({ data: null, error: { message: "err" } });
      const response = await withRoles(["admin"])(req, async () => new Response());
      expect(response.status).toBe(404);
    });

    it("returns 403 if user is not admin", async () => {
      const req = { user: { id: "u1" } } as any;
      (supabaseAdmin.from as any)().select().eq().single.mockResolvedValueOnce({ data: { id: "p1", role: "user" }, error: null });
      const response = await withRoles(["admin"])(req, async () => new Response());
      expect(response.status).toBe(403);
    });

    it("allows access if user has required role", async () => {
      const req = { user: { id: "u1" } } as any;
      (supabaseAdmin.from as any)().select().eq().single.mockResolvedValueOnce({ data: { id: "p1", role: "admin" }, error: null });
      const handler = vi.fn().mockResolvedValue(new Response("ok"));
      const response = await withRoles(["admin"])(req, handler);
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("withOwnership", () => {
    it("returns 401 if not authenticated", async () => {
      const req = {} as any;
      const response = await withOwnership("test_table", "id")(req, async () => new Response(), { id: "1" });
      expect(response.status).toBe(401);
    });

    it("returns 400 if resource ID is missing", async () => {
      const req = { user: { id: "u1" } } as any;
      const response = await withOwnership("test_table", "id")(req, async () => new Response(), {});
      expect(response.status).toBe(400);
    });

    it("returns 404 if resource not found", async () => {
      const req = { user: { id: "u1" } } as any;
      (supabaseAdmin.from as any)().select().eq().single.mockResolvedValue({ data: null, error: { message: "err" } });
      const response = await withOwnership("test_table", "id")(req, async () => new Response(), { id: "r1" });
      expect(response.status).toBe(404);
    });

    it("returns 403 if user does not own resource and is not admin", async () => {
      const req = { user: { id: "u1" } } as any;
      (supabaseAdmin.from as any)().select().eq().single
        .mockResolvedValueOnce({ data: { user_id: "u2" }, error: null }) // resource
        .mockResolvedValueOnce({ data: null, error: null }); // profile (not admin)

      const response = await withOwnership("test_table", "id")(req, async () => new Response(), { id: "r1" });
      expect(response.status).toBe(403);
    });

    it("allows access if user owns resource", async () => {
      const req = { user: { id: "u1" } } as any;
      (supabaseAdmin.from as any)().select().eq().single.mockResolvedValueOnce({ data: { user_id: "u1" }, error: null });

      const handler = vi.fn().mockResolvedValue(new Response("ok"));
      const response = await withOwnership("test_table", "id")(req, handler, { id: "r1" });
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("withRateLimit", () => {
    it("allows requests within limit", async () => {
      const req = { headers: { get: () => "1.1.1.1" } } as any;
      const handler = vi.fn().mockResolvedValue(new NextResponse("ok"));
      
      const response = await withRateLimit(5)(req, handler);
      expect(response.status).toBe(200);
      expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
    });

    it("blocks request if rate limit exceeded", async () => {
      const req = { headers: { get: () => "1.1.1.2" } } as any;
      const handler = vi.fn().mockResolvedValue(new NextResponse("ok"));
      
      const rateLimiter = withRateLimit(1);
      await rateLimiter(req, handler); // 1st request (allowed)
      const response = await rateLimiter(req, handler); // 2nd request (blocked)
      
      expect(response.status).toBe(429);
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("Utility Functions", () => {

    it("getUserFromRequest returns null if no token", async () => {
      const req = { cookies: { get: () => null }, headers: { get: () => null } } as any;
      const user = await getUserFromRequest(req);
      expect(user).toBeNull();
    });

    it("getUserFromRequest returns user if valid", async () => {
      const req = { cookies: { get: () => ({ value: "token" }) }, headers: { get: () => null } } as any;
      const mockUser = { id: "u1" };
      (supabaseAdmin.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
      const user = await getUserFromRequest(req);
      expect(user).toEqual(mockUser);
    });

    it("getUserFromRequest returns null on error", async () => {
      const req = { cookies: { get: () => ({ value: "token" }) }, headers: { get: () => null } } as any;
      (supabaseAdmin.auth.getUser as any).mockRejectedValue(new Error("err"));
      const user = await getUserFromRequest(req);
      expect(user).toBeNull();
    });

    it("isAdmin returns true if profile exists", async () => {
      (supabaseAdmin.from as any)().select().eq().single.mockResolvedValue({ data: { id: "p1" } });
      const result = await isAdmin("u1");
      expect(result).toBe(true);
    });

    it("isAdmin returns false on error", async () => {
      (supabaseAdmin.from as any)().select().eq().single.mockRejectedValue(new Error("err"));
      const result = await isAdmin("u1");
      expect(result).toBe(false);
    });

    it("combineMiddleware applies middleware in correct order", async () => {
      const m1 = vi.fn().mockImplementation(async (req, next) => {
        req.trace = (req.trace || "") + "1";
        return await next(req);
      });
      const m2 = vi.fn().mockImplementation(async (req, next) => {
        req.trace = (req.trace || "") + "2";
        return await next(req);
      });
      
      const handler = vi.fn().mockImplementation(async (req) => {
        return new Response(req.trace);
      });

      const combined = combineMiddleware(m1, m2);
      const req = {} as any;
      const response = await combined(req, handler);
      
      expect(await response.text()).toBe("12");
    });
  });
});
