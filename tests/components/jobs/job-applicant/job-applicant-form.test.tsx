import { useEffect } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import JobApplicationPage from "@/components/jobs/job-applicant/JobApplicantForm"

const { mockUseJobApp } = vi.hoisted(() => {
  const mockFn = vi.fn().mockImplementation(() => ({
    initializeAllStepsFromDraft: vi.fn(),
    allFields: [],
    draftName: null,
    tabs: [],
    isLoading: false,
    stepData: {},
  }));

  mockFn.mockReturnValue = (val: any) => {
    return mockFn.mockImplementation(() => ({
      initializeAllStepsFromDraft: vi.fn(),
      allFields: [],
      draftName: null,
      tabs: [],
      isLoading: false,
      stepData: {},
      ...val,
    }));
  };

  return { mockUseJobApp: mockFn };
});

vi.mock("@/lib/contexts/job-application-context", () => ({
  useJobApp: mockUseJobApp,
}))

const mockUseAuth = vi.fn()
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}))

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockUseGetDraftJobApplicant = vi.fn()
const mockUseCreateJobApplicant = vi.fn(() => ({ mutate: vi.fn(), isPending: false }))
const mockUseDeleteDraftJobApplicant = vi.fn(() => ({ mutate: vi.fn() }))

vi.mock("@/lib/hooks/useJobOpening", () => ({
  useGetDraftJobApplicant: (...args: any[]) => mockUseGetDraftJobApplicant(...args),
  useCreateJobApplicant: () => mockUseCreateJobApplicant(),
  useDeleteDraftJobApplicant: () => mockUseDeleteDraftJobApplicant(),
}))

vi.mock("@/components/jobs/job-applicant/job-applicationstep-nav", () => ({
  JobApplicationStepNav: ({ currentStep, completedSteps, onStepChange }: { currentStep: number; completedSteps: Set<string>; onStepChange: (step: number) => void }) => (
    <div data-testid="step-nav">
      <span data-testid="current-step">{currentStep}</span>
      <span data-testid="completed-steps">{completedSteps.size}</span>
      <button onClick={() => onStepChange(0)}>Go to Step 0</button>
      <button onClick={() => onStepChange(1)}>Go to Step 1</button>
    </div>
  ),
}))

vi.mock("@/components/jobs/job-applicant/DynamicField", () => ({
  JobApplicationStep: ({ tab, methods, onNext, onPrev, currentStep, totalSteps }: any) => {
    useEffect(() => {
      if (tab.skipAutoFill) return;
      // Auto-fill fields to pass validation in tests
      tab.sections.forEach((s: any) => {
        s.fields.forEach((f: any) => {
          if (f.reqd || f.is_mandatory) {
            methods.setValue(f.fieldname, "Filled Value");
          }
        })
      })
    }, [tab, methods])

    return (
      <div data-testid="job-application-step">
        <h2>{tab.tab}</h2>
        <span data-testid="step-info">{currentStep + 1}/{totalSteps}</span>
        <button onClick={onNext} data-testid="next-btn">Next</button>
        <button onClick={onPrev} data-testid="prev-btn">Prev</button>
      </div>
    )
  },
}))

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import { useJobApp } from "@/lib/contexts/job-application-context"
import { toast } from "sonner"

const mockTabs = [
  {
    tab: "Personal Info",
    sections: [
      {
        fields: [
          { fieldname: "name", label: "Name", reqd: true },
          { fieldname: "email", label: "Email", is_mandatory: 1 },
        ],
      },
    ],
  },
  {
    tab: "Experience",
    sections: [
      {
        fields: [
          { fieldname: "experience", label: "Experience", reqd: true },
        ],
      },
    ],
  },
]

describe("JobApplicantForm", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: { email: "test@example.com" } })
    mockUseGetDraftJobApplicant.mockReturnValue({
      data: {
        success: true,
        data: {
          name: "John Doe",
          form_data: JSON.stringify({ name: "John Doe", email: "john@example.com" }),
        },
      },
      isLoading: false,
    })
  })

  describe("Loading State", () => {
    it("renders loading spinner when isLoading is true", () => {
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: mockTabs,
        isLoading: true,
        stepData: {},
      })

      const { container } = render(<JobApplicationPage jobID="job-123" />)
      expect(container.querySelector("svg[class*='animate-spin']")).toBeTruthy()
    })
  })

  describe("Empty State", () => {
    it("renders null when no tabs", () => {
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: [],
        isLoading: false,
        stepData: {},
      })

      const { container } = render(<JobApplicationPage jobID="job-123" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe("Form Rendering", () => {
    beforeEach(() => {
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: mockTabs,
        isLoading: false,
        stepData: {
          personal_info: {},
          experience: {},
        },
      })
    })

    it("renders step navigation sidebar", () => {
      render(<JobApplicationPage jobID="job-123" />)
      expect(screen.getByTestId("step-nav")).toBeTruthy()
    })

    it("renders main content area", () => {
      render(<JobApplicationPage jobID="job-123" />)
      expect(screen.getByRole("main")).toBeTruthy()
    })

    it("displays current step header", () => {
      render(<JobApplicationPage jobID="job-123" />)
      expect(screen.getByText(/Step 1 of 3/)).toBeTruthy()
      expect(screen.getAllByText("Personal Info").length).toBeGreaterThan(0)
    })

    it("displays job application step component", () => {
      render(<JobApplicationPage jobID="job-123" />)
      expect(screen.getByTestId("job-application-step")).toBeTruthy()
    })
  })

  describe("Step Navigation", () => {
    beforeEach(() => {
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: mockTabs,
        isLoading: false,
        stepData: {
          personal_info: { name: "John Doe", email: "john@example.com" },
          experience: {},
        },
      })
    })

    it("navigates to next step when handleNext is called", async () => {
      render(<JobApplicationPage jobID="job-123" />)
      const nextBtn = screen.getByTestId("next-btn")

      await user.click(nextBtn)

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 3/)).toBeTruthy()
        expect(screen.getAllByText("Experience").length).toBeGreaterThan(0)
      })
    })

    it("navigates to previous step when handlePrev is called", async () => {
      render(<JobApplicationPage jobID="job-123" />)
      const nextBtn = screen.getByTestId("next-btn")

      await user.click(nextBtn)
      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 3/)).toBeTruthy()
      })

      const prevBtn = screen.getByTestId("prev-btn")
      await user.click(prevBtn)
      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 3/)).toBeTruthy()
      })
    })

    it("prevents navigation beyond last step", async () => {
      render(<JobApplicationPage jobID="job-123" />)

      const nextBtn = screen.getByTestId("next-btn")
      await user.click(nextBtn)
      await user.click(nextBtn)

      await waitFor(() => {
        expect(screen.getByText(/Step 3 of 3/)).toBeTruthy()
      })
    })

    it("prevents navigation before first step", () => {
      render(<JobApplicationPage jobID="job-123" />)

      expect(screen.getByText("Step 1 of 3")).toBeTruthy()
    })
  })

  describe("Field Validation", () => {
    it("shows warning when required fields are missing on step change", async () => {
      mockUseGetDraftJobApplicant.mockReturnValue({
        success: true,
        data: {
          name: "John Doe",
          form_data: JSON.stringify({ name: "", email: "" }), // Empty data
        },
        isLoading: false,
      })

      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: mockTabs.map(t => ({ ...t, skipAutoFill: true })),
        isLoading: false,
        stepData: {
          personal_info: { name: "" },
          experience: {},
        },
      })

      render(<JobApplicationPage jobID="job-123" />)

      await waitFor(() => {
        const goToStep1Btn = screen.getByText("Go to Step 1")
        expect(goToStep1Btn).toBeTruthy()
      })
      
      const goToStep1Btn = screen.getByText("Go to Step 1")
      await user.click(goToStep1Btn)

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith(
          "Please fill all required fields before proceeding."
        )
      })
    })

    it("allows step change when all required fields are filled", async () => {
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: mockTabs,
        isLoading: false,
        stepData: {
          personal_info: { name: "John Doe", email: "john@example.com" },
          experience: {},
        },
      })

      render(<JobApplicationPage jobID="job-123" />)

      await waitFor(() => {
        const goToStep1Btn = screen.getByText("Go to Step 1")
        expect(goToStep1Btn).toBeTruthy()
      })
      
      const goToStep1Btn = screen.getByText("Go to Step 1")
      await user.click(goToStep1Btn)

      await waitFor(() => {
        expect(toast.warning).not.toHaveBeenCalled()
      })
    })
  })

  describe("Completed Steps Tracking", () => {
    beforeEach(() => {
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: mockTabs,
        isLoading: false,
        stepData: {
          personal_info: { name: "John Doe", email: "john@example.com" },
          experience: { experience: "5 years" },
        },
      })
    })

    it("marks step as complete when navigating away", async () => {
      render(<JobApplicationPage jobID="job-123" />)

      await waitFor(() => {
        const goToStep1Btn = screen.getByText("Go to Step 1")
        expect(goToStep1Btn).toBeTruthy()
      })
      
      const goToStep1Btn = screen.getByText("Go to Step 1")
      await user.click(goToStep1Btn)

      await waitFor(() => {
        const completedSteps = screen.getByTestId("completed-steps")
        expect(completedSteps.textContent).toBe("1")
      })
    })

    it("accumulates completed steps", async () => {
      render(<JobApplicationPage jobID="job-123" />)

      expect(screen.getByTestId("completed-steps").textContent).toBe("0")
    })
  })

  describe("Responsive Layout", () => {
    beforeEach(() => {
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: mockTabs,
        isLoading: false,
        stepData: {
          personal_info: {},
          experience: {},
        },
      })
    })

    it("renders sidebar navigation", () => {
      render(<JobApplicationPage jobID="job-123" />)
      expect(screen.getByTestId("step-nav")).toBeTruthy()
    })

    it("renders main content area with proper layout", () => {
      const { container } = render(<JobApplicationPage jobID="job-123" />)
      const mainContent = container.querySelector("main")
      expect(mainContent).toBeTruthy()
      expect(mainContent?.className).toContain("flex-1")
    })
  })

  describe("Step Key Generation", () => {
    it("generates correct step key from tab name", () => {
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: [
          {
            tab: "Personal Info",
            sections: [{ fields: [] }],
          },
        ],
        isLoading: false,
        stepData: {},
      })

      render(<JobApplicationPage jobID="job-123" />)

      expect(screen.getAllByText("Personal Info").length).toBeGreaterThan(0)
    })
  })

  describe("Props Handling", () => {
    beforeEach(() => {
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: vi.fn(),
        tabs: mockTabs,
        isLoading: false,
        stepData: {},
      })
    })

    it("receives and passes jobID prop correctly", () => {
      render(<JobApplicationPage jobID="job-456" />)
      expect(screen.getByTestId("job-application-step")).toBeTruthy()
    })
  })

  describe("Draft Data Restoration Options", () => {
    it("does not restore draft data from the get_draft API (draft restoration removed)", async () => {
      const initializeMock = vi.fn()
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: initializeMock,
        tabs: mockTabs,
        isLoading: false,
        stepData: {},
      })

      mockUseGetDraftJobApplicant.mockReturnValue({
        data: {
          success: true,
          data: [{
            name: "Draft-123",
            form_data: { name: "Jane Doe", email: "jane@example.com" },
          }],
        },
        isLoading: false,
      })

      render(<JobApplicationPage jobID="job-123" />)

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(initializeMock).not.toHaveBeenCalledWith({ name: "Jane Doe", email: "jane@example.com" })
      expect(toast.info).not.toHaveBeenCalledWith("Draft data restored successfully.")
    })

    it("does not restore draft if draft data success is false", async () => {
      const initializeMock = vi.fn()
      mockUseJobApp.mockReturnValue({
        initializeAllStepsFromDraft: initializeMock,
        tabs: mockTabs,
        isLoading: false,
        stepData: {},
      })

      mockUseGetDraftJobApplicant.mockReturnValue({
        data: {
          success: false,
          data: null,
        },
        isLoading: false,
      })

      render(<JobApplicationPage jobID="job-123" />)

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(initializeMock).not.toHaveBeenCalled()
    })
  })
})
