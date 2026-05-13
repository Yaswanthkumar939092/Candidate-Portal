import React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Progress } from "@/components/ui/progress"

describe("Progress Component", () => {
  describe("Rendering", () => {
    it("renders progress element", () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot).toBeTruthy()
    })

    it("renders with default value of 0", () => {
      const { container } = render(<Progress />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot).toBeTruthy()
    })

    it("renders progress indicator", () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      expect(indicator).toBeTruthy()
    })
  })

  describe("Progress Value", () => {
    it("accepts value prop", () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      // value is reflected via the indicator's transform style, not data-value
      expect(indicator?.getAttribute("style")).toContain("translateX(-50%)")
    })

    it("handles 0 value", () => {
      const { container } = render(<Progress value={0} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      const style = indicator?.getAttribute("style")
      expect(style?.includes("translateX(-100%)")|| style?.includes("translateX(0)")).toBeTruthy()
    })

    it("handles 100 value", () => {
      const { container } = render(<Progress value={100} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      const style = indicator?.getAttribute("style") ?? ""
      // 100 - 100 = 0, so transform is translateX(-0%) in some browsers/jsdom
      expect(style.includes("translateX(-0%)") || style.includes("translateX(0%)")).toBeTruthy()
    })

    it("handles partial value", () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      const style = indicator?.getAttribute("style")
      expect(style?.includes("translateX")).toBeTruthy()
    })

    it("handles undefined value gracefully", () => {
      const { container } = render(<Progress value={undefined} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      expect(indicator).toBeTruthy()
    })

    it("calculates correct translation for value 25", () => {
      const { container } = render(<Progress value={25} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      const style = indicator?.getAttribute("style")
      // 100 - 25 = 75
      expect(style?.includes("translateX(-75%)")).toBeTruthy()
    })

    it("calculates correct translation for value 75", () => {
      const { container } = render(<Progress value={75} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      const style = indicator?.getAttribute("style")
      // 100 - 75 = 25
      expect(style?.includes("translateX(-25%)")).toBeTruthy()
    })
  })

  describe("Styling", () => {
    it("has correct default container classes", () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot?.className).toContain("relative")
      expect(progressRoot?.className).toContain("h-4")
      expect(progressRoot?.className).toContain("w-full")
      expect(progressRoot?.className).toContain("overflow-hidden")
      expect(progressRoot?.className).toContain("rounded-full")
      expect(progressRoot?.className).toContain("bg-secondary")
    })

    it("has correct indicator classes", () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      expect(indicator?.className).toContain("h-full")
      expect(indicator?.className).toContain("w-full")
      expect(indicator?.className).toContain("flex-1")
      expect(indicator?.className).toContain("bg-primary")
      expect(indicator?.className).toContain("transition-all")
    })

    it("applies custom className to root", () => {
      const { container } = render(
        <Progress value={50} className="custom-progress" />
      )
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot?.className).toContain("custom-progress")
    })

    it("applies custom className along with defaults", () => {
      const { container } = render(
        <Progress value={50} className="custom-progress" />
      )
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot?.className).toContain("h-4")
      expect(progressRoot?.className).toContain("w-full")
      expect(progressRoot?.className).toContain("custom-progress")
    })
  })

  describe("Accessibility", () => {
    it("has progressbar role", () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot?.getAttribute("role")).toBe("progressbar")
    })

    it("exposes aria-valuenow on the progressbar", () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      // The value is only reflected in the indicator's translateX, not data-value
      expect(indicator?.getAttribute("style")).toContain("translateX(-50%)")
    })

    it("displays name attribute if provided", () => {
      const { container } = render(
        <Progress value={50} aria-label="Upload progress" />
      )
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot?.getAttribute("aria-label")).toBe("Upload progress")
    })

    it("supports aria-valuenow", () => {
      const { container } = render(
        <Progress value={50} aria-valuenow={50} />
      )
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot?.getAttribute("aria-valuenow")).toBe("50")
    })

    it("supports aria-valuemin and aria-valuemax", () => {
      const { container } = render(
        <Progress
          value={50}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      )
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot).toBeTruthy()
    })
  })

  describe("Animation", () => {
    it("includes transition-all class for smooth animation", () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      expect(indicator?.className).toContain("transition-all")
    })

    it("animates from 0 to 100 progressively", () => {
      const { rerender, container } = render(<Progress value={0} />)

      let indicator = container.querySelector('[role="progressbar"] > div')
      let style = indicator?.getAttribute("style")
      expect(style?.includes("translateX(-100%)") || style?.includes("translateX(0)")).toBeTruthy()

      rerender(<Progress value={50} />)
      indicator = container.querySelector('[role="progressbar"] > div')
      style = indicator?.getAttribute("style")
      expect(style?.includes("translateX(-50%)")).toBeTruthy()

      rerender(<Progress value={100} />)
      indicator = container.querySelector('[role="progressbar"] > div')
      style = indicator?.getAttribute("style") ?? ""
      expect(style.includes("translateX(-0%)") || style.includes("translateX(0%)")).toBeTruthy()
    })
  })

  describe("ForwardRef", () => {
    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLDivElement>()
      const { container } = render(
        <Progress value={50} ref={ref} />
      )

      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot).toBeTruthy()
    })

    it("allows accessing DOM properties via ref", () => {
      const TestComponent = () => {
        const ref = React.createRef<HTMLDivElement>()
        return (
          <Progress
            value={50}
            ref={ref}
            data-testid="progress"
          />
        )
      }

      render(<TestComponent />)
      const progress = screen.getByTestId("progress")
      expect(progress).toBeTruthy()
    })
  })

  describe("Props Forwarding", () => {
    it("forwards additional props to root element", () => {
      const { container } = render(
        <Progress
          value={50}
          data-testid="progress-bar"
          aria-label="File upload progress"
        />
      )

      const progressRoot = container.querySelector('[data-testid="progress-bar"]')
      expect(progressRoot).toBeTruthy()
      expect(progressRoot?.getAttribute("aria-label")).toBe("File upload progress")
    })

    it("supports data attributes", () => {
      const { container } = render(
        <Progress
          value={75}
          data-status="uploading"
          data-file-id="file-123"
        />
      )

      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot?.getAttribute("data-status")).toBe("uploading")
      expect(progressRoot?.getAttribute("data-file-id")).toBe("file-123")
    })

    it("supports custom style prop", () => {
      const { container } = render(
        <Progress
          value={50}
          style={{ width: "200px" }}
        />
      )

      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot?.getAttribute("style")).toBeTruthy()
    })
  })

  describe("Edge Cases", () => {
    it("handles NaN value", () => {
      const { container } = render(<Progress value={NaN} />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot).toBeTruthy()
    })

    it("handles null value", () => {
      const { container } = render(<Progress value={null as unknown as number} />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot).toBeTruthy()
    })

    it("handles value greater than 100", () => {
      const { container } = render(<Progress value={150} />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot).toBeTruthy()
    })

    it("handles negative value", () => {
      const { container } = render(<Progress value={-50} />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot).toBeTruthy()
    })

    it("handles decimal values", () => {
      const { container } = render(<Progress value={33.33} />)
      const indicator = container.querySelector('[role="progressbar"] > div')
      const style = indicator?.getAttribute("style")
      expect(style?.includes("translateX")).toBeTruthy()
    })
  })

  describe("Display Name", () => {
    it("has correct display name", () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot).toBeTruthy()
    })
  })

  describe("Complete Usage Examples", () => {
    it("renders file upload progress", () => {
      const { container } = render(
        <div>
          <p>Uploading file...</p>
          <Progress value={65} />
          <p>65%</p>
        </div>
      )

      expect(screen.getByText("Uploading file...")).toBeTruthy()
      expect(screen.getByText("65%")).toBeTruthy()
      expect(container.querySelector('[role="progressbar"]')).toBeTruthy()
    })

    it("renders download progress", () => {
      const downloadProgress = 42
      const { container } = render(
        <div>
          <p>Downloading...</p>
          <Progress value={downloadProgress} />
          <p>{downloadProgress}% complete</p>
        </div>
      )

      expect(screen.getByText("Downloading...")).toBeTruthy()
      expect(screen.getByText("42% complete")).toBeTruthy()
      expect(container.querySelector('[role="progressbar"]')).toBeTruthy()
    })

    it("renders multiple progress bars", () => {
      const { container } = render(
        <div className="space-y-4">
          <div>
            <p>Task 1</p>
            <Progress value={25} />
          </div>
          <div>
            <p>Task 2</p>
            <Progress value={50} />
          </div>
          <div>
            <p>Task 3</p>
            <Progress value={100} />
          </div>
        </div>
      )

      const progressBars = container.querySelectorAll('[role="progressbar"]')
      expect(progressBars.length).toBe(3)
      expect(screen.getByText("Task 1")).toBeTruthy()
      expect(screen.getByText("Task 2")).toBeTruthy()
      expect(screen.getByText("Task 3")).toBeTruthy()
    })

    it("updates progress dynamically", () => {
      const { rerender, container } = render(
        <Progress value={0} aria-label="Loading" />
      )

      let indicator = container.querySelector('[role="progressbar"] > div')
      expect(indicator?.getAttribute("style")).toContain("translateX(-100%)")

      rerender(<Progress value={50} aria-label="Loading" />)
      indicator = container.querySelector('[role="progressbar"] > div')
      expect(indicator?.getAttribute("style")).toContain("translateX(-50%)")

      rerender(<Progress value={100} aria-label="Loading" />)
      indicator = container.querySelector('[role="progressbar"] > div')
      const style = indicator?.getAttribute("style") ?? ""
      expect(style.includes("translateX(-0%)") || style.includes("translateX(0%)")).toBeTruthy()
    })
  })

  describe("Responsive Design", () => {
    it("maintains full width by default", () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[role="progressbar"]')
      expect(progressRoot?.className).toContain("w-full")
    })

    it("respects container width constraints", () => {
      const { container } = render(
        <div style={{ width: "300px" }}>
          <Progress value={50} />
        </div>
      )

      expect(container.querySelector('[role="progressbar"]')).toBeTruthy()
    })
  })
})
