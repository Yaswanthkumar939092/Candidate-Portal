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

  it("uploadFile calls FrappeAPI.uploadFile correctly", async () => {
    const mockRes = { file_url: "url", name: "name" };
    (FrappeAPI.uploadFile as any).mockResolvedValue(mockRes);

    const file = new File(["test"], "test.pdf");
    const result = await fileUploadService.uploadFile(file, "DocType", "DocName");

    expect(result).toEqual(mockRes);
    expect(FrappeAPI.uploadFile).toHaveBeenCalledWith(file, "", "DocName", "DocType");
  });

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

