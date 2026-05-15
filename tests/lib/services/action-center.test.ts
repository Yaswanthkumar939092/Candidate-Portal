import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  ActionCenterDataService, 
  ActionCenterMyRequestService, 
  CandidateRaiseRequestService 
} from "@/lib/services/action-center";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
    getresourceDocumentData: vi.fn(),
  },
}));

describe("ActionCenter Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ActionCenterDataService", () => {
    it("getActionCenterData calls FrappeAPI.get with correct arguments", async () => {
      const mockResponse = { items: [] };
      (FrappeAPI.get as any).mockResolvedValue(mockResponse);

      const result = await ActionCenterDataService.getActionCenterData("test@example.com");

      expect(result).toEqual(mockResponse);
      expect(FrappeAPI.get).toHaveBeenCalledWith(
        "recruitment.api.action_center.get_action_center_items",
        { candidate_email: "test@example.com" }
      );
    });
  });

  describe("ActionCenterMyRequestService", () => {
    it("getActionCenterMyRequestService calls FrappeAPI.getresourceDocumentData correctly", async () => {
      const mockResponse = { data: [{ id: 1 }] };
      (FrappeAPI.getresourceDocumentData as any).mockResolvedValue(mockResponse);

      const result = await ActionCenterMyRequestService.getActionCenterMyRequestService(1, 10, "test@example.com");

      expect(result).toEqual(mockResponse.data);
      expect(FrappeAPI.getresourceDocumentData).toHaveBeenCalledWith("Candidate%20Raise%20Request", {
        method: "GET",
        page: 1,
        limit: 10,
        fields: ["*"],
        filters: [["candidate_email", "=", "test@example.com"]],
      });
    });
  });

  describe("CandidateRaiseRequestService", () => {
    it("createCandidateRaiseRequest calls FrappeAPI.getresourceDocumentData correctly", async () => {
      const mockResponse = { data: { success: true } };
      (FrappeAPI.getresourceDocumentData as any).mockResolvedValue(mockResponse);

      const payload = { title: "Help" };
      const result = await CandidateRaiseRequestService.createCandidateRaiseRequest(payload);

      expect(result).toEqual(mockResponse.data);
      expect(FrappeAPI.getresourceDocumentData).toHaveBeenCalledWith("Candidate Raise Request", {
        method: "POST",
        data: payload,
      });
    });
  });
});
