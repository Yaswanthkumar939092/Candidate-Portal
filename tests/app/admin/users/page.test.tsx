import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AdminUsersPage from '@/app/admin/users/page'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import type { Profile } from '@/types/database'
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

interface SelectProps extends ComponentWithChildren {
  onValueChange?: (value: string) => void
  value?: string
}

interface UserManagementTableProps {
  users: Profile[]
  onRoleChange: (userId: string, newRole: 'candidate' | 'admin' | 'super_admin') => void
  onActivateUser: (userId: string) => void
  onDeactivateUser: (userId: string) => void
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

vi.mock('@/components/user-management-table', () => ({
  UserManagementTable: ({ users, onRoleChange, onActivateUser, onDeactivateUser }: UserManagementTableProps) => (
    <div data-testid="user-table">
      {users.map((u: Profile) => (
        <div key={u.id}>
          <span>{u.full_name}</span>
          <button onClick={() => onRoleChange(u.id, 'admin')}>Change Role</button>
          <button onClick={() => onActivateUser(u.id)}>Activate</button>
          <button onClick={() => onDeactivateUser(u.id)}>Deactivate</button>
        </div>
      ))}
    </div>
  ),
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: ButtonProps) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children?: React.ReactNode; className?: string; variant?: string }) => <span className={className}>{children}</span>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: CardProps) => <section className={className}>{children}</section>,
  CardHeader: ({ children }: ComponentWithChildren) => <header>{children}</header>,
  CardTitle: ({ children, className }: CardProps) => <h2 className={className}>{children}</h2>,
  CardContent: ({ children, className }: CardProps) => <div className={className}>{children}</div>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: SelectProps) => (
    <select value={value} onChange={(e) => onValueChange && onValueChange(e.target.value)} data-testid="mock-select">
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: ComponentWithChildren) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: ComponentWithChildren) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
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

describe('AdminUsersPage', () => {
  const mockRouter = {
    push: vi.fn(),
  }

  const mockProfiles: Profile[] = [
    {
      id: 'u-1',
      email: 'user1@example.com',
      full_name: 'User One',
      role: 'candidate',
      lifecycle_stage: 'candidate',
      avatar_url: null,
      phone: null,
      location: null,
      bio: null,
      skills: [],
      experience_level: 'entry',
      preferred_salary_min: null,
      preferred_salary_max: null,
      preferred_job_types: [],
      provider: null,
      frappe_employee_id: null,
      is_internal_employee: false,
      email_domain: 'example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'u-2',
      email: 'user2@example.com',
      full_name: 'User Two',
      role: 'admin',
      lifecycle_stage: 'employee',
      avatar_url: null,
      phone: null,
      location: null,
      bio: null,
      skills: [],
      experience_level: 'mid',
      preferred_salary_min: null,
      preferred_salary_max: null,
      preferred_job_types: [],
      provider: null,
      frappe_employee_id: 'EMP-002',
      is_internal_employee: true,
      email_domain: 'example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>)
    
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'admin-1' } as unknown as Awaited<ReturnType<typeof getCurrentUser>>)
    
    // Mock Supabase chain
    const mockSupabaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as unknown as ReturnType<typeof supabase.from>)

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn()
  })

  it('renders loading state initially', () => {
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => {}))
    render(<AdminUsersPage />)
    expect(screen.getByText(/Loading users/i)).toBeDefined()
  })

  it('loads and displays user stats and table', async () => {
    // Mock count for stats
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ count: 10, data: mockProfiles }),
    } as unknown as ReturnType<typeof supabase.from>).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
    } as unknown as ReturnType<typeof supabase.from>)

    render(<AdminUsersPage />)
    await screen.findByText('User One')
    expect(screen.getByText('User Two')).toBeDefined()
  })

  it('handles filter changes (search and role)', async () => {
    render(<AdminUsersPage />)
    const searchInput = await screen.findByPlaceholderText(/Search by name/i)
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles')
    })
  })

  it('handles user export (line 171-193)', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')
    
    render(<AdminUsersPage />)
    const exportBtn = await screen.findByRole('button', { name: /export/i })
    fireEvent.click(exportBtn)
    
    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
    
    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('redirects if not admin', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }), // No profile
    } as unknown as ReturnType<typeof supabase.from>)
    
    render(<AdminUsersPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/dashboard'))
  })

  it('handles page load error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Auth failed'))
    render(<AdminUsersPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/login'))
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
