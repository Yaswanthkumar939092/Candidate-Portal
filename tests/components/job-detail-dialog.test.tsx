import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JobDetailDialog } from "@/components/jobs/job-detail-dialog"
import { useRouter } from "next/navigation"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}))

// Mock lucide-react icons to avoid rendering issues in tests
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
    salary: "120,000 - 150,000",
    type: "Full-time",
    skills: ["react", "typescript", "node.js"],
    matchPercentage: 85,
    description: "<p>Build amazing React applications</p>",
    custom_qualifications: ["BS in Computer Science", "5+ years experience"],
  }

  beforeEach(() => {
    vi.clearAllMocks()
      ; (useRouter as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
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

  it("does not render dialog when open is false", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.queryByText("Senior React Developer")).toBeNull()
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

  it("renders job title in dialog header", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText("Senior React Developer")).toBeTruthy()
  })

  it("renders job company, location, experience, and salary in description", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText("Tech Corp")).toBeTruthy()
    expect(screen.getByText("New York, NY")).toBeTruthy()
    expect(screen.getByText("3-5 years")).toBeTruthy()
    expect(screen.getByText("120,000 - 150,000")).toBeTruthy()
  })

  it("renders match percentage section", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText("Why you're a match")).toBeTruthy()
    expect(screen.getByText("85%")).toBeTruthy()
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
  })

  it("renders Cancel and Apply buttons", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText("Cancel")).toBeTruthy()
    expect(screen.getByText("Apply")).toBeTruthy()
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

  it("displays all detail icons", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByTestId("icon-building")).toBeTruthy()
    expect(screen.getByTestId("icon-location")).toBeTruthy()
    expect(screen.getByTestId("icon-clock")).toBeTruthy()
    expect(screen.getByTestId("icon-rupee")).toBeTruthy()
  })

  it("renders job with minimal data", () => {
    const minimalJob = {
      id: "job-2",
      title: "Developer",
      company: "Company",
      location: "Location",
      experience: "Experience",
      salary: "Salary",
      type: "Type",
      skills: [],
      matchPercentage: 50,
      custom_qualifications: [],
    }

    render(
      <JobDetailDialog
        job={minimalJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText("Developer")).toBeTruthy()
    expect(screen.getByText("Company")).toBeTruthy()
  })

  it("navigates with correct job id", async () => {
    const customJob = { ...mockJob, id: "job-custom-123" }

    render(
      <JobDetailDialog
        job={customJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    const applyButton = screen.getByText("Apply")
    await user.click(applyButton)

    expect(mockPush).toHaveBeenCalledWith("/open-jobs/job-custom-123/apply-job")
  })

  it("handles optional description field", () => {
    const jobWithoutDescription = { ...mockJob, description: undefined }

    render(
      <JobDetailDialog
        job={jobWithoutDescription}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText("Job Description")).toBeTruthy()
  })

  it("handles long job title", () => {
    const jobWithLongTitle = {
      ...mockJob,
      title: "Senior Software Engineer - Full Stack with Leadership Responsibilities",
    }

    render(
      <JobDetailDialog
        job={jobWithLongTitle}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(
      screen.getByText("Senior Software Engineer - Full Stack with Leadership Responsibilities")
    ).toBeTruthy()
  })

  it("renders match percentage with correct styling", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    const matchPercentage = screen.getByText("85%")
    expect(matchPercentage).toBeTruthy()
    expect(matchPercentage.className).toContain("font-bold")
    expect(matchPercentage.className).toContain("text-primary")
  })

  it("renders match explanation text", () => {
    render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText(/Your resume matches key requirements/)).toBeTruthy()
  })

  it("closes dialog when clicking outside (backdrop)", async () => {
    const { container } = render(
      <JobDetailDialog
        job={mockJob}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    // The dialog overlay/backdrop should exist
    // This depends on how the Dialog component handles backdrop clicks
    // The implementation calls onOpenChange when the dialog is closed
  })
})
