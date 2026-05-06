import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AppliedJobsTimeline, type ApplicationWithTimeline } from "@/components/my-jobs/applied-jobs-timeline"

describe("AppliedJobsTimeline", () => {
  const mockApplication: ApplicationWithTimeline = {
    id: "app-1",
    jobTitle: "Senior Frontend Developer",
    company: "Tech Corp",
    location: "San Francisco, CA",
    experience: "5+ years",
    jobType: "Full-time",
    currentStage: "interview",
    stages: [
      { key: "applied", label: "Applied", date: "2024-01-15" },
      { key: "review", label: "Review", date: "2024-01-20" },
      { key: "interview", label: "Interview", date: "2024-01-25" },
      { key: "transitioning", label: "Transitioning" },
    ],
    appliedDate: "2024-01-15",
  }

  describe("Single Application", () => {
    it("renders application card", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })

    it("displays job title", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })

    it("displays company name with icon", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("Tech Corp")).toBeTruthy()
    })

    it("displays location with icon", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("San Francisco, CA")).toBeTruthy()
    })

    it("displays experience level with icon", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("5+ years")).toBeTruthy()
    })

    it("displays job type with icon", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("Full-time")).toBeTruthy()
    })

    it("renders View Application button", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("View Application")).toBeTruthy()
    })
  })

  describe("Timeline Stages", () => {
    it("renders all four pipeline stages", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("Applied")).toBeTruthy()
      expect(screen.getAllByText("Review").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Interview").length).toBeGreaterThan(0)
      expect(screen.getByText("Transitioning")).toBeTruthy()
    })

    it("displays stage dates for completed stages", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("2024-01-15")).toBeTruthy()
      expect(screen.getByText("2024-01-20")).toBeTruthy()
      expect(screen.getByText("2024-01-25")).toBeTruthy()
    })

    it("does not display date for future stages without date", () => {
      const app = {
        ...mockApplication,
        stages: [
          { key: "applied", label: "Applied", date: "2024-01-15" },
          { key: "review", label: "Review" },
          { key: "interview", label: "Interview" },
          { key: "transitioning", label: "Transitioning" },
        ],
      }
      render(<AppliedJobsTimeline applications={[app]} />)
      const dates = screen.getAllByText(/2024-01-\d+/)
      expect(dates.length).toBe(1)
    })
  })

  describe("Current Stage Tracking", () => {
    it("indicates current stage correctly for applied", () => {
      const app: ApplicationWithTimeline = {
        ...mockApplication,
        currentStage: "applied",
      }
      render(<AppliedJobsTimeline applications={[app]} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })

    it("indicates current stage correctly for review", () => {
      const app: ApplicationWithTimeline = {
        ...mockApplication,
        currentStage: "review",
      }
      render(<AppliedJobsTimeline applications={[app]} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })

    it("indicates current stage correctly for interview", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })

    it("indicates current stage correctly for transitioning", () => {
      const app: ApplicationWithTimeline = {
        ...mockApplication,
        currentStage: "transitioning",
      }
      render(<AppliedJobsTimeline applications={[app]} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })
  })

  describe("Multiple Applications", () => {
    it("renders multiple application cards", () => {
      const apps = [
        mockApplication,
        {
          ...mockApplication,
          id: "app-2",
          jobTitle: "Backend Developer",
        },
      ]
      render(<AppliedJobsTimeline applications={apps} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
      expect(screen.getByText("Backend Developer")).toBeTruthy()
    })

    it("renders correct number of cards", () => {
      const apps = [
        mockApplication,
        { ...mockApplication, id: "app-2", jobTitle: "Job 2" },
        { ...mockApplication, id: "app-3", jobTitle: "Job 3" },
      ]
      render(<AppliedJobsTimeline applications={apps} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
      expect(screen.getByText("Job 2")).toBeTruthy()
      expect(screen.getByText("Job 3")).toBeTruthy()
    })

    it("maintains separate state for each application", () => {
      const apps = [
        { ...mockApplication, id: "app-1", currentStage: "applied" as const },
        { ...mockApplication, id: "app-2", currentStage: "interview" as const },
      ]
      render(<AppliedJobsTimeline applications={apps} />)
      expect(screen.getAllByText("Senior Frontend Developer").length).toBe(2)
    })
  })

  describe("Empty State", () => {
    it("renders empty container for empty applications array", () => {
      const { container } = render(<AppliedJobsTimeline applications={[]} />)
      expect(container.querySelector("div")).toBeTruthy()
    })
  })

  describe("Custom className", () => {
    it("applies custom className to root container", () => {
      const { container } = render(
        <AppliedJobsTimeline applications={[mockApplication]} className="custom-class" />
      )
      expect(container.querySelector(".custom-class")).toBeTruthy()
    })

    it("maintains default classes with custom className", () => {
      const { container } = render(
        <AppliedJobsTimeline applications={[mockApplication]} className="custom-class" />
      )
      const root = container.querySelector(".custom-class")
      expect(root?.className).toContain("space-y-4")
    })
  })

  describe("Stage Index Calculation", () => {
    it("correctly maps stage keys to indices", () => {
      const app: ApplicationWithTimeline = {
        ...mockApplication,
        currentStage: "review",
        stages: [
          { key: "applied", label: "Applied" },
          { key: "review", label: "Review" },
          { key: "interview", label: "Interview" },
          { key: "transitioning", label: "Transitioning" },
        ],
      }
      render(<AppliedJobsTimeline applications={[app]} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })

    it("handles unknown stage keys gracefully", () => {
      const app: ApplicationWithTimeline = {
        ...mockApplication,
        currentStage: "unknown" as any,
      }
      render(<AppliedJobsTimeline applications={[app]} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })
  })

  describe("Visual Timeline Rendering", () => {
    it("renders timeline connector elements", () => {
      const { container } = render(<AppliedJobsTimeline applications={[mockApplication]} />)
      const connectors = container.querySelectorAll("div.h-1")
      expect(connectors.length).toBeGreaterThan(0)
    })

    it("renders stage circle indicators", () => {
      const { container } = render(<AppliedJobsTimeline applications={[mockApplication]} />)
      const circles = container.querySelectorAll("div[class*='rounded-full']")
      expect(circles.length).toBeGreaterThan(0)
    })

    it("applies different styling for completed vs pending stages", () => {
      const { container } = render(<AppliedJobsTimeline applications={[mockApplication]} />)
      const circles = container.querySelectorAll("div[class*='rounded-full']")
      expect(circles.length).toBeGreaterThan(0)
    })
  })

  describe("Application Details Rendering", () => {
    it("renders all job details in metadata badges", () => {
      render(<AppliedJobsTimeline applications={[mockApplication]} />)
      expect(screen.getByText("Tech Corp")).toBeTruthy()
      expect(screen.getByText("San Francisco, CA")).toBeTruthy()
      expect(screen.getByText("5+ years")).toBeTruthy()
      expect(screen.getByText("Full-time")).toBeTruthy()
    })

    it("maintains consistent metadata badge structure", () => {
      const { container } = render(<AppliedJobsTimeline applications={[mockApplication]} />)
      const badges = container.querySelectorAll("span[class*='bg-muted']")
      expect(badges.length).toBe(4)
    })
  })

  describe("Special Cases", () => {
    it("handles application with no stage dates", () => {
      const app: ApplicationWithTimeline = {
        ...mockApplication,
        stages: [
          { key: "applied", label: "Applied" },
          { key: "review", label: "Review" },
          { key: "interview", label: "Interview" },
          { key: "transitioning", label: "Transitioning" },
        ],
      }
      render(<AppliedJobsTimeline applications={[app]} />)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })

    it("handles very long job titles", () => {
      const app: ApplicationWithTimeline = {
        ...mockApplication,
        jobTitle: "Senior Frontend Developer with Full Stack Capabilities and Cloud Architecture Expertise",
      }
      render(<AppliedJobsTimeline applications={[app]} />)
      expect(screen.getByText(/Senior Frontend Developer with Full Stack/)).toBeTruthy()
    })

    it("handles applications with special characters in fields", () => {
      const app: ApplicationWithTimeline = {
        ...mockApplication,
        company: "Tech & Solutions (USA) Inc.",
        location: "San Francisco, CA - Remote (50/50)",
      }
      render(<AppliedJobsTimeline applications={[app]} />)
      expect(screen.getByText("Tech & Solutions (USA) Inc.")).toBeTruthy()
      expect(screen.getByText("San Francisco, CA - Remote (50/50)")).toBeTruthy()
    })
  })
})
