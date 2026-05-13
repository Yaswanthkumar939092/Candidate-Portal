import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb"

describe("Breadcrumb Components", () => {
  describe("Breadcrumb", () => {
    it("renders as nav element with breadcrumb aria-label", () => {
      const { container } = render(<Breadcrumb />)
      const nav = container.querySelector("nav[aria-label='breadcrumb']")
      expect(nav).toBeTruthy()
    })

    it("renders children correctly", () => {
      render(
        <Breadcrumb>
          <span>Test Content</span>
        </Breadcrumb>
      )
      expect(screen.getByText("Test Content")).toBeTruthy()
    })

    it("applies custom className", () => {
      const { container } = render(
        <Breadcrumb className="custom-breadcrumb" />
      )
      const nav = container.querySelector("nav.custom-breadcrumb")
      expect(nav).toBeTruthy()
    })

    it("forwards additional props", () => {
      const { container } = render(
        <Breadcrumb data-testid="breadcrumb-nav" />
      )
      expect(container.querySelector('[data-testid="breadcrumb-nav"]')).toBeTruthy()
    })
  })

  describe("BreadcrumbList", () => {
    it("renders as ol element", () => {
      const { container } = render(<BreadcrumbList />)
      const ol = container.querySelector("ol")
      expect(ol).toBeTruthy()
    })

    it("has correct default styling classes", () => {
      const { container } = render(<BreadcrumbList />)
      const ol = container.querySelector("ol")
      expect(ol?.className).toContain("flex")
      expect(ol?.className).toContain("flex-wrap")
      expect(ol?.className).toContain("items-center")
      expect(ol?.className).toContain("gap-1.5")
      expect(ol?.className).toContain("text-sm")
    })

    it("applies custom className", () => {
      const { container } = render(
        <BreadcrumbList className="custom-list" />
      )
      const ol = container.querySelector("ol")
      expect(ol?.className).toContain("custom-list")
    })

    it("renders children items", () => {
      render(
        <BreadcrumbList>
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbItem>Products</BreadcrumbItem>
        </BreadcrumbList>
      )
      expect(screen.getByText("Home")).toBeTruthy()
      expect(screen.getByText("Products")).toBeTruthy()
    })
  })

  describe("BreadcrumbItem", () => {
    it("renders as li element", () => {
      const { container } = render(<BreadcrumbItem />)
      const li = container.querySelector("li")
      expect(li).toBeTruthy()
    })

    it("has correct default styling classes", () => {
      const { container } = render(<BreadcrumbItem />)
      const li = container.querySelector("li")
      expect(li?.className).toContain("inline-flex")
      expect(li?.className).toContain("items-center")
      expect(li?.className).toContain("gap-1.5")
    })

    it("applies custom className", () => {
      const { container } = render(
        <BreadcrumbItem className="custom-item" />
      )
      const li = container.querySelector("li")
      expect(li?.className).toContain("custom-item")
    })

    it("renders text content", () => {
      render(<BreadcrumbItem>Home</BreadcrumbItem>)
      expect(screen.getByText("Home")).toBeTruthy()
    })
  })

  describe("BreadcrumbLink", () => {
    it("renders as a element by default", () => {
      const { container } = render(<BreadcrumbLink />)
      const link = container.querySelector("a")
      expect(link).toBeTruthy()
    })

    it("accepts href attribute", () => {
      const { container } = render(
        <BreadcrumbLink href="/home">Home</BreadcrumbLink>
      )
      const link = container.querySelector("a[href='/home']")
      expect(link).toBeTruthy()
    })

    it("has hover transition styling", () => {
      const { container } = render(<BreadcrumbLink />)
      const link = container.querySelector("a")
      expect(link?.className).toContain("hover:text-foreground")
      expect(link?.className).toContain("transition-colors")
    })

    it("renders with Slot when asChild is true", () => {
      const { container } = render(
        <BreadcrumbLink asChild>
          <button>Custom Element</button>
        </BreadcrumbLink>
      )
      const button = container.querySelector("button")
      expect(button).toBeTruthy()
      expect(screen.getByText("Custom Element")).toBeTruthy()
    })

    it("applies custom className", () => {
      const { container } = render(
        <BreadcrumbLink className="custom-link" />
      )
      const link = container.querySelector("a")
      expect(link?.className).toContain("custom-link")
    })

    it("renders link text", () => {
      render(<BreadcrumbLink>Click here</BreadcrumbLink>)
      expect(screen.getByText("Click here")).toBeTruthy()
    })
  })

  describe("BreadcrumbPage", () => {
    it("renders as span element", () => {
      const { container } = render(<BreadcrumbPage />)
      const span = container.querySelector("span")
      expect(span).toBeTruthy()
    })

    it("has proper accessibility attributes", () => {
      const { container } = render(<BreadcrumbPage />)
      const span = container.querySelector("span")
      expect(span?.getAttribute("role")).toBe("link")
      expect(span?.getAttribute("aria-disabled")).toBe("true")
      expect(span?.getAttribute("aria-current")).toBe("page")
    })

    it("has correct styling classes", () => {
      const { container } = render(<BreadcrumbPage />)
      const span = container.querySelector("span")
      expect(span?.className).toContain("text-foreground")
      expect(span?.className).toContain("font-normal")
    })

    it("applies custom className", () => {
      const { container } = render(
        <BreadcrumbPage className="custom-page" />
      )
      const span = container.querySelector("span")
      expect(span?.className).toContain("custom-page")
    })

    it("renders page text", () => {
      render(<BreadcrumbPage>Current Page</BreadcrumbPage>)
      expect(screen.getByText("Current Page")).toBeTruthy()
    })
  })

  describe("BreadcrumbSeparator", () => {
    it("renders as li element", () => {
      const { container } = render(<BreadcrumbSeparator />)
      const li = container.querySelector("li")
      expect(li).toBeTruthy()
    })

    it("has proper accessibility attributes", () => {
      const { container } = render(<BreadcrumbSeparator />)
      const li = container.querySelector("li")
      expect(li?.getAttribute("role")).toBe("presentation")
      expect(li?.getAttribute("aria-hidden")).toBe("true")
    })

    it("renders ChevronRight icon by default", () => {
      const { container } = render(<BreadcrumbSeparator />)
      const svg = container.querySelector("svg")
      expect(svg).toBeTruthy()
    })

    it("renders custom children when provided", () => {
      render(
        <BreadcrumbSeparator>
          <span data-testid="custom-separator">/</span>
        </BreadcrumbSeparator>
      )
      expect(screen.getByTestId("custom-separator")).toBeTruthy()
    })

    it("applies custom className", () => {
      const { container } = render(
        <BreadcrumbSeparator className="custom-separator" />
      )
      const li = container.querySelector("li")
      expect(li?.className).toContain("custom-separator")
    })
  })

  describe("BreadcrumbEllipsis", () => {
    it("renders as span element", () => {
      const { container } = render(<BreadcrumbEllipsis />)
      const span = container.querySelector("span")
      expect(span).toBeTruthy()
    })

    it("has proper accessibility attributes", () => {
      const { container } = render(<BreadcrumbEllipsis />)
      const span = container.querySelector("span")
      expect(span?.getAttribute("role")).toBe("presentation")
      expect(span?.getAttribute("aria-hidden")).toBe("true")
    })

    it("renders MoreHorizontal icon", () => {
      const { container } = render(<BreadcrumbEllipsis />)
      const svg = container.querySelector("svg")
      expect(svg).toBeTruthy()
    })

    it("includes sr-only More text for accessibility", () => {
      render(<BreadcrumbEllipsis />)
      const srText = screen.getByText("More")
      expect(srText.className).toContain("sr-only")
    })

    it("has correct flex styling", () => {
      const { container } = render(<BreadcrumbEllipsis />)
      const span = container.querySelector("span")
      expect(span?.className).toContain("flex")
      expect(span?.className).toContain("size-9")
      expect(span?.className).toContain("items-center")
      expect(span?.className).toContain("justify-center")
    })

    it("applies custom className", () => {
      const { container } = render(
        <BreadcrumbEllipsis className="custom-ellipsis" />
      )
      const span = container.querySelector("span")
      expect(span?.className).toContain("custom-ellipsis")
    })
  })

  describe("Breadcrumb Integration", () => {
    it("renders complete breadcrumb navigation", () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/products">Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )

      expect(screen.getByText("Home")).toBeTruthy()
      expect(screen.getByText("Products")).toBeTruthy()
      expect(screen.getByText("Details")).toBeTruthy()
      expect(container.querySelector("nav[aria-label='breadcrumb']")).toBeTruthy()
    })

    it("renders breadcrumb with ellipsis", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )

      expect(screen.getByText("Home")).toBeTruthy()
      expect(screen.getByText("More")).toBeTruthy()
      expect(screen.getByText("Current")).toBeTruthy()
    })
  })
})
