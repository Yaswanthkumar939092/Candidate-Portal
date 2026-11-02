import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('@/lib/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/hooks/useOnboardingMutation', () => ({
  useOnboardingSubmit: vi.fn(),
}))

vi.mock('@/lib/hooks/useOnboardingForm', () => ({
  useOnboardingForm: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { OnboardingProvider, useOnboarding } from '@/lib/contexts/onboarding-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useOnboardingSubmit } from '@/lib/hooks/useOnboardingMutation'
import { useOnboardingForm } from '@/lib/hooks/useOnboardingForm'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { OnboardingForm } from '@/types/onboarding'

const mockUseRouter = useRouter as ReturnType<typeof vi.fn>
const mockUseSearchParams = useSearchParams as ReturnType<typeof vi.fn>
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockUseOnboardingSubmit = useOnboardingSubmit as ReturnType<typeof vi.fn>
const mockUseOnboardingForm = useOnboardingForm as ReturnType<typeof vi.fn>
const mockUseQueryClient = useQueryClient as ReturnType<typeof vi.fn>

const mockPush = vi.fn()
const mockMutateAsync = vi.fn()
const mockInvalidateQueries = vi.fn()

const sampleFormConfig = {
  applicantId: "test-applicant",
  status: 'Draft',
  tabs: [
    {
      tab: 'Personal Info',
      sections: [
        {
          fields: [
            { fieldname: 'first_name', fieldtype: 'Data', value: 'Alice', default: '' },
            { fieldname: 'last_name', fieldtype: 'Data', value: null, default: 'Doe' },
          ],
        },
      ],
    },
    {
      tab: 'Work Experience',
      sections: [
        {
          fields: [
            { fieldname: 'company', fieldtype: 'Data', value: 'Acme', default: '' },
          ],
        },
      ],
    },
  ],
} as unknown as OnboardingForm

function setupMocks(formConfigOverride?: Partial<OnboardingForm>) {
  mockUseRouter.mockReturnValue({ push: mockPush })
  mockUseSearchParams.mockReturnValue({ get: vi.fn().mockReturnValue(null) })
  mockUseAuth.mockReturnValue({ user: { email: 'test@example.com', user_metadata: {} } })
  mockUseOnboardingSubmit.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false })
  mockUseOnboardingForm.mockReturnValue({
    data: formConfigOverride !== undefined ? formConfigOverride : sampleFormConfig,
    isLoading: false,
    isError: false,
  })
  mockUseQueryClient.mockReturnValue({ invalidateQueries: mockInvalidateQueries })
}

function ConsumerComponent() {
  const {
    currentStep,
    stepData,
    isLoading,
    isDirty,
    status,
    completedSteps,
    isSaving,
  } = useOnboarding()

  return (
    <div>
      <span data-testid="step">{currentStep}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="dirty">{String(isDirty)}</span>
      <span data-testid="status">{status}</span>
      <span data-testid="saving">{String(isSaving)}</span>
      <span data-testid="completed">{completedSteps.size}</span>
      <span data-testid="step-data">{JSON.stringify(stepData)}</span>
    </div>
  )
}

function NavigationTest() {
  const { currentStep, goToStep, nextStep, prevStep } = useOnboarding()
  return (
    <div>
      <span data-testid="step">{currentStep}</span>
      <button onClick={() => goToStep(1)}>Go To 1</button>
      <button onClick={nextStep}>Next</button>
      <button onClick={prevStep}>Prev</button>
    </div>
  )
}

describe('OnboardingContext', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setupMocks()
  })

  describe('useOnboarding hook', () => {
    // Spec: CAND-05-A4.2A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a4-2a)
    it('throws when used outside OnboardingProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      function BadComponent() {
        useOnboarding()
        return null
      }

      expect(() => render(<BadComponent />)).toThrow('useOnboarding must be used within an OnboardingProvider')
      consoleSpy.mockRestore()
    })
  })

  describe('OnboardingProvider', () => {
    // Spec: CAND-05-A4.2B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a4-2b)
    it('renders children', () => {
      render(
        <OnboardingProvider>
          <div>Onboarding content</div>
        </OnboardingProvider>
      )
      expect(screen.getByText('Onboarding content')).toBeTruthy()
    })

    // Spec: CAND-05-A2.2E (docs/spec/clauses/05-onboarding-logic.md#cand-05-a2-2e)
    it('starts at step 0', async () => {
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      await waitFor(() => {
        expect(screen.getByTestId('step').textContent).toBe('0')
      })
    })

    // Spec: CAND-05-A1.1E (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1e)
    it('is not loading after formConfig loads', async () => {
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false')
      })
    })

    // Spec: CAND-05-A1.1F (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1f)
    it('status is draft when formConfig status is Draft', async () => {
      setupMocks({ ...sampleFormConfig, status: 'Draft' })
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      await waitFor(() => {
        expect(screen.getByTestId('status').textContent).toBe('draft')
      })
    })

    // Spec: CAND-05-A1.1G (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1g)
    it('status is draft when formConfig status is Pending', async () => {
      setupMocks({ ...sampleFormConfig, status: 'Pending' })
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      await waitFor(() => {
        expect(screen.getByTestId('status').textContent).toBe('draft')
      })
    })

    // Spec: CAND-05-A1.1H (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1h)
    it('status is submitted when formConfig status is Completed', async () => {
      setupMocks({ ...sampleFormConfig, status: 'Completed' })
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      await waitFor(() => {
        expect(screen.getByTestId('status').textContent).toBe('submitted')
      })
    })

    // Spec: CAND-05-A1.1I (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1i)
    it('marks all steps complete when status is Completed', async () => {
      setupMocks({ ...sampleFormConfig, status: 'Completed' })
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      await waitFor(() => {
        expect(Number(screen.getByTestId('completed').textContent)).toBeGreaterThan(0)
      })
    })

    // Spec: CAND-05-A1.1A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1a)
    it('initializes step data from formConfig', async () => {
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      await waitFor(() => {
        const stepData = JSON.parse(screen.getByTestId('step-data').textContent!)
        expect(stepData).toHaveProperty('personal_info')
        expect(stepData).toHaveProperty('work_experience')
      })
    })

    // Spec: CAND-05-A1.1B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1b)
    it('populates field values from formConfig', async () => {
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      await waitFor(() => {
        const stepData = JSON.parse(screen.getByTestId('step-data').textContent!)
        expect(stepData.personal_info.first_name).toBe('Alice')
      })
    })


    // Spec: CAND-05-A1.1C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1c)
    it('stays loading while formConfig is loading', () => {
      mockUseOnboardingForm.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
      })
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      expect(screen.getByTestId('loading').textContent).toBe('true')
    })

    // Spec: CAND-05-A1.1D (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1d)
    it('stops loading when formConfig errors', async () => {
      mockUseOnboardingForm.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
      })
      render(<OnboardingProvider><ConsumerComponent /></OnboardingProvider>)
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false')
      })
    })
  })

  describe('navigation', () => {
    // Spec: CAND-05-A2.2A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a2-2a)
    it('goToStep navigates to specified step', async () => {
      render(<OnboardingProvider><NavigationTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('step').textContent).toBe('0'))

      await user.click(screen.getByText('Go To 1'))
      await waitFor(() => {
        expect(screen.getByTestId('step').textContent).toBe('1')
        expect(mockPush).toHaveBeenCalledWith('/onboarding?step=1', { scroll: false })
      })
    })

    // Spec: CAND-05-A2.2B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a2-2b)
    it('nextStep advances to next step', async () => {
      render(<OnboardingProvider><NavigationTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('step').textContent).toBe('0'))

      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByTestId('step').textContent).toBe('1')
      })
    })

    // Spec: CAND-05-A2.2C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a2-2c)
    it('prevStep goes back a step', async () => {
      render(<OnboardingProvider><NavigationTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('step').textContent).toBe('0'))

      await user.click(screen.getByText('Next'))
      await waitFor(() => expect(screen.getByTestId('step').textContent).toBe('1'))

      await user.click(screen.getByText('Prev'))
      await waitFor(() => expect(screen.getByTestId('step').textContent).toBe('0'))
    })

    // Spec: CAND-05-A2.2D (docs/spec/clauses/05-onboarding-logic.md#cand-05-a2-2d)
    it('prevStep does not go below 0', async () => {
      render(<OnboardingProvider><NavigationTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('step').textContent).toBe('0'))

      await user.click(screen.getByText('Prev'))
      await waitFor(() => expect(screen.getByTestId('step').textContent).toBe('0'))
    })
  })

  describe('setStepData', () => {
    function SetDataTest() {
      const { stepData, setStepData, isDirty } = useOnboarding()
      return (
        <div>
          <span data-testid="dirty">{String(isDirty)}</span>
          <span data-testid="data">{JSON.stringify(stepData.personal_info ?? {})}</span>
          <button onClick={() => setStepData('personal_info', { first_name: 'Bob' })}>
            Update
          </button>
        </div>
      )
    }

    // Spec: CAND-05-A3.1A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-1a)
    it('updates step data', async () => {
      render(<OnboardingProvider><SetDataTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('dirty').textContent).toBe('false'))

      await user.click(screen.getByText('Update'))
      await waitFor(() => {
        const data = JSON.parse(screen.getByTestId('data').textContent!)
        expect(data.first_name).toBe('Bob')
      })
    })

    // Spec: CAND-05-A3.1B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-1b)
    it('marks isDirty after setStepData', async () => {
      render(<OnboardingProvider><SetDataTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('dirty').textContent).toBe('false'))

      await user.click(screen.getByText('Update'))
      await waitFor(() => {
        expect(screen.getByTestId('dirty').textContent).toBe('true')
      })
    })
  })

  describe('markStepComplete', () => {
    function MarkCompleteTest() {
      const { completedSteps, markStepComplete } = useOnboarding()
      return (
        <div>
          <span data-testid="completed">{completedSteps.size}</span>
          <button onClick={() => markStepComplete('personal_info')}>Mark</button>
        </div>
      )
    }

    // Spec: CAND-05-A3.4A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-4a)
    it('adds step key to completedSteps', async () => {
      setupMocks({
        applicantId: "test-applicant",
        status: 'Draft',
        tabs: [
          {
            tab: 'Personal Info',
            sections: [
              {
                section: 'Basic Info',
                fields: [
                  { fieldname: 'first_name', fieldtype: 'Data', value: '', default: '', is_mandatory: 1 } as any,
                ],
              },
            ],
          },
        ],
      })

      render(<OnboardingProvider><MarkCompleteTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('completed').textContent).toBe('0'))

      await user.click(screen.getByText('Mark'))
      await waitFor(() => {
        expect(Number(screen.getByTestId('completed').textContent)).toBeGreaterThan(0)
      })
    })
  })

  describe('getFieldValue', () => {
    function GetFieldTest() {
      const { getFieldValue } = useOnboarding()
      return (
        <span data-testid="value">{String(getFieldValue('first_name') ?? 'not found')}</span>
      )
    }

    // Spec: CAND-05-A3.3B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-3b)
    it('returns value from stepData', async () => {
      render(<OnboardingProvider><GetFieldTest /></OnboardingProvider>)
      await waitFor(() => {
        expect(screen.getByTestId('value').textContent).toBe('Alice')
      })
    })

    // Spec: CAND-05-A3.3C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-3c)
    it('returns undefined for unknown field', async () => {
      function UnknownFieldTest() {
        const { getFieldValue } = useOnboarding()
        return <span data-testid="value">{String(getFieldValue('nonexistent') ?? 'not found')}</span>
      }

      render(<OnboardingProvider><UnknownFieldTest /></OnboardingProvider>)
      await waitFor(() => {
        expect(screen.getByTestId('value').textContent).toBe('not found')
      })
    })
  })

  describe('submitAll', () => {
    function SubmitTest() {
      const { submitAll, isSaving, status } = useOnboarding()
      return (
        <div>
          <span data-testid="saving">{String(isSaving)}</span>
          <span data-testid="status">{status}</span>
          <button onClick={() => submitAll("submit")}>Submit</button>
        </div>
      )
    }

    // Spec: CAND-05-A3.1E (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-1e)
    it('calls mutateAsync with step data, user email, and action', async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      mockInvalidateQueries.mockResolvedValue(undefined)

      render(<OnboardingProvider><SubmitTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('draft'))

      await user.click(screen.getByText('Submit'))
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ userEmail: 'test@example.com', action: 'submit' })
        )
      })
    })

    // Spec: CAND-05-A3.1F (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-1f)
    it('updates status to submitted after success', async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      mockInvalidateQueries.mockResolvedValue(undefined)

      render(<OnboardingProvider><SubmitTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('draft'))

      await user.click(screen.getByText('Submit'))
      await waitFor(() => {
        expect(screen.getByTestId('status').textContent).toBe('submitted')
      })
    })

    // Spec: CAND-05-A3.1G (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-1g)
    it('shows success toast on submit', async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      mockInvalidateQueries.mockResolvedValue(undefined)

      render(<OnboardingProvider><SubmitTest /></OnboardingProvider>)
      await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('draft'))

      await user.click(screen.getByText('Submit'))
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Onboarding submitted successfully!')
      })
    })

    // Spec: CAND-05-A3.1D (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-1d)
    it('calls mutateAsync with only the active step data when saving progress', async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      mockInvalidateQueries.mockResolvedValue(undefined)

      function SaveTest() {
        const { submitAll } = useOnboarding()
        return (
          <button onClick={() => submitAll("save", "personal_info", { first_name: "Charlie" })}>
            Save
          </button>
        )
      }

      render(<OnboardingProvider><SaveTest /></OnboardingProvider>)
      await user.click(screen.getByText('Save'))
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          stepData: {
            personal_info: { first_name: "Charlie" }
          },
          userEmail: 'test@example.com',
          action: 'save'
        })
      })
    })

    // Spec: CAND-05-A3.1H (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-1h)
    it("invalidates both onboarding-form and dashboard queries after success", async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      mockInvalidateQueries.mockResolvedValue(undefined)

      function SaveTest() {
        const { submitAll } = useOnboarding()
        return (
          <button onClick={() => submitAll("save", "personal_info", { first_name: "Charlie" })}>
            Save
          </button>
        )
      }

      render(<OnboardingProvider><SaveTest /></OnboardingProvider>)
      await user.click(screen.getByText("Save"))

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ["onboarding-form", { userEmail: "test@example.com" }]
        })
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ["dashboard", { email: "test@example.com" }]
        })
      })
    })
  })

  describe('formConfig', () => {
    function FormConfigTest() {
      const { formConfig } = useOnboarding()
      return (
        <span data-testid="tabs">{formConfig?.tabs.length ?? 0}</span>
      )
    }

    // Spec: CAND-05-A1.1J (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1j)
    it('exposes formConfig', async () => {
      render(<OnboardingProvider><FormConfigTest /></OnboardingProvider>)
      await waitFor(() => {
        expect(screen.getByTestId('tabs').textContent).toBe('2')
      })
    })

    // Spec: CAND-05-A1.1K (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-1k)
    it('formConfig is undefined when not loaded', async () => {
      mockUseOnboardingForm.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
      })
      render(<OnboardingProvider><FormConfigTest /></OnboardingProvider>)
      expect(screen.getByTestId('tabs').textContent).toBe('0')
    })
  })
})
