import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DpdpConsentCard } from "@/components/dashboard/dpdp-consent-card";
import React from "react";

describe("DpdpConsentCard", () => {
  it("links to the in-app consent form when no mode is given", () => {
    // An older backend sends no mode at all - the original behaviour must hold.
    render(<DpdpConsentCard appl="test@example.com" />);

    const link = screen.getByRole("link", { name: /Go to Consent Form/i });
    expect(link).toHaveAttribute(
      "href",
      "/job_offer/consent?appl=test%40example.com",
    );
  });

  it("still honours a consent URL in the absence of a mode", () => {
    render(<DpdpConsentCard consentUrl="/job_offer/consent?appl=x" />);

    expect(screen.getByRole("link", { name: /Go to Consent Form/i })).toHaveAttribute(
      "href",
      "/job_offer/consent?appl=x",
    );
  });

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

  it("keeps following an absolute URL even when the backend reports no mode", () => {
    // Pre-existing behaviour: an absolute consent URL has always left the site.
    render(<DpdpConsentCard consentUrl="https://l.hffc.in/HFFCIN/legacy" />);

    expect(screen.getByRole("link", { name: /Go to Consent Form/i })).toHaveAttribute(
      "href",
      "https://l.hffc.in/HFFCIN/legacy",
    );
  });

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
