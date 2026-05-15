import '@testing-library/jest-dom/vitest'

// Polyfill ResizeObserver for Radix UI components
class ResizeObserverMock {
  constructor(_callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver

// Polyfill IntersectionObserver for components that use it
class IntersectionObserverMock {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
globalThis.IntersectionObserver = IntersectionObserverMock as typeof IntersectionObserver

// Mock window.HTMLElement.prototype.scrollIntoView (used by Radix Select)
Element.prototype.scrollIntoView = () => {}

// Mock window.HTMLElement.prototype.hasPointerCapture (used by Radix)
Element.prototype.hasPointerCapture = () => false
Element.prototype.releasePointerCapture = () => {}
Element.prototype.setPointerCapture = () => {}

// Stub matchMedia for responsive component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
// Mock Supabase environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-key'
process.env.NEXT_PUBLIC_FRAPPE_URL = 'http://localhost:8000'
