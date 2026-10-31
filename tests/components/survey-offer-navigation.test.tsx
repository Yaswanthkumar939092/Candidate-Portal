import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SurveyOfferNavigation } from "@/components/portal/survey-offer-navigation"

vi.mock("@/components/portal/portal-navigation", () => ({
  PortalNavigation: ({ hideNavLinks }: { hideNavLinks?: boolean }) => (
    <div data-testid="portal-navigation" data-hide-nav-links={hideNavLinks ? "true" : "false"}>
      Portal Navigation Mock
    </div>
  ),
}))

describe("SurveyOfferNavigation", () => {
  // Spec: CAND-04-A8.5A (docs/spec/clauses/04-dashboard.md#cand-04-a8-5a)
  it("renders PortalNavigation with hideNavLinks=true", () => {
    render(<SurveyOfferNavigation />);
    const nav = screen.getByTestId("portal-navigation");
    expect(nav).toBeTruthy();
    expect(nav.getAttribute("data-hide-nav-links")).toBe("true");
  });
});
