import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"
import { Search } from "lucide-react"

describe("Empty Components", () => {
  describe("Empty", () => {
    it("renders as div element", () => {
      const { container } = render(<Empty />)
      const div = container.querySelector("div[data-slot='empty']")
      expect(div).toBeTruthy()
    })

    it("has correct default styling classes", () => {
      const { container } = render(<Empty />)
      const div = container.querySelector("div[data-slot='empty']")
      expect(div?.className).toContain("flex")
      expect(div?.className).toContain("flex-col")
      expect(div?.className).toContain("items-center")
      expect(div?.className).toContain("justify-center")
      expect(div?.className).toContain("gap-6")
      expect(div?.className).toContain("rounded-lg")
      expect(div?.className).toContain("border-dashed")
      expect(div?.className).toContain("p-6")
      expect(div?.className).toContain("text-center")
    })

    it("applies custom className", () => {
      const { container } = render(<Empty className="custom-empty" />)
      const div = container.querySelector("div[data-slot='empty']")
      expect(div?.className).toContain("custom-empty")
    })

    it("renders children content", () => {
      render(<Empty>Empty State Content</Empty>)
      expect(screen.getByText("Empty State Content")).toBeTruthy()
    })

    it("forwards additional props", () => {
      const { container } = render(
        <Empty data-testid="empty-container" />
      )
      expect(container.querySelector('[data-testid="empty-container"]')).toBeTruthy()
    })
  })

  describe("EmptyHeader", () => {
    it("renders as div element", () => {
      const { container } = render(<EmptyHeader />)
      const div = container.querySelector("div[data-slot='empty-header']")
      expect(div).toBeTruthy()
    })

    it("has correct default styling classes", () => {
      const { container } = render(<EmptyHeader />)
      const div = container.querySelector("div[data-slot='empty-header']")
      expect(div?.className).toContain("flex")
      expect(div?.className).toContain("flex-col")
      expect(div?.className).toContain("items-center")
      expect(div?.className).toContain("gap-2")
      expect(div?.className).toContain("text-center")
      expect(div?.className).toContain("max-w-sm")
    })

    it("applies custom className", () => {
      const { container } = render(
        <EmptyHeader className="custom-header" />
      )
      const div = container.querySelector("div[data-slot='empty-header']")
      expect(div?.className).toContain("custom-header")
    })

    it("renders children content", () => {
      render(<EmptyHeader>Header Content</EmptyHeader>)
      expect(screen.getByText("Header Content")).toBeTruthy()
    })
  })

  describe("EmptyTitle", () => {
    it("renders as div element", () => {
      const { container } = render(<EmptyTitle />)
      const div = container.querySelector("div[data-slot='empty-title']")
      expect(div).toBeTruthy()
    })

    it("has correct default styling classes", () => {
      const { container } = render(<EmptyTitle />)
      const div = container.querySelector("div[data-slot='empty-title']")
      expect(div?.className).toContain("text-lg")
      expect(div?.className).toContain("font-medium")
      expect(div?.className).toContain("tracking-tight")
    })

    it("applies custom className", () => {
      const { container } = render(
        <EmptyTitle className="custom-title" />
      )
      const div = container.querySelector("div[data-slot='empty-title']")
      expect(div?.className).toContain("custom-title")
    })

    it("renders text content", () => {
      render(<EmptyTitle>No Results Found</EmptyTitle>)
      expect(screen.getByText("No Results Found")).toBeTruthy()
    })
  })

  describe("EmptyDescription", () => {
    it("renders as div element (not p)", () => {
      const { container } = render(<EmptyDescription />)
      const div = container.querySelector("div[data-slot='empty-description']")
      expect(div).toBeTruthy()
    })

    it("has correct default styling classes", () => {
      const { container } = render(<EmptyDescription />)
      const div = container.querySelector("div[data-slot='empty-description']")
      expect(div?.className).toContain("text-muted-foreground")
      expect(div?.className).toContain("text-sm")
    })

    it("applies custom className", () => {
      const { container } = render(
        <EmptyDescription className="custom-description" />
      )
      const div = container.querySelector("div[data-slot='empty-description']")
      expect(div?.className).toContain("custom-description")
    })

    it("renders text content", () => {
      render(
        <EmptyDescription>
          Try adjusting your search criteria
        </EmptyDescription>
      )
      expect(screen.getByText("Try adjusting your search criteria")).toBeTruthy()
    })

    it("supports links with styling", () => {
      const { container } = render(
        <EmptyDescription>
          Need help? <a href="/help">Contact support</a>
        </EmptyDescription>
      )
      const link = container.querySelector("a")
      expect(link).toBeTruthy()
      expect(screen.getByText("Contact support")).toBeTruthy()
    })
  })

  describe("EmptyContent", () => {
    it("renders as div element", () => {
      const { container } = render(<EmptyContent />)
      const div = container.querySelector("div[data-slot='empty-content']")
      expect(div).toBeTruthy()
    })

    it("has correct default styling classes", () => {
      const { container } = render(<EmptyContent />)
      const div = container.querySelector("div[data-slot='empty-content']")
      expect(div?.className).toContain("flex")
      expect(div?.className).toContain("w-full")
      expect(div?.className).toContain("max-w-sm")
      expect(div?.className).toContain("flex-col")
      expect(div?.className).toContain("items-center")
      expect(div?.className).toContain("gap-4")
      expect(div?.className).toContain("text-sm")
    })

    it("applies custom className", () => {
      const { container } = render(
        <EmptyContent className="custom-content" />
      )
      const div = container.querySelector("div[data-slot='empty-content']")
      expect(div?.className).toContain("custom-content")
    })

    it("renders children content", () => {
      render(
        <EmptyContent>
          <button>Action</button>
        </EmptyContent>
      )
      expect(screen.getByText("Action")).toBeTruthy()
    })
  })

  describe("EmptyMedia", () => {
    it("renders as div element", () => {
      const { container } = render(<EmptyMedia />)
      const div = container.querySelector("div[data-slot='empty-icon']")
      expect(div).toBeTruthy()
    })

    it("has correct default styling classes", () => {
      const { container } = render(<EmptyMedia />)
      const div = container.querySelector("div[data-slot='empty-icon']")
      expect(div?.className).toContain("flex")
      expect(div?.className).toContain("shrink-0")
      expect(div?.className).toContain("items-center")
      expect(div?.className).toContain("justify-center")
    })

    it("applies default variant styling", () => {
      const { container } = render(<EmptyMedia />)
      const div = container.querySelector("div[data-slot='empty-icon']")
      expect(div?.getAttribute("data-variant")).toBe("default")
    })

    it("applies icon variant", () => {
      const { container } = render(<EmptyMedia variant="icon" />)
      const div = container.querySelector("div[data-slot='empty-icon']")
      expect(div?.getAttribute("data-variant")).toBe("icon")
      expect(div?.className).toContain("bg-muted")
      expect(div?.className).toContain("size-10")
      expect(div?.className).toContain("rounded-lg")
    })

    it("renders with icon children", () => {
      const { container } = render(
        <EmptyMedia variant="icon">
          <Search className="w-6 h-6" />
        </EmptyMedia>
      )
      const svg = container.querySelector("svg")
      expect(svg).toBeTruthy()
    })

    it("applies custom className", () => {
      const { container } = render(
        <EmptyMedia className="custom-media" />
      )
      const div = container.querySelector("div[data-slot='empty-icon']")
      expect(div?.className).toContain("custom-media")
    })
  })

  describe("Empty Integration - Complete Empty State", () => {
    it("renders complete empty state", () => {
      render(
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>No results found</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>
            We couldn't find any matching items. Try adjusting your filters.
          </EmptyDescription>
          <EmptyContent>
            <button>Clear filters</button>
          </EmptyContent>
        </Empty>
      )

      expect(screen.getByText("No results found")).toBeTruthy()
      expect(
        screen.getByText(
          "We couldn't find any matching items. Try adjusting your filters."
        )
      ).toBeTruthy()
      expect(screen.getByText("Clear filters")).toBeTruthy()
    })

    it("renders empty state with multiple action buttons", () => {
      render(
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No jobs yet</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>
            Start searching for your next opportunity
          </EmptyDescription>
          <EmptyContent>
            <button>Browse Jobs</button>
            <button>Save Search</button>
          </EmptyContent>
        </Empty>
      )

      expect(screen.getByText("No jobs yet")).toBeTruthy()
      expect(screen.getByText("Start searching for your next opportunity")).toBeTruthy()
      expect(screen.getByText("Browse Jobs")).toBeTruthy()
      expect(screen.getByText("Save Search")).toBeTruthy()
    })

    it("renders minimal empty state", () => {
      render(
        <Empty>
          <EmptyTitle>Empty</EmptyTitle>
        </Empty>
      )

      expect(screen.getByText("Empty")).toBeTruthy()
    })

    it("renders empty state with link in description", () => {
      render(
        <Empty>
          <EmptyTitle>Nothing here</EmptyTitle>
          <EmptyDescription>
            <a href="/help">Learn more</a> about what you can do
          </EmptyDescription>
        </Empty>
      )

      expect(screen.getByText("Nothing here")).toBeTruthy()
      const link = screen.getByText("Learn more")
      expect(link.getAttribute("href")).toBe("/help")
    })
  })

  describe("Accessibility", () => {
    it("maintains semantic structure for screen readers", () => {
      const { container } = render(
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No items</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>Empty state message</EmptyDescription>
        </Empty>
      )

      expect(container.querySelector("div[data-slot='empty']")).toBeTruthy()
      expect(container.querySelector("div[data-slot='empty-header']")).toBeTruthy()
      expect(container.querySelector("div[data-slot='empty-title']")).toBeTruthy()
    })
  })

  describe("Responsive Design", () => {
    it("applies responsive padding classes", () => {
      const { container } = render(<Empty />)
      const div = container.querySelector("div[data-slot='empty']")
      expect(div?.className).toContain("p-6")
      expect(div?.className).toContain("md:p-12")
    })
  })
})
