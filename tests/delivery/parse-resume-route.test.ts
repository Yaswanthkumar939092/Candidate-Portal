import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pdfMock = vi.fn();
vi.mock("pdf-parse/lib/pdf-parse.js", () => ({ default: (...a: unknown[]) => pdfMock(...a) }));

import { POST } from "@/app/api/parse-resume/route";

const LIB_TEXT = /Invalid PDF structure|pdf-parse|Expected multipart|Content-Type|FormData|stack|at /i;
const pdfBytes = (extra = 0) => new Uint8Array([...Buffer.from("%PDF-1.4\n"), ...new Uint8Array(extra)]);

type Part = Uint8Array | string;

function fakeFile(parts: Part[]) {
  const buf = Buffer.concat(parts.map((p) => Buffer.from(p)));
  return { size: buf.length, name: "resume.pdf", arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) };
}

function multipart(parts?: Part[]) {
  const file = parts ? fakeFile(parts) : null;
  return { formData: async () => ({ get: (k: string) => (k === "file" ? file : null) }) } as unknown as Request;
}

async function expectGeneric(res: Response, status: number) {
  expect(res.status).toBe(status);
  const body = await res.json();
  expect(Object.keys(body)).toEqual(["error"]);
  expect(String(body.error)).not.toMatch(LIB_TEXT);
}

beforeEach(() => {
  pdfMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("POST /api/parse-resume fails closed with generic bodies", () => {
  it("400 for a non-multipart body, with no framework text", async () => {
    const res = await POST({ formData: async () => { throw new TypeError("Content-Type was not one of multipart/form-data"); } } as unknown as Request);
    await expectGeneric(res, 400);
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it("400 when no file is sent", async () => {
    await expectGeneric(await POST(multipart()), 400);
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it("400 for an empty file", async () => {
    await expectGeneric(await POST(multipart([])), 400);
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it("400 for a text file labelled as a PDF (magic bytes checked before the parser)", async () => {
    await expectGeneric(await POST(multipart(["not a pdf at all"])), 400);
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it("413 for a file over 2 MB", async () => {
    await expectGeneric(await POST(multipart([pdfBytes(2 * 1024 * 1024 + 1)])), 413);
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it("generic 500 when the parser throws, and the real error stays in the server log", async () => {
    pdfMock.mockRejectedValue(new Error("Invalid PDF structure secret-lib-detail"));
    const res = await POST(multipart([pdfBytes(10)]));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["error"]);
    expect(JSON.stringify(body)).not.toMatch(/secret-lib-detail|Invalid PDF/);
    expect(console.error).toHaveBeenCalled();
  });

  it("still returns the text for a valid PDF", async () => {
    pdfMock.mockResolvedValue({ text: "Hello CV" });
    const res = await POST(multipart([pdfBytes(10)]));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: "Hello CV" });
  });
});
