import { describe, it, expect, vi, beforeEach } from "vitest";
import { directApplicantFormService, frappeErrorMessage } from "@/lib/services/direct-applicant-form";

const fetchMock = vi.fn();

function reply(status: number, body: unknown) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);
}

describe("directApplicantFormService", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("getForm asks for the request by name with the session cookie", async () => {
    fetchMock.mockReturnValue(reply(200, { message: { form_title: "F", fields: [] } }));
    const data = await directApplicantFormService.getForm({ request: "DAFR-1" });
    expect(data.form_title).toBe("F");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("recruitment.api.direct_applicant_portal.get_my_form?request=DAFR-1");
    expect(init.credentials).toBe("include");
  });

  it("submit posts the data as a JSON string", async () => {
    fetchMock.mockReturnValue(reply(200, { message: { status: "ok" } }));
    await directApplicantFormService.submit({ request: "DAFR-1" }, { custom_pan_number: "ABCDE1234F" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("submit_my_form");
    expect(JSON.parse(init.body)).toEqual({ request: "DAFR-1", data: JSON.stringify({ custom_pan_number: "ABCDE1234F" }) });
  });

  it("uploadFile sends multipart with the table column when given", async () => {
    fetchMock.mockReturnValue(reply(200, { message: { file_url: "/private/files/a.pdf", file_name: "a.pdf" } }));
    const res = await directApplicantFormService.uploadFile({ request: "DAFR-1" }, "edu", new File(["x"], "a.pdf"), "proof");
    expect(res.file_url).toBe("/private/files/a.pdf");
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("request")).toBe("DAFR-1");
    expect(body.get("fieldname")).toBe("edu");
    expect(body.get("child_fieldname")).toBe("proof");
  });

  it("the emailed link uses the token endpoints, no session", async () => {
    fetchMock.mockReturnValue(reply(200, { message: { status: "ok" } }));
    await directApplicantFormService.getForm({ token: "tok" });
    expect(fetchMock.mock.calls[0][0]).toContain("direct_applicant_portal.get_form?t=tok");
    await directApplicantFormService.submit({ token: "tok" }, { a: 1 });
    expect(fetchMock.mock.calls[1][0]).toContain("direct_applicant_portal.submit_form");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ t: "tok", data: JSON.stringify({ a: 1 }) });
  });

  it("throws the server's own message", async () => {
    fetchMock.mockReturnValue(
      reply(403, { _server_messages: JSON.stringify([JSON.stringify({ message: "This form is not available." })]) })
    );
    await expect(directApplicantFormService.getForm({ request: "DAFR-9" })).rejects.toThrow("This form is not available.");
  });
});

describe("frappeErrorMessage", () => {
  it("strips html and joins messages", () => {
    const body = { _server_messages: JSON.stringify([JSON.stringify({ message: "<b>PAN</b> is required" })]) };
    expect(frappeErrorMessage(body, "x")).toBe("PAN is required");
  });
  it("falls back to the exception text, then the fallback", () => {
    expect(frappeErrorMessage({ exception: "frappe.exceptions.ValidationError: Bad" }, "x")).toBe("Bad");
    expect(frappeErrorMessage({}, "fallback")).toBe("fallback");
  });
});
