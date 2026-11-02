import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InfoCard } from "@/components/dashboard/info-card";
import { Calendar } from "lucide-react";

describe("InfoCard", () => {
  // Spec: CAND-04-A3.5A (docs/spec/clauses/04-dashboard.md#cand-04-a3-5a)
  it("renders with basic props correctly", () => {
    render(
      <InfoCard 
        icon={<Calendar data-testid="icon" />}
        label="Joining Date"
        value="Mon, 8 Sep 2025"
      />
    );
    
    expect(screen.getByText("Joining Date")).toBeTruthy();
    expect(screen.getByText("Mon, 8 Sep 2025")).toBeTruthy();
    expect(screen.getByTestId("icon")).toBeTruthy();
  });

  // Spec: CAND-04-A3.5B (docs/spec/clauses/04-dashboard.md#cand-04-a3-5b)
  it("renders with subtitle when provided", () => {
    render(
      <InfoCard 
        icon={<Calendar />}
        label="Joining Date"
        value="Mon, 8 Sep 2025"
        subtitle="Remote"
      />
    );
    
    expect(screen.getByText("Remote")).toBeTruthy();
  });

  // Spec: CAND-04-A3.5C (docs/spec/clauses/04-dashboard.md#cand-04-a3-5c)
  it("renders with tag and correct variant classes", () => {
    const { rerender } = render(
      <InfoCard 
        icon={<Calendar />}
        label="Joining Date"
        value="Mon, 8 Sep 2025"
        tag="Full Time"
        tagVariant="default"
      />
    );
    
    expect(screen.getByText("Full Time")).toBeTruthy();
    expect(screen.getByText("Full Time").className).toContain("bg-muted");

    rerender(
      <InfoCard 
        icon={<Calendar />}
        label="Joining Date"
        value="Mon, 8 Sep 2025"
        tag="Tomorrow"
        tagVariant="brand"
      />
    );
    expect(screen.getByText("Tomorrow").className).toContain("text-accent-foreground");

    rerender(
      <InfoCard 
        icon={<Calendar />}
        label="Joining Date"
        value="Mon, 8 Sep 2025"
        tag="View Details"
        tagVariant="link"
      />
    );
    expect(screen.getByText("View Details").className).toContain("cursor-pointer");
  });
});
