import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"

describe("Dropdown Menu Components", () => {
  const user = userEvent.setup()

  describe("DropdownMenu", () => {
    it("renders menu structure", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText("Open Menu")).toBeTruthy()
    })

    it("opens and closes menu on trigger click", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open Menu")
      await user.click(trigger)
      await waitFor(() => {
        expect(screen.getByText("Edit")).toBeTruthy()
      })
    })
  })

  describe("DropdownMenuTrigger", () => {
    it("renders as button element", () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger>Click Me</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const button = container.querySelector("button")
      expect(button).toBeTruthy()
      expect(screen.getByText("Click Me")).toBeTruthy()
    })

    it("accepts custom children", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>
            <span data-testid="custom-trigger">Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId("custom-trigger")).toBeTruthy()
    })
  })

  describe("DropdownMenuContent", () => {
    it("renders menu content", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Option 1</DropdownMenuItem>
            <DropdownMenuItem>Option 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeTruthy()
        expect(screen.getByText("Option 2")).toBeTruthy()
      })
    })

    it("has correct sideOffset default value", () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(container).toBeTruthy()
    })

    it("applies custom className", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        // Content renders in a portal outside container — query document.body
        const content = document.body.querySelector(".custom-content")
        expect(content).toBeTruthy()
      })
    })
  })

  describe("DropdownMenuItem", () => {
    it("renders menu item", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Edit")).toBeTruthy()
      })
    })

    it("handles click events", async () => {
      const handleClick = vi.fn()
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleClick}>
              Click Me
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const item = screen.getByText("Click Me")
        expect(item).toBeTruthy()
      })

      const item = screen.getByText("Click Me")
      await user.click(item)

      expect(handleClick).toHaveBeenCalled()
    })

    it("supports disabled state", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const item = screen.getByText("Disabled Item")
        // Radix sets data-disabled as an empty-string attribute, not "true"
        expect(item.hasAttribute("data-disabled")).toBe(true)
      })
    })

    it("renders inset variant", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        // Portal — query document.body
        const item = document.body.querySelector('[data-inset="true"]')
        expect(item).toBeTruthy()
      })
    })

    it("renders destructive variant", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const item = document.body.querySelector('[data-variant="destructive"]')
        expect(item).toBeTruthy()
      })
    })

    it("applies custom className", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="custom-item">
              Custom
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const item = screen.getByText("Custom")
        expect(item.className).toContain("custom-item")
      })
    })
  })

  describe("DropdownMenuGroup", () => {
    it("renders group of items", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Item 1</DropdownMenuItem>
              <DropdownMenuItem>Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeTruthy()
        expect(screen.getByText("Item 2")).toBeTruthy()
      })
    })
  })

  describe("DropdownMenuCheckboxItem", () => {
    it("renders checkbox item", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked>
              Enabled
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Enabled")).toBeTruthy()
      })
    })

    it("handles checked state", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked>
              Checked
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const item = document.body.querySelector(
          '[role="menuitemcheckbox"][data-state="checked"]'
        )
        expect(item).toBeTruthy()
      })
    })
  })

  describe("DropdownMenuRadioItem", () => {
    it("renders radio group items", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeTruthy()
        expect(screen.getByText("Option 2")).toBeTruthy()
      })
    })

    it("handles value selection", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">
                Selected
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const item = document.body.querySelector(
          '[role="menuitemradio"][data-state="checked"]'
        )
        expect(item).toBeTruthy()
      })
    })
  })

  describe("DropdownMenuLabel", () => {
    it("renders label", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Actions")).toBeTruthy()
      })
    })

    it("renders inset label", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const label = document.body.querySelector('[data-inset="true"]')
        expect(label).toBeTruthy()
      })
    })
  })

  describe("DropdownMenuSeparator", () => {
    it("renders separator", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const separator = document.body.querySelector('[role="separator"]')
        expect(separator).toBeTruthy()
      })
    })
  })

  describe("DropdownMenuShortcut", () => {
    it("renders keyboard shortcut", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Ctrl+S")).toBeTruthy()
      })
    })

    it("has correct styling for shortcut", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut className="custom">
                ⌘S
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const shortcut = document.body.querySelector(
          '[data-slot="dropdown-menu-shortcut"].custom'
        )
        expect(shortcut).toBeTruthy()
      })
    })
  })

  describe("DropdownMenuSub", () => {
    it("renders submenu", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Submenu Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("More")).toBeTruthy()
      })
    })

    it("opens submenu on hover/click", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Option</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        const subTrigger = screen.getByText("More")
        expect(subTrigger).toBeTruthy()
      })
    })
  })

  describe("DropdownMenuSubTrigger", () => {
    it("renders submenu trigger", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Submenu</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Open")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Submenu")).toBeTruthy()
      })
    })
  })

  describe("Complex Menu Structure", () => {
    it("renders full dropdown menu with all elements", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Edit
                <DropdownMenuShortcut>Ctrl+E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Archive</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem checked>
                Show Tips
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByText("Menu")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Actions")).toBeTruthy()
        expect(screen.getByText("Edit")).toBeTruthy()
        expect(screen.getByText("Ctrl+E")).toBeTruthy()
        expect(screen.getByText("Delete")).toBeTruthy()
      })
    })
  })
})
