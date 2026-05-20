import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import FeatureFlagsPage from '@/app/admin/feature-flags/page'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import type { FeatureFlag, FeatureFlagUpdate } from '@/types/database'
import React from 'react'

// Define interfaces for components to avoid 'any'
interface FeatureToggleProps {
  flag: FeatureFlag
  onUpdate: (id: string, updates: FeatureFlagUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isUpdating: boolean
}

interface SelectProps {
  children: React.ReactNode
  onValueChange?: (value: string) => void
  value?: string
  id?: string
}

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  getCurrentUser: vi.fn(),
}))

// Mock sub-components
vi.mock('@/components/admin-navigation', () => ({
  AdminNavigation: () => <div data-testid="admin-navigation">Admin Navigation</div>,
}))

vi.mock('@/components/feature-toggle', () => ({
  FeatureToggle: ({ flag, onUpdate, onDelete }: FeatureToggleProps) => (
    <div data-testid={`feature-toggle-${flag.id}`}>
      <span>{flag.name}</span>
      <button onClick={() => onUpdate(flag.id, { is_enabled: !flag.is_enabled })}>Toggle</button>
      <button onClick={() => onDelete(flag.id)}>Delete</button>
    </div>
  ),
}))

// Mock UI components
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, ...props }: SelectProps) => (
    <select
      data-testid={props.id || 'mock-select'}
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: ButtonProps) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => <label htmlFor={htmlFor}>{children}</label>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  CardContent: ({ children }: { children: React.ReactNode }) => <article>{children}</article>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: DialogProps) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock window.alert
global.alert = vi.fn()

// Mock fetch
global.fetch = vi.fn()
const mockFetch = global.fetch as Mock

describe('FeatureFlagsPage', () => {
  const mockRouter = {
    push: vi.fn(),
  }

  const mockFlags: FeatureFlag[] = [
    {
      id: '1',
      key: 'flag-1',
      name: 'Flag One',
      description: 'Description 1',
      is_enabled: true,
      default_value: false,
      value_type: 'boolean',
      tags: ['tag1'],
      environments: ['production'],
      rollout_percentage: 100,
      created_by: 'admin-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      key: 'flag-2',
      name: 'Flag Two',
      description: 'Description 2',
      is_enabled: false,
      default_value: false,
      value_type: 'boolean',
      tags: ['tag2'],
      environments: ['staging'],
      rollout_percentage: 50,
      created_by: 'admin-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>)
    mockFetch.mockReset()
    
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'admin-1' } as unknown as Awaited<ReturnType<typeof getCurrentUser>>)
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
    } as unknown as ReturnType<typeof supabase.from>)
    
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, featureFlags: mockFlags })
    } as Response))
  })

  it('renders loading state initially', () => {
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => { }))
    render(<FeatureFlagsPage />)
    expect(screen.getByText('Loading feature flags...')).toBeDefined()
  })

  it('redirects to login if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    render(<FeatureFlagsPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/login'))
  })

  it('redirects to dashboard if user is not an admin', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-1' } as unknown as Awaited<ReturnType<typeof getCurrentUser>>)
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'user' } }),
    } as unknown as ReturnType<typeof supabase.from>)
    render(<FeatureFlagsPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/dashboard'))
  })

  it('loads and displays feature flags for admin user', async () => {
    render(<FeatureFlagsPage />)
    await waitFor(() => expect(screen.getByText('Flag One')).toBeDefined())
    expect(screen.getByText('Flag Two')).toBeDefined()
  })

  it('handles load feature flags error (line 111, 120)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false
    } as Response))

    render(<FeatureFlagsPage />)
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled())
    consoleSpy.mockRestore()
  })

  describe('Filtering', () => {
    it('handles search filtering', async () => {
      render(<FeatureFlagsPage />)
      await waitFor(() => expect(screen.getByText('Flag One')).toBeDefined())

      const searchInput = screen.getByPlaceholderText('Search flags...')
      fireEvent.change(searchInput, { target: { value: 'Flag One' } })
      await waitFor(() => {
        expect(screen.queryByText('Flag Two')).toBeNull()
        expect(screen.getByText('Flag One')).toBeDefined()
      })
    })

    it('handles status filtering', async () => {
      render(<FeatureFlagsPage />)
      await waitFor(() => expect(screen.getByText('Flag One')).toBeDefined())

      const statusSelect = screen.getAllByTestId('mock-select')[0]
      fireEvent.change(statusSelect, { target: { value: 'disabled' } })
      await waitFor(() => {
        expect(screen.queryByText('Flag One')).toBeNull()
        expect(screen.getByText('Flag Two')).toBeDefined()
      })
    })

    it('handles tag filtering', async () => {
      render(<FeatureFlagsPage />)
      await waitFor(() => expect(screen.getByText('Flag One')).toBeDefined())

      const tagSelect = screen.getAllByTestId('mock-select')[1]
      fireEvent.change(tagSelect, { target: { value: 'tag1' } })
      await waitFor(() => {
        expect(screen.queryByText('Flag Two')).toBeNull()
        expect(screen.getByText('Flag One')).toBeDefined()
      })
    })
  })

  it('handles creation with all fields, validation, and cancel (line 179-180, 199-200, 333, 382)', async () => {
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, featureFlags: [] })
    } as Response))

    render(<FeatureFlagsPage />)
    await waitFor(() => screen.getByText('Create Feature Flag'))
    
    // Test Cancel button (line 382)
    fireEvent.click(screen.getByText('Create Feature Flag'))
    await waitFor(() => expect(screen.getByTestId('dialog')).toBeDefined())
    fireEvent.click(screen.getByText('Cancel'))
    await waitFor(() => expect(screen.queryByTestId('dialog')).toBeNull())

    // Open again to test creation
    fireEvent.click(screen.getByText('Create Feature Flag'))
    await waitFor(() => expect(screen.getByTestId('dialog')).toBeDefined())

    fireEvent.change(screen.getByPlaceholderText('oauth_login'), { target: { value: 'new-key' } })
    fireEvent.change(screen.getByPlaceholderText('OAuth Login'), { target: { value: 'New Name' } })
    fireEvent.change(screen.getByPlaceholderText(/Enable OAuth login/i), { target: { value: 'New Description' } })

    const dialogSelects = screen.getAllByTestId('mock-select')
    const valueTypeSelect = dialogSelects[0]
    fireEvent.change(valueTypeSelect, { target: { value: 'string' } })

    fireEvent.change(screen.getByLabelText(/Rollout %/i), { target: { value: '80' } })
    fireEvent.change(screen.getByLabelText(/Tags \(comma-separated\)/i), { target: { value: 't1, t2' } })

    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Custom API Error' })
    } as Response))
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'Create Flag' }))
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Custom API Error')
      expect(consoleSpy).toHaveBeenCalled()
    })
    consoleSpy.mockRestore()

    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, featureFlag: { ...mockFlags[0], name: 'Created Flag' } })
    } as Response))
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'Create Flag' }))

    await waitFor(() => expect(screen.getByText('Created Flag')).toBeDefined())
  })

  it('handles update and delete successes (line 220-223, 246)', async () => {
    render(<FeatureFlagsPage />)
    await waitFor(() => expect(screen.getByText('Flag One')).toBeDefined())

    mockFetch.mockImplementationOnce(() => Promise.resolve({ 
      ok: true, 
      json: () => Promise.resolve({ success: true, featureFlag: { ...mockFlags[0], is_enabled: false } }) 
    } as Response))
    fireEvent.click(screen.getAllByText('Toggle')[0])
    await waitFor(() => expect(screen.getByText('Flag One')).toBeDefined())

    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true } as Response))
    fireEvent.click(screen.getAllByText('Delete')[0])
    await waitFor(() => expect(screen.queryByText('Flag One')).toBeNull())
  })

  it('handles update and delete errors', async () => {
    render(<FeatureFlagsPage />)
    await waitFor(() => screen.getByText('Flag One'))

    mockFetch.mockResolvedValueOnce({ ok: false } as Response)
    fireEvent.click(screen.getAllByText('Toggle')[0])
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Failed to update feature flag'))

    mockFetch.mockResolvedValueOnce({ ok: false } as Response)
    fireEvent.click(screen.getAllByText('Delete')[0])
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Failed to delete feature flag'))
  })

  it('handles page load error', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Auth failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
    render(<FeatureFlagsPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/login'))
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('triggers create dialog from empty state', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, featureFlags: [] })
    } as Response))

    render(<FeatureFlagsPage />)
    await waitFor(() => screen.getByText('No feature flags found'))
    fireEvent.click(screen.getByText('Create Feature Flag'))
    expect(screen.getByTestId('dialog')).toBeDefined()
  })
})
