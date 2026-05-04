import { describe, it, expect, vi, beforeEach } from "vitest";
import { fileUploadService } from "@/lib/services/file-upload";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Mock supabaseAdmin
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        createSignedUrl: vi.fn(),
      }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn(),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn(),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn(),
        }),
      }),
    }),
  },
}));

describe("FileUploadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateFile", () => {
    it("validates valid file", () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      const result = fileUploadService.validateFile(file, "resume");
      expect(result.valid).toBe(true);
    });

    it("rejects oversized file", () => {
      const file = new File(["a".repeat(6 * 1024 * 1024)], "large.pdf", { type: "application/pdf" });
      const result = fileUploadService.validateFile(file, "resume");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds limit");
    });

    it("rejects invalid file type", () => {
      const file = new File(["test"], "test.exe", { type: "application/x-msdownload" });
      const result = fileUploadService.validateFile(file, "resume");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("type not allowed");
    });

    it("rejects dangerous filenames", () => {
      const file = new File(["test"], "../evil.pdf", { type: "application/pdf" });
      const result = fileUploadService.validateFile(file, "resume");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid filename characters");
    });
  });

  describe("uploadFile", () => {
    it("uploads file successfully", async () => {
      const mockFile = new File(["test"], "test.pdf", { type: "application/pdf" });
      const mockUploadData = { path: "path/to/file" };
      const mockPublicUrl = { publicUrl: "http://example.com/file.pdf" };
      const mockFileRecord = { id: "123", name: "test.pdf" };

      const storageFrom = (supabaseAdmin.storage.from as any)();
      storageFrom.upload.mockResolvedValue({ data: mockUploadData, error: null });
      storageFrom.getPublicUrl.mockReturnValue({ data: mockPublicUrl });

      const dbFrom = (supabaseAdmin.from as any)();
      dbFrom.insert().select().single.mockResolvedValue({ data: mockFileRecord, error: null });

      const result = await fileUploadService.uploadFile("user-1", mockFile, "resume");

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe(mockPublicUrl.publicUrl);
    });

    it("handles upload error", async () => {
      const mockFile = new File(["test"], "test.pdf", { type: "application/pdf" });
      const storageFrom = (supabaseAdmin.storage.from as any)();
      storageFrom.upload.mockResolvedValue({ data: null, error: { message: "Upload failed" } });

      const result = await fileUploadService.uploadFile("user-1", mockFile, "resume");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Upload failed");
    });
  });

  describe("deleteFile", () => {
    it("deletes file successfully", async () => {
      const mockRecord = { id: "123", user_id: "user-1", bucket_name: "resumes", storage_path: "path" };
      const dbFrom = (supabaseAdmin.from as any)();
      dbFrom.select().eq().single.mockResolvedValue({ data: mockRecord, error: null });
      dbFrom.delete().eq().eq.mockResolvedValue({ error: null });

      const storageFrom = (supabaseAdmin.storage.from as any)();
      storageFrom.remove.mockResolvedValue({ error: null });

      const result = await fileUploadService.deleteFile("user-1", "123");

      expect(result.success).toBe(true);
    });

    it("prevents deleting others files", async () => {
      const mockRecord = { id: "123", user_id: "other-user" };
      const dbFrom = (supabaseAdmin.from as any)();
      dbFrom.select().eq().single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await fileUploadService.deleteFile("user-1", "123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("uploadMultipleFiles", () => {
    it("uploads multiple files", async () => {
      const mockFile = new File(["test"], "test.pdf", { type: "application/pdf" });
      const storageFrom = (supabaseAdmin.storage.from as any)();
      storageFrom.upload.mockResolvedValue({ data: { path: "path" }, error: null });
      storageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: "http://example.com/file.pdf" } });

      const dbFrom = (supabaseAdmin.from as any)();
      dbFrom.insert().select().single.mockResolvedValue({ data: { id: "1" }, error: null });

      const result = await fileUploadService.uploadMultipleFiles("user-1", [
        { file: mockFile, documentType: "resume" },
        { file: mockFile, documentType: "cover_letter" },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(true);
    });
  });

  describe("getSignedUrl", () => {
    it("generates signed url successfully", async () => {
      const dbFrom = (supabaseAdmin.from as any)();
      dbFrom.select().eq().single.mockResolvedValue({
        data: { user_id: "user-1", bucket_name: "b", storage_path: "p" },
        error: null
      });

      const storageFrom = (supabaseAdmin.storage.from as any)();
      storageFrom.createSignedUrl.mockResolvedValue({ data: { signedUrl: "http://signed" }, error: null });

      const result = await fileUploadService.getSignedUrl("user-1", "123");
      expect(result.success).toBe(true);
      expect(result.url).toBe("http://signed");
    });

    it("prevents access for other users", async () => {
      const dbFrom = (supabaseAdmin.from as any)();
      dbFrom.select().eq().single.mockResolvedValue({
        data: { user_id: "other-user" },
        error: null
      });

      const result = await fileUploadService.getSignedUrl("user-1", "123");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("checkStorageQuota", () => {
    it("returns correct quota", async () => {
      const dbFrom = (supabaseAdmin.from as any)();
      dbFrom.select().eq.mockResolvedValueOnce({
        data: [{ file_size: 1000 }, { file_size: 2000 }],
        error: null
      });

      const result = await fileUploadService.checkStorageQuota("user-1");
      expect(result.used).toBe(3000);
      expect(result.canUpload(100)).toBe(true);
    });
  });

  describe("generateThumbnail", () => {
    it("generates thumbnail for images", async () => {
      const dbFrom = (supabaseAdmin.from as any)();
      dbFrom.select().eq().single.mockResolvedValue({
        data: { file_type: "image/png", bucket_name: "b", storage_path: "p" },
        error: null
      });

      const storageFrom = (supabaseAdmin.storage.from as any)();
      storageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: "http://thumb" } });

      const result = await fileUploadService.generateThumbnail("123");
      expect(result.success).toBe(true);
      expect(result.thumbnailUrl).toBe("http://thumb");
    });
  });

  describe("cleanupOrphanedFiles", () => {
    it("cleans up orphaned files", async () => {
      const storageFrom = (supabaseAdmin.storage.from as any)();
      storageFrom.list.mockResolvedValue({ data: [{ name: "f1" }, { name: "f2" }], error: null });
      storageFrom.remove.mockResolvedValue({ error: null });

      const dbFrom = (supabaseAdmin.from as any)();
      // f1 exists in db, f2 doesn't
      dbFrom.select().eq().single
        .mockResolvedValueOnce({ data: { id: "1" } })
        .mockResolvedValueOnce({ data: null });

      const result = await fileUploadService.cleanupOrphanedFiles("resume");
      expect(result.cleaned).toBe(1);
    });
  });

  describe("getFileMetadata", () => {
    it("returns file metadata", async () => {
      const dbFrom = (supabaseAdmin.from as any)();
      dbFrom.select().eq().single.mockResolvedValue({
        data: {
          name: "test.pdf",
          file_size: 100,
          file_type: "application/pdf",
          bucket_name: "b",
          storage_path: "p"
        },
        error: null
      });

      const result = await fileUploadService.getFileMetadata("123");
      expect(result.success).toBe(true);
      expect(result.metadata?.name).toBe("test.pdf");
    });
  });
});
