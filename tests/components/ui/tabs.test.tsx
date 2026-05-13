import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

function BasicTabs() {
  return (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab One</TabsTrigger>
        <TabsTrigger value="tab2">Tab Two</TabsTrigger>
        <TabsTrigger value="tab3">Tab Three</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content One</TabsContent>
      <TabsContent value="tab2">Content Two</TabsContent>
      <TabsContent value="tab3">Content Three</TabsContent>
    </Tabs>
  )
}

describe("Tabs Components", () => {
  const user = userEvent.setup()

  describe("Tabs (Root)", () => {
    it("renders tabs root", () => {
      const { container } = render(<Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList></Tabs>)
      const root = container.querySelector('[data-slot="tabs"]')
      expect(root).toBeTruthy()
    })

    it("has flex flex-col and gap-2 classes", () => {
      const { container } = render(<Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList></Tabs>)
      const root = container.querySelector('[data-slot="tabs"]')
      expect(root?.className).toContain("flex")
      expect(root?.className).toContain("flex-col")
      expect(root?.className).toContain("gap-2")
    })

    it("applies custom className", () => {
      const { container } = render(<Tabs defaultValue="a" className="custom-tabs"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList></Tabs>)
      const root = container.querySelector('[data-slot="tabs"]')
      expect(root?.className).toContain("custom-tabs")
    })

    it("has data-slot='tabs' attribute", () => {
      const { container } = render(<Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList></Tabs>)
      expect(container.querySelector('[data-slot="tabs"]')).toBeTruthy()
    })
  })

  describe("TabsList", () => {
    it("renders with tablist role", () => {
      render(<BasicTabs />)
      expect(screen.getByRole("tablist")).toBeTruthy()
    })

    it("has data-slot='tabs-list'", () => {
      const { container } = render(<BasicTabs />)
      expect(container.querySelector('[data-slot="tabs-list"]')).toBeTruthy()
    })

    it("has inline-flex and h-9 classes", () => {
      const { container } = render(<BasicTabs />)
      const list = container.querySelector('[data-slot="tabs-list"]')
      expect(list?.className).toContain("inline-flex")
      expect(list?.className).toContain("h-9")
      expect(list?.className).toContain("items-center")
    })

    it("has muted background", () => {
      const { container } = render(<BasicTabs />)
      const list = container.querySelector('[data-slot="tabs-list"]')
      expect(list?.className).toContain("bg-muted")
    })

    it("applies custom className", () => {
      const { container } = render(
        <Tabs defaultValue="a">
          <TabsList className="custom-list">
            <TabsTrigger value="a">A</TabsTrigger>
          </TabsList>
        </Tabs>
      )
      expect(container.querySelector('[data-slot="tabs-list"]')?.className).toContain("custom-list")
    })
  })

  describe("TabsTrigger", () => {
    it("renders tabs with tab role", () => {
      render(<BasicTabs />)
      const tabs = screen.getAllByRole("tab")
      expect(tabs.length).toBe(3)
    })

    it("has data-slot='tabs-trigger'", () => {
      const { container } = render(<BasicTabs />)
      const triggers = container.querySelectorAll('[data-slot="tabs-trigger"]')
      expect(triggers.length).toBe(3)
    })

    it("first tab is active by default", () => {
      render(<BasicTabs />)
      const firstTab = screen.getByRole("tab", { name: "Tab One" })
      expect(firstTab.getAttribute("data-state")).toBe("active")
    })

    it("inactive tabs have inactive state", () => {
      render(<BasicTabs />)
      const secondTab = screen.getByRole("tab", { name: "Tab Two" })
      expect(secondTab.getAttribute("data-state")).toBe("inactive")
    })

    it("activates tab on click", async () => {
      render(<BasicTabs />)
      await user.click(screen.getByRole("tab", { name: "Tab Two" }))
      expect(screen.getByRole("tab", { name: "Tab Two" }).getAttribute("data-state")).toBe("active")
    })

    it("deactivates previously active tab on click", async () => {
      render(<BasicTabs />)
      await user.click(screen.getByRole("tab", { name: "Tab Two" }))
      expect(screen.getByRole("tab", { name: "Tab One" }).getAttribute("data-state")).toBe("inactive")
    })

    it("applies custom className", () => {
      const { container } = render(
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a" className="custom-trigger">A</TabsTrigger>
          </TabsList>
        </Tabs>
      )
      expect(container.querySelector('[data-slot="tabs-trigger"]')?.className).toContain("custom-trigger")
    })

    it("disabled trigger has disabled attribute", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      )
      const disabledTab = screen.getByRole("tab", { name: "Tab 2" })
      expect(disabledTab).toBeDisabled()
    })
  })

  describe("TabsContent", () => {
    it("renders active content by default", () => {
      render(<BasicTabs />)
      expect(screen.getByText("Content One")).toBeTruthy()
    })

    it("shows correct content when tab switches", async () => {
      render(<BasicTabs />)
      await user.click(screen.getByRole("tab", { name: "Tab Two" }))
      expect(screen.getByText("Content Two")).toBeTruthy()
    })

    it("has data-slot='tabs-content'", () => {
      const { container } = render(<BasicTabs />)
      expect(container.querySelector('[data-slot="tabs-content"]')).toBeTruthy()
    })

    it("has tabpanel role", () => {
      render(<BasicTabs />)
      expect(screen.getByRole("tabpanel")).toBeTruthy()
    })

    it("applies custom className", () => {
      const { container } = render(
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">A</TabsTrigger>
          </TabsList>
          <TabsContent value="a" className="custom-content">Content</TabsContent>
        </Tabs>
      )
      expect(container.querySelector('[data-slot="tabs-content"]')?.className).toContain("custom-content")
    })

    it("has flex-1 and outline-none classes", () => {
      const { container } = render(
        <Tabs defaultValue="a">
          <TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>
          <TabsContent value="a">Content</TabsContent>
        </Tabs>
      )
      const content = container.querySelector('[data-slot="tabs-content"]')
      expect(content?.className).toContain("flex-1")
      expect(content?.className).toContain("outline-none")
    })
  })

  describe("Keyboard Navigation", () => {
    it("can navigate tabs with arrow keys", async () => {
      render(<BasicTabs />)
      const firstTab = screen.getByRole("tab", { name: "Tab One" })
      firstTab.focus()
      await user.keyboard("{ArrowRight}")
      expect(document.activeElement?.textContent).toBe("Tab Two")
    })

    it("wraps focus on ArrowLeft from first tab", async () => {
      render(<BasicTabs />)
      const firstTab = screen.getByRole("tab", { name: "Tab One" })
      firstTab.focus()
      await user.keyboard("{ArrowLeft}")
      expect(document.activeElement?.textContent).toBe("Tab Three")
    })
  })

  describe("Controlled Mode", () => {
    it("supports controlled value", () => {
      render(
        <Tabs value="tab2" onValueChange={() => {}}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      expect(screen.getByRole("tab", { name: "Tab 2" }).getAttribute("data-state")).toBe("active")
      expect(screen.getByText("Content 2")).toBeTruthy()
    })
  })

  describe("Accessibility", () => {
    it("tabs have aria-controls pointing to panels", () => {
      render(<BasicTabs />)
      const tab = screen.getByRole("tab", { name: "Tab One" })
      const panelId = tab.getAttribute("aria-controls")
      expect(panelId).toBeTruthy()
      expect(document.getElementById(panelId!)).toBeTruthy()
    })

    it("panels have aria-labelledby pointing to tabs", () => {
      render(<BasicTabs />)
      const panel = screen.getByRole("tabpanel")
      const labelId = panel.getAttribute("aria-labelledby")
      expect(labelId).toBeTruthy()
    })
  })

  describe("Complete Usage Example", () => {
    it("renders a profile settings tabs", async () => {
      render(
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <p>Account settings here</p>
          </TabsContent>
          <TabsContent value="security">
            <p>Security settings here</p>
          </TabsContent>
        </Tabs>
      )

      expect(screen.getByText("Account settings here")).toBeTruthy()
      await user.click(screen.getByRole("tab", { name: "Security" }))
      expect(screen.getByText("Security settings here")).toBeTruthy()
    })
  })
})
