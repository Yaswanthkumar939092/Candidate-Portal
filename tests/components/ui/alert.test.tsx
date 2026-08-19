import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

describe("Alert", () => {
  it("renders the alert title and description", () => {
    render(
      <Alert>
        <AlertTitle>My Title</AlertTitle>
        <AlertDescription>My Description</AlertDescription>
      </Alert>
    )

    expect(screen.getByText("My Title")).toBeTruthy()
    expect(screen.getByText("My Description")).toBeTruthy()
  })

  it("handles different variants", () => {
    const { container } = render(<Alert variant="destructive">Error</Alert>)
    expect(container.firstChild).toHaveClass("border-destructive/50")
  })
})
