import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

describe("Sheet Components", () => {
  const user = userEvent.setup()

  describe("Sheet", () => {
    it("renders sheet root element", () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      expect(screen.getByText("Open")).toBeTruthy()
    })

    it("manages open/close state", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>Sheet content</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open Sheet")
      expect(screen.queryByText("Sheet content")).not.toBeInTheDocument()

      await user.click(trigger)
      await waitFor(() => {
        expect(screen.getByText("Sheet content")).toBeTruthy()
      })
    })

    it("accepts open prop for controlled state", () => {
      render(
        <Sheet open={true}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      expect(screen.getByText("Open")).toBeTruthy()
    })

    it("accepts onOpenChange callback", async () => {
      const handleOpenChange = vi.fn()
      render(
        <Sheet onOpenChange={handleOpenChange}>
          <SheetTrigger>Click</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Click")
      await user.click(trigger)

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalled()
      })
    })
  })

  describe("SheetTrigger", () => {
    it("renders as button element", () => {
      const { container } = render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      const button = container.querySelector("button")
      expect(button).toBeTruthy()
      expect(screen.getByText("Open")).toBeTruthy()
    })

    it("opens sheet on click", async () => {
      render(
        <Sheet>
          <SheetTrigger>Click to open</SheetTrigger>
          <SheetContent>Sheet is now open</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Click to open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Sheet is now open")).toBeTruthy()
      })
    })

    it("accepts custom children", () => {
      render(
        <Sheet>
          <SheetTrigger>
            <span data-testid="custom-trigger">Custom</span>
          </SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      expect(screen.getByTestId("custom-trigger")).toBeTruthy()
    })

    it("accepts className prop", () => {
      const { container } = render(
        <Sheet>
          <SheetTrigger className="custom-button">Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      const button = container.querySelector(".custom-button")
      expect(button).toBeTruthy()
    })
  })

  describe("SheetContent", () => {
    it("renders sheet content when open", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content goes here</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Content goes here")).toBeTruthy()
      })
    })

    it("renders as dialog element", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        // Sheet renders via Radix Dialog portal — query document.body
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).toBeTruthy()
      })
    })

    it("supports different side positions", async () => {
      const sides: ("top" | "bottom" | "left" | "right")[] = [
        "top",
        "bottom",
        "left",
        "right",
      ]

      for (const side of sides) {
        render(
          <Sheet>
            <SheetTrigger>Open {side}</SheetTrigger>
            <SheetContent side={side}>Side content {side}</SheetContent>
          </Sheet>
        )

        const trigger = screen.getByText(`Open ${side}`)
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByText(`Side content ${side}`)).toBeTruthy()
        })

        // close before next iteration
        await user.keyboard("{Escape}")
        await waitFor(() => {
          expect(screen.queryByText(`Side content ${side}`)).not.toBeInTheDocument()
        })
      }
    })

    it("includes a close button inside the dialog", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        // Radix SheetContent adds a close button with sr-only "Close" text
        const closeBtn = screen.getByRole("button", { name: "Close" })
        expect(closeBtn).toBeTruthy()
      })
    })

    it("closes when the built-in close button is clicked", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Content")).toBeTruthy()
      })

      const closeBtn = screen.getByRole("button", { name: "Close" })
      await user.click(closeBtn)

      await waitFor(() => {
        expect(screen.queryByText("Content")).not.toBeInTheDocument()
      })
    })

    it("applies custom className", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent className="custom-content">Content</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        // Portal — must query document.body
        const dialog = document.body.querySelector(".custom-content")
        expect(dialog).toBeTruthy()
      })
    })

    it("renders children correctly", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <h1>Sheet Title</h1>
            <p>Sheet content</p>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Sheet Title")).toBeTruthy()
        expect(screen.getByText("Sheet content")).toBeTruthy()
      })
    })
  })

  describe("SheetClose", () => {
    it("renders as button element", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetClose>Close Manually</SheetClose>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const closeButton = screen.getByText("Close Manually")
        expect(closeButton).toBeTruthy()
      })
    })

    it("closes sheet when clicked", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetClose>Dismiss</SheetClose>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Dismiss")).toBeTruthy()
      })

      const closeButton = screen.getByText("Dismiss")
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText("Dismiss")).not.toBeInTheDocument()
      })
    })

    it("accepts asChild prop", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetClose asChild>
              <a href="#home">Go Home</a>
            </SheetClose>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Go Home")).toBeTruthy()
      })
    })
  })

  describe("SheetHeader", () => {
    it("renders header container", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>Header content</SheetHeader>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Header content")).toBeTruthy()
      })
    })

    it("has correct flex styling", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader className="test-header">Header</SheetHeader>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const header = document.body.querySelector(".test-header")
        expect(header?.className).toContain("flex")
      })
    })

    it("applies custom className", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader className="custom-header">Header</SheetHeader>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const header = document.body.querySelector(".custom-header")
        expect(header).toBeTruthy()
      })
    })
  })

  describe("SheetFooter", () => {
    it("renders footer container", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetFooter>Footer content</SheetFooter>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Footer content")).toBeTruthy()
      })
    })

    it("has correct flex styling for buttons", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetFooter>
              <button>Cancel</button>
              <button>Save</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeTruthy()
        expect(screen.getByText("Save")).toBeTruthy()
      })
    })

    it("applies custom className", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetFooter className="custom-footer">Footer</SheetFooter>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const footer = document.body.querySelector(".custom-footer")
        expect(footer).toBeTruthy()
      })
    })
  })

  describe("SheetTitle", () => {
    it("renders as heading element", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>My Title</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("My Title")).toBeTruthy()
      })
    })

    it("has correct styling", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        // SheetTitle uses SheetPrimitive.Title which renders as h2 via Radix Dialog
        const title = screen.getByText("Title")
        expect(title.className).toContain("text-lg")
        expect(title.className).toContain("font-semibold")
      })
    })

    it("applies custom className", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle className="custom-title">Title</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const title = document.body.querySelector(".custom-title")
        expect(title).toBeTruthy()
      })
    })
  })

  describe("SheetDescription", () => {
    it("renders description text", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetDescription>This is a description</SheetDescription>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("This is a description")).toBeTruthy()
      })
    })

    it("has correct styling", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const description = screen.getByText("Description")
        expect(description.className).toContain("text-sm")
        expect(description.className).toContain("text-muted-foreground")
      })
    })

    it("applies custom className", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetDescription className="custom-desc">
              Description
            </SheetDescription>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const description = document.body.querySelector(".custom-desc")
        expect(description).toBeTruthy()
      })
    })
  })

  describe("Sheet Integration - Complete Example", () => {
    it("renders complete sheet with all components", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open Menu</SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>
                Choose an option from the menu
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <ul>
                <li>Option 1</li>
                <li>Option 2</li>
                <li>Option 3</li>
              </ul>
            </div>
            <SheetFooter>
              <SheetClose>Dismiss</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open Menu")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Navigation")).toBeTruthy()
        expect(screen.getByText("Choose an option from the menu")).toBeTruthy()
        expect(screen.getByText("Option 1")).toBeTruthy()
        expect(screen.getByText("Dismiss")).toBeTruthy()
      })
    })

    it("renders sheet with form content", async () => {
      render(
        <Sheet>
          <SheetTrigger>Settings</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <form className="space-y-4">
              <input type="text" placeholder="Name" />
              <input type="email" placeholder="Email" />
            </form>
            <SheetFooter>
              <button>Save</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Settings")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Name")).toBeTruthy()
        expect(screen.getByPlaceholderText("Email")).toBeTruthy()
        expect(screen.getByText("Save")).toBeTruthy()
      })
    })
  })

  describe("Accessibility", () => {
    it("supports keyboard navigation", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <button>Action</button>
          </SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      trigger.focus()

      await user.keyboard("{Enter}")

      await waitFor(() => {
        expect(screen.getByText("Action")).toBeTruthy()
      })
    })

    it("closes on Escape key", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
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

  describe("Animation", () => {
    it("has animation classes for slide animation", async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="right">Content</SheetContent>
        </Sheet>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        // Sheet content renders via portal — query document.body
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog?.className).toContain("data-[state=open]:animate-in")
      })
    })
  })
})
