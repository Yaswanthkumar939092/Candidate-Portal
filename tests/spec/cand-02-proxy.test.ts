import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import * as route from "@/app/backend/[...path]/route"

let sent: { url: string; init: RequestInit & { duplex?: string } } | null = null
const realFetch = globalThis.fetch

beforeEach(() => {
  sent = null
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe.example.invalid:8000")
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    sent = { url: String(input), init: init as RequestInit & { duplex?: string } }
    return new Response("upstream body", {
      status: 201,
      statusText: "Created",
      headers: [["content-type", "text/plain"], ["set-cookie", "a=1; Path=/"], ["x-frappe-cmd", "test"], ["connection", "close"], ["content-encoding", "gzip"], ["content-length", "13"]],
    })
  }) as typeof fetch
})

afterEach(() => {
  vi.unstubAllEnvs()
  globalThis.fetch = realFetch
})

function call(handler: (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => Promise<Response>, url: string, path: string[], init?: RequestInit) {
  return handler(new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]), { params: Promise.resolve({ path }) })
}

describe("/backend proxy request side", () => {
  // Spec: CAND-02-A3.1A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a3-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("forwards the cookie and other client headers, drops host and hop-by-hop headers, and sets Host and X-Frappe-Site-Name from FRAPPE_BASE_URL", async () => {
    await call(route.POST, "http://portal.example.invalid/backend/api/method/x", ["api", "method", "x"], {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: {
        cookie: "candidate_portal_session=TEST",
        "x-custom": "kept",
        "x-forwarded-for": "10.0.0.1",
        "x-forwarded-host": "portal.example.invalid",
        "x-forwarded-proto": "https",
        "proxy-authorization": "Basic dGVzdA==",
        "content-type": "application/json",
      },
    })
    const h = new Headers(sent!.init.headers)
    expect(h.get("cookie")).toBe("candidate_portal_session=TEST")
    expect(h.get("x-custom")).toBe("kept")
    expect(h.get("content-type")).toBe("application/json")
    for (const dropped of ["x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "proxy-authorization"]) expect(h.get(dropped)).toBeNull()
    expect(h.get("host")).toBe("frappe.example.invalid:8000")
    expect(h.get("x-frappe-site-name")).toBe("frappe.example.invalid")
  })

  // Spec: CAND-02-A3.1B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a3-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("streams the body with duplex half for POST and sends no body for GET and HEAD, with manual redirects and no caching", async () => {
    await call(route.POST, "http://portal.example.invalid/backend/a", ["a"], { method: "POST", body: "payload" })
    expect(sent!.init.method).toBe("POST")
    expect(sent!.init.body).toBeTruthy()
    expect(sent!.init.duplex).toBe("half")
    expect(sent!.init.redirect).toBe("manual")
    expect(sent!.init.cache).toBe("no-store")

    for (const [handler, method] of [[route.GET, "GET"], [route.HEAD, "HEAD"]] as const) {
      await call(handler, "http://portal.example.invalid/backend/a?q=1", ["a"], { method })
      expect(sent!.init.method).toBe(method)
      expect(sent!.init.body).toBeUndefined()
      expect("duplex" in sent!.init).toBe(false)
      expect(sent!.url).toBe("http://frappe.example.invalid:8000/a?q=1")
    }
  })

  // Spec: CAND-02-A3.1C (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a3-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("exports one handler for each of GET, POST, PUT, PATCH, DELETE, OPTIONS and HEAD and no path allowlist", async () => {
    for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const) expect(typeof route[m]).toBe("function")
    expect(route.runtime).toBe("nodejs")
    expect(route.dynamic).toBe("force-dynamic")
    await call(route.GET, "http://portal.example.invalid/backend/api/method/frappe.utils.some_anything", ["api", "method", "frappe.utils.some_anything"], { method: "GET" })
    expect(sent!.url).toBe("http://frappe.example.invalid:8000/api/method/frappe.utils.some_anything")
  })
})

describe("/backend proxy response side", () => {
  // Spec: CAND-02-A3.2A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a3-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("returns the upstream status, statusText and body, passes set-cookie and other headers, and drops hop-by-hop, content-encoding and content-length", async () => {
    const res = await call(route.GET, "http://portal.example.invalid/backend/a", ["a"], { method: "GET" })
    expect(res.status).toBe(201)
    expect(res.statusText).toBe("Created")
    expect(await res.text()).toBe("upstream body")
    expect(res.headers.get("set-cookie")).toBe("a=1; Path=/")
    expect(res.headers.get("x-frappe-cmd")).toBe("test")
    expect(res.headers.get("content-type")).toBe("text/plain")
    expect(res.headers.get("connection")).toBeNull()
    expect(res.headers.get("content-encoding")).toBeNull()
    expect(res.headers.get("content-length")).toBeNull()
  })

  // Spec: CAND-02-A3.2B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a3-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("answers 502 with a fixed JSON body when the upstream fetch throws and does not follow upstream redirects", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as typeof fetch
    const res = await call(route.GET, "http://portal.example.invalid/backend/a", ["a"], { method: "GET" })
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: "Backend request failed" })

    globalThis.fetch = vi.fn(async () => new Response(null, { status: 302, headers: { location: "http://elsewhere.example.invalid/" } })) as typeof fetch
    const redirected = await call(route.GET, "http://portal.example.invalid/backend/a", ["a"], { method: "GET" })
    expect(redirected.status).toBe(302)
    expect(redirected.headers.get("location")).toBe("http://elsewhere.example.invalid/")
  })
})
