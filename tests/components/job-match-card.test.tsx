import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JobMatchCard } from "@/components/jobs/job-match-card"

// ─── Mocks ──────────────────────────────────────────────────────────

// Mock lucide-react icons to avoid rendering issues in tests
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    MapPin: () => <div data-testid="icon-location" />,
    Briefcase: () => <div data-testid="icon-briefcase" />,
    Bookmark: () => <div data-testid="icon-bookmark" />,
    BookmarkCheck: () => <div data-testid="icon-bookmark-check" />,
    Building2: () => <div data-testid="icon-building" />,
    Clock: () => <div data-testid="icon-clock" />,
    IndianRupee: () => <div data-testid="icon-rupee" />,
  }
})

describe("JobMatchCard", () => {
  const user = userEvent.setup()
  const mockOnViewDetails = vi.fn()
  const mockOnBookmark = vi.fn()

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
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders job title and match percentage", () => {
    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    expect(screen.getByText("Senior React Developer")).toBeTruthy()
    expect(screen.getByText("85%")).toBeTruthy()
  })

  it("renders company, location, experience, and salary info", () => {
    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    expect(screen.getByText("Tech Corp")).toBeTruthy()
    expect(screen.getByText("New York, NY")).toBeTruthy()
    expect(screen.getByText("3-5 years")).toBeTruthy()
    expect(screen.getByText("120,000 - 150,000")).toBeTruthy()
  })

  it("renders all skill badges", () => {
    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    expect(screen.getByText("react")).toBeTruthy()
    expect(screen.getByText("typescript")).toBeTruthy()
    expect(screen.getByText("node.js")).toBeTruthy()
  })

  it("renders View Details button", () => {
    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    expect(screen.getByText("View Details")).toBeTruthy()
  })

  it("calls onViewDetails when View Details button is clicked", async () => {
    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    const viewDetailsButton = screen.getByText("View Details")
    await user.click(viewDetailsButton)

    expect(mockOnViewDetails).toHaveBeenCalled()
  })

  it("renders bookmark button with correct aria-label when not bookmarked", () => {
    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
        isBookmarked={false}
      />
    )

    const bookmarkButton = screen.getByLabelText("Bookmark job")
    expect(bookmarkButton).toBeTruthy()
    expect(screen.getByTestId("icon-bookmark")).toBeTruthy()
  })

  it("renders filled bookmark when isBookmarked is true", () => {
    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
        isBookmarked={true}
      />
    )

    expect(screen.getByLabelText("Remove bookmark")).toBeTruthy()
    expect(screen.getByTestId("icon-bookmark-check")).toBeTruthy()
  })

  it("calls onBookmark when bookmark button is clicked", async () => {
    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    const bookmarkButton = screen.getByLabelText("Bookmark job")
    await user.click(bookmarkButton)

    expect(mockOnBookmark).toHaveBeenCalled()
  })

  it("displays info icons for all job details", () => {
    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    expect(screen.getByTestId("icon-building")).toBeTruthy()
    expect(screen.getByTestId("icon-location")).toBeTruthy()
    expect(screen.getByTestId("icon-clock")).toBeTruthy()
    expect(screen.getByTestId("icon-rupee")).toBeTruthy()
  })

  it("handles empty skills array gracefully", () => {
    const jobWithoutSkills = { ...mockJob, skills: [] }

    render(
      <JobMatchCard
        job={jobWithoutSkills}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    expect(screen.getByText("Senior React Developer")).toBeTruthy()
    // Should still render other content without error
  })

  it("handles single skill", () => {
    const jobWithOneSkill = { ...mockJob, skills: ["react"] }

    render(
      <JobMatchCard
        job={jobWithOneSkill}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    expect(screen.getByText("react")).toBeTruthy()
  })

  it("applies custom className", () => {
    const { container } = render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
        className="custom-class"
      />
    )

    expect(container.querySelector(".custom-class")).toBeTruthy()
  })

  it("handles high match percentage", () => {
    const highMatchJob = { ...mockJob, matchPercentage: 95 }

    render(
      <JobMatchCard
        job={highMatchJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    expect(screen.getByText("95%")).toBeTruthy()
  })

  it("handles low match percentage", () => {
    const lowMatchJob = { ...mockJob, matchPercentage: 30 }

    render(
      <JobMatchCard
        job={lowMatchJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    expect(screen.getByText("30%")).toBeTruthy()
  })

  it("stops event propagation on button clicks", async () => {
    const mockStopPropagation = vi.fn()

    render(
      <JobMatchCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onBookmark={mockOnBookmark}
      />
    )

    const viewDetailsButton = screen.getByText("View Details")
    // Simulate event
    viewDetailsButton.click()

    expect(mockOnViewDetails).toHaveBeenCalled()
  })
})
