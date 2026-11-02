import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionCard } from "@/components/onboarding/section-card";

describe("SectionCard", () => {
  // Spec: CAND-06-A1.1A (docs/spec/clauses/06-onboarding-components.md#cand-06-a1-1a)
  it("renders children correctly", () => {
    render(
      <SectionCard>
        <div data-testid="child">Child Content</div>
      </SectionCard>
    );
    expect(screen.getByTestId("child")).toBeTruthy();
    expect(screen.getByText("Child Content")).toBeTruthy();
  });

  // Spec: CAND-06-A1.1B (docs/spec/clauses/06-onboarding-components.md#cand-06-a1-1b)
  it("renders the title when provided", () => {
    render(
      <SectionCard title="Testing Title">
        <div>Content</div>
      </SectionCard>
    );
    expect(screen.getByText("Testing Title")).toBeTruthy();
  });

  // Spec: CAND-06-A1.1C (docs/spec/clauses/06-onboarding-components.md#cand-06-a1-1c)
  it("does not render CardHeader when title is not provided", () => {
    const { container } = render(
      <SectionCard>
        <div>Content</div>
      </SectionCard>
    );
    // CardHeader usually has a specific class or check if the title text is absent
    const header = container.querySelector(".pt-2.px-6");
    expect(header).toBeNull();
  });

  // Spec: CAND-06-A1.1D (docs/spec/clauses/06-onboarding-components.md#cand-06-a1-1d)
  it("applies custom className", () => {
    const { container } = render(
      <SectionCard className="custom-test-class">
        <div>Content</div>
      </SectionCard>
    );
    expect(container.firstChild).toHaveClass("custom-test-class");
  });
});
