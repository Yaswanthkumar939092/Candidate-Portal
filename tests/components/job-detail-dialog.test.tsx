import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JobDetailDialog } from "@/components/jobs/job-detail-dialog"
import { useRouter } from "next/navigation"
import React from "react"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}))

// Mock lucide-react icons
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    MapPin: () => <div data-testid="icon-location" />,
    Building2: () => <div data-testid="icon-building" />,
    Clock: () => <div data-testid="icon-clock" />,
    IndianRupee: () => <div data-testid="icon-rupee" />,
  }
})

describe("JobDetailDialog", () => {
  const user = userEvent.setup()
  const mockPush = vi.fn()
  const mockOnOpenChange = vi.fn()

  const mockJob = {
    id: "job-1",
    title: "Senior React Developer",
    company: "Tech Corp",
    location: "New York, NY",
    experience: "3-5 years",
    lower_range: "10",
    upper_range: "15",
    type: "Full-time",
    skills: ["react", "typescript", "node.js"],
    matchPercentage: 85,
    description: "<p>Build amazing React applications</p>",
    custom_qualifications: ["BS in Computer Science", "5+ years experience"],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({
      push: mockPush,
    })
  })

  it("returns null when job is null", () => {
    const { container } = render(
      <JobDetailDialog
        job={null}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders dialog when open is true", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(screen.getByText("Senior React Developer")).toBeTruthy()
  })

  it("renders job details (company, location, type, salary)", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(screen.getByText("Tech Corp")).toBeTruthy()
    expect(screen.getByText("New York, NY")).toBeTruthy()
    expect(screen.getByText("Full-time")).toBeTruthy()
    expect(screen.getByText(/10 - 15 LPA/)).toBeTruthy()
  })

  it("renders job description section", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(screen.getByText("Job Description")).toBeTruthy()
    expect(screen.getByText("Build amazing React applications")).toBeTruthy()
  })

  it("calls onOpenChange when Cancel button is clicked", async () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )
    const cancelButton = screen.getByText("Cancel")
    await user.click(cancelButton)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes dialog and navigates to apply page when Apply button is clicked", async () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )
    const applyButton = screen.getByText("Apply")
    await user.click(applyButton)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    expect(mockPush).toHaveBeenCalledWith("/open-jobs/job-1/apply-job")
  })
})
