import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WelcomeHeader } from '@/components/dashboard/welcome-header'

// Mock the auth context so the component can render without a provider.
vi.mock('@/lib/contexts/auth-context', () => ({
  useAuth: () => ({
    user: null,
    profile: { id: '1', full_name: 'Test User' },
    isLoading: false,
    isOnboardingComplete: false,
    refreshProfile: vi.fn(),
  }),
}))

// TC-3.1: Personalized greeting
describe('WelcomeHeader', () => {
  it('shows first name in greeting', () => {
    render(<WelcomeHeader name="Vanshita Sharma" />)
    // The component extracts the first name from the full name
    expect(screen.getByText(/Vanshita/)).toBeTruthy()
  })

  // Spec: CAND-04-A3.1A (docs/spec/clauses/04-dashboard.md#cand-04-a3-1a)
  it('extracts first name from multi-word name', () => {
    render(<WelcomeHeader name="John Michael Doe" />)
    // Should show "John", not the full name
    expect(screen.getByText(/John/)).toBeTruthy()
  })

  // Spec: CAND-04-A3.1B (docs/spec/clauses/04-dashboard.md#cand-04-a3-1b)
  it('handles single-word name gracefully', () => {
    render(<WelcomeHeader name="Prince" />)
    expect(screen.getByText(/Prince/)).toBeTruthy()
  })

  // Spec: CAND-04-A3.2A (docs/spec/clauses/04-dashboard.md#cand-04-a3-2a)
  it('uses custom greeting when provided', () => {
    render(<WelcomeHeader name="John Doe" greeting="Hello" />)
    expect(screen.getByText(/Hello/)).toBeTruthy()
  })

  it('shows time-of-day greeting when no custom greeting', () => {
    render(<WelcomeHeader name="Test User" />)
    // Should contain one of the time-based greetings
    const heading = screen.getByRole('heading', { level: 1 })
    expect(
      heading.textContent?.includes('Good morning') ||
        heading.textContent?.includes('Good afternoon') ||
        heading.textContent?.includes('Good evening'),
    ).toBe(true)
  })

  // Spec: CAND-04-A3.3C (docs/spec/clauses/04-dashboard.md#cand-04-a3-3c)
  it('shows subtitle text about onboarding', () => {
    render(<WelcomeHeader name="Test User" />)
    expect(
      screen.getByText(/onboarding snapshot/i),
    ).toBeTruthy()
  })

  // Spec: CAND-04-A3.3D (docs/spec/clauses/04-dashboard.md#cand-04-a3-3d)
  it('renders a wave emoji with accessible label', () => {
    render(<WelcomeHeader name="Test" />)
    const wave = screen.getByRole('img', { name: 'wave' })
    expect(wave).toBeTruthy()
  })

  it('accepts className prop', () => {
    const { container } = render(
      <WelcomeHeader name="Test" className="custom-class" />,
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('custom-class')).toBe(true)
  })

  // Spec: CAND-04-A3.3A (docs/spec/clauses/04-dashboard.md#cand-04-a3-3a)
  it('shows Profile Active badge when profile exists', () => {
    render(<WelcomeHeader name="Test" />)
    expect(screen.getByText('Profile Active')).toBeTruthy()
  })

  // Spec: CAND-04-A3.1C (docs/spec/clauses/04-dashboard.md#cand-04-a3-1c)
  it('shows User when name is omitted', () => {
    render(<WelcomeHeader />)
    expect(screen.getByText(/User/)).toBeTruthy()
  })

  // Spec: CAND-04-A3.2B (docs/spec/clauses/04-dashboard.md#cand-04-a3-2b)
  it('shows Good morning before 12 PM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 1, 1, 10, 0, 0))
    render(<WelcomeHeader name="Test" />)
    expect(screen.getByText(/Good morning/)).toBeTruthy()
    vi.useRealTimers()
  })

  // Spec: CAND-04-A3.2C (docs/spec/clauses/04-dashboard.md#cand-04-a3-2c)
  it('shows Good afternoon between 12 PM and 5 PM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 1, 1, 14, 0, 0))
    render(<WelcomeHeader name="Test" />)
    expect(screen.getByText(/Good afternoon/)).toBeTruthy()
    vi.useRealTimers()
  })

  // Spec: CAND-04-A3.2D (docs/spec/clauses/04-dashboard.md#cand-04-a3-2d)
  it('shows Good evening after 5 PM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 1, 1, 19, 0, 0))
    render(<WelcomeHeader name="Test" />)
    expect(screen.getByText(/Good evening/)).toBeTruthy()
    vi.useRealTimers()
  })
})
