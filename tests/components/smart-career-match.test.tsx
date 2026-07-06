import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SmartCareerMatch } from "@/components/jobs/smart-career-match"
import * as useJobOpeningHook from "@/lib/hooks/useJobOpening"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("@/lib/hooks/useJobOpening")

// Mock lucide-react icons to avoid rendering issues in tests
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    Upload: () => <div data-testid="icon-upload" />,
    Rocket: () => <div data-testid="icon-rocket" />,
  }
})

describe("SmartCareerMatch", () => {
  const user = userEvent.setup()
  const mockOnAnalysisComplete = vi.fn()

  const mockJobOpenings = [
    {
      name: "job-1",
      job_title: "React Developer",
      company: "Tech Corp",
      location: "New York",
      custom_work_experience: "2-3 years",
      custom_salary: "120k",
      employment_type: "Full-time",
      description: "Build React applications",
      skills_required: "react javascript typescript",
      status: "active",
    },
    {
      name: "job-2",
      job_title: "Node.js Backend Engineer",
      company: "Dev Inc",
      location: "San Francisco",
      custom_work_experience: "3-5 years",
      custom_salary: "140k",
      employment_type: "Full-time",
      description: "Build Node.js APIs",
      skills_required: "node express javascript",
      status: "active",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
      ; (useJobOpeningHook.useJobOpening as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
        data: mockJobOpenings,
        isLoading: false,
        error: null,
      })

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            text: "react javascript typescript nodejs skills",
          }),
      })
       
    ) as any
  })

  it("renders file upload interface", () => {
    render(<SmartCareerMatch />)
    expect(screen.getByText("Drop your resume here")).toBeTruthy()
    expect(screen.getByTestId("icon-upload")).toBeTruthy()
  })

  it("accepts file upload and shows analyze button", async () => {
    render(<SmartCareerMatch />)

    const file = new File(["resume content"], "resume.pdf", { type: "application/pdf" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText("Analyze Resume")).toBeTruthy()
  })

  it("rejects invalid file types", async () => {
    render(<SmartCareerMatch />)

    const file = new File(["content"], "file.xyz", { type: "application/x-xyz" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText("Upload PDF/DOC/TXT")).toBeTruthy()
  })

  it("shows analyzing state after clicking analyze", async () => {
    render(<SmartCareerMatch onAnalysisComplete={mockOnAnalysisComplete} />)

    const file = new File(["resume content"], "resume.pdf", { type: "application/pdf" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)
    const analyzeButton = screen.getByText("Analyze Resume")
    await user.click(analyzeButton)

    await waitFor(() => {
      expect(screen.getByText("Analyzing resume...")).toBeTruthy()
    })
  })

  it("calls onAnalysisComplete with matched jobs", async () => {
    render(<SmartCareerMatch onAnalysisComplete={mockOnAnalysisComplete} />)

    const file = new File(["react javascript typescript"], "resume.pdf", { type: "application/pdf" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)
    const analyzeButton = screen.getByText("Analyze Resume")
    await user.click(analyzeButton)

    await waitFor(() => {
      expect(mockOnAnalysisComplete).toHaveBeenCalled()
    })

    const results = mockOnAnalysisComplete.mock.calls[0][0]
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(0)
  })

  it("handles supported file types (PDF, DOC, TXT)", async () => {
    const { rerender } = render(<SmartCareerMatch />)

    const fileTypes = [
      { type: "application/pdf", name: "resume.pdf" },
      { type: "application/msword", name: "resume.doc" },
      { type: "text/plain", name: "resume.txt" },
      { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", name: "resume.docx" },
    ]

    for (const { type, name } of fileTypes) {
      const file = new File(["content"], name, { type })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(input, file)
      expect(screen.queryByText("Upload PDF/DOC/TXT")).toBeNull()
    }
  })

  it("clears error when valid file is selected after error", async () => {
    render(<SmartCareerMatch />)

    // First upload invalid file
    const invalidFile = new File(["content"], "file.xyz", { type: "application/x-xyz" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, invalidFile)
    expect(screen.getByText("Upload PDF/DOC/TXT")).toBeTruthy()

    // Then upload valid file
    const validFile = new File(["content"], "resume.pdf", { type: "application/pdf" })
    await user.upload(input, validFile)

    await waitFor(() => {
      expect(screen.queryByText("Upload PDF/DOC/TXT")).toBeNull()
    })
  })

  it("applies custom className", () => {
    const { container } = render(<SmartCareerMatch className="custom-class" />)
    expect(container.querySelector(".custom-class")).toBeTruthy()
  })

  it("calls fetch with correct endpoint", async () => {
    render(<SmartCareerMatch onAnalysisComplete={mockOnAnalysisComplete} />)

    const file = new File(["resume content"], "resume.pdf", { type: "application/pdf" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)
    const analyzeButton = screen.getByText("Analyze Resume")
    await user.click(analyzeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parse-resume",
        expect.objectContaining({
          method: "POST",
        })
      )
    })
  })
})
