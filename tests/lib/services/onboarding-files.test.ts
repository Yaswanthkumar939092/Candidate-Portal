import { describe, it, expect, vi, beforeEach } from "vitest";
import { myOnboardingFileUrl, uploadMyOnboardingFile } from "@/lib/services/onboarding-files";

const fetchMock = vi.fn();

function reply(status: number, body: unknown) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);
}

describe("uploadMyOnboardingFile", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("posts the file and its field to the candidate endpoint with the session cookie", async () => {
    fetchMock.mockReturnValue(reply(200, { message: { file_url: "/private/files/pan.png", file_name: "pan.png" } }));
    const res = await uploadMyOnboardingFile(new File(["x"], "pan.png"), "pan_card");
    expect(res.file_url).toBe("/private/files/pan.png");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("recruitment.api.onboarding_files.upload_my_onboarding_file");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    const body = init.body as FormData;
    expect(body.get("fieldname")).toBe("pan_card");
    expect((body.get("file") as File).name).toBe("pan.png");
  });

  it("surfaces the server's message when the upload is refused", async () => {
    fetchMock.mockReturnValue(
      reply(417, { _server_messages: JSON.stringify([JSON.stringify({ message: "This field cannot be changed now." })]) }),
    );
    await expect(uploadMyOnboardingFile(new File(["x"], "a.png"), "form_16")).rejects.toThrow(
      "This field cannot be changed now.",
    );
  });
});

describe("myOnboardingFileUrl", () => {
  it("routes a private file through the candidate download endpoint", () => {
    const url = myOnboardingFileUrl("/private/files/pan card.png");
    expect(url).toContain("recruitment.api.onboarding_files.download_my_onboarding_file?");
    expect(url).toContain("file_url=%2Fprivate%2Ffiles%2Fpan+card.png");
  });

  it("links a public file or full URL as before", () => {
    expect(myOnboardingFileUrl("/files/old.png")).toMatch(/\/files\/old\.png$/);
    expect(myOnboardingFileUrl("https://cdn.example.com/a.pdf")).toBe("https://cdn.example.com/a.pdf");
  });
});
