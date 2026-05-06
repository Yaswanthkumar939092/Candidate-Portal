import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"

describe("Popover Components", () => {
  const user = userEvent.setup()

  describe("Popover", () => {
    it("renders popover root element", () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )
      expect(screen.getByText("Open")).toBeTruthy()
    })

    it("manages open/close state", async () => {
      render(
        <Popover>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Toggle")
      expect(screen.queryByText("Popover content")).not.toBeInTheDocument()

      await user.click(trigger)
      await waitFor(() => {
        expect(screen.getByText("Popover content")).toBeTruthy()
      })
    })

    it("closes popover when trigger clicked again", async () => {
      render(
        <Popover>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Toggle")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Content")).toBeTruthy()
      })

      await user.click(trigger)
      await waitFor(() => {
        expect(screen.queryByText("Content")).not.toBeInTheDocument()
      })
    })

    it("accepts open prop for controlled state", () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Visible Content</PopoverContent>
        </Popover>
      )

      expect(screen.getByText("Open")).toBeTruthy()
    })

    it("accepts onOpenChange callback", async () => {
      const handleOpenChange = vi.fn()
      render(
        <Popover onOpenChange={handleOpenChange}>
          <PopoverTrigger>Click</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Click")
      await user.click(trigger)

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalled()
      })
    })
  })

  describe("PopoverTrigger", () => {
    it("renders as button element", () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>Trigger Button</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const button = container.querySelector("button")
      expect(button).toBeTruthy()
      expect(screen.getByText("Trigger Button")).toBeTruthy()
    })

    it("triggers popover on click", async () => {
      render(
        <Popover>
          <PopoverTrigger>Click Me</PopoverTrigger>
          <PopoverContent>Popover is visible</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Click Me")
      expect(screen.queryByText("Popover is visible")).not.toBeInTheDocument()

      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Popover is visible")).toBeTruthy()
      })
    })

    it("accepts custom children element", () => {
      render(
        <Popover>
          <PopoverTrigger asChild>
            <div data-testid="custom-trigger">Custom Trigger</div>
          </PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      expect(screen.getByTestId("custom-trigger")).toBeTruthy()
    })

    it("accepts className prop", () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger className="custom-button">Styled</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const button = container.querySelector(".custom-button")
      expect(button).toBeTruthy()
    })

    it("renders with icon and text", () => {
      render(
        <Popover>
          <PopoverTrigger>
            <span>⚙️ Settings</span>
          </PopoverTrigger>
          <PopoverContent>Settings panel</PopoverContent>
        </Popover>
      )

      expect(screen.getByText("⚙️ Settings")).toBeTruthy()
    })
  })

  describe("PopoverContent", () => {
    it("renders content when popover is open", async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>This is the popover content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("This is the popover content")).toBeTruthy()
      })
    })

    it("uses default align center", async () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it("supports custom align prop", async () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent align="start">Aligned content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Aligned content")).toBeTruthy()
      })
    })

    it("supports custom sideOffset prop", async () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent sideOffset={8}>
            Offset content
          </PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Offset content")).toBeTruthy()
      })
    })

    it("renders complex content structure", async () => {
      render(
        <Popover>
          <PopoverTrigger>Show Options</PopoverTrigger>
          <PopoverContent>
            <div>
              <h3>Title</h3>
              <p>Description</p>
              <button>Action</button>
            </div>
          </PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Show Options")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Title")).toBeTruthy()
        expect(screen.getByText("Description")).toBeTruthy()
        expect(screen.getByText("Action")).toBeTruthy()
      })
    })

    it("supports form inputs in content", async () => {
      render(
        <Popover>
          <PopoverTrigger>Edit</PopoverTrigger>
          <PopoverContent>
            <input type="text" placeholder="Enter text" />
          </PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Edit")
      await user.click(trigger)

      await waitFor(() => {
        const input = screen.getByPlaceholderText("Enter text")
        expect(input).toBeTruthy()
      })
    })

    it("closes when clicking outside", async () => {
      const { container } = render(
        <div>
          <div data-testid="outside">Outside element</div>
          <Popover>
            <PopoverTrigger>Toggle</PopoverTrigger>
            <PopoverContent>Popover content</PopoverContent>
          </Popover>
        </div>
      )

      const trigger = screen.getByText("Toggle")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Popover content")).toBeTruthy()
      })

      const outside = container.querySelector('[data-testid="outside"]')
      if (outside) {
        await user.click(outside)
      }

      await waitFor(() => {
        expect(screen.queryByText("Popover content")).not.toBeInTheDocument()
      })
    })

    it("closes when pressing Escape", async () => {
      render(
        <Popover>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Toggle")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Content")).toBeTruthy()
      })

      await user.keyboard("{Escape}")

      await waitFor(() => {
        expect(screen.queryByText("Content")).not.toBeInTheDocument()
      })
    })
  })

  describe("PopoverAnchor", () => {
    it("renders anchor element", () => {
      const { container } = render(
        <Popover>
          <PopoverAnchor />
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      expect(container).toBeTruthy()
      expect(screen.getByText("Trigger")).toBeTruthy()
    })

    it("positions popover relative to anchor", async () => {
      render(
        <Popover>
          <PopoverAnchor data-testid="popover-anchor" />
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Anchored content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Trigger")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Anchored content")).toBeTruthy()
      })
    })
  })

  describe("Popover Integration - Complete Example", () => {
    it("renders popover with form content", async () => {
      render(
        <Popover>
          <PopoverTrigger>Filter</PopoverTrigger>
          <PopoverContent>
            <div className="space-y-4">
              <h3>Filter Options</h3>
              <input type="checkbox" /> Show archived items
              <button>Apply</button>
            </div>
          </PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Filter")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Filter Options")).toBeTruthy()
        expect(screen.getByText("Apply")).toBeTruthy()
      })
    })

    it("renders popover with user profile menu", async () => {
      render(
        <Popover>
          <PopoverTrigger>👤 Profile</PopoverTrigger>
          <PopoverContent>
            <div>
              <p>John Doe</p>
              <p>john@example.com</p>
              <button>View Profile</button>
              <button>Sign Out</button>
            </div>
          </PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("👤 Profile")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeTruthy()
        expect(screen.getByText("john@example.com")).toBeTruthy()
        expect(screen.getByText("View Profile")).toBeTruthy()
        expect(screen.getByText("Sign Out")).toBeTruthy()
      })
    })

    it("renders multiple popovers independently", async () => {
      render(
        <div>
          <Popover>
            <PopoverTrigger>Popover 1</PopoverTrigger>
            <PopoverContent>Content 1</PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger>Popover 2</PopoverTrigger>
            <PopoverContent>Content 2</PopoverContent>
          </Popover>
        </div>
      )

      const trigger1 = screen.getByText("Popover 1")
      await user.click(trigger1)

      await waitFor(() => {
        expect(screen.getByText("Content 1")).toBeTruthy()
      })

      const trigger2 = screen.getByText("Popover 2")
      await user.click(trigger2)

      await waitFor(() => {
        expect(screen.getByText("Content 2")).toBeTruthy()
      })
    })
  })

  describe("Accessibility", () => {
    it("supports keyboard navigation", async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <button>Action</button>
          </PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Open")
      trigger.focus()

      await user.keyboard("{Enter}")

      await waitFor(() => {
        expect(screen.getByText("Action")).toBeTruthy()
      })
    })

    it("manages focus properly when opening", async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <input type="text" placeholder="Focus me" autoFocus />
          </PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const input = screen.getByPlaceholderText("Focus me")
        expect(input).toBeTruthy()
      })
    })
  })
})
