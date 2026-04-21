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

  it('extracts first name from multi-word name', () => {
    render(<WelcomeHeader name="John Michael Doe" />)
    // Should show "John", not the full name
    expect(screen.getByText(/John/)).toBeTruthy()
  })

  it('handles single-word name gracefully', () => {
    render(<WelcomeHeader name="Prince" />)
    expect(screen.getByText(/Prince/)).toBeTruthy()
  })

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

  it('shows subtitle text about onboarding', () => {
    render(<WelcomeHeader name="Test User" />)
    expect(
      screen.getByText(/onboarding snapshot/i),
    ).toBeTruthy()
  })

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

  it('shows Profile Active badge when profile exists', () => {
    render(<WelcomeHeader name="Test" />)
    expect(screen.getByText('Profile Active')).toBeTruthy()
  })
})
