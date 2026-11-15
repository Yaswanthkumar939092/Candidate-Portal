import { describe, it, expect } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { BrandLockup, shouldShowBrandName } from "@/components/brand-lockup"

describe("shouldShowBrandName", () => {
  it("shows the name by default when a title exists", () => {
    expect(shouldShowBrandName({ title_prefix: "Acme Careers" })).toBe(true)
  })

  it("hides the name when the logo already spells it out", () => {
    expect(
      shouldShowBrandName({ title_prefix: "Acme Careers", logo_includes_company_name: true }),
    ).toBe(false)
  })

  it("hides the name when there is none", () => {
    expect(shouldShowBrandName(null)).toBe(false)
    expect(shouldShowBrandName({ title_prefix: "   " })).toBe(false)
  })
})

describe("BrandLockup", () => {
  it("renders logo before name", () => {
    render(<BrandLockup branding={{ title_prefix: "Acme Careers", app_logo: "/files/logo.png" }} />)
    const lockup = screen.getByTestId("brand-lockup")
    const img = lockup.querySelector("img")!
    const name = screen.getByText("Acme Careers")
    expect(img.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("renders a height-bound wide logo with an alt and no text when the logo carries the name", () => {
    render(
      <BrandLockup
        branding={{ title_prefix: "Acme Careers", app_logo: "/files/logo.png", logo_includes_company_name: true }}
      />,
    )
    const img = screen.getByAltText("Acme Careers")
    expect(screen.queryByText("Acme Careers")).toBeNull()
    expect(img.className).toContain("w-auto")
    expect(img.className).not.toContain("size-")
  })

  it("shows the bundled Hybrowlabs wordmark, with no text, when no logo is configured", () => {
    render(<BrandLockup branding={{ title_prefix: "Acme Careers" }} />)
    expect(screen.getByAltText("Acme Careers").getAttribute("src")).toBe("/hybrowlabs-logo.svg")
    expect(screen.queryByText("Acme Careers")).toBeNull()
  })

  it("uses the light wordmark on dark surfaces and the Hybrowlabs name when Operate has none", () => {
    render(<BrandLockup branding={null} tone="light" />)
    expect(screen.getByAltText("Hybrowlabs").getAttribute("src")).toBe("/hybrowlabs-logo-white.svg")
  })

  it("falls back to the bundled wordmark when the configured logo fails to load", () => {
    render(<BrandLockup branding={{ title_prefix: "Acme Careers", app_logo: "/files/logo.png" }} />)
    fireEvent.error(screen.getByTestId("brand-lockup").querySelector("img")!)
    expect(screen.getByAltText("Acme Careers").getAttribute("src")).toBe("/hybrowlabs-logo.svg")
    expect(screen.queryByText("Acme Careers")).toBeNull()
  })
})
