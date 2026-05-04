import { describe, it, expect } from "vitest";
import { 
  emailSchema, 
  signupSchema, 
  updateProfileSchema,
  createJobSchema,
  updateJobSchema,
  applicationsQuerySchema,
  createApplicationSchema,
  validateUUID,
  validateEmail,
  validatePhone,
  validateURL,
  sanitizeString,
  sanitizeHTML,
  ValidationError,
  handleValidationError
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  describe("emailSchema", () => {
    it("validates correct emails", () => {
      expect(emailSchema.safeParse("test@example.com").success).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(emailSchema.safeParse("invalid-email").success).toBe(false);
    });
  });

  describe("signupSchema", () => {
    it("validates correct signup data", () => {
      const data = {
        email: "test@test.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe"
      };
      expect(signupSchema.safeParse(data).success).toBe(true);
    });

    it("rejects short passwords", () => {
      const data = {
        email: "test@test.com",
        password: "short",
        firstName: "John",
        lastName: "Doe"
      };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("updateProfileSchema", () => {
    it("validates salary range", () => {
      const data = { preferred_salary_min: 100, preferred_salary_max: 50 };
      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("createJobSchema", () => {
    it("requires basic fields", () => {
      const result = createJobSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("updateJobSchema", () => {
    it("validates salary range", () => {
      const result = updateJobSchema.safeParse({ salary_min: 100, salary_max: 50 });
      expect(result.success).toBe(false);
    });
  });

  describe("applicationsQuerySchema", () => {
    it("sets defaults", () => {
      const result = applicationsQuerySchema.safeParse({});
      expect(result.data.page).toBe(1);
    });
  });

  describe("createApplicationSchema", () => {
    it("validates application", () => {
      const result = createApplicationSchema.safeParse({ job_id: "123e4567-e89b-12d3-a456-426614174000" });
      expect(result.success).toBe(true);
    });
  });

  describe("Utilities and Errors", () => {
    it("validates strings", () => {
      expect(validateUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(validateUUID("invalid")).toBe(false);
      expect(validateEmail("test@test.com")).toBe(true);
      expect(validatePhone("1234567890")).toBe(true);
      expect(validateURL("http://example.com")).toBe(true);
      expect(validateURL("invalid")).toBe(false);
      expect(sanitizeString("  test  ")).toBe("test");
      expect(sanitizeHTML("<script>")).toBe("&lt;script&gt;");
    });

    it("handles validation error", () => {
      const { z } = require("zod");
      const zodErr = new z.ZodError([]);
      expect(() => handleValidationError(zodErr)).toThrow(ValidationError);
      expect(() => handleValidationError(new Error("Other"))).toThrow("Other");
    });
  });
});
