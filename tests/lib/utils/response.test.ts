import { describe, it, expect } from "vitest";
import { 
  successResponse, 
  errorResponse, 
  createPaginationMeta,
  successResponseWithPagination,
  notFoundResponse,
  exportResponse,
  fileUploadResponse,
  createdResponse,
  noContentResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  rateLimitResponse,
  serviceUnavailableResponse,
  healthCheckResponse,
  batchOperationResponse,
  setCacheHeaders,
  setSecurityHeaders,
  setCorsHeaders
} from "@/lib/utils/response";

describe("Response Utils", () => {
  describe("successResponse", () => {
    it("creates a standard success response", async () => {
      const response = successResponse({ foo: "bar" }, "Done");
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.foo).toBe("bar");
      expect(body.message).toBe("Done");
    });
  });

  describe("errorResponse", () => {
    it("creates a standard error response", async () => {
      const response = errorResponse("Fail", 400);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Fail");
    });
  });

  describe("createPaginationMeta", () => {
    it("calculates total pages and next/prev", () => {
      const meta = createPaginationMeta(1, 10, 25);
      expect(meta.totalPages).toBe(3);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);
    });
  });

  describe("successResponseWithPagination", () => {
    it("includes pagination meta in response", async () => {
      const meta = createPaginationMeta(1, 10, 25);
      const response = successResponseWithPagination([1, 2], meta);
      const body = await response.json();
      expect(body.pagination).toEqual(meta);
    });
  });

  describe("exportResponse", () => {
    it("exports json correctly", async () => {
      const data = [{ a: 1 }];
      const res = exportResponse(data, "test.json", "json");
      expect(res.headers.get("Content-Type")).toBe("application/json");
      expect(await res.json()).toEqual(data);
    });

    it("exports csv correctly", async () => {
      const data = [{ a: 1, b: 2 }];
      const res = exportResponse(data, "test.csv", "csv");
      expect(res.headers.get("Content-Type")).toBe("text/csv");
      expect(await res.text()).toBe("1,2");
    });

    it("handles invalid format", async () => {
      const res = exportResponse([], "test.txt", "txt" as any);
      expect(res.status).toBe(400);
    });
  });

  describe("fileUploadResponse", () => {
    it("returns created response", async () => {
      const file = { id: "1", name: "f", url: "u", size: 1, type: "t" };
      const res = fileUploadResponse(file, "Uploaded");
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data).toEqual(file);
    });
  });

  describe("Other Responses", () => {
    it("returns correct statuses and formats", async () => {
      expect(createdResponse({}).status).toBe(201);
      expect(noContentResponse().status).toBe(200);
      expect(validationErrorResponse([]).status).toBe(400);
      expect(unauthorizedResponse().status).toBe(401);
      expect(forbiddenResponse().status).toBe(403);
      expect(conflictResponse().status).toBe(409);
      expect(rateLimitResponse(60).status).toBe(429);
      expect(serviceUnavailableResponse().status).toBe(503);
      expect(serviceUnavailableResponse("Auth").status).toBe(503);
      expect(healthCheckResponse().status).toBe(200);
      expect(healthCheckResponse("unhealthy").status).toBe(503);
      
      const batchRes = batchOperationResponse([{ id: "1", success: true }, { id: "2", success: false }]);
      expect(batchRes.status).toBe(200);

      const resWithHeaders = setCacheHeaders(createdResponse({}));
      expect(resWithHeaders.headers.get("Cache-Control")).toContain("max-age=300");

      const secRes = setSecurityHeaders(createdResponse({}));
      expect(secRes.headers.get("X-Frame-Options")).toBe("DENY");

      const corsRes = setCorsHeaders(createdResponse({}));
      expect(corsRes.headers.get("Access-Control-Allow-Methods")).toContain("GET");
      
      // With specific origin
      const reqRes = createdResponse({});
      reqRes.headers.set("origin", "http://localhost:3000");
      const corsReqRes = setCorsHeaders(reqRes);
      expect(corsReqRes.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    });
  });

  describe("notFoundResponse", () => {
    it("returns 404 with custom message", async () => {
      const response = notFoundResponse("User");
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("User not found");
    });
  });
});
