import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import OnboardingManagementPage from '@/app/admin/onboarding-management/page'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import React from 'react'

// Define interfaces to avoid 'any'
interface ComponentWithChildren {
  children?: React.ReactNode
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string
  size?: string
}

interface CardProps extends ComponentWithChildren {
  className?: string
}

interface DialogProps extends ComponentWithChildren {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface BadgeProps extends ComponentWithChildren {
  variant?: string
  className?: string
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

// Mock components
vi.mock('@/components/admin-navigation', () => ({
  AdminNavigation: () => <div data-testid="admin-navigation">Admin Navigation</div>,
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: ButtonProps) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: CardProps) => <section className={className}>{children}</section>,
  CardHeader: ({ children }: ComponentWithChildren) => <header>{children}</header>,
  CardTitle: ({ children, className }: CardProps) => <h2 className={className}>{children}</h2>,
  CardContent: ({ children, className }: CardProps) => <div className={className}>{children}</div>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: BadgeProps) => <span className={className}>{children}</span>,
}))

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: ComponentWithChildren) => <table>{children}</table>,
  TableHeader: ({ children }: ComponentWithChildren) => <thead>{children}</thead>,
  TableBody: ({ children }: ComponentWithChildren) => <tbody>{children}</tbody>,
  TableRow: ({ children }: ComponentWithChildren) => <tr>{children}</tr>,
  TableHead: ({ children }: ComponentWithChildren) => <th>{children}</th>,
  TableCell: ({ children, className }: { children?: React.ReactNode; className?: string }) => <td className={className}>{children}</td>,
}))

// Fixed Dialog mock to render children (trigger) even if not open
vi.mock('@/components/ui/dialog', () => {
  let isOpen = false
  return {
    Dialog: ({ children, open }: DialogProps) => {
      isOpen = !!open
      return <div data-testid="dialog-root">{children}</div>
    },
    DialogTrigger: ({ children }: ComponentWithChildren) => <div data-testid="dialog-trigger">{children}</div>,
    DialogContent: ({ children }: ComponentWithChildren) => (isOpen ? <main data-testid="dialog">{children}</main> : null),
    DialogHeader: ({ children }: ComponentWithChildren) => <header>{children}</header>,
    DialogTitle: ({ children }: ComponentWithChildren) => <h1>{children}</h1>,
    DialogDescription: ({ children }: ComponentWithChildren) => <p>{children}</p>,
    DialogFooter: ({ children }: ComponentWithChildren) => <footer>{children}</footer>,
  }
})

// Mock window.alert
global.alert = vi.fn()

// Mock fetch
global.fetch = vi.fn()
const mockFetch = global.fetch as Mock

describe('OnboardingManagementPage', () => {
  const mockRouter = {
    push: vi.fn(),
  }

  const mockRecords = [
    {
      id: 'rec-1',
      user_id: 'user-1',
      status: 'submitted',
      current_step: 3,
      completed_steps: ['step1', 'step2'],
      frappe_employee_id: null,
      submitted_at: '2024-01-01T00:00:00Z',
      approved_at: null,
      pushed_to_frappe_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      profile: {
        id: 'user-1',
        email: 'user1@example.com',
        full_name: 'John Doe',
        lifecycle_stage: 'onboarding',
        avatar_url: null,
      }
    },
    {
      id: 'rec-2',
      user_id: 'user-2',
      status: 'approved',
      current_step: 8,
      completed_steps: ['1', '2', '3', '4', '5', '6', '7', '8'],
      frappe_employee_id: 'EMP-001',
      submitted_at: '2024-01-01T00:00:00Z',
      approved_at: '2024-01-02T00:00:00Z',
      pushed_to_frappe_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      profile: {
        id: 'user-2',
        email: 'user2@example.com',
        full_name: 'Jane Smith',
        lifecycle_stage: 'onboarding',
        avatar_url: null,
      }
    }
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
      json: () => Promise.resolve({ success: true, data: mockRecords })
    } as Response))
  })

  it('renders loading state initially', () => {
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => {}))
    render(<OnboardingManagementPage />)
    expect(screen.getByText(/Loading onboarding/i)).toBeDefined()
  })

  it('redirects to login if not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    render(<OnboardingManagementPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/login'))
  })

  it('redirects to dashboard if not an admin', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'user' } }),
    } as unknown as ReturnType<typeof supabase.from>)
    
    render(<OnboardingManagementPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/dashboard'))
  })

  it('handles page load error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Auth failed'))
    render(<OnboardingManagementPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/login'))
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('loads and displays onboarding records', async () => {
    render(<OnboardingManagementPage />)
    await screen.findByText('John Doe')
    expect(screen.getByText('Jane Smith')).toBeDefined()
    expect(screen.getByText('user1@example.com')).toBeDefined()
    expect(screen.getByText('25%')).toBeDefined() 
    expect(screen.getByText('100%')).toBeDefined() 
  })

  it('handles empty state', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    } as Response))

    render(<OnboardingManagementPage />)
    await screen.findByText('No onboarding records yet')
  })

  it('handles approve workflow', async () => {
    render(<OnboardingManagementPage />)
    const approveBtn = await screen.findByRole('button', { name: /approve/i })
    fireEvent.click(approveBtn)
    
    await waitFor(() => expect(screen.getByTestId('dialog')).toBeDefined())
    
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true } as Response))
    fireEvent.click(within(screen.getByTestId('dialog')).getByRole('button', { name: /approve/i }))
    
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/user-1'), expect.objectContaining({ method: 'PUT' })))
  })

  it('handles reject workflow', async () => {
    render(<OnboardingManagementPage />)
    const rejectBtn = await screen.findByRole('button', { name: /reject/i })
    fireEvent.click(rejectBtn)
    
    await waitFor(() => expect(screen.getByTestId('dialog')).toBeDefined())
    
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true } as Response))
    fireEvent.click(within(screen.getByTestId('dialog')).getByRole('button', { name: /reject/i }))
    
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/user-1'), expect.objectContaining({ method: 'PUT' })))
  })

  it('handles create employee workflow', async () => {
    render(<OnboardingManagementPage />)
    const createBtn = await screen.findByRole('button', { name: /create employee/i })
    fireEvent.click(createBtn)
    
    await waitFor(() => expect(screen.getByTestId('dialog')).toBeDefined())
    
    mockFetch.mockImplementationOnce(() => Promise.resolve({ 
      ok: true,
      json: () => Promise.resolve({ data: { frappe_employee_id: 'EMP-999' } })
    } as Response))
    fireEvent.click(within(screen.getByTestId('dialog')).getByRole('button', { name: /create employee/i }))
    
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('EMP-999')))
  })

  it('handles action errors', async () => {
    render(<OnboardingManagementPage />)
    const approveBtn = await screen.findByRole('button', { name: /approve/i })
    fireEvent.click(approveBtn)
    
    mockFetch.mockImplementationOnce(() => Promise.resolve({ 
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to approve' })
    } as Response))
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fireEvent.click(within(screen.getByTestId('dialog')).getByRole('button', { name: /approve/i }))
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to approve')
      expect(consoleSpy).toHaveBeenCalled()
    })
    consoleSpy.mockRestore()
  })
})
