import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DpdpConsentCard } from "@/components/dashboard/dpdp-consent-card";
import React from "react";

describe("DpdpConsentCard", () => {
  // Spec: CAND-04-A5.1A (docs/spec/clauses/04-dashboard.md#cand-04-a5-1a)
  it("links to the in-app consent form when no mode is given", () => {
    // An older backend sends no mode at all - the original behaviour must hold.
    render(<DpdpConsentCard appl="test@example.com" />);

    const link = screen.getByRole("link", { name: /Go to Consent Form/i });
    expect(link).toHaveAttribute(
      "href",
      "/job_offer/consent?appl=test%40example.com",
    );
  });

  // Spec: CAND-04-A5.1B (docs/spec/clauses/04-dashboard.md#cand-04-a5-1b)
  it("still honours a consent URL in the absence of a mode", () => {
    render(<DpdpConsentCard consentUrl="/job_offer/consent?appl=x" />);

    expect(screen.getByRole("link", { name: /Go to Consent Form/i })).toHaveAttribute(
      "href",
      "/job_offer/consent?appl=x",
    );
  });

  // Spec: CAND-04-A5.1C (docs/spec/clauses/04-dashboard.md#cand-04-a5-1c)
  it("sends the candidate off-site in External Portal mode", () => {
    render(
      <DpdpConsentCard
        consentMode="External Portal"
        consentUrl="https://l.hffc.in/HFFCIN/gqsPk"
        appl="test@example.com"
      />,
    );

    const link = screen.getByRole("link", { name: /Continue to Consent Portal/i });
    expect(link).toHaveAttribute("href", "https://l.hffc.in/HFFCIN/gqsPk");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  // Spec: CAND-04-A5.1D (docs/spec/clauses/04-dashboard.md#cand-04-a5-1d)
  it("keeps following an absolute URL even when the backend reports no mode", () => {
    // Pre-existing behaviour: an absolute consent URL has always left the site.
    render(<DpdpConsentCard consentUrl="https://l.hffc.in/HFFCIN/legacy" />);

    expect(screen.getByRole("link", { name: /Go to Consent Form/i })).toHaveAttribute(
      "href",
      "https://l.hffc.in/HFFCIN/legacy",
    );
  });

  // Spec: CAND-04-A5.1E (docs/spec/clauses/04-dashboard.md#cand-04-a5-1e)
  it("falls back to the in-app route when the external link is unusable", () => {
    // The in-app consent page re-issues a session rather than dead-ending.
    render(
      <DpdpConsentCard
        consentMode="External Portal"
        consentUrl={undefined}
        appl="test@example.com"
      />,
    );

    expect(screen.getByRole("link", { name: /Go to Consent Form/i })).toHaveAttribute(
      "href",
      "/job_offer/consent?appl=test%40example.com",
    );
  });

  // Spec: CAND-04-A5.1F (docs/spec/clauses/04-dashboard.md#cand-04-a5-1f)
  it("does not navigate to a script-bearing consent URL", () => {
    render(
      <DpdpConsentCard
        consentMode="External Portal"
        consentUrl={"javascript:alert(1)" as string}
        appl="test@example.com"
      />,
    );

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).not.toContain("javascript:");
  });
});
