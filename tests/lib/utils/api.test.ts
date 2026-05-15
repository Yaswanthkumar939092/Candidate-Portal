/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { 
  getPaginationParams, 
  getSortParams, 
  getFilterParams, 
  parseArrayParam, 
  parseBooleanParam,
  getClientIP,
  validateRequiredFields,
  cleanObject,
  createAuditLogData,
  formatErrorForLogging
} from "@/lib/utils/api";

describe("API Utils", () => {
  describe("getPaginationParams", () => {
    it("returns default values when no params provided", () => {
      const req = new NextRequest("http://test.com/api");
      const params = getPaginationParams(req);
      expect(params).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    it("parses provided params correctly", () => {
      const req = new NextRequest("http://test.com/api?page=2&limit=50");
      const params = getPaginationParams(req);
      expect(params).toEqual({ page: 2, limit: 50, offset: 50 });
    });

    it("enforces limits and minimums", () => {
      const req = new NextRequest("http://test.com/api?page=0&limit=500");
      const params = getPaginationParams(req);
      expect(params.page).toBe(1);
      expect(params.limit).toBe(100);
    });
  });

  describe("getSortParams", () => {
    it("returns default sort params", () => {
      const req = new NextRequest("http://test.com/api");
      const params = getSortParams(req, ["name"]);
      expect(params).toEqual({ sortBy: "created_at", sortOrder: "desc" });
    });

    it("validates sort field against allowed list", () => {
      const req = new NextRequest("http://test.com/api?sort_by=age");
      const params = getSortParams(req, ["name"]);
      expect(params.sortBy).toBe("created_at"); // fallback to default
    });
  });

  describe("getFilterParams", () => {
    it("extracts only allowed filters", () => {
      const req = new NextRequest("http://test.com/api?status=open&foo=bar");
      const filters = getFilterParams(req, ["status"]);
      expect(filters).toEqual({ status: "open" });
    });
  });

  describe("parseArrayParam", () => {
    it("parses comma separated string into array", () => {
      expect(parseArrayParam("a,b,c")).toEqual(["a", "b", "c"]);
      expect(parseArrayParam("")).toEqual([]);
      expect(parseArrayParam(null)).toEqual([]);
    });
  });

  describe("parseBooleanParam", () => {
    it("parses boolean strings correctly", () => {
      expect(parseBooleanParam("true")).toBe(true);
      expect(parseBooleanParam("false")).toBe(false);
      expect(parseBooleanParam(null, true)).toBe(true);
    });
  });

  describe("getClientIP", () => {
    it("extracts IP from headers", () => {
      const req = { headers: new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }) } as any;
      expect(getClientIP(req)).toBe("1.1.1.1");
    });
    it("returns unknown when no IP header exists", () => {
      const req = { headers: new Headers() } as any;
      expect(getClientIP(req)).toBe("unknown");
    });
  });

  describe("createAuditLogData", () => {
    it("creates audit log data correctly", () => {
      const req = { headers: new Headers({ "user-agent": "test-agent" }) } as any;
      const data = createAuditLogData(req, "u1", "action", "resource", "r1", { old: 1 }, { new: 2 });
      expect(data.user_id).toBe("u1");
      expect(data.action).toBe("action");
      expect(data.ip_address).toBe("unknown");
      expect(data.user_agent).toBe("test-agent");
    });
  });

  describe("formatErrorForLogging", () => {
    it("formats Error objects", () => {
      const err = new Error("Test Error");
      const req = { headers: new Headers() } as any;
      const str = formatErrorForLogging(err, "Context", req);
      expect(str).toContain("Context");
      expect(str).toContain("Test Error");
      expect(str).toContain("IP: unknown");
    });

    it("formats string errors", () => {
      const str = formatErrorForLogging("Test string", "Context");
      expect(str).toContain("Context - Test string");
    });

    it("formats unknown errors", () => {
      const str = formatErrorForLogging({ foo: "bar" }, "Context");
      expect(str).toContain("{\"foo\":\"bar\"}");
    });
  });

  describe("validateRequiredFields", () => {
    it("identifies missing fields", () => {
      const body = { name: "John" };
      const missing = validateRequiredFields(body, ["name", "email"]);
      expect(missing).toEqual(["email"]);
    });
  });

  describe("cleanObject", () => {
    it("removes null, undefined and empty strings", () => {
      const obj = { a: 1, b: null, c: undefined, d: "", e: 0 };
      expect(cleanObject(obj)).toEqual({ a: 1, e: 0 });
    });
  });
});
