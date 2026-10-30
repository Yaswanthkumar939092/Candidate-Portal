import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrandLockup, shouldShowBrandName } from "@/components/brand-lockup"

describe("shouldShowBrandName", () => {
  it("shows the name by default when a title exists", () => {
    expect(shouldShowBrandName({ title_prefix: "PW Oxygen" })).toBe(true)
  })

  it("hides the name when the logo already spells it out", () => {
    expect(
      shouldShowBrandName({ title_prefix: "PW Oxygen", logo_includes_company_name: true }),
    ).toBe(false)
  })

  it("hides the name when there is none", () => {
    expect(shouldShowBrandName(null)).toBe(false)
    expect(shouldShowBrandName({ title_prefix: "   " })).toBe(false)
  })
})

describe("BrandLockup", () => {
  it("renders logo before name", () => {
    render(<BrandLockup branding={{ title_prefix: "PW Oxygen", app_logo: "/brand.png" }} />)
    const lockup = screen.getByTestId("brand-lockup")
    const img = lockup.querySelector("img")!
    const name = screen.getByText("PW Oxygen")
    expect(img.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("renders a height-bound wide logo with an alt and no text when the logo carries the name", () => {
    render(
      <BrandLockup
        branding={{ title_prefix: "PW Oxygen", app_logo: "/brand.png", logo_includes_company_name: true }}
      />,
    )
    const img = screen.getByAltText("PW Oxygen")
    expect(screen.queryByText("PW Oxygen")).toBeNull()
    expect(img.className).toContain("w-auto")
    expect(img.className).not.toContain("size-")
  })
})
