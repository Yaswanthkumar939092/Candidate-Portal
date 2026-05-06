import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/hooks/useCandidateFeatureFlags', () => ({
  useCandidateFeatureFlags: vi.fn(),
}))

import {
  FeatureFlagProvider,
  useFeatureFlags,
  useFeatureFlag,
  useFeatureFlagValue,
  FeatureGate,
  FeatureFlagLoader,
  DEFAULT_FEATURE_FLAGS,
} from '@/lib/contexts/feature-flags'
import { useCandidateFeatureFlags } from '@/lib/hooks/useCandidateFeatureFlags'

const mockUseCandidateFeatureFlags = useCandidateFeatureFlags as ReturnType<typeof vi.fn>

function defaultMock(overrides: Partial<{ data: any; isLoading: boolean; error: any; refetch: any }> = {}) {
  mockUseCandidateFeatureFlags.mockReturnValue({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })
}

function TestConsumer() {
  const { flags, isLoading, error } = useFeatureFlags()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{error ?? 'null'}</span>
      <span data-testid="oauth">{String(flags.oauth_login)}</span>
    </div>
  )
}

describe('FeatureFlagContext', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    defaultMock()
  })

  describe('DEFAULT_FEATURE_FLAGS', () => {
    it('has oauth_login enabled', () => {
      expect(DEFAULT_FEATURE_FLAGS.oauth_login).toBe(true)
    })

    it('has social_job_sharing disabled', () => {
      expect(DEFAULT_FEATURE_FLAGS.social_job_sharing).toBe(false)
    })
  })

  describe('FeatureFlagProvider', () => {
    it('renders children', () => {
      render(
        <FeatureFlagProvider>
          <div>Content</div>
        </FeatureFlagProvider>
      )
      expect(screen.getByText('Content')).toBeTruthy()
    })

    it('provides default flags when remote data is null', () => {
      defaultMock({ data: null })
      render(
        <FeatureFlagProvider>
          <TestConsumer />
        </FeatureFlagProvider>
      )
      expect(screen.getByTestId('oauth').textContent).toBe('true')
    })

    it('merges remote flags with defaults', () => {
      defaultMock({ data: { oauth_login: 0, social_job_sharing: 1 } })
      render(
        <FeatureFlagProvider>
          <TestConsumer />
        </FeatureFlagProvider>
      )
      // remote 0 maps to false, remote 1 maps to true
      expect(screen.getByTestId('oauth').textContent).toBe('false')
    })

    it('passes initialFlags', () => {
      defaultMock({ data: null })
      render(
        <FeatureFlagProvider initialFlags={{ oauth_login: false }}>
          <TestConsumer />
        </FeatureFlagProvider>
      )
      expect(screen.getByTestId('oauth').textContent).toBe('false')
    })

    it('propagates isLoading state', () => {
      defaultMock({ isLoading: true })
      render(
        <FeatureFlagProvider>
          <TestConsumer />
        </FeatureFlagProvider>
      )
      expect(screen.getByTestId('loading').textContent).toBe('true')
    })

    it('propagates error state as string', () => {
      defaultMock({ error: new Error('fetch failed') })
      render(
        <FeatureFlagProvider>
          <TestConsumer />
        </FeatureFlagProvider>
      )
      expect(screen.getByTestId('error').textContent).toBe('fetch failed')
    })

    it('handles non-Error error objects', () => {
      defaultMock({ error: 'string error' })
      render(
        <FeatureFlagProvider>
          <TestConsumer />
        </FeatureFlagProvider>
      )
      expect(screen.getByTestId('error').textContent).toBe('string error')
    })
  })

  describe('useFeatureFlags', () => {
    it('throws when used outside FeatureFlagProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function BadComponent() {
        useFeatureFlags()
        return null
      }

      expect(() => render(<BadComponent />)).toThrow('useFeatureFlags must be used within a FeatureFlagProvider')
      consoleSpy.mockRestore()
    })

    it('provides refreshFlags function', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined)
      defaultMock({ refetch })

      function RefreshTest() {
        const { refreshFlags } = useFeatureFlags()
        return <button onClick={refreshFlags}>Refresh</button>
      }

      render(<FeatureFlagProvider><RefreshTest /></FeatureFlagProvider>)
      await user.click(screen.getByText('Refresh'))
      expect(refetch).toHaveBeenCalled()
    })

    it('isEnabled returns true for enabled flags', () => {
      defaultMock()

      function EnabledTest() {
        const { isEnabled } = useFeatureFlags()
        return <span data-testid="result">{String(isEnabled('oauth_login'))}</span>
      }

      render(<FeatureFlagProvider><EnabledTest /></FeatureFlagProvider>)
      expect(screen.getByTestId('result').textContent).toBe('true')
    })

    it('isEnabled returns false for disabled flags', () => {
      defaultMock()

      function DisabledTest() {
        const { isEnabled } = useFeatureFlags()
        return <span data-testid="result">{String(isEnabled('social_job_sharing'))}</span>
      }

      render(<FeatureFlagProvider><DisabledTest /></FeatureFlagProvider>)
      expect(screen.getByTestId('result').textContent).toBe('false')
    })

    it('isEnabled returns false for unknown flags', () => {
      defaultMock()

      function UnknownTest() {
        const { isEnabled } = useFeatureFlags()
        return <span data-testid="result">{String(isEnabled('nonexistent_flag'))}</span>
      }

      render(<FeatureFlagProvider><UnknownTest /></FeatureFlagProvider>)
      expect(screen.getByTestId('result').textContent).toBe('false')
    })

    it('getFlag returns flag value with fallback', () => {
      defaultMock()

      function GetFlagTest() {
        const { getFlag } = useFeatureFlags()
        return (
          <div>
            <span data-testid="known">{String(getFlag('oauth_login'))}</span>
            <span data-testid="unknown">{String(getFlag('unknown', true))}</span>
          </div>
        )
      }

      render(<FeatureFlagProvider><GetFlagTest /></FeatureFlagProvider>)
      expect(screen.getByTestId('known').textContent).toBe('true')
      expect(screen.getByTestId('unknown').textContent).toBe('true')
    })
  })

  describe('useFeatureFlag', () => {
    it('returns boolean value for a flag', () => {
      defaultMock()

      function FlagTest() {
        const value = useFeatureFlag('oauth_login')
        return <span data-testid="value">{String(value)}</span>
      }

      render(<FeatureFlagProvider><FlagTest /></FeatureFlagProvider>)
      expect(screen.getByTestId('value').textContent).toBe('true')
    })

    it('returns false for disabled flag', () => {
      defaultMock()

      function FlagTest() {
        const value = useFeatureFlag('social_job_sharing')
        return <span data-testid="value">{String(value)}</span>
      }

      render(<FeatureFlagProvider><FlagTest /></FeatureFlagProvider>)
      expect(screen.getByTestId('value').textContent).toBe('false')
    })
  })

  describe('useFeatureFlagValue', () => {
    it('returns flag value', () => {
      defaultMock()

      function ValueTest() {
        const val = useFeatureFlagValue('oauth_login')
        return <span data-testid="val">{String(val)}</span>
      }

      render(<FeatureFlagProvider><ValueTest /></FeatureFlagProvider>)
      expect(screen.getByTestId('val').textContent).toBe('true')
    })

    it('uses defaultValue for unknown flags', () => {
      defaultMock()

      function ValueTest() {
        const val = useFeatureFlagValue('home' as any, true)
        return <span data-testid="val">{String(val)}</span>
      }

      render(<FeatureFlagProvider><ValueTest /></FeatureFlagProvider>)
      expect(screen.getByTestId('val').textContent).toBeTruthy()
    })
  })

  describe('FeatureGate', () => {
    it('renders children when flag is enabled', () => {
      defaultMock()

      render(
        <FeatureFlagProvider>
          <FeatureGate flag="oauth_login">
            <div>Protected content</div>
          </FeatureGate>
        </FeatureFlagProvider>
      )
      expect(screen.getByText('Protected content')).toBeTruthy()
    })

    it('hides children when flag is disabled', () => {
      defaultMock()

      render(
        <FeatureFlagProvider>
          <FeatureGate flag="social_job_sharing">
            <div>Hidden content</div>
          </FeatureGate>
        </FeatureFlagProvider>
      )
      expect(screen.queryByText('Hidden content')).toBeNull()
    })

    it('renders fallback when flag is disabled', () => {
      defaultMock()

      render(
        <FeatureFlagProvider>
          <FeatureGate flag="social_job_sharing" fallback={<div>Fallback</div>}>
            <div>Hidden</div>
          </FeatureGate>
        </FeatureFlagProvider>
      )
      expect(screen.getByText('Fallback')).toBeTruthy()
      expect(screen.queryByText('Hidden')).toBeNull()
    })

    it('renders null fallback by default when flag disabled', () => {
      defaultMock()

      const { container } = render(
        <FeatureFlagProvider>
          <FeatureGate flag="social_job_sharing">
            <div>Content</div>
          </FeatureGate>
        </FeatureFlagProvider>
      )
      expect(screen.queryByText('Content')).toBeNull()
    })

    it('shows content when remote flag is enabled', () => {
      defaultMock({ data: { social_job_sharing: 1 } })

      render(
        <FeatureFlagProvider>
          <FeatureGate flag="social_job_sharing">
            <div>Now visible</div>
          </FeatureGate>
        </FeatureFlagProvider>
      )
      expect(screen.getByText('Now visible')).toBeTruthy()
    })
  })

  describe('FeatureFlagLoader', () => {
    it('shows loading spinner when isLoading is true', () => {
      defaultMock({ isLoading: true })

      render(
        <FeatureFlagProvider>
          <FeatureFlagLoader>
            <div>Content</div>
          </FeatureFlagLoader>
        </FeatureFlagProvider>
      )
      expect(screen.getByText('Loading...')).toBeTruthy()
      expect(screen.queryByText('Content')).toBeNull()
    })

    it('renders children when not loading', () => {
      defaultMock({ isLoading: false })

      render(
        <FeatureFlagProvider>
          <FeatureFlagLoader>
            <div>Content</div>
          </FeatureFlagLoader>
        </FeatureFlagProvider>
      )
      expect(screen.getByText('Content')).toBeTruthy()
      expect(screen.queryByText('Loading...')).toBeNull()
    })
  })
})
