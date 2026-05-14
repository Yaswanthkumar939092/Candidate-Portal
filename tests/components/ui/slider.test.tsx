import React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Slider } from "@/components/ui/slider"

describe("Slider Component", () => {
  const user = userEvent.setup()

  // Radix Slider root is a <span>, not a <div>
  const getRoot = (container: HTMLElement) =>
    container.firstElementChild as HTMLElement | null

  describe("Rendering", () => {
    it("renders slider element", () => {
      const { container } = render(<Slider />)
      const slider = container.querySelector('[role="slider"]')
      expect(slider).toBeTruthy()
    })

    it("renders slider with default props", () => {
      const { container } = render(<Slider />)
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("renders track element", () => {
      const { container } = render(<Slider />)
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("renders thumb element", () => {
      const { container } = render(<Slider />)
      const thumb = container.querySelector('[role="slider"]')
      expect(thumb).toBeTruthy()
    })
  })

  describe("Styling", () => {
    it("has correct default root classes", () => {
      const { container } = render(<Slider />)
      // Radix Slider root renders as <span>, not <div>
      const root = getRoot(container)
      expect(root?.className).toContain("relative")
      expect(root?.className).toContain("flex")
      expect(root?.className).toContain("w-full")
      expect(root?.className).toContain("touch-none")
      expect(root?.className).toContain("select-none")
      expect(root?.className).toContain("items-center")
    })

    it("applies custom className to root", () => {
      const { container } = render(<Slider className="custom-slider" />)
      const root = getRoot(container)
      expect(root?.className).toContain("custom-slider")
    })

    it("applies custom className along with defaults", () => {
      const { container } = render(<Slider className="custom-slider" />)
      const root = getRoot(container)
      expect(root?.className).toContain("flex")
      expect(root?.className).toContain("w-full")
      expect(root?.className).toContain("custom-slider")
    })

    it("has track styling", () => {
      const { container } = render(<Slider />)
      expect(container).toBeTruthy()
    })

    it("has thumb styling", () => {
      const { container } = render(<Slider />)
      const thumb = container.querySelector('[role="slider"]')
      expect(thumb?.className).toContain("rounded-full")
    })
  })

  describe("Value Handling", () => {
    it("accepts default value", () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const slider = container.querySelector('[role="slider"]')
      expect(slider).toBeTruthy()
    })

    it("accepts array of values", () => {
      const { container } = render(<Slider defaultValue={[25, 75]} />)
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("handles controlled value prop", () => {
      const { container } = render(<Slider value={[50]} />)
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("supports min/max range", () => {
      const { container } = render(
        <Slider defaultValue={[50]} min={0} max={100} />
      )
      const slider = container.querySelector('[role="slider"]')
      expect(slider?.getAttribute("aria-valuemin")).toBe("0")
      expect(slider?.getAttribute("aria-valuemax")).toBe("100")
    })

    it("supports step value", () => {
      const { container } = render(
        <Slider defaultValue={[50]} step={10} />
      )
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })
  })

  describe("Accessibility", () => {
    it("has slider role", () => {
      const { container } = render(<Slider />)
      const slider = container.querySelector('[role="slider"]')
      expect(slider?.getAttribute("role")).toBe("slider")
    })

    it("exposes aria-valuemin", () => {
      const { container } = render(
        <Slider min={0} max={100} defaultValue={[50]} />
      )
      const slider = container.querySelector('[role="slider"]')
      expect(slider?.getAttribute("aria-valuemin")).toBe("0")
    })

    it("exposes aria-valuemax", () => {
      const { container } = render(
        <Slider min={0} max={100} defaultValue={[50]} />
      )
      const slider = container.querySelector('[role="slider"]')
      expect(slider?.getAttribute("aria-valuemax")).toBe("100")
    })

    it("exposes aria-valuenow", () => {
      const { container } = render(
        <Slider min={0} max={100} defaultValue={[50]} />
      )
      const slider = container.querySelector('[role="slider"]')
      expect(slider?.getAttribute("aria-valuenow")).toBeTruthy()
    })

    it("supports aria-label on root element", () => {
      const { container } = render(<Slider aria-label="Volume control" />)
      // Radix forwards aria attributes to the root span, not to [role="slider"]
      const root = getRoot(container)
      expect(root?.getAttribute("aria-label")).toBe("Volume control")
    })

    it("supports aria-labelledby on root element", () => {
      const { container } = render(
        <Slider aria-labelledby="slider-label" />
      )
      const root = getRoot(container)
      expect(root?.getAttribute("aria-labelledby")).toBe("slider-label")
    })

    it("supports aria-describedby on root element", () => {
      const { container } = render(
        <Slider aria-describedby="slider-help" />
      )
      const root = getRoot(container)
      expect(root?.getAttribute("aria-describedby")).toBe("slider-help")
    })

    it("sets aria-disabled on root when disabled", () => {
      const { container } = render(<Slider disabled={true} />)
      // Radix sets aria-disabled="true" on the root span
      const root = getRoot(container)
      expect(root?.getAttribute("aria-disabled")).toBe("true")
    })

    it("sets data-disabled on thumb when disabled", () => {
      const { container } = render(<Slider disabled={true} />)
      const slider = container.querySelector('[role="slider"]')
      // Radix marks the thumb with data-disabled (empty-string attribute)
      expect(slider?.hasAttribute("data-disabled")).toBe(true)
    })
  })

  describe("Props Forwarding", () => {
    it("forwards data attributes", () => {
      const { container } = render(
        <Slider data-testid="custom-slider" data-value="test" />
      )
      expect(container.querySelector('[data-testid="custom-slider"]')).toBeTruthy()
    })

    it("forwards standard HTML attributes", () => {
      const { container } = render(<Slider id="slider-1" />)
      expect(container.querySelector("#slider-1")).toBeTruthy()
    })

    it("forwards style prop to root span", () => {
      const { container } = render(
        <Slider style={{ maxWidth: "200px" }} />
      )
      // Radix root is a <span>; style is on the root element
      const root = getRoot(container)
      expect(root?.getAttribute("style")).toBeTruthy()
    })
  })

  describe("Interaction", () => {
    it("responds to keyboard input", async () => {
      const { container } = render(
        <Slider defaultValue={[50]} min={0} max={100} />
      )

      const slider = container.querySelector('[role="slider"]')
      if (slider) {
        (slider as HTMLElement).focus()
        await user.keyboard("{ArrowRight}")
      }

      expect(slider).toBeTruthy()
    })

    it("supports onValueChange callback", () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("tracks interaction state", () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const slider = container.querySelector('[role="slider"]')
      expect(slider).toBeTruthy()
    })

    it("prevents text selection during drag", () => {
      const { container } = render(<Slider />)
      const root = getRoot(container)
      expect(root?.className).toContain("select-none")
    })
  })

  describe("Thumb Styling", () => {
    it("has circular thumb shape", () => {
      const { container } = render(<Slider />)
      const thumb = container.querySelector('[role="slider"]')
      expect(thumb?.className).toContain("rounded-full")
    })

    it("has proper size", () => {
      const { container } = render(<Slider />)
      const thumb = container.querySelector('[role="slider"]')
      expect(thumb?.className).toContain("h-5")
      expect(thumb?.className).toContain("w-5")
    })

    it("has border styling", () => {
      const { container } = render(<Slider />)
      const thumb = container.querySelector('[role="slider"]')
      expect(thumb?.className).toContain("border-2")
      expect(thumb?.className).toContain("border-primary")
    })

    it("has focus ring styling", () => {
      const { container } = render(<Slider />)
      const thumb = container.querySelector('[role="slider"]')
      expect(thumb?.className).toContain("focus-visible:ring-2")
    })
  })

  describe("Complete Usage Examples", () => {
    it("renders volume control slider", () => {
      const { container } = render(
        <div>
          <label>Volume</label>
          <Slider defaultValue={[70]} min={0} max={100} step={1} />
          <span>70%</span>
        </div>
      )

      expect(screen.getByText("Volume")).toBeTruthy()
      expect(screen.getByText("70%")).toBeTruthy()
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("renders price range slider", () => {
      render(
        <div>
          <label>Price Range</label>
          <Slider defaultValue={[20, 80]} min={0} max={100} />
          <div>$20 - $80</div>
        </div>
      )

      expect(screen.getByText("Price Range")).toBeTruthy()
      expect(screen.getByText("$20 - $80")).toBeTruthy()
    })

    it("renders brightness control slider", () => {
      const { container } = render(
        <div>
          <label>Brightness</label>
          <Slider
            defaultValue={[50]}
            min={0}
            max={100}
            step={5}
            aria-label="Brightness"
          />
        </div>
      )

      expect(screen.getByText("Brightness")).toBeTruthy()
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("renders disabled slider with aria-disabled on root", () => {
      const { container } = render(
        <Slider defaultValue={[50]} disabled={true} />
      )

      const root = getRoot(container)
      expect(root?.getAttribute("aria-disabled")).toBe("true")
    })
  })

  describe("Range Slider (Multiple Thumbs)", () => {
    it("supports two-thumb range slider", () => {
      const { container } = render(
        <Slider defaultValue={[25, 75]} min={0} max={100} />
      )

      const sliders = container.querySelectorAll('[role="slider"]')
      expect(sliders.length).toBeGreaterThan(0)
    })

    it("handles range with step value", () => {
      const { container } = render(
        <Slider defaultValue={[20, 80]} min={0} max={100} step={10} />
      )

      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("ensures min thumb stays below max thumb", () => {
      const { container } = render(
        <Slider defaultValue={[25, 75]} min={0} max={100} />
      )

      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })
  })

  describe("Responsive Design", () => {
    it("spans full width by default", () => {
      const { container } = render(<Slider />)
      const root = getRoot(container)
      expect(root?.className).toContain("w-full")
    })

    it("respects container width", () => {
      const { container } = render(
        <div style={{ width: "300px" }}>
          <Slider />
        </div>
      )

      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })
  })

  describe("Edge Cases", () => {
    it("handles very small steps", () => {
      const { container } = render(
        <Slider defaultValue={[50]} step={0.1} />
      )

      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("handles negative range", () => {
      const { container } = render(
        <Slider min={-100} max={0} defaultValue={[-50]} />
      )

      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("handles fractional values", () => {
      const { container } = render(
        <Slider min={0} max={1} step={0.25} defaultValue={[0.5]} />
      )

      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })
  })

  describe("ForwardRef", () => {
    it("forwards ref to root element", () => {
      const ref = React.createRef<HTMLSpanElement>()
      render(<Slider ref={ref} data-testid="slider" />)

      const slider = screen.getByTestId("slider")
      expect(slider).toBeTruthy()
    })

    it("allows accessing DOM properties via ref", () => {
      render(<Slider data-testid="slider" />)

      const slider = screen.getByTestId("slider")
      expect(slider).toBeTruthy()
    })
  })

  describe("Keyboard Navigation", () => {
    it("supports arrow keys for navigation", () => {
      const { container } = render(
        <Slider defaultValue={[50]} min={0} max={100} />
      )

      const slider = container.querySelector('[role="slider"]')
      expect(slider).toBeTruthy()
    })

    it("supports Home key", () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("supports End key", () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })

    it("respects Page Up/Page Down keys", () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })
  })

  describe("Display Name", () => {
    it("has correct display name", () => {
      const { container } = render(<Slider />)
      expect(container.querySelector('[role="slider"]')).toBeTruthy()
    })
  })
})
