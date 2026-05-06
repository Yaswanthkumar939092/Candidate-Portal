import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ApplicationStageBadge } from "@/components/my-jobs/application-stage-badge"

describe("ApplicationStageBadge", () => {
  describe("All Stages Coverage", () => {
    const stages = ["pending", "reviewing", "interviewing", "offered", "rejected", "withdrawn"] as const
    const expectedLabels = ["Applied", "In Review", "Interview", "Offered", "Rejected", "Withdrawn"]

    stages.forEach((stage, index) => {
      it(`renders ${stage} stage with label "${expectedLabels[index]}"`, () => {
        render(<ApplicationStageBadge stage={stage} />)
        expect(screen.getByText(expectedLabels[index])).toBeTruthy()
      })
    })
  })

  describe("Custom className Prop", () => {
    it("accepts and applies custom className", () => {
      const { container } = render(
        <ApplicationStageBadge stage="pending" className="custom-class" />
      )
      expect(container.querySelector(".custom-class")).toBeTruthy()
      expect(screen.getByText("Applied")).toBeTruthy()
    })
  })

  describe("Multiple Badges", () => {
    it("renders multiple badges independently with different stages", () => {
      render(
        <div>
          <ApplicationStageBadge stage="pending" />
          <ApplicationStageBadge stage="offered" />
          <ApplicationStageBadge stage="rejected" />
        </div>
      )

      expect(screen.getByText("Applied")).toBeTruthy()
      expect(screen.getByText("Offered")).toBeTruthy()
      expect(screen.getByText("Rejected")).toBeTruthy()
    })
  })

  describe("Fallback Behavior", () => {
    it("defaults to pending style for unknown stage", () => {
      render(<ApplicationStageBadge stage="unknown" as any />)
      expect(screen.getByText("Applied")).toBeTruthy()
    })
  })

  describe("Pending Stage", () => {
    it("renders with Applied label", () => {
      render(<ApplicationStageBadge stage="pending" />)
      expect(screen.getByText("Applied")).toBeTruthy()
    })
  })

  describe("Reviewing Stage", () => {
    it("renders with In Review label", () => {
      render(<ApplicationStageBadge stage="reviewing" />)
      expect(screen.getByText("In Review")).toBeTruthy()
    })
  })

  describe("Interviewing Stage", () => {
    it("renders with Interview label", () => {
      render(<ApplicationStageBadge stage="interviewing" />)
      expect(screen.getByText("Interview")).toBeTruthy()
    })
  })

  describe("Offered Stage", () => {
    it("renders with Offered label", () => {
      render(<ApplicationStageBadge stage="offered" />)
      expect(screen.getByText("Offered")).toBeTruthy()
    })
  })

  describe("Rejected Stage", () => {
    it("renders with Rejected label", () => {
      render(<ApplicationStageBadge stage="rejected" />)
      expect(screen.getByText("Rejected")).toBeTruthy()
    })
  })

  describe("Withdrawn Stage", () => {
    it("renders with Withdrawn label", () => {
      render(<ApplicationStageBadge stage="withdrawn" />)
      expect(screen.getByText("Withdrawn")).toBeTruthy()
    })
  })

  describe("Props Validation", () => {
    it("accepts stage prop and renders correctly", () => {
      render(<ApplicationStageBadge stage="pending" />)
      expect(screen.getByText("Applied")).toBeTruthy()
    })

    it("accepts optional className prop", () => {
      const { container } = render(
        <ApplicationStageBadge stage="pending" className="test-class" />
      )
      expect(container.querySelector(".test-class")).toBeTruthy()
    })

    it("works without className prop", () => {
      render(<ApplicationStageBadge stage="pending" />)
      expect(screen.getByText("Applied")).toBeTruthy()
    })
  })

  describe("Component Structure", () => {
    it("renders as a Badge component with text content", () => {
      render(<ApplicationStageBadge stage="pending" />)
      expect(screen.getByText("Applied")).toBeTruthy()
    })

    it("maintains rendering across all stages", () => {
      const stages = ["pending", "reviewing", "interviewing", "offered", "rejected", "withdrawn"] as const
      const labels = ["Applied", "In Review", "Interview", "Offered", "Rejected", "Withdrawn"]

      stages.forEach((stage, index) => {
        const { unmount } = render(<ApplicationStageBadge stage={stage} />)
        expect(screen.getByText(labels[index])).toBeTruthy()
        unmount()
      })
    })
  })

  describe("Text Rendering", () => {
    it("renders exact text labels for each stage", () => {
      const mappings = [
        { stage: "pending" as const, label: "Applied" },
        { stage: "reviewing" as const, label: "In Review" },
        { stage: "interviewing" as const, label: "Interview" },
        { stage: "offered" as const, label: "Offered" },
        { stage: "rejected" as const, label: "Rejected" },
        { stage: "withdrawn" as const, label: "Withdrawn" },
      ]

      mappings.forEach(({ stage, label }) => {
        const { unmount } = render(<ApplicationStageBadge stage={stage} />)
        expect(screen.getByText(label)).toBeTruthy()
        unmount()
      })
    })
  })

  describe("Accessibility", () => {
    it("renders visible text for all stages", () => {
      const stages = ["pending", "reviewing", "interviewing", "offered", "rejected", "withdrawn"] as const
      const labels = ["Applied", "In Review", "Interview", "Offered", "Rejected", "Withdrawn"]

      stages.forEach((stage, index) => {
        const { unmount } = render(<ApplicationStageBadge stage={stage} />)
        expect(screen.getByText(labels[index])).toBeTruthy()
        unmount()
      })
    })
  })
})
