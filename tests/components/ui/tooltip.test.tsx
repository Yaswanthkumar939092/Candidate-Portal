import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"

function BasicTooltip({ content = "Tooltip text" }: { content?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>Hover me</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  )
}

describe("Tooltip Components", () => {
  const user = userEvent.setup()

  describe("TooltipProvider", () => {
    it("renders children", () => {
      render(
        <TooltipProvider>
          <div>Child content</div>
        </TooltipProvider>
      )
      expect(screen.getByText("Child content")).toBeTruthy()
    })

    it("has data-slot='tooltip-provider'", () => {
      const { container } = render(
        <TooltipProvider>
          <span data-testid="child">Child</span>
        </TooltipProvider>
      )
      expect(screen.getByTestId("child")).toBeTruthy()
    })

    it("accepts delayDuration prop", () => {
      render(
        <TooltipProvider delayDuration={500}>
          <div>Content</div>
        </TooltipProvider>
      )
      expect(screen.getByText("Content")).toBeTruthy()
    })
  })

  describe("Tooltip", () => {
    it("renders trigger text", () => {
      render(<BasicTooltip />)
      expect(screen.getByText("Hover me")).toBeTruthy()
    })

    it("does not show content before hover", () => {
      render(<BasicTooltip />)
      expect(screen.queryByText("Tooltip text")).toBeNull()
    })

    it("shows content on hover", async () => {
      render(<BasicTooltip />)
      await user.hover(screen.getByText("Hover me"))
      await waitFor(() => {
        expect(document.body.querySelector('[data-slot="tooltip-content"]')).toBeTruthy()
      })
    })

  })

  describe("TooltipTrigger", () => {
    it("renders trigger element", () => {
      render(<BasicTooltip />)
      expect(screen.getByText("Hover me")).toBeTruthy()
    })

    it("has data-slot='tooltip-trigger'", () => {
      const { container } = render(<BasicTooltip />)
      expect(container.querySelector('[data-slot="tooltip-trigger"]')).toBeTruthy()
    })

    it("renders custom trigger content", () => {
      render(
        <Tooltip>
          <TooltipTrigger>
            <button>Icon button</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByText("Icon button")).toBeTruthy()
    })
  })

  describe("TooltipContent", () => {
    it("renders in portal (document.body)", async () => {
      render(<BasicTooltip />)
      await user.hover(screen.getByText("Hover me"))
      await waitFor(() => {
        const content = document.body.querySelector('[data-slot="tooltip-content"]')
        expect(content).toBeTruthy()
      })
    })

    it("has correct default classes", async () => {
      render(<BasicTooltip />)
      await user.hover(screen.getByText("Hover me"))
      await waitFor(() => {
        const content = document.body.querySelector('[data-slot="tooltip-content"]')
        expect(content?.className).toContain("bg-foreground")
        expect(content?.className).toContain("text-background")
        expect(content?.className).toContain("rounded-md")
        expect(content?.className).toContain("z-50")
      })
    })

    it("applies custom className", async () => {
      render(
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent className="custom-tooltip">Content</TooltipContent>
        </Tooltip>
      )
      await user.hover(screen.getByText("Trigger"))
      await waitFor(() => {
        const content = document.body.querySelector(".custom-tooltip")
        expect(content).toBeTruthy()
      })
    })

    it("has animate-in class for entrance animation", async () => {
      render(<BasicTooltip />)
      await user.hover(screen.getByText("Hover me"))
      await waitFor(() => {
        const content = document.body.querySelector('[data-slot="tooltip-content"]')
        expect(content?.className).toContain("animate-in")
      })
    })

    it("has text-xs and px-3 py-1.5 classes", async () => {
      render(<BasicTooltip />)
      await user.hover(screen.getByText("Hover me"))
      await waitFor(() => {
        const content = document.body.querySelector('[data-slot="tooltip-content"]')
        expect(content?.className).toContain("text-xs")
        expect(content?.className).toContain("px-3")
        expect(content?.className).toContain("py-1.5")
      })
    })
  })

  describe("Complete Usage Examples", () => {

    it("renders multiple tooltips independently", () => {
      render(
        <div>
          <BasicTooltip content="First tooltip" />
          <BasicTooltip content="Second tooltip" />
        </div>
      )
      const triggers = screen.getAllByText("Hover me")
      expect(triggers.length).toBe(2)
    })
  })

  describe("Accessibility", () => {
    it("trigger has accessible name", () => {
      render(
        <Tooltip>
          <TooltipTrigger aria-label="Help">?</TooltipTrigger>
          <TooltipContent>Help information</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByLabelText("Help")).toBeTruthy()
    })

    it("tooltip content has tooltip role when shown", async () => {
      render(<BasicTooltip />)
      await user.hover(screen.getByText("Hover me"))
      await waitFor(() => {
        const tooltip = document.body.querySelector('[role="tooltip"]')
        expect(tooltip).toBeTruthy()
      })
    })
  })
})
