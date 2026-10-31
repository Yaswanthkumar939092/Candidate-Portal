import { afterEach, describe, expect, it, vi } from "vitest"
import { frappeApiBase, FRAPPE_PROXY_PREFIX } from "@/lib/frappe-base"
import { frappeErrorMessage } from "@/lib/frappe-error"
import { FrappeAPI } from "@/lib/frappe-api"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("frappeApiBase on the server", () => {
  // Spec: CAND-02-A1.1A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a1-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("returns the runtime FRAPPE_BASE_URL, else NEXT_PUBLIC_FRAPPE_URL, without a trailing slash", () => {
    vi.stubGlobal("window", undefined)
    expect(typeof window).toBe("undefined")
    vi.stubEnv("FRAPPE_BASE_URL", "http://runtime.example.invalid:8000/")
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://public.example.invalid/")
    expect(frappeApiBase()).toBe("http://runtime.example.invalid:8000")

    vi.stubEnv("FRAPPE_BASE_URL", "")
    expect(frappeApiBase()).toBe("http://public.example.invalid")

    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "")
    expect(frappeApiBase()).toBe("")
    expect(FRAPPE_PROXY_PREFIX).toBe("/backend")
  })
})

describe("frappeApiBase in the browser", () => {
  // Spec: CAND-02-A1.1B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a1-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("returns the same-origin /backend prefix whatever the environment names", () => {
    vi.stubEnv("FRAPPE_BASE_URL", "http://runtime.example.invalid:8000")
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://public.example.invalid")
    expect(typeof window).toBe("object")
    expect(frappeApiBase()).toBe("/backend")
  })
})

describe("frappeErrorMessage", () => {
  // Spec: CAND-02-A1.2A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a1-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("joins _server_messages with markup stripped, else strips the exception class, else returns the fallback", () => {
    const server = JSON.stringify([
      JSON.stringify({ message: "<b>First</b> problem" }),
      "plain second",
      JSON.stringify({ message: "   " }),
    ])
    expect(frappeErrorMessage({ _server_messages: server }, "fb")).toBe("First problem\nplain second")
    expect(frappeErrorMessage({ _server_messages: "not json", exception: "frappe.exceptions.ValidationError: Bad value" }, "fb")).toBe("Bad value")
    expect(frappeErrorMessage({ _server_messages: JSON.stringify([JSON.stringify({ message: " " })]), exception: "Plain text" }, "fb")).toBe("Plain text")
    expect(frappeErrorMessage({}, "fb")).toBe("fb")
    expect(frappeErrorMessage(null, "fb")).toBe("fb")
  })
})

describe("FrappeAPI error text", () => {
  function failWith(status: number, statusText: string, body: unknown, json = true) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status,
      statusText,
      json: json ? () => Promise.resolve(body) : () => Promise.reject(new Error("not json")),
    }))
  }

  // Spec: CAND-02-A1.3A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a1-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("prefers message.message, then message, then the Frappe parser, then a status-based fallback", async () => {
    failWith(400, "Bad Request", { message: { message: "nested text" } })
    await expect(FrappeAPI.get("m")).rejects.toThrow("nested text")

    failWith(400, "Bad Request", { message: "top text", _server_messages: JSON.stringify([JSON.stringify({ message: "ignored" })]) })
    await expect(FrappeAPI.post("m", {})).rejects.toThrow("top text")

    failWith(417, "Expectation Failed", { message: "   ", exception: "x.Y: from exception" })
    await expect(FrappeAPI.get("m")).rejects.toThrow("from exception")

    failWith(500, "Internal Server Error", "<html>", false)
    await expect(FrappeAPI.get("m")).rejects.toThrow("API request failed: Internal Server Error")

    failWith(502, "", "<html>", false)
    await expect(FrappeAPI.get("m")).rejects.toThrow("API request failed (502)")
  })

  // Spec: CAND-02-A1.3B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a1-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("sends POST bodies as JSON, GET params in the query, and every request with credentials include", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: { ok: 1 } }) })
    vi.stubGlobal("fetch", fetchMock)

    await FrappeAPI.get("a.b.c", { x: "1 2", y: "z" })
    await FrappeAPI.post("a.b.c", { n: 1 })
    await FrappeAPI.getResource("Job Opening", { "filters[0]": "v" })

    expect(fetchMock.mock.calls[0][0]).toBe("/backend/api/method/a.b.c?x=1+2&y=z")
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: '{"n":1}' })
    expect(fetchMock.mock.calls[2][0]).toBe("/backend/api/resource/Job Opening?filters[0]=v")
    for (const call of fetchMock.mock.calls) expect(call[1].credentials).toBe("include")
  })

  // Spec: CAND-02-A1.3C (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a1-3c)
  // Characterization: pins current behaviour, not endorsed.
  it("getresourceDocumentData serialises fields and filters as JSON and does not unwrap the response", async () => {
    const reply = { data: [{ name: "REQ-TEST-1" }] }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(reply) })
    vi.stubGlobal("fetch", fetchMock)

    const out = await FrappeAPI.getresourceDocumentData("Candidate Raise Request", {
      fields: ["name"],
      filters: [["candidate_email", "=", "cand@example.invalid"]],
      page: 3,
      limit: 5,
    })
    expect(out).toBe(reply)
    const raw: string = fetchMock.mock.calls[0][0]
    expect(raw.startsWith("/backend/api/resource/Candidate Raise Request?")).toBe(true)
    const url = new URL(raw, "http://x.invalid")
    expect(url.searchParams.get("fields")).toBe('["name"]')
    expect(url.searchParams.get("filters")).toBe('[["candidate_email","=","cand@example.invalid"]]')
    expect(url.searchParams.get("limit_page_length")).toBe("5")
    expect(url.searchParams.get("limit_start")).toBe("10")
  })

  // Spec: CAND-02-A1.3D (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a1-3d)
  // Characterization: pins current behaviour, not endorsed.
  it("uploadFile posts multipart form data with file, doctype and docname and returns message, and getBlob returns the response blob", async () => {
    const blob = new Blob(["x"])
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: { file_url: "/files/a.txt" } }) })
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(blob) })
    vi.stubGlobal("fetch", fetchMock)

    const file = new File(["x"], "a.txt")
    expect(await FrappeAPI.uploadFile(file, "DOC-TEST-1", "Job Applicant")).toEqual({ file_url: "/files/a.txt" })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/backend/api/method/upload_file")
    expect(init).toMatchObject({ method: "POST", credentials: "include" })
    expect((init.body as FormData).get("docname")).toBe("DOC-TEST-1")
    expect((init.body as FormData).get("doctype")).toBe("Job Applicant")
    expect((init.body as FormData).get("file")).toBeInstanceOf(File)
    expect(init.headers).toBeUndefined()

    expect(await FrappeAPI.getBlob("a.b.pdf", { appl: "X" })).toBe(blob)
    expect(fetchMock.mock.calls[1][0]).toBe("/backend/api/method/a.b.pdf?appl=X")
  })
})
