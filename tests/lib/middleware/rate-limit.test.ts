import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { RateLimiter, InMemoryRateLimitStore, withRateLimit, RedisRateLimitStore, dynamicRateLimit, DynamicRateLimiter, WhitelistRateLimiter, createFileUploadRateLimit, createSearchRateLimit, createAPIKeyRateLimit, strictRateLimit, apiRateLimit, authRateLimit, uploadRateLimit } from "@/lib/middleware/rate-limit";

describe("Rate Limit Middleware", () => {
  let store: InMemoryRateLimitStore;

  beforeEach(() => {
    store = new InMemoryRateLimitStore();
  });

  afterEach(() => {
    store.destroy();
  });

  describe("InMemoryRateLimitStore", () => {
    it("increments count correctly", () => {
      const key = "test-key";
      const windowMs = 1000;
      
      const first = store.increment(key, windowMs);
      expect(first.count).toBe(1);
      
      const second = store.increment(key, windowMs);
      expect(second.count).toBe(2);
    });

    it("resets after window expires", async () => {
      const key = "test-key";
      const windowMs = 10; // 10ms
      
      store.increment(key, windowMs);
      await new Promise(r => setTimeout(r, 20));
      
      const next = store.increment(key, windowMs);
      expect(next.count).toBe(1);
    });
  });

  describe("RateLimiter", () => {
    it("allows requests within maxRequests", async () => {
      const limiter = new RateLimiter({ maxRequests: 2 }, store);
      const req = { url: "http://test.com/api", headers: { get: () => "1.1.1.1" } } as any;

      const r1 = await limiter.checkLimit(req);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(1);

      const r2 = await limiter.checkLimit(req);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(0);

      const r3 = await limiter.checkLimit(req);
      expect(r3.allowed).toBe(false);
    });
    it("calls onLimitReached when limit exceeded", async () => {
      const onLimitReached = vi.fn();
      const limiter = new RateLimiter({ maxRequests: 1, onLimitReached }, store);
      const req = { url: "http://test.com/api", headers: { get: () => "1.1.1.1" } } as any;

      await limiter.checkLimit(req); // 1
      await limiter.checkLimit(req); // 2
      expect(onLimitReached).toHaveBeenCalled();
    });

    it("generates custom key", async () => {
      const limiter = new RateLimiter({ keyGenerator: () => "custom" }, store);
      const req = { url: "http://test.com/api", headers: { get: () => "1.1.1.1" } } as any;
      await limiter.checkLimit(req);
      expect(store.get("custom")).toBeTruthy();
    });

    it("resets key", () => {
      const limiter = new RateLimiter({ keyGenerator: () => "custom" }, store);
      const req = { url: "http://test.com/api", headers: { get: () => "1.1.1.1" } } as any;
      limiter.reset(req); // resets even if missing
    });
  });

  describe("withRateLimit", () => {
    it("returns 429 when limit exceeded", async () => {
      const limiter = new RateLimiter({ maxRequests: 1 }, store);
      const req = { url: "http://test.com/api", headers: { get: () => "1.1.1.1" } } as any;
      const handler = vi.fn().mockResolvedValue(new Response("ok"));

      await withRateLimit(limiter)(req, handler); // 1st request
      const response = await withRateLimit(limiter)(req, handler); // 2nd request

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toBe("Rate limit exceeded");
    });

    it("skips rate limiting headers if skipSuccessfulRequests is true", async () => {
      const limiter = new RateLimiter({ maxRequests: 10 }, store);
      const req = { url: "http://test.com/api", headers: { get: () => "1.1.1.1" } } as any;
      const handler = vi.fn().mockResolvedValue(new NextResponse("ok"));

      const response = await withRateLimit(limiter, { skipSuccessfulRequests: true })(req, handler);
      expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
    });

    it("continues if middleware throws error", async () => {
      const limiter = { checkLimit: vi.fn().mockRejectedValue(new Error("fail")) } as any;
      const req = { url: "http://test.com/api", headers: { get: () => "1.1.1.1" } } as any;
      const handler = vi.fn().mockResolvedValue(new NextResponse("ok"));
      
      const response = await withRateLimit(limiter)(req, handler);
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("RedisRateLimitStore", () => {
    it("falls back to in-memory store", () => {
      const redis = new RedisRateLimitStore();
      redis.set("k", { count: 1, resetTime: 2, firstRequest: 1 });
      expect(redis.get("k")?.count).toBe(1);
      redis.increment("k2", 1000);
      expect(redis.get("k2")?.count).toBe(1);
      redis.reset("k");
      expect(redis.get("k")).toBeUndefined();
      redis.destroy();
    });
  });

  describe("DynamicRateLimiter", () => {
    
    it("uses proper limiter based on user type", async () => {
      const req = { url: "http://test.com/api", headers: { get: () => "1.1.1.1" } } as any;
      const resultAnon = await dynamicRateLimit.checkLimit(req, "anonymous");
      expect(resultAnon.allowed).toBe(true);

      const resultAdmin = await dynamicRateLimit.checkLimit(req, "admin");
      expect(resultAdmin.allowed).toBe(true);
      
      expect(dynamicRateLimit.getLimiter("premium")).toBeTruthy();
    });
  });

  describe("WhitelistRateLimiter", () => {

    it("allows whitelisted IPs unconditionally", async () => {
      const limiter = new WhitelistRateLimiter({ maxRequests: 1 }, ["1.1.1.1"]);
      const req = { url: "http://test.com/api", headers: { get: () => "1.1.1.1" } } as any;
      
      const r1 = await limiter.checkLimit(req);
      const r2 = await limiter.checkLimit(req);
      expect(r2.allowed).toBe(true);

      expect(limiter.isWhitelisted("1.1.1.1")).toBe(true);
      limiter.removeFromWhitelist("1.1.1.1");
      expect(limiter.isWhitelisted("1.1.1.1")).toBe(false);

      limiter.addToWhitelist("2.2.2.2");
      expect(limiter.isWhitelisted("2.2.2.2")).toBe(true);
    });
  });

  describe("Utility limiters", () => {
    
    it("should instantiate without errors", () => {
      expect(createFileUploadRateLimit()).toBeTruthy();
      expect(createSearchRateLimit()).toBeTruthy();
      expect(createAPIKeyRateLimit("key1")).toBeTruthy();
      expect(strictRateLimit).toBeTruthy();
      expect(apiRateLimit).toBeTruthy();
      expect(authRateLimit).toBeTruthy();
      expect(uploadRateLimit).toBeTruthy();
    });
  });
});
