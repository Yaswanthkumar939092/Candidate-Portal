 
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import VerticalTabs from "@/components/vertical-tabs"

// Mock hugeicons
vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: ({ icon }: any) => <div data-testid="hugeicon" data-icon={icon?.name} />
}))

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, variants, custom, ...props }: any) => {
      if (variants) {
        if (typeof variants.enter === 'function') {
          variants.enter(custom || 1)
          variants.enter(-1)
        }
        if (typeof variants.exit === 'function') {
          variants.exit(custom || 1)
          variants.exit(-1)
        }
      }
      return <div {...props}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe("VerticalTabs", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders all service titles", () => {
    render(<VerticalTabs />)
    expect(screen.getByText("Web Design")).toBeTruthy()
    expect(screen.getByText("Framer Development")).toBeTruthy()
    expect(screen.getByText("Branding")).toBeTruthy()
  })

  it("shows description for the active tab only", () => {
    render(<VerticalTabs />)
    // First tab is active by default
    expect(screen.getByText(/Creating beautiful, functional, and user-centric digital experiences/i)).toBeTruthy()

    // Others should not be visible initially (AnimatePresence handles this, but since we mocked it simple, let's see)
    // Actually, in the real component, it's {isActive && ...}
    expect(screen.queryByText(/Building high-performance, animated websites with Framer/i)).toBeNull()
  })

  it("switches tabs on click", () => {
    render(<VerticalTabs />)
    const framerTab = screen.getByText("Framer Development")
    fireEvent.click(framerTab)

    expect(screen.getByText(/Building high-performance, animated websites with Framer/i)).toBeTruthy()
    expect(screen.queryByText(/Creating beautiful, functional, and user-centric digital experiences/i)).toBeNull()
  })

  it("auto-plays to the next tab after duration", () => {
    render(<VerticalTabs />)

    // Initial tab
    expect(screen.getByText("Web Design")).toBeTruthy()

    // Advance timers by 5000ms
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // Should now show second tab description
    expect(screen.getByText(/Building high-performance, animated websites with Framer/i)).toBeTruthy()
  })

  it("pauses auto-play on mouse enter and resumes on mouse leave", () => {
    render(<VerticalTabs />)

    const galleryContainer = screen.getByRole("img", { name: /web design/i }).parentElement?.parentElement?.parentElement
    if (!galleryContainer) throw new Error("Gallery container not found")

    // Mouse enter to pause
    fireEvent.mouseEnter(galleryContainer)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // Should still be on the first tab
    expect(screen.getByText(/Creating beautiful, functional, and user-centric digital experiences/i)).toBeTruthy()

    // Mouse leave to resume
    fireEvent.mouseLeave(galleryContainer)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // Should have advanced now
    expect(screen.getByText(/Building high-performance, animated websites with Framer/i)).toBeTruthy()
  })

  it("navigates using next/prev buttons", () => {
    render(<VerticalTabs />)

    const nextButton = screen.getByLabelText("Next")
    const prevButton = screen.getByLabelText("Previous")

    // Go to next
    fireEvent.click(nextButton)
    expect(screen.getByText(/Building high-performance, animated websites with Framer/i)).toBeTruthy()

    // Go to next again
    fireEvent.click(nextButton)
    expect(screen.getByText(/Defining your brand's visual identity and voice/i)).toBeTruthy()

    // Go back to prev
    fireEvent.click(prevButton)
    expect(screen.getByText(/Building high-performance, animated websites with Framer/i)).toBeTruthy()
  })
})
