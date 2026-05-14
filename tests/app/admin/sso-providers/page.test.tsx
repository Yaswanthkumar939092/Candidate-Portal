import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import SSOProvidersPage from '@/app/admin/sso-providers/page'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import type { SSOProvider } from '@/types/database'
import React from 'react'

// Define interfaces to avoid 'any'
interface ComponentWithChildren {
  children?: React.ReactNode
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string
  size?: string
}

interface LabelProps extends ComponentWithChildren {
  htmlFor?: string
}

interface SelectProps extends ComponentWithChildren {
  onValueChange?: (value: string) => void
  value?: string
}

interface DialogProps extends ComponentWithChildren {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface CardProps extends ComponentWithChildren {
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

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: LabelProps) => <label htmlFor={htmlFor}>{children}</label>,
}))

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void; id?: string }) => (
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)} id={id} data-testid="mock-switch" />
  ),
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

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: CardProps) => <section className={className}>{children}</section>,
  CardHeader: ({ children }: ComponentWithChildren) => <header>{children}</header>,
  CardTitle: ({ children, className }: CardProps) => <h2 className={className}>{children}</h2>,
  CardDescription: ({ children, className }: CardProps) => <p className={className}>{children}</p>,
  CardContent: ({ children, className }: CardProps) => <div className={className}>{children}</div>,
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
    DialogContent: ({ children }: ComponentWithChildren) => (isOpen ? <main data-testid="dialog-content">{children}</main> : null),
    DialogHeader: ({ children }: ComponentWithChildren) => <header>{children}</header>,
    DialogTitle: ({ children }: ComponentWithChildren) => <h1>{children}</h1>,
    DialogDescription: ({ children }: ComponentWithChildren) => <p>{children}</p>,
    DialogFooter: ({ children }: ComponentWithChildren) => <footer>{children}</footer>,
  }
})

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children?: React.ReactNode; className?: string; variant?: string }) => <span className={className}>{children}</span>,
}))

// Mock window.alert
global.alert = vi.fn()
global.confirm = vi.fn(() => true)

// Mock fetch
global.fetch = vi.fn()
const mockFetch = global.fetch as Mock

describe('SSOProvidersPage', () => {
  const mockRouter = {
    push: vi.fn(),
  }

  const mockProviders: SSOProvider[] = [
    {
      id: 'p-1',
      provider_type: 'frappe_sso',
      name: 'My Frappe SSO',
      is_enabled: true,
      config: { frappe_url: 'https://erp.example.com', client_id: 'abc' },
      email_domain_restriction: ['example.com'],
      auto_create_profile: true,
      default_role: 'candidate',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'p-2',
      provider_type: 'oidc',
      name: 'Google OIDC',
      is_enabled: false,
      config: { issuer_url: 'https://accounts.google.com' },
      email_domain_restriction: [],
      auto_create_profile: false,
      default_role: 'candidate',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
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
      json: () => Promise.resolve({ success: true, data: mockProviders })
    } as Response))
  })

  it('renders loading state initially', () => {
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => {}))
    render(<SSOProvidersPage />)
    expect(screen.getByText(/Loading SSO providers/i)).toBeDefined()
  })

  it('loads and displays SSO providers', async () => {
    render(<SSOProvidersPage />)
    await screen.findByText('My Frappe SSO')
    expect(screen.getByText('Google OIDC')).toBeDefined()
    expect(screen.getByText('frappe_url:')).toBeDefined()
    expect(screen.getByText('example.com')).toBeDefined()
  })

  it('handles JSON parse error in config (line 123)', async () => {
    render(<SSOProvidersPage />)
    const addBtn = await screen.findByText('Add Provider')
    fireEvent.click(addBtn)
    
    const configTextarea = screen.getByLabelText(/Configuration/i)
    fireEvent.change(configTextarea, { target: { value: '{ invalid: json }' } })
    
    fireEvent.click(screen.getByText('Create Provider'))
    expect(global.alert).toHaveBeenCalledWith('Invalid JSON in config field')
  })

  it('handles creation with domain restrictions (line 127-142)', async () => {
    render(<SSOProvidersPage />)
    const addBtn = await screen.findByText('Add Provider')
    fireEvent.click(addBtn)

    fireEvent.change(screen.getByLabelText(/Display Name/i), { target: { value: 'New Provider' } })
    fireEvent.change(screen.getByLabelText(/Email Domain Restriction/i), { target: { value: 'test.com, other.org' } })
    
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response))

    fireEvent.click(screen.getByText('Create Provider'))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/sso-providers', expect.objectContaining({
        body: expect.stringContaining('"email_domain_restriction":["test.com","other.org"]')
      }))
    })
  })

  it('handles toggle enabled (line 160-173)', async () => {
    render(<SSOProvidersPage />)
    await screen.findByText('My Frappe SSO')
    
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true } as Response))
    const switches = screen.getAllByTestId('mock-switch')
    fireEvent.click(switches[0])
    
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/p-1'), expect.objectContaining({ method: 'PUT' })))
  })

  it('handles deletion (line 175-189)', async () => {
    render(<SSOProvidersPage />)
    await screen.findByText('My Frappe SSO')
    
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true } as Response))
    const deleteBtns = await screen.findAllByRole('button')
    const deleteBtn = deleteBtns.find(b => b.innerHTML.includes('lucide-trash2'))
    if (deleteBtn) fireEvent.click(deleteBtn)
    
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/p-1'), expect.objectContaining({ method: 'DELETE' })))
  })

  it('handles page load error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Auth failed'))
    render(<SSOProvidersPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/login'))
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
