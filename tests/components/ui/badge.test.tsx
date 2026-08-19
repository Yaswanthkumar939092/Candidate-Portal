import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { Badge } from "@/components/ui/badge"

describe("Badge", () => {
  it("renders correctly with default variant", () => {
    const { container } = render(<Badge>Test Badge</Badge>)
    expect(container.firstChild).toHaveClass("bg-primary")
    expect(container.firstChild?.nodeName).toBe("SPAN")
  })

  it("handles different variants", () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>)
    expect(container.firstChild).toHaveClass("bg-destructive")
  })

  it("uses Slot when asChild is true", () => {
    // When asChild is true, Badge passes its props and classes to its child
    // rather than rendering a span
    const { container } = render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>
    )
    expect(container.firstChild?.nodeName).toBe("A")
    expect(container.firstChild).toHaveAttribute("href", "/test")
    expect(container.firstChild).toHaveClass("bg-primary")
  })
})
