import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/hooks/useJobOpening', () => ({
  useJobApplicationForm: vi.fn(),
}))

vi.mock('@/lib/utils/transformJobFields', () => ({
  transformFieldsToTabs: vi.fn(),
}))

import { JobAppProvider, useJobApp } from '@/lib/contexts/job-application-context'
import { useJobApplicationForm } from '@/lib/hooks/useJobOpening'
import { transformFieldsToTabs } from '@/lib/utils/transformJobFields'

const mockUseJobApplicationForm = useJobApplicationForm as ReturnType<typeof vi.fn>
const mockTransformFieldsToTabs = transformFieldsToTabs as ReturnType<typeof vi.fn>

function defaultMockSetup(overrides: Partial<{ data: unknown; isLoading: boolean }> = {}) {
  mockUseJobApplicationForm.mockReturnValue({
    data: null,
    isLoading: false,
    ...overrides,
  })
  mockTransformFieldsToTabs.mockReturnValue([])
}

function ConsumerComponent() {
  const { stepData, tabs, allFields, isLoading } = useJobApp()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="tabs-count">{tabs.length}</span>
      <span data-testid="fields-count">{allFields.length}</span>
      <span data-testid="step-data">{JSON.stringify(stepData)}</span>
    </div>
  )
}

describe('JobAppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    defaultMockSetup()
  })

  describe('JobAppProvider', () => {
    it('renders children', () => {
      render(
        <JobAppProvider>
          <div>Child content</div>
        </JobAppProvider>
      )
      expect(screen.getByText('Child content')).toBeTruthy()
    })

    it('provides isLoading from hook', () => {
      defaultMockSetup({ isLoading: true })
      render(
        <JobAppProvider>
          <ConsumerComponent />
        </JobAppProvider>
      )
      expect(screen.getByTestId('loading').textContent).toBe('true')
    })

    it('provides empty allFields when data is null', () => {
      defaultMockSetup({ data: null })
      render(
        <JobAppProvider>
          <ConsumerComponent />
        </JobAppProvider>
      )
      expect(screen.getByTestId('fields-count').textContent).toBe('0')
    })

    it('provides allFields from data.fields', () => {
      const fields = [
        { fieldname: 'first_name', fieldtype: 'Data' },
        { fieldname: 'last_name', fieldtype: 'Data' },
      ]
      defaultMockSetup({ data: { fields } })
      mockTransformFieldsToTabs.mockReturnValue([{ tab: 'Info', sections: [] }])

      render(
        <JobAppProvider>
          <ConsumerComponent />
        </JobAppProvider>
      )
      expect(screen.getByTestId('fields-count').textContent).toBe('2')
    })

    it('calls transformFieldsToTabs with allFields', () => {
      const fields = [{ fieldname: 'name', fieldtype: 'Data' }]
      defaultMockSetup({ data: { fields } })

      render(
        <JobAppProvider>
          <ConsumerComponent />
        </JobAppProvider>
      )
      expect(mockTransformFieldsToTabs).toHaveBeenCalledWith(fields)
    })

    it('provides tabs from transformFieldsToTabs result', () => {
      const tabs = [
        { tab: 'Personal', sections: [] },
        { tab: 'Experience', sections: [] },
      ]
      defaultMockSetup({ data: { fields: [] } })
      mockTransformFieldsToTabs.mockReturnValue(tabs)

      render(
        <JobAppProvider>
          <ConsumerComponent />
        </JobAppProvider>
      )
      expect(screen.getByTestId('tabs-count').textContent).toBe('2')
    })

    it('initializes stepData as empty object', () => {
      render(
        <JobAppProvider>
          <ConsumerComponent />
        </JobAppProvider>
      )
      expect(screen.getByTestId('step-data').textContent).toBe('{}')
    })
  })

  describe('setStepData', () => {
    function SetStepDataTest() {
      const { setStepData, stepData } = useJobApp()
      return (
        <div>
          <span data-testid="step-data">{JSON.stringify(stepData)}</span>
          <button
            onClick={() => setStepData('personal', { name: 'Alice', age: 30 })}
          >
            Set Data
          </button>
        </div>
      )
    }

    it('updates stepData for a given step key', async () => {
      const user = (await import('@testing-library/user-event')).default.setup()
      render(
        <JobAppProvider>
          <SetStepDataTest />
        </JobAppProvider>
      )

      await user.click(screen.getByText('Set Data'))
      const data = JSON.parse(screen.getByTestId('step-data').textContent!)
      expect(data.personal).toEqual({ name: 'Alice', age: 30 })
    })

    it('merges multiple step data updates', async () => {
      const user = (await import('@testing-library/user-event')).default.setup()

      function MultiSetTest() {
        const { setStepData, stepData } = useJobApp()
        return (
          <div>
            <span data-testid="step-data">{JSON.stringify(stepData)}</span>
            <button onClick={() => setStepData('step1', { field1: 'a' })}>Set Step 1</button>
            <button onClick={() => setStepData('step2', { field2: 'b' })}>Set Step 2</button>
          </div>
        )
      }

      render(<JobAppProvider><MultiSetTest /></JobAppProvider>)
      await user.click(screen.getByText('Set Step 1'))
      await user.click(screen.getByText('Set Step 2'))

      const data = JSON.parse(screen.getByTestId('step-data').textContent!)
      expect(data.step1).toEqual({ field1: 'a' })
      expect(data.step2).toEqual({ field2: 'b' })
    })

    it('overwrites existing step data with new data', async () => {
      const user = (await import('@testing-library/user-event')).default.setup()

      function OverwriteTest() {
        const { setStepData, stepData } = useJobApp()
        return (
          <div>
            <span data-testid="step-data">{JSON.stringify(stepData)}</span>
            <button onClick={() => setStepData('step1', { field: 'original' })}>First</button>
            <button onClick={() => setStepData('step1', { field: 'updated' })}>Second</button>
          </div>
        )
      }

      render(<JobAppProvider><OverwriteTest /></JobAppProvider>)
      await user.click(screen.getByText('First'))
      await user.click(screen.getByText('Second'))

      const data = JSON.parse(screen.getByTestId('step-data').textContent!)
      expect(data.step1).toEqual({ field: 'updated' })
    })
  })

  describe('useJobApp hook', () => {
    it('throws when used outside JobAppProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function BadComponent() {
        useJobApp()
        return null
      }

      expect(() => render(<BadComponent />)).toThrow('useJobApp must be used inside provider')
      consoleSpy.mockRestore()
    })

    it('provides setStepData function', () => {
      let capturedCtx: ReturnType<typeof useJobApp> | null = null

      function Capture() {
        capturedCtx = useJobApp()
        return null
      }

      render(<JobAppProvider><Capture /></JobAppProvider>)
      expect(typeof capturedCtx!.setStepData).toBe('function')
    })
  })

  describe('data updates when hook data changes', () => {
    it('recalculates tabs when fields change', () => {
      const newFields = [
        { fieldname: 'email', fieldtype: 'Data' },
        { fieldname: 'phone', fieldtype: 'Data' },
        { fieldname: 'address', fieldtype: 'Data' },
      ]
      defaultMockSetup({ data: { fields: newFields } })
      mockTransformFieldsToTabs.mockReturnValue([
        { tab: 'Contact', sections: [] },
      ])

      render(<JobAppProvider><ConsumerComponent /></JobAppProvider>)
      expect(screen.getByTestId('fields-count').textContent).toBe('3')
      expect(screen.getByTestId('tabs-count').textContent).toBe('1')
      expect(mockTransformFieldsToTabs).toHaveBeenCalledWith(newFields)
    })
  })
})
