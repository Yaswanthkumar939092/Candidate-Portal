import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AppliedJobsTimeline } from "@/components/my-jobs/applied-jobs-timeline"
import React from "react"

vi.mock("@/components/my-jobs/view-application-modal", () => ({
  ViewApplicationModal: ({ isOpen, onClose, jobApplicantName }: any) => (
    isOpen ? (
      <div data-testid="view-application-modal" data-applicant={jobApplicantName}>
        <button data-testid="close-modal" onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}))

vi.mock("lucide-react", () => ({
  Check: () => <div data-testid="icon-check" />,
  Building2: () => <div data-testid="icon-building" />,
  MapPin: () => <div data-testid="icon-map-pin" />,
  Clock: () => <div data-testid="icon-clock" />,
  Briefcase: () => <div data-testid="icon-briefcase" />,
  CalendarDays: () => <div data-testid="icon-calendar" />,
  User: () => <div data-testid="icon-user" />,
}))

describe("AppliedJobsTimeline", () => {
  const mockApplication = {
    id: "app-1",
    applied_on: "2024-01-15",
    job: {
      designation: "Senior Frontend Developer",
      company: "Tech Corp",
      location: "San Francisco, CA",
      experience_range: "5+ years",
      employment_type: "Full-time",
    },
    status: "Interview",
    flags: [
      { status: "Open", flag: true, date: "2024-01-15" },
      { status: "Screening", flag: true, date: "2024-01-20" },
      { status: "Interview", flag: true, date: "2024-01-25" },
      { status: "Hold", flag: false, date: null },
    ],
  }

  const renderTimeline = (apps = [mockApplication]) => {
    return render(<AppliedJobsTimeline applicantName="Test User" applications={apps as any} />)
  }

  describe("Single Application", () => {
    it("renders application card", () => {
      renderTimeline()
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })

    it("displays job title", () => {
      renderTimeline()
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
    })

    it("displays company name", () => {
      renderTimeline()
      expect(screen.getByText("Tech Corp")).toBeTruthy()
    })

    it("displays location", () => {
      renderTimeline()
      expect(screen.getByText("San Francisco, CA")).toBeTruthy()
    })

    it("displays experience level", () => {
      renderTimeline()
      expect(screen.getByText("5+ years")).toBeTruthy()
    })

    it("displays job type", () => {
      renderTimeline()
      expect(screen.getByText("Full-time")).toBeTruthy()
    })

    it("renders View Application button", () => {
      renderTimeline()
      expect(screen.getByText("View Application")).toBeTruthy()
    })

    it("opens and closes the View Application modal", async () => {
      const user = userEvent.setup()
      renderTimeline()
      
      expect(screen.queryByTestId("view-application-modal")).toBeNull()
      
      const viewButton = screen.getByRole("button", { name: "View Application" })
      await user.click(viewButton)
      
      const modal = screen.getByTestId("view-application-modal")
      expect(modal).toBeTruthy()
      expect(modal.getAttribute("data-applicant")).toBe("app-1")
      
      const closeButton = screen.getByTestId("close-modal")
      await user.click(closeButton)
      
      expect(screen.queryByTestId("view-application-modal")).toBeNull()
    })
  })

  describe("Timeline Stages", () => {
    it("renders pipeline stages from flags", () => {
      renderTimeline()
      expect(screen.getByText("Open")).toBeTruthy()
      expect(screen.getByText("Screening")).toBeTruthy()
      expect(screen.getAllByText("Interview").length).toBeGreaterThan(0)
      expect(screen.getByText("Hold")).toBeTruthy()
    })

    it("displays stage dates for completed stages", () => {
      renderTimeline()
      // "15-01-2024" appears twice (Applied On and Open flag)
      // "20-01-2024" appears once (Screening flag)
      // "25-01-2024" appears once (Interview flag)
      expect(screen.getAllByText("15-01-2024").length).toBe(2)
      expect(screen.getByText("20-01-2024")).toBeTruthy()
      expect(screen.getByText("25-01-2024")).toBeTruthy()
    })

    it("does not display date for future stages without date", () => {
      const app = {
        ...mockApplication,
        flags: [
          { status: "Open", flag: true, date: "2024-01-15" },
          { status: "Screening", flag: false, date: null },
        ],
      }
      renderTimeline([app])
      // "15-01-2024" appears twice
      const dates = screen.getAllByText(/\d{2}-\d{2}-\d{4}/)
      expect(dates.length).toBe(2)
    })
  })

  describe("Multiple Applications", () => {
    it("renders multiple application cards", () => {
      const apps = [
        mockApplication,
        {
          ...mockApplication,
          id: "app-2",
          job: { ...mockApplication.job, designation: "Backend Developer" },
        },
      ]
      renderTimeline(apps)
      expect(screen.getByText("Senior Frontend Developer")).toBeTruthy()
      expect(screen.getByText("Backend Developer")).toBeTruthy()
    })
  })

  describe("Empty State", () => {
    it("renders empty container for empty applications array", () => {
      const { container } = renderTimeline([])
      expect(container.querySelector("div")).toBeTruthy()
    })
  })

  describe("Custom className", () => {
    it("applies custom className to root container", () => {
      const { container } = render(
        <AppliedJobsTimeline applicantName="Test User" applications={[mockApplication] as any} className="custom-class" />
      )
      expect(container.querySelector(".custom-class")).toBeTruthy()
    })
  })

  describe("Special Cases", () => {
    it("handles very long job titles", () => {
      const app = {
        ...mockApplication,
        job: {
          ...mockApplication.job,
          designation: "Senior Frontend Developer with Full Stack Capabilities and Cloud Architecture Expertise",
        },
      }
      renderTimeline([app])
      expect(screen.getByText(/Senior Frontend Developer with Full Stack/)).toBeTruthy()
    })

    it("handles applications with special characters in fields", () => {
      const app = {
        ...mockApplication,
        job: {
          ...mockApplication.job,
          company: "Tech & Solutions (USA) Inc.",
          location: "San Francisco, CA - Remote (50/50)",
        },
      }
      renderTimeline([app])
      expect(screen.getByText("Tech & Solutions (USA) Inc.")).toBeTruthy()
      expect(screen.getByText("San Francisco, CA - Remote (50/50)")).toBeTruthy()
    })
  })
})
