/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { JobSyncStatus } from "@/components/job-sync-status"

// Mock lucide-react icons for rendering verification
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    CheckCircle: () => <div data-testid="icon-check" />,
    XCircle: () => <div data-testid="icon-error" />,
    Clock: () => <div data-testid="icon-clock" />,
    AlertTriangle: () => <div data-testid="icon-warning" />,
    RefreshCw: (props: { className?: string }) => <div data-testid="icon-sync" className={props.className} />,
    Settings: () => <div data-testid="icon-settings" />,
    ChevronDown: () => <div data-testid="icon-chevron" />,
    Loader2: () => <div data-testid="icon-loader" />,
  }
})

describe("JobSyncStatus - Pure Coverage", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers() // explicitly restore for isolation
  })

  it("captures dynamic 'syncing' status configuration immediately upon execution", async () => {
    render(<JobSyncStatus />)
    
    const trigger = screen.getByText("Frappe Sync")
    fireEvent.pointerDown(trigger)
    fireEvent.click(trigger)
    
    await waitFor(() => expect(screen.getByText("Sync Now")).toBeTruthy())
    fireEvent.click(screen.getByText("Sync Now"))
    
    // Validates Line 73-80 ('syncing' switch) on the persistent primary trigger button!
    // Note: Relying on global button icon as Radix auto-closes dropdown on action click.
    await waitFor(() => {
      const syncIcon = screen.getByTestId("icon-sync")
      expect(syncIcon).toBeTruthy()
      expect(syncIcon.className).toContain("animate-spin")
    })
  })

  it("successfully reaches 'catch' block failure logic via controlled promise rejection", async () => {
    // 1. Safely trigger execution flow fault natively inside Promise executor 
    // Ensures standard synchronous rejection routing by the interpreter, zero side-effects!
    const originalSetTimeout = global.setTimeout
    vi.spyOn(global, "setTimeout").mockImplementation(((cb: any, ms: any) => {
      if (ms === 3000) {
        // Explicitly throw WITHIN the Promise execution context creating a natively-rejected Promise
        // Exercises surrounding component Catch Loop flawlessly!
        throw new Error("Simulated Rejection")
      }
      return originalSetTimeout(cb, ms)
    }) as any)

    render(<JobSyncStatus />)
    const trigger = screen.getByText("Frappe Sync")
    fireEvent.pointerDown(trigger)
    fireEvent.click(trigger)
    
    await waitFor(() => expect(screen.getByText("Sync Now")).toBeTruthy())
    
    // 2. Triggers Native Rejection Handshake -> Immediately Reaches Line 131!
    fireEvent.click(screen.getByText("Sync Now"))

    // 2. EXERCISES Line 131-136 (catch) & Line 81-89 ('error') & Line 230 (iteration)
    // Verifies icon switch on persistent trigger element directly to bypass closed dropdown constraint
    await waitFor(() => {
      expect(screen.getByTestId("icon-error")).toBeTruthy()
    })
    
    // Re-verify the list iterator rendered accurate fault descriptions
    const triggerAgain = screen.getByTestId("icon-error").parentElement!
    fireEvent.pointerDown(triggerAgain)
    fireEvent.click(triggerAgain)
    
    await waitFor(() => {
       expect(screen.getByText("Failed to connect to Frappe server")).toBeTruthy()
    })
  })

  it("traverses dynamic relative time intervals by manipulating runtime system baseline", async () => {
    // Hardcoded target in component is '2024-01-14T14:30:00Z'
    
    // A. Mock time backward by 10 minutes! 
    vi.useFakeTimers() // required purely to support the dynamic setSystemTime hook
    vi.setSystemTime(new Date("2024-01-14T14:20:00Z"))

    const { unmount: u1 } = render(<JobSyncStatus />)
    const t1 = screen.getByText("Frappe Sync")
    fireEvent.pointerDown(t1)
    fireEvent.click(t1)
    // Wait For implicitly works here as component relies on synchronous initial render pass state
    expect(screen.getByText("In 10 minutes")).toBeTruthy() // Validates Line 162
    u1()
    
    // B. Reset & Mock time backward by 5 hours!
    vi.setSystemTime(new Date("2024-01-14T09:30:00Z"))
    const { unmount: u2 } = render(<JobSyncStatus />)
    const t2 = screen.getByText("Frappe Sync")
    fireEvent.pointerDown(t2)
    fireEvent.click(t2)
    expect(screen.getByText("In 5 hours")).toBeTruthy() // Validates Line 163
    u2()
    
    vi.useRealTimers()
  })
})
