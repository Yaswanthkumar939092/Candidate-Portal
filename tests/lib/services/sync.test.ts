import { describe, it, expect, vi, beforeEach } from "vitest";
import { FrappeSyncService } from "@/lib/services/sync";
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
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// Mock frappeEnvManager
const mockClient = {
  request: vi.fn(),
  ping: vi.fn(),
};
const mockEnvManager = {
  getClient: vi.fn().mockResolvedValue(mockClient),
};

describe("FrappeSyncService", () => {
  let service: FrappeSyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FrappeSyncService(mockEnvManager as any);
  });

  it("syncJobs fetches jobs and processes them", async () => {
    const mockJobs = [{ 
      name: "JO1", 
      job_title: "Dev", 
      company: "Acme", 
      description: "Desc", 
      location: "City",
      employment_type: "Full-time",
      experience_level: "Junior",
      status: "Open",
      creation: new Date().toISOString(),
      modified: new Date().toISOString(),
    }];
    mockClient.request.mockResolvedValue({ data: mockJobs });

    // Mock existingJob = null
    const dbFrom = (supabaseAdmin.from as any)();
    dbFrom.select().eq().single.mockResolvedValue({ data: null, error: null });

    const result = await service.syncJobs({ entityType: "jobs", batchSize: 10 });

    expect(result.created).toBe(1);
    expect(mockClient.request).toHaveBeenCalled();
    expect(supabaseAdmin.from).toHaveBeenCalledWith("jobs");
  });

  it("syncApplications finds candidate and job before processing", async () => {
    const mockApps = [{
      name: "APP1",
      job_opening: "JO1",
      applicant_email: "test@test.com",
      applicant_name: "John",
      status: "Open",
      application_date: new Date().toISOString(),
      creation: new Date().toISOString(),
      modified: new Date().toISOString(),
    }];
    mockClient.request.mockResolvedValue({ data: mockApps });

    // Mock candidate and job lookups
    const dbFrom = (supabaseAdmin.from as any)();
    dbFrom.select().eq().single
      .mockResolvedValueOnce({ data: { id: "c1" }, error: null }) // candidate
      .mockResolvedValueOnce({ data: { id: "j1" }, error: null }) // job
      .mockResolvedValueOnce({ data: null, error: null }); // existing app

    const result = await service.syncApplications({ entityType: "applications", batchSize: 10 });

    expect(result.created).toBe(1);
  });

  it("testConnection returns success if ping succeeds", async () => {
    mockClient.ping.mockResolvedValue(true);
    const result = await service.testConnection();
    expect(result.success).toBe(true);
  });

  it("testConnection returns error if ping fails", async () => {
    mockClient.ping.mockRejectedValue(new Error("Network Error"));
    const result = await service.testConnection();
    expect(result.success).toBe(false);
    expect(result.error).toBe("Network Error");
  });

  it("syncCompanies fetches companies and processes them", async () => {
    const mockCompanies = [{
      name: "C1",
      company_name: "Acme Corp",
      company_description: "A description",
      website: "http://example.com",
      company_logo: "http://example.com/logo.png",
      address: "123 Main St",
      industry: "Tech",
      creation: new Date().toISOString(),
      modified: new Date().toISOString(),
    }];
    mockClient.request.mockResolvedValue({ data: mockCompanies });

    // Mock existingCompany = null
    const dbFrom = (supabaseAdmin.from as any)();
    dbFrom.select().eq().single.mockResolvedValue({ data: null, error: null });

    const result = await service.syncCompanies({ entityType: "companies", batchSize: 10 });

    expect(result.created).toBe(1);
    expect(mockClient.request).toHaveBeenCalled();
    expect(supabaseAdmin.from).toHaveBeenCalledWith("companies");
  });

  it("syncAll runs all syncs and returns summary", async () => {
    // Mock for jobs
    mockClient.request.mockResolvedValueOnce({ data: [] });
    // Mock for applications
    mockClient.request.mockResolvedValueOnce({ data: [] });
    // Mock for companies
    mockClient.request.mockResolvedValueOnce({ data: [] });

    const result = await service.syncAll({ batchSize: 10 });

    expect(result.jobs).toBeDefined();
    expect(result.applications).toBeDefined();
    expect(result.companies).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.total_created).toBe(0);
  });
});
