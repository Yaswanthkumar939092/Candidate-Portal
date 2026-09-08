import { describe, it, expect } from "vitest";
import {
  buildConsentQuery,
  buildConsentPath,
  isSafeExternalConsentUrl,
  resolveConsentOnwardUrl,
  CONSENT_FORM_PATH,
  CONSENT_ONWARD_PATH,
} from "@/lib/utils/dpdp-consent";

describe("buildConsentQuery", () => {
  it("carries appl and token through the journey", () => {
    expect(buildConsentQuery("a@b.com", "tok")).toBe("appl=a%40b.com&token=tok");
  });

  it("omits missing values rather than sending empty params", () => {
    expect(buildConsentQuery("a@b.com")).toBe("appl=a%40b.com");
    expect(buildConsentQuery(null, null)).toBe("");
  });
});

describe("buildConsentPath", () => {
  it("appends the query when there is one", () => {
    expect(buildConsentPath(CONSENT_FORM_PATH, "a@b.com", "tok")).toBe(
      "/job_offer/consent?appl=a%40b.com&token=tok",
    );
  });

  it("leaves a bare path alone when there is nothing to append", () => {
    expect(buildConsentPath(CONSENT_FORM_PATH)).toBe("/job_offer/consent");
  });
});

describe("isSafeExternalConsentUrl", () => {
  it("accepts absolute http(s) links", () => {
    expect(isSafeExternalConsentUrl("https://l.hffc.in/HFFCIN/gqsPk")).toBe(true);
    expect(isSafeExternalConsentUrl("http://uat.example.com/consent")).toBe(true);
  });

  it("rejects anything that isn't a usable absolute link", () => {
    expect(isSafeExternalConsentUrl(null)).toBe(false);
    expect(isSafeExternalConsentUrl(undefined)).toBe(false);
    expect(isSafeExternalConsentUrl("")).toBe(false);
    expect(isSafeExternalConsentUrl("/job_offer/consent")).toBe(false);
  });

  it("rejects script-bearing schemes", () => {
    expect(isSafeExternalConsentUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalConsentUrl("data:text/html,<h1>x</h1>")).toBe(false);
  });
});

describe("resolveConsentOnwardUrl", () => {
  it("prefers the backend's redirect URL when it is usable", () => {
    expect(
      resolveConsentOnwardUrl("https://hr.example.com/action-center", "a@b.com"),
    ).toEqual({ url: "https://hr.example.com/action-center", isExternal: true });
  });

  it("keeps the candidate in the portal when there is no usable redirect", () => {
    expect(resolveConsentOnwardUrl(null, "a@b.com", "tok")).toEqual({
      url: `${CONSENT_ONWARD_PATH}?appl=a%40b.com&token=tok`,
      isExternal: false,
    });
  });

  it("does not follow an unsafe redirect value", () => {
    expect(resolveConsentOnwardUrl("javascript:alert(1)", "a@b.com").isExternal).toBe(
      false,
    );
  });
});
