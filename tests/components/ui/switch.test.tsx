import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Switch } from "@/components/ui/switch"

describe("Switch Component", () => {
  const user = userEvent.setup()

  describe("Rendering", () => {
    it("renders switch element", () => {
      render(<Switch />)
      expect(screen.getByRole("switch")).toBeTruthy()
    })

    it("renders as button with role switch", () => {
      const { container } = render(<Switch />)
      const btn = container.querySelector("button")
      expect(btn?.getAttribute("role")).toBe("switch")
    })

    it("renders thumb inside root", () => {
      const { container } = render(<Switch />)
      const thumb = container.querySelector("span")
      expect(thumb).toBeTruthy()
    })
  })

  describe("State", () => {
    it("is unchecked by default", () => {
      render(<Switch />)
      const sw = screen.getByRole("switch")
      expect(sw.getAttribute("data-state")).toBe("unchecked")
    })

    it("reflects checked state via defaultChecked", () => {
      render(<Switch defaultChecked />)
      const sw = screen.getByRole("switch")
      expect(sw.getAttribute("data-state")).toBe("checked")
    })

    it("toggles state on click", async () => {
      render(<Switch />)
      const sw = screen.getByRole("switch")
      expect(sw.getAttribute("data-state")).toBe("unchecked")
      await user.click(sw)
      expect(sw.getAttribute("data-state")).toBe("checked")
    })

    it("reflects controlled checked prop", () => {
      render(<Switch checked={true} onCheckedChange={() => { }} />)
      const sw = screen.getByRole("switch")
      expect(sw.getAttribute("data-state")).toBe("checked")
    })

    it("reflects controlled unchecked prop", () => {
      render(<Switch checked={false} onCheckedChange={() => { }} />)
      const sw = screen.getByRole("switch")
      expect(sw.getAttribute("data-state")).toBe("unchecked")
    })
  })

  describe("Callbacks", () => {
    it("calls onCheckedChange when toggled", async () => {
      const onChange = vi.fn()
      render(<Switch onCheckedChange={onChange} />)
      await user.click(screen.getByRole("switch"))
      expect(onChange).toHaveBeenCalledWith(true)
    })

    it("calls onCheckedChange with false when turning off", async () => {
      const onChange = vi.fn()
      render(<Switch defaultChecked onCheckedChange={onChange} />)
      await user.click(screen.getByRole("switch"))
      expect(onChange).toHaveBeenCalledWith(false)
    })
  })

  describe("Disabled State", () => {
    it("is disabled when disabled prop is set", () => {
      render(<Switch disabled />)
      const sw = screen.getByRole("switch")
      expect(sw).toBeDisabled()
    })

    it("has data-disabled attribute when disabled", () => {
      render(<Switch disabled />)
      const sw = screen.getByRole("switch")
      expect(sw.hasAttribute("data-disabled")).toBe(true)
    })

    it("does not toggle when disabled", async () => {
      const onChange = vi.fn()
      render(<Switch disabled onCheckedChange={onChange} />)
      await user.click(screen.getByRole("switch"))
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe("Styling", () => {
    it("has default root classes", () => {
      render(<Switch />)
      const sw = screen.getByRole("switch")
      expect(sw.className).toContain("inline-flex")
      expect(sw.className).toContain("rounded-full")
      expect(sw.className).toContain("cursor-pointer")
    })

    it("applies custom className to root", () => {
      render(<Switch className="custom-switch" />)
      const sw = screen.getByRole("switch")
      expect(sw.className).toContain("custom-switch")
    })

    it("has transition-colors class", () => {
      render(<Switch />)
      const sw = screen.getByRole("switch")
      expect(sw.className).toContain("transition-colors")
    })

    it("has correct dimensions", () => {
      render(<Switch />)
      const sw = screen.getByRole("switch")
      expect(sw.className).toContain("h-6")
      expect(sw.className).toContain("w-11")
    })
  })

  describe("Accessibility", () => {
    it("has switch role", () => {
      render(<Switch />)
      expect(screen.getByRole("switch")).toBeTruthy()
    })

    it("supports aria-label", () => {
      render(<Switch aria-label="Toggle notifications" />)
      const sw = screen.getByRole("switch", { name: "Toggle notifications" })
      expect(sw).toBeTruthy()
    })

    it("supports aria-labelledby", () => {
      render(
        <div>
          <label id="switch-label">Dark mode</label>
          <Switch aria-labelledby="switch-label" />
        </div>
      )
      expect(screen.getByRole("switch")).toBeTruthy()
    })
  })

  describe("Keyboard Navigation", () => {
    it("can be focused", () => {
      render(<Switch />)
      const sw = screen.getByRole("switch")
      sw.focus()
      expect(document.activeElement).toBe(sw)
    })

    it("toggles on Space key", async () => {
      render(<Switch />)
      const sw = screen.getByRole("switch")
      sw.focus()
      await user.keyboard(" ")
      expect(sw.getAttribute("data-state")).toBe("checked")
    })
  })

  describe("Props Forwarding", () => {
    it("forwards data attributes", () => {
      render(<Switch data-testid="my-switch" />)
      expect(screen.getByTestId("my-switch")).toBeTruthy()
    })

    it("forwards id prop", () => {
      const { container } = render(<Switch id="toggle-1" />)
      expect(container.querySelector("#toggle-1")).toBeTruthy()
    })
  })

  describe("ForwardRef", () => {
    it("forwards ref to root element", () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Switch ref={ref} />)
      expect(ref.current).toBeTruthy()
    })
  })

  describe("Complete Usage Examples", () => {
    it("renders labeled switch", async () => {
      const onChange = vi.fn()
      render(
        <div className="flex items-center gap-2">
          <Switch id="dark-mode" onCheckedChange={onChange} />
          <label htmlFor="dark-mode">Dark mode</label>
        </div>
      )
      expect(screen.getByText("Dark mode")).toBeTruthy()
      await user.click(screen.getByRole("switch"))
      expect(onChange).toHaveBeenCalledWith(true)
    })

    it("renders multiple switches", () => {
      render(
        <div>
          <Switch data-testid="switch-1" />
          <Switch data-testid="switch-2" defaultChecked />
        </div>
      )
      const switches = screen.getAllByRole("switch")
      expect(switches.length).toBe(2)
      expect(switches[0].getAttribute("data-state")).toBe("unchecked")
      expect(switches[1].getAttribute("data-state")).toBe("checked")
    })
  })
})
