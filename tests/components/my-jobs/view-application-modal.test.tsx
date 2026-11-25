import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ViewApplicationModal } from "@/components/my-jobs/view-application-modal"

vi.mock("@/lib/hooks/useApplicantStatus", () => ({
  useApplication: vi.fn(),
}))

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual as any,
    Loader2: () => <div data-testid="loader" />,
  }
})

import { useApplication } from "@/lib/hooks/useApplicantStatus"

describe("ViewApplicationModal", () => {
  const mockOnClose = vi.fn()

  it("renders loading state", () => {
    vi.mocked(useApplication).mockReturnValue({ isLoading: true, data: null, error: null } as any)
    render(
      <ViewApplicationModal jobApplicantName="app-1" isOpen={true} onClose={mockOnClose} />
    )
    expect(screen.getByTestId("loader")).toBeTruthy()
  })

  it("renders error state", () => {
    vi.mocked(useApplication).mockReturnValue({ isLoading: false, data: null, error: new Error("Failed") } as any)
    render(
      <ViewApplicationModal jobApplicantName="app-1" isOpen={true} onClose={mockOnClose} />
    )
    expect(screen.getByText(/Failed to load application details/i)).toBeTruthy()
  })

  it("renders applicant data successfully", () => {
    vi.mocked(useApplication).mockReturnValue({
      isLoading: false,
      error: null,
      data: {
          first_name: "John",
          last_name: "Doe",
          is_active: true,
          nested_table: [
            { field_1: "Value 1" }
          ]
      }
    } as any)

    render(
      <ViewApplicationModal jobApplicantName="app-1" isOpen={true} onClose={mockOnClose} />
    )

    expect(screen.getByText("First Name")).toBeTruthy()
    expect(screen.getByText("John")).toBeTruthy()
    expect(screen.getByText("Yes")).toBeTruthy()
    expect(screen.getByText("Nested Table")).toBeTruthy()
    expect(screen.getByText("Value 1")).toBeTruthy()
  })

  it("handles empty array in applicant data", () => {
    vi.mocked(useApplication).mockReturnValue({
      isLoading: false,
      error: null,
      data: {
          empty_list: []
      }
    } as any)

    render(
      <ViewApplicationModal jobApplicantName="app-1" isOpen={true} onClose={mockOnClose} />
    )

    expect(screen.getAllByText("—").length).toBeGreaterThan(0)
  })
})
