import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CircularProgress } from './circular-progress'

describe('CircularProgress', () => {
  // TC-3.6: SVG rendering
  it('renders an SVG element', () => {
    const { container } = render(<CircularProgress value={50} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders two circle elements (track + progress arc)', () => {
    const { container } = render(<CircularProgress value={50} />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(2)
  })

  // The percentage label uses clampedValue (not animatedValue), so it
  // immediately shows the target value regardless of animation state.
  it('displays percentage text immediately', () => {
    render(<CircularProgress value={75} />)
    expect(screen.getByText('75%')).toBeTruthy()
  })

  it('renders 0% correctly', () => {
    render(<CircularProgress value={0} />)
    expect(screen.getByText('0%')).toBeTruthy()
  })

  it('renders 100% correctly', () => {
    render(<CircularProgress value={100} />)
    expect(screen.getByText('100%')).toBeTruthy()
  })

  it('clamps values above 100 to 100', () => {
    render(<CircularProgress value={150} />)
    expect(screen.getByText('100%')).toBeTruthy()
  })

  it('clamps values below 0 to 0', () => {
    render(<CircularProgress value={-20} />)
    expect(screen.getByText('0%')).toBeTruthy()
  })

  it('accepts custom size and sets SVG dimensions', () => {
    const { container } = render(
      <CircularProgress value={50} size={200} strokeWidth={12} />,
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('200')
    expect(svg?.getAttribute('height')).toBe('200')
  })

  it('uses default size of 120 when not specified', () => {
    const { container } = render(<CircularProgress value={50} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('120')
    expect(svg?.getAttribute('height')).toBe('120')
  })

  it('accepts className prop for styling', () => {
    const { container } = render(
      <CircularProgress value={50} className="my-custom-class" />,
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('my-custom-class')).toBe(true)
  })
})
