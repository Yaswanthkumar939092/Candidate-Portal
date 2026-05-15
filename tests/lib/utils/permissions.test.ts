import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getUserContext, 
  hasPermission, 
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  canAccessResource,
  requirePermissions,
  requireRoles,
  filterDataByPermissions,
  getAllowedActions,
  updateUserRole,
  validateRoleAssignment,
  UserContext,
  Role,
  Permission
} from "@/lib/utils/permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Mock supabaseAdmin
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn(),
        }),
      }),
    }),
  },
}));

describe("Permission Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserContext", () => {
    it("returns context with permissions based on role", async () => {
      const mockProfile = { id: "u1", email: "test@test.com", role: "candidate" };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
      ;vi.mocked(supabaseAdmin.from).mockReturnValue({ select: () => ({ eq: () => ({ single: mockSingle }) }) });

      const context = await getUserContext("u1");
      expect(context?.role).toBe("candidate");
      expect(context?.permissions).toContain("jobs.read");
      expect(context?.permissions).not.toContain("users.delete");
    });

    it("returns null on error", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "error" } });
      ;vi.mocked(supabaseAdmin.from).mockReturnValue({ select: () => ({ eq: () => ({ single: mockSingle }) }) });

      const context = await getUserContext("u1");
      expect(context).toBeNull();
    });
  });

  describe("hasPermission", () => {
    const candidateContext: UserContext = {
      id: "u1",
      email: "u1@test.com",
      role: "candidate",
      permissions: ["jobs.read", "profile.update"] as Permission[]
    };

    it("returns true if user has permission", () => {
      const result = hasPermission(candidateContext, "jobs.read");
      expect(result.allowed).toBe(true);
    });

    it("returns false if user lacks permission", () => {
      const result = hasPermission(candidateContext, "users.delete" as Permission);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("User does not have permission");
    });

    it("enforces ownership for candidates", () => {
      const result = hasPermission(candidateContext, "profile.update", { resourceOwnerId: "other" });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Candidates can only access their own resources");
    });
  });

  describe("hasAnyPermission", () => {
    const ctx: UserContext = { id: "u1", email: "e", role: "candidate", permissions: ["jobs.read" as Permission] };
    it("returns true if any permission matches", () => {
      expect(hasAnyPermission(ctx, ["jobs.read" as Permission, "jobs.create" as Permission]).allowed).toBe(true);
      expect(hasAnyPermission(ctx, ["jobs.create" as Permission, "jobs.delete" as Permission]).allowed).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    const ctx: UserContext = { id: "u1", email: "e", role: "candidate", permissions: ["jobs.read" as Permission, "jobs.create" as Permission] };
    it("returns true if all permissions match", () => {
      expect(hasAllPermissions(ctx, ["jobs.read" as Permission, "jobs.create" as Permission]).allowed).toBe(true);
      expect(hasAllPermissions(ctx, ["jobs.read" as Permission, "jobs.delete" as Permission]).allowed).toBe(false);
    });
  });

  describe("hasRole and hasAnyRole", () => {
    const ctx = { id: "u1", email: "e", role: "admin" as Role, permissions: [] as Permission[] } as UserContext;
    it("checks roles correctly", () => {
      expect(hasRole(ctx, "admin")).toBe(true);
      expect(hasRole(ctx, "candidate")).toBe(false);
      expect(hasAnyRole(ctx, ["admin", "recruiter"])).toBe(true);
      expect(hasAnyRole(ctx, ["candidate", "recruiter"])).toBe(false);
    });
  });

  describe("canAccessResource", () => {
    it("checks access for application", async () => {
      const mockSingle = vi.fn()
        .mockResolvedValueOnce({ data: { id: "u1", role: "candidate", permissions: ["applications.read"] } }) // getUserContext
        .mockResolvedValueOnce({ data: { candidate_id: "u1", jobs: { company_id: "c1" } } }); // application
      ;vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      });

      const result = await canAccessResource("u1", "application", "a1", "read");
      expect(result.allowed).toBe(true);
    });

    it("handles job, document, profile resource types", async () => {
      const mockSingle = vi.fn()
        .mockResolvedValueOnce({ data: { id: "u1", role: "admin", permissions: ["jobs.read"] } })
        .mockResolvedValueOnce({ data: { id: "j1" } });
      ;vi.mocked(supabaseAdmin.from).mockReturnValue({ select: () => ({ eq: () => ({ single: mockSingle }) }) });
      const jobResult = await canAccessResource("u1", "job", "j1", "read");
      expect(jobResult.allowed).toBe(true);

      // Mocks for profile
      mockSingle.mockReset();
      mockSingle.mockResolvedValueOnce({ data: { id: "u1", role: "candidate", permissions: ["profile.read"] } });
      const profResult = await canAccessResource("u1", "profile", "u1", "read");
      expect(profResult.allowed).toBe(true);
    });

    it("returns false on error", async () => {
      const mockSingle = vi.fn().mockRejectedValue(new Error("DB Error"));
      ;vi.mocked(supabaseAdmin.from).mockReturnValue({ select: () => ({ eq: () => ({ single: mockSingle }) }) });
      const result = await canAccessResource("u1", "job", "j1", "read");
      expect(result.allowed).toBe(false);
    });
  });

  describe("requirePermissions and requireRoles", () => {
    it("requirePermissions works", async () => {
      const middleware = requirePermissions(["jobs.read"]);
      const ctx: UserContext = { id: "u1", email: "e", role: "candidate", permissions: ["jobs.read" as Permission] };
      const res = await middleware(ctx);
      expect(res.allowed).toBe(true);
      
      const resFail = await middleware({ ...ctx, permissions: [] });
      expect(resFail.allowed).toBe(false);
    });

    it("requireRoles works", () => {
      const middleware = requireRoles(["admin", "recruiter"]);
      const baseCtx: UserContext = { id: "u1", email: "e", role: "admin", permissions: [] };
      expect(middleware({ ...baseCtx, role: "admin" }).allowed).toBe(true);
      expect(middleware({ ...baseCtx, role: "candidate" }).allowed).toBe(false);
    });
  });

  describe("filterDataByPermissions", () => {
    it("filters data based on permissions", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "u1", role: "candidate", permissions: ["jobs.read"] } });
      ;vi.mocked(supabaseAdmin.from).mockReturnValue({ select: () => ({ eq: () => ({ single: mockSingle }) }) });

      const data = [{ id: "p1" }, { id: "p2" }];
      // u1 can read jobs
      const filtered = await filterDataByPermissions("u1", data, "job", (item) => item.id === "p1" ? "u1" : "other");
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("p1");
    });
  });

  describe("getAllowedActions", () => {
    it("returns map of allowed actions", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "u1", role: "admin" } });
      ;vi.mocked(supabaseAdmin.from).mockReturnValue({ select: () => ({ eq: () => ({ single: mockSingle }) }) });

      const actions = await getAllowedActions("u1", "job", "u1");
      expect(actions.canRead).toBe(true);
      expect(actions.canUpdate).toBe(true);
      expect(actions.canCreate).toBe(true);
    });
  });

  describe("updateUserRole", () => {
    it("updates role successfully", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "admin1", role: "admin", permissions: ["users.update"] } });
      const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
      ;vi.mocked(supabaseAdmin.from).mockReturnValue({ 
        select: () => ({ eq: () => ({ single: mockSingle }) }),
        update: mockUpdate
      });

      const res = await updateUserRole("admin1", "target1", "candidate");
      expect(res.success).toBe(true);
    });

    it("fails if non-admin", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "user1", role: "candidate", permissions: [] } });
      ;vi.mocked(supabaseAdmin.from).mockReturnValue({ select: () => ({ eq: () => ({ single: mockSingle }) }) });

      const res = await updateUserRole("user1", "target1", "candidate");
      expect(res.success).toBe(false);
    });
  });

  describe("validateRoleAssignment", () => {
    it("validates role assignments correctly", () => {
      expect(validateRoleAssignment("admin", "recruiter").allowed).toBe(true);
      expect(validateRoleAssignment("hr_manager", "candidate").allowed).toBe(true);
      expect(validateRoleAssignment("company_admin", "recruiter").allowed).toBe(true);
      expect(validateRoleAssignment("candidate", "admin").allowed).toBe(false);
    });
  });
});
