import { describe, it, expect } from "vitest";
import { z } from "zod";
import { 
  AppError, 
  ValidationError, 
  handleApiError, 
  createErrorResponse,
  createSuccessResponse,
  isOperationalError,
  RateLimitError,
  isValidationError,
  isAppError,
  isZodError
} from "@/lib/utils/errors";

describe("Error Utils", () => {
  describe("AppError", () => {
    it("creates an error with status code", () => {
      const error = new AppError("Test message", 418);
      expect(error.message).toBe("Test message");
      expect(error.statusCode).toBe(418);
      expect(error.name).toBe("AppError");
    });
  });

  describe("handleApiError", () => {
    it("handles ZodError by returning 400 with details", async () => {
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({ name: 123 });
      
      if (!result.success) {
        const response = handleApiError(result.error);
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe("Validation failed");
        expect(body.details[0].field).toBe("name");
      }
    });

    it("handles AppError by returning its status code", async () => {
      const error = new AppError("Custom error", 403);
      const response = handleApiError(error);
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Custom error");
    });

    it("handles Supabase 404 (PGRST116)", async () => {
      const error = { code: "PGRST116", message: "Not found" };
      const response = handleApiError(error);
      expect(response.status).toBe(404);
    });
  });

  describe("createErrorResponse", () => {
    it("creates a standardized error response", async () => {
      const response = createErrorResponse("Oops", 500, { foo: "bar" });
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Oops");
      expect(body.details.foo).toBe("bar");
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("createSuccessResponse", () => {
    it("creates a standardized success response", async () => {
      const response = createSuccessResponse({ id: 1 }, "Success");
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toBe("Success");
      expect(body.id).toBe(1);
    });
  });

  describe("isOperationalError", () => {
    it("identifies operational errors", () => {
      expect(isOperationalError(new AppError("msg", 400))).toBe(true);
      expect(isOperationalError(new Error("msg"))).toBe(false);
      expect(isOperationalError({ code: "23505" })).toBe(true);
    });
  });

  describe("Error Classes and Type Guards", () => {
    it("RateLimitError sets retryAfter", () => {
      const err = new RateLimitError(60);
      expect(err.retryAfter).toBe(60);
      expect(err.statusCode).toBe(429);
    });

    it("identifies error types correctly", () => {
      const zodErr = new z.ZodError([]);
      
      const valErr = new ValidationError(zodErr);
      const appErr = new AppError("test", 500);

      expect(isValidationError(valErr)).toBe(true);
      expect(isValidationError(appErr)).toBe(false);

      expect(isAppError(appErr)).toBe(true);
      expect(isAppError(new Error())).toBe(false);

      expect(isZodError(zodErr)).toBe(true);
      expect(isZodError(appErr)).toBe(false);
    });
  });
});
