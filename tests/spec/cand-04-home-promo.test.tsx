import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const h = vi.hoisted(() => ({ reduced: { value: false }, content: vi.fn() }))

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
  useReducedMotion: () => h.reduced.value,
}))
vi.mock("@/lib/services/home", () => ({ homeService: { getHomeContent: h.content } }))

import { HomePromo } from "@/components/home/home-promo"
import { PromoCarousel } from "@/components/home/promo-carousel"

const slide = (n: number) => ({ tag: n === 1 ? "" : `Tag ${n}`, title: `Slide ${n}`, body: `Body ${n}`, image: null, image_alt: null, artwork_key: "learners" as const })
const slides = [slide(1), slide(2), slide(3)]

const off = {
  hero: { enabled: false, eyebrow: "", heading: "", body: "", image: null, image_alt: null, artwork_key: null, stats: [] },
  carousel: { enabled: false, interval: 0, slides: [] },
  values: { enabled: false, heading: "", subheading: "", cards: [] },
}

function promo(fallback?: React.ReactNode) {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <HomePromo fallback={fallback} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  h.reduced.value = false
  h.content.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("home promo (characterization)", () => {
  // Spec: CAND-04-A7.1D (docs/spec/clauses/04-dashboard.md#cand-04-a7-1d)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the loading skeleton while content loads, the fallback when every section is off or the request fails, and nothing when there is no fallback", async () => {
    h.content.mockReturnValue(new Promise(() => {}))
    const a = promo(<p>fallback text</p>)
    expect(a.container.querySelector('[aria-label="Loading company highlights"]')).toBeTruthy()
    expect(screen.queryByText("fallback text")).toBeNull()
    a.unmount()

    h.content.mockResolvedValue(off)
    const b = promo(<p>fallback text</p>)
    await waitFor(() => expect(screen.getByText("fallback text")).toBeTruthy())
    b.unmount()

    h.content.mockRejectedValue(new Error("guest api down"))
    const c = promo(<p>fallback text</p>)
    await waitFor(() => expect(screen.getByText("fallback text")).toBeTruthy())
    expect(h.content).toHaveBeenCalledTimes(3)
    c.unmount()

    h.content.mockResolvedValue(off)
    const d = promo()
    await waitFor(() => expect(d.container.querySelector('[aria-label="Loading company highlights"]')).toBeNull())
    expect(d.container.textContent).toBe("")
  })

  // Spec: CAND-04-A7.1E (docs/spec/clauses/04-dashboard.md#cand-04-a7-1e)
  // Characterization: pins current behaviour, not endorsed.
  it("renders only the values section, with the sparkles icon fallback for a card without an icon, when only values are enabled", async () => {
    h.content.mockResolvedValue({
      ...off,
      values: { enabled: true, heading: "Values heading", subheading: "Values sub", cards: [{ title: "Card A", description: "Desc A", icon: null }] },
    })
    const view = promo(<p>fallback text</p>)
    await waitFor(() => expect(screen.getByText("Values heading")).toBeTruthy())
    expect(screen.getByText("Card A")).toBeTruthy()
    expect(screen.queryByText("fallback text")).toBeNull()
    expect(view.container.querySelector('[aria-label="Company highlights"]')).toBeNull()
    expect(view.container.querySelector("svg.lucide-sparkles")).toBeTruthy()
  })
})

describe("promo carousel (characterization)", () => {
  // Spec: CAND-04-A7.2C (docs/spec/clauses/04-dashboard.md#cand-04-a7-2c)
  // Characterization: pins current behaviour, not endorsed.
  it("advances on its interval, wraps to the first slide, and pauses while the pointer is over it", () => {
    vi.useFakeTimers()
    render(<PromoCarousel carousel={{ enabled: true, interval: 1000, slides }} />)
    expect(screen.getByText("Slide 1")).toBeTruthy()
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText("Slide 2")).toBeTruthy()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByText("Slide 1")).toBeTruthy()

    const region = screen.getByRole("region", { name: "Company highlights" })
    fireEvent.mouseEnter(region)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText("Slide 1")).toBeTruthy()
    fireEvent.mouseLeave(region)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText("Slide 2")).toBeTruthy()
  })

  // Spec: CAND-04-A7.2D (docs/spec/clauses/04-dashboard.md#cand-04-a7-2d)
  // Characterization: pins current behaviour, not endorsed.
  it("does not autoplay for a zero interval, a single slide or a reduced-motion preference", () => {
    vi.useFakeTimers()
    const zero = render(<PromoCarousel carousel={{ enabled: true, interval: 0, slides }} />)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(screen.getByText("Slide 1")).toBeTruthy()
    zero.unmount()

    const one = render(<PromoCarousel carousel={{ enabled: true, interval: 1000, slides: slides.slice(0, 1) }} />)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(screen.getByText("Slide 1")).toBeTruthy()
    one.unmount()

    h.reduced.value = true
    render(<PromoCarousel carousel={{ enabled: true, interval: 1000, slides }} />)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(screen.getByText("Slide 1")).toBeTruthy()
  })

  // Spec: CAND-04-A7.2E (docs/spec/clauses/04-dashboard.md#cand-04-a7-2e)
  // Characterization: pins current behaviour, not endorsed.
  it("jumps to a slide from its dot, marks only that dot current, and renders nothing for an empty slide list", () => {
    const view = render(<PromoCarousel carousel={{ enabled: true, interval: 0, slides }} />)
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 3" }))
    expect(screen.getByText("Slide 3")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Go to slide 3" }).getAttribute("aria-current")).toBe("true")
    expect(screen.getByRole("button", { name: "Go to slide 1" }).getAttribute("aria-current")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }))
    expect(screen.getByText("Slide 1")).toBeTruthy()
    view.unmount()

    const empty = render(<PromoCarousel carousel={{ enabled: true, interval: 1000, slides: [] }} />)
    expect(empty.container.firstChild).toBeNull()
  })
})
