import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '@/lib/contexts/theme-context'

function ThemeConsumer() {
  const { mode, isDark, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="isDark">{String(isDark)}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  )
}

describe('ThemeContext', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.classList.remove('dark')
  })

  describe('ThemeProvider', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(screen.getByText('Content')).toBeTruthy()
    })

    it('starts in light mode by default', () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('mode').textContent).toBe('light')
    })

    it('isDark is false in light mode', () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('isDark').textContent).toBe('false')
    })

    it('reads saved dark mode from localStorage', () => {
      localStorage.setItem('candidate-portal-theme', 'dark')
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('mode').textContent).toBe('dark')
      expect(screen.getByTestId('isDark').textContent).toBe('true')
    })

    it('defaults to light when localStorage has invalid value', () => {
      localStorage.setItem('candidate-portal-theme', 'invalid')
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('mode').textContent).toBe('light')
    })
  })

  describe('toggleTheme', () => {
    it('toggles from light to dark', async () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('mode').textContent).toBe('light')
      await user.click(screen.getByText('Toggle'))
      expect(screen.getByTestId('mode').textContent).toBe('dark')
    })

    it('toggles from dark back to light', async () => {
      localStorage.setItem('candidate-portal-theme', 'dark')
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      await user.click(screen.getByText('Toggle'))
      expect(screen.getByTestId('mode').textContent).toBe('light')
    })

    it('persists theme to localStorage on toggle', async () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      await user.click(screen.getByText('Toggle'))
      expect(localStorage.getItem('candidate-portal-theme')).toBe('dark')
    })

    it('applies dark class to documentElement on toggle to dark', async () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      await user.click(screen.getByText('Toggle'))
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes dark class from documentElement on toggle to light', async () => {
      localStorage.setItem('candidate-portal-theme', 'dark')
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      await user.click(screen.getByText('Toggle'))
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('sets data-theme attribute on toggle to dark', async () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      await user.click(screen.getByText('Toggle'))
      expect(document.documentElement.getAttribute('data-theme')).toBe('nova-dark')
    })

    it('removes data-theme attribute on toggle to light', async () => {
      localStorage.setItem('candidate-portal-theme', 'dark')
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      )
      await user.click(screen.getByText('Toggle'))
      expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    })
  })

  describe('useTheme hook', () => {
    it('throws when used outside ThemeProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function BadComponent() {
        useTheme()
        return null
      }

      expect(() => render(<BadComponent />)).toThrow('useTheme must be used inside ThemeProvider')
      consoleSpy.mockRestore()
    })

    it('provides mode, isDark, and toggleTheme', () => {
      let capturedContext: ReturnType<typeof useTheme> | null = null

      function Capture() {
        capturedContext = useTheme()
        return null
      }

      render(<ThemeProvider><Capture /></ThemeProvider>)
      expect(capturedContext).toBeTruthy()
      expect(typeof capturedContext!.mode).toBe('string')
      expect(typeof capturedContext!.isDark).toBe('boolean')
      expect(typeof capturedContext!.toggleTheme).toBe('function')
    })
  })

  describe('Dark mode DOM effects', () => {
    it('applies dark theme on initial render when saved as dark', () => {
      localStorage.setItem('candidate-portal-theme', 'dark')
      render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('nova-dark')
    })

    it('does not apply dark class in light mode', () => {
      render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })
})
