import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import FrappeEnvironmentsPage from '@/app/admin/frappe-environments/page'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import type { FrappeEnvironment } from '@/types/database'
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

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: LabelProps) => <label htmlFor={htmlFor}>{children}</label>,
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

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: DialogProps) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogTrigger: ({ children }: ComponentWithChildren) => <>{children}</>,
  DialogContent: ({ children }: ComponentWithChildren) => <main>{children}</main>,
  DialogHeader: ({ children }: ComponentWithChildren) => <header>{children}</header>,
  DialogTitle: ({ children }: ComponentWithChildren) => <h1>{children}</h1>,
  DialogDescription: ({ children }: ComponentWithChildren) => <p>{children}</p>,
  DialogFooter: ({ children }: ComponentWithChildren) => <footer>{children}</footer>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: BadgeProps) => <span className={className}>{children}</span>,
}))

// Mock window.alert
global.alert = vi.fn()

// Mock fetch
global.fetch = vi.fn()
const mockFetch = global.fetch as Mock

describe('FrappeEnvironmentsPage', () => {
  const mockRouter = {
    push: vi.fn(),
  }

  const mockEnvs: FrappeEnvironment[] = [
    {
      id: 'env-1',
      environment_key: 'DEV',
      label: 'Dev Server',
      frappe_url: 'https://dev.example.com',
      is_active: true,
      last_connection_status: 'connected',
      last_connection_test_at: '2024-01-01T00:00:00Z',
      api_key: 'key-1',
      api_secret: 'secret-1',
      username: 'user-1',
      password: 'pass-1',
      webhook_secret: 'wh-1',
      auto_sync_enabled: true,
      sync_interval_hours: 24,
      created_by: 'admin-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'env-2',
      environment_key: 'PROD',
      label: 'Prod Server',
      frappe_url: 'https://erp.example.com',
      is_active: false,
      last_connection_status: 'failed',
      last_connection_test_at: '2024-01-01T00:00:00Z',
      api_key: null,
      api_secret: null,
      username: 'admin',
      password: 'password',
      webhook_secret: null,
      auto_sync_enabled: false,
      sync_interval_hours: 12,
      created_by: 'admin-1',
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
      json: () => Promise.resolve({ success: true, data: mockEnvs })
    } as Response))
  })

  it('renders loading state initially', () => {
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => {}))
    render(<FrappeEnvironmentsPage />)
    expect(screen.getByText('Loading environments...')).toBeDefined()
  })

  it('redirects to login if not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    render(<FrappeEnvironmentsPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/login'))
  })

  it('redirects to dashboard if not an admin', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'user' } }),
    } as unknown as ReturnType<typeof supabase.from>)
    
    render(<FrappeEnvironmentsPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/dashboard'))
  })

  it('handles page load error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Auth failed'))
    render(<FrappeEnvironmentsPage />)
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/login'))
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('loads and displays environments', async () => {
    render(<FrappeEnvironmentsPage />)
    await waitFor(() => expect(screen.getByText('Dev Server')).toBeDefined())
    expect(screen.getByText('Prod Server')).toBeDefined()
  })

  it('handles load environments error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: false } as Response))
    render(<FrappeEnvironmentsPage />)
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('No environments configured')).toBeDefined())
    consoleSpy.mockRestore()
  })

  it('handles environment creation workflows', async () => {
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    } as Response))

    render(<FrappeEnvironmentsPage />)
    
    // Wait for empty state
    await waitFor(() => expect(screen.getByText('No environments configured')).toBeDefined())
    
    // Test Cancel
    fireEvent.click(screen.getAllByText('Add Environment')[0])
    await waitFor(() => expect(screen.getByTestId('dialog')).toBeDefined())
    fireEvent.click(screen.getByText('Cancel'))
    await waitFor(() => expect(screen.queryByTestId('dialog')).toBeNull())

    // Success path
    fireEvent.click(screen.getAllByText('Add Environment')[0])
    await waitFor(() => expect(screen.getByTestId('dialog')).toBeDefined())

    fireEvent.change(screen.getByTestId('mock-select'), { target: { value: 'UAT' } })
    fireEvent.change(screen.getByPlaceholderText('My Dev Server'), { target: { value: 'New Server' } })
    fireEvent.change(screen.getByPlaceholderText('https://erp.example.com'), { target: { value: 'https://uat.example.com' } })
    
    const inputs = screen.getAllByPlaceholderText('Optional')
    fireEvent.change(inputs[0], { target: { value: 'key-new' } })    
    fireEvent.change(inputs[1], { target: { value: 'secret-new' } }) 
    fireEvent.change(inputs[2], { target: { value: 'user-new' } })   
    fireEvent.change(inputs[3], { target: { value: 'pass-new' } })   

    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response))

    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/admin/frappe-environments', expect.objectContaining({ method: 'POST' })))

    // Error path (re-open dialog for error test)
    fireEvent.click(screen.getAllByText('Add Environment')[0])
    await waitFor(() => expect(screen.getByTestId('dialog')).toBeDefined())

    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Creation failed' })
    } as Response))
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Creation failed')
      expect(consoleSpy).toHaveBeenCalled()
    })
    consoleSpy.mockRestore()
  })

  it('handles connection testing and activation', async () => {
    render(<FrappeEnvironmentsPage />)
    await waitFor(() => expect(screen.getByText('Dev Server')).toBeDefined())

    // Success
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { success: true, response_time_ms: 123 } })
    } as Response))
    fireEvent.click(screen.getAllByText('Test Connection')[0])
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Connection successful! Response time: 123ms'))

    // Failure
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: false, data: { error: 'Time out' } })
    } as Response))
    fireEvent.click(screen.getAllByText('Test Connection')[0])
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Connection failed: Time out'))

    // Catch
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fireEvent.click(screen.getAllByText('Test Connection')[0])
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Failed to test connection'))
    consoleSpy.mockRestore()

    // Activation
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true } as Response))
    fireEvent.click(screen.getByText('Set Active'))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/activate'), expect.objectContaining({ method: 'POST' })))
  })

  it('displays correct status and auth labels', async () => {
    const envs: FrappeEnvironment[] = [
      { ...mockEnvs[0], last_connection_status: 'connected', api_key: 'key' },
      { ...mockEnvs[1], last_connection_status: 'failed', api_key: null, username: 'user' },
      { ...mockEnvs[1], id: 'env-3', last_connection_status: null, api_key: null, username: null }
    ]
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: envs })
    } as Response))

    render(<FrappeEnvironmentsPage />)
    await waitFor(() => expect(screen.getByText('Dev Server')).toBeDefined())
    
    expect(screen.getByText('Connected')).toBeDefined()
    expect(screen.getByText('Failed')).toBeDefined()
    expect(screen.getByText('Not tested')).toBeDefined()
    expect(screen.getByText('API Key')).toBeDefined()
    expect(screen.getByText('Username/Password')).toBeDefined()
    expect(screen.getByText('None')).toBeDefined()
  })
})
