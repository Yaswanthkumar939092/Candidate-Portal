import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

describe("Select Components", () => {
  const user = userEvent.setup()

  const SelectDemo = () => (
    <Select defaultValue="apple">
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )

  it("renders select trigger initially", () => {
    render(<SelectDemo />)
    expect(screen.getByRole("combobox")).toBeTruthy()
  })

  it("renders SelectGroup, SelectLabel, and SelectSeparator when open", async () => {
    render(<SelectDemo />)
    
    const trigger = screen.getByRole("combobox")
    await user.click(trigger)

    await waitFor(() => {
      // Check for group label to verify SelectLabel & SelectGroup coverage
      expect(screen.getByText("Fruits")).toBeTruthy()
      expect(screen.getByText("Vegetables")).toBeTruthy()
    })

    // Verify Group existence in DOM structure
    const groups = document.body.querySelectorAll('[data-slot="select-group"]')
    expect(groups.length).toBeGreaterThan(0)

    // Verify Label existence
    const labels = document.body.querySelectorAll('[data-slot="select-label"]')
    expect(labels.length).toBeGreaterThan(0)

    // Verify Separator existence
    const separators = document.body.querySelectorAll('[data-slot="select-separator"]')
    expect(separators.length).toBeGreaterThan(0)
  })

  it("passes custom className to SelectGroup, SelectLabel, and SelectSeparator", async () => {
    render(
      <Select open={true}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup className="custom-group">
            <SelectLabel className="custom-label">Test Label</SelectLabel>
            <SelectItem value="test">Test Item</SelectItem>
          </SelectGroup>
          <SelectSeparator className="custom-separator" />
        </SelectContent>
      </Select>
    )

    await waitFor(() => {
      const group = document.body.querySelector(".custom-group")
      const label = document.body.querySelector(".custom-label")
      const separator = document.body.querySelector(".custom-separator")
      
      expect(group).toBeTruthy()
      expect(label).toBeTruthy()
      expect(separator).toBeTruthy()
    })
  })
})
