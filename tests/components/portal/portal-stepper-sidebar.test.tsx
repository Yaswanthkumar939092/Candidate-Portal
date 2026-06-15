import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortalStepperSidebar } from "@/components/portal/portal-stepper-sidebar";

// Render next/link as a plain anchor so we can assert href
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

const mockUseSurvey = vi.fn();
vi.mock("@/lib/hooks/useSurvey", () => ({
  useSurvey: () => mockUseSurvey(),
}));

describe("PortalStepperSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSurvey.mockReturnValue({ data: null, isLoading: false, error: null });
  });

  describe("Dynamic steps (from survey data)", () => {
    it("renders dynamic steps with mapped icons, statuses, links, and next step label", () => {
      mockUseSurvey.mockReturnValue({
        data: {
          current_step: "offer",
          next_step: "onboarding",
          steps: [
            { key: "survey", label: "Survey", status: "completed", redirect_url: "/survey" },
            { key: "offer", label: "Offer Preview", status: "ongoing", redirect_url: "/job_offer" },
            { key: "onboarding", label: "Onboarding", status: "pending", redirect_url: "/onboarding" },
            // generic key matches none of the icon conditions (default icon path)
            { key: "documents", label: "Documents", status: "pending", redirect_url: "" },
          ],
        },
        isLoading: false,
        error: null,
      });

      render(<PortalStepperSidebar currentStep="offer" />);

      // Labels rendered
      expect(screen.getByText("Survey")).toBeTruthy();
      expect(screen.getByText("Offer Preview")).toBeTruthy();

      // Status pills derived correctly
      expect(screen.getByText("COMPLETED")).toBeTruthy(); // survey: completed & not current
      expect(screen.getByText("ONGOING")).toBeTruthy(); // offer: current step
      expect(screen.getAllByText("PENDING").length).toBeGreaterThanOrEqual(2); // onboarding + documents

      // generic-key step renders with default icon
      expect(screen.getByText("Documents")).toBeTruthy();

      // redirect_url renders Link (anchor) with href
      const surveyLink = screen.getByText("Survey").closest("a");
      expect(surveyLink).toBeTruthy();
      expect(surveyLink?.getAttribute("href")).toBe("/survey");

      // no redirect_url → not an anchor
      expect(screen.getByText("Documents").closest("a")).toBeNull();

      // next_step matches a step → uses that step's label
      const onboardingMatches = screen.getAllByText("Onboarding");
      expect(onboardingMatches.length).toBeGreaterThanOrEqual(2); // step label + next step card
    });

    it("marks a step ongoing when its key equals current_step even if status is not ongoing", () => {
      mockUseSurvey.mockReturnValue({
        data: {
          current_step: "onboarding",
          next_step: null,
          steps: [
            { key: "onboarding", label: "Onboarding", status: "pending", redirect_url: "" },
          ],
        },
        isLoading: false,
        error: null,
      });

      // currentStep is "survey" so isCurrentStepPage is false, forcing the
      // `apiStep.key === data.current_step` branch to drive ONGOING.
      render(<PortalStepperSidebar currentStep="survey" />);

      expect(screen.getByText("ONGOING")).toBeTruthy();
      // No redirect_url → rendered as a div, not an anchor
      expect(screen.getByText("Onboarding").closest("a")).toBeNull();
    });

    it("falls back to next_step key when it does not match any step", () => {
      mockUseSurvey.mockReturnValue({
        data: {
          current_step: "survey",
          next_step: "Portal Completion",
          steps: [
            { key: "survey", label: "Survey", status: "ongoing", redirect_url: "" },
          ],
        },
        isLoading: false,
        error: null,
      });

      render(<PortalStepperSidebar currentStep="survey" />);

      // next_step has no matching step → raw next_step string is shown
      expect(screen.getByText("Portal Completion")).toBeTruthy();
    });
  });

  describe("Static fallback (no survey data)", () => {
    it("renders the three static steps and next-step text for the survey page", () => {
      render(<PortalStepperSidebar currentStep="survey" />);

      expect(screen.getByText("Survey")).toBeTruthy();
      expect(screen.getByText("Onboarding")).toBeTruthy();

      // survey is ongoing, offer pending, onboarding pending
      expect(screen.getByText("ONGOING")).toBeTruthy();

      // "Offer Preview" appears as a step label and as the next-step text
      const offerMatches = screen.getAllByText("Offer Preview");
      expect(offerMatches.length).toBeGreaterThanOrEqual(2);
    });

    it("computes next-step text for the offer and onboarding pages", () => {
      const { rerender } = render(<PortalStepperSidebar currentStep="offer" />);
      // "Onboarding" appears as the step label and as the next-step text
      expect(screen.getAllByText("Onboarding").length).toBeGreaterThanOrEqual(2);

      rerender(<PortalStepperSidebar currentStep="onboarding" />);
      expect(screen.getByText("Portal Completion")).toBeTruthy();
    });

    it("applies a custom className", () => {
      const { container } = render(
        <PortalStepperSidebar currentStep="survey" className="custom-test-class" />,
      );
      expect(container.querySelector(".custom-test-class")).toBeTruthy();
    });
  });
});
