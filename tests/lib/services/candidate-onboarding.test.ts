import { describe, it, expect, vi, beforeEach } from "vitest";
import { candidateOnboardingService, transformOnboardingForm } from "@/lib/services/candidate-onboarding";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("candidateOnboardingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOnboardingForm", () => {
    // Spec: CAND-05-A8.1D (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-1d)
    it("fetches and transforms onboarding form", async () => {
      const mockRes = {
        status: "success",
        job_applicant: "APP-001",
        boarding_status: "Draft",
        tabs: [],
      };
      (FrappeAPI.get as any).mockResolvedValue(mockRes);

      const result = await candidateOnboardingService.getOnboardingForm("test@example.com");

      expect(result).toEqual({
        applicantId: "APP-001",
        status: "Draft",
        tabs: [],
      });
      expect(FrappeAPI.get).toHaveBeenCalledWith(expect.any(String), { job_applicant_id: "test@example.com" });
    });

    // Spec: CAND-05-A8.1E (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-1e)
    it("throws error if email is missing", async () => {
      await expect(candidateOnboardingService.getOnboardingForm("")).rejects.toThrow("User email is required");
    });

    // Spec: CAND-05-A8.1F (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-1f)
    it("throws error if API fails", async () => {
      (FrappeAPI.get as any).mockResolvedValue({ status: "error" });
      await expect(candidateOnboardingService.getOnboardingForm("test@example.com")).rejects.toThrow("Failed to fetch onboarding form");
    });
  });

  describe("submitOnboarding", () => {
    // Spec: CAND-05-A8.2D (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-2d)
    it("submits onboarding data correctly", async () => {
      const mockRes = { status: "success", message: "Success" };
      (FrappeAPI.post as any).mockResolvedValue(mockRes);

      const stepData = { personal: { first_name: "John" } };
      const result = await candidateOnboardingService.submitOnboarding(stepData, "test@example.com", "submit");

      expect(result).toEqual({ success: true, message: "Success" });
      expect(FrappeAPI.post).toHaveBeenCalledWith(expect.any(String), {
        email: "test@example.com",
        data: expect.objectContaining({ first_name: "John" }),
        action: "submit"
      });
    });

    // Spec: CAND-05-A8.2E (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-2e)
    it("throws error if submission fails", async () => {
      (FrappeAPI.post as any).mockResolvedValue({ status: "error", message: "Error" });
      await expect(candidateOnboardingService.submitOnboarding({}, "test@example.com", "submit")).rejects.toThrow("Error");
    });
  });

  describe("transformOnboardingForm", () => {
    // Spec: CAND-05-A8.1G (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-1g)
    it("transforms backend data to frontend format", () => {
      const input = {
        job_applicant: "ID1",
        boarding_status: "Pending",
        tabs: [{ id: "tab1" } as any],
      };
      const output = transformOnboardingForm(input as any);
      expect(output).toEqual({
        applicantId: "ID1",
        status: "Pending",
        tabs: [{ id: "tab1" }],
      });
    });
  });
});
