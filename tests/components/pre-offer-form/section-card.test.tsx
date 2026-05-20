import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionCard } from "@/components/pre-offer-form/section-card";

describe("SectionCard", () => {
  it("renders children correctly", () => {
    render(
      <SectionCard>
        <div data-testid="child">Child Content</div>
      </SectionCard>
    );
    expect(screen.getByTestId("child")).toBeTruthy();
    expect(screen.getByText("Child Content")).toBeTruthy();
  });

  it("renders the title when provided", () => {
    render(
      <SectionCard title="Testing Title">
        <div>Content</div>
      </SectionCard>
    );
    expect(screen.getByText("Testing Title")).toBeTruthy();
  });

  it("does not render CardHeader when title is not provided", () => {
    const { container } = render(
      <SectionCard>
        <div>Content</div>
      </SectionCard>
    );
    const header = container.querySelector(".pt-2.px-6");
    expect(header).toBeNull();
  });

  it("applies custom className", () => {
    const { container } = render(
      <SectionCard className="custom-test-class">
        <div>Content</div>
      </SectionCard>
    );
    expect(container.firstChild).toHaveClass("custom-test-class");
  });
});
