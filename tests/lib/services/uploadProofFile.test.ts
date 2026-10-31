import { describe, it, expect, vi, beforeEach } from "vitest";
import { fileUploadService } from "@/lib/services/uploadProofFile";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    uploadFile: vi.fn(),
  },
}));

describe("fileUploadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Spec: CAND-02-A1.4B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a1-4b)
  it("uploadFile calls FrappeAPI.uploadFile correctly", async () => {
    const mockRes = { file_url: "url", name: "name" };
    (FrappeAPI.uploadFile as any).mockResolvedValue(mockRes);

    const file = new File(["test"], "test.pdf");
    const result = await fileUploadService.uploadFile(file, "DocType", "DocName");

    expect(result).toEqual(mockRes);
    expect(FrappeAPI.uploadFile).toHaveBeenCalledWith(file, "", "DocName", "DocType");
  });

  // Spec: CAND-05-A9.2A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a9-2a)
  it("handles upload errors", async () => {
    const mockError = new Error("Upload failed");
    (FrappeAPI.uploadFile as any).mockRejectedValue(mockError);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const file = new File(["test"], "test.pdf");
    await expect(fileUploadService.uploadFile(file)).rejects.toThrow(mockError);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

