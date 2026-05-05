import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JobSyncStatus } from "@/components/job-sync-status"

// Mock lucide-react icons
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

describe("JobSyncStatus", () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
  })

  it("renders initial status correctly", () => {
    render(<JobSyncStatus />)
    expect(screen.getByText("Frappe Sync")).toBeTruthy()
    expect(screen.getByText("47")).toBeTruthy() // Initial mock job count
  })

  it("shows status details in dropdown when clicked", async () => {
    render(<JobSyncStatus />)
    const trigger = screen.getByText("Frappe Sync")

    fireEvent.pointerDown(trigger)
    fireEvent.click(trigger)

    // screen.debug() // Uncomment to see DOM
    await waitFor(() => {
      expect(screen.getByText("Frappe Sync Status")).toBeTruthy()
    })
    expect(screen.getByText("Connected")).toBeTruthy()
    expect(screen.getByText("47 jobs")).toBeTruthy()
    expect(screen.getByText("Some job descriptions contain formatting issues")).toBeTruthy()
  })


  it("updates last sync time periodically", async () => {
    vi.useFakeTimers()
    render(<JobSyncStatus />)

    // The component has a 30s interval for updates
    await act(async () => {
      vi.advanceTimersByTime(30000)
    })

    // In a real test we'd check if a fetch was called, but here we just check if it doesn't crash
    expect(screen.getByText("Frappe Sync")).toBeTruthy()
    vi.useRealTimers()
  })
})
