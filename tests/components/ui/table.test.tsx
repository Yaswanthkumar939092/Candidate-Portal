import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table"

function FullTable() {
  return (
    <Table>
      <TableCaption>A list of users</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Alice</TableCell>
          <TableCell>alice@example.com</TableCell>
          <TableCell>Admin</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bob</TableCell>
          <TableCell>bob@example.com</TableCell>
          <TableCell>User</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total: 2 users</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

describe("Table Components", () => {
  describe("Table", () => {
    it("renders a table element", () => {
      const { container } = render(<Table />)
      expect(container.querySelector("table")).toBeTruthy()
    })

    it("wraps table in a scrollable div", () => {
      const { container } = render(<Table />)
      const wrapper = container.firstElementChild
      expect(wrapper?.className).toContain("relative")
      expect(wrapper?.className).toContain("w-full")
      expect(wrapper?.className).toContain("overflow-auto")
    })

    it("has default table classes", () => {
      const { container } = render(<Table />)
      const table = container.querySelector("table")
      expect(table?.className).toContain("w-full")
      expect(table?.className).toContain("text-sm")
      expect(table?.className).toContain("caption-bottom")
    })

    it("applies custom className to table", () => {
      const { container } = render(<Table className="custom-table" />)
      const table = container.querySelector("table")
      expect(table?.className).toContain("custom-table")
    })

    it("forwards ref to table element", () => {
      const ref = { current: null }
      const { container } = render(<Table ref={ref as any} />)
      expect(ref.current).toBe(container.querySelector("table"))
    })

    it("forwards additional props", () => {
      const { container } = render(<Table data-testid="my-table" />)
      expect(screen.getByTestId("my-table")).toBeTruthy()
    })
  })

  describe("TableHeader", () => {
    it("renders a thead element", () => {
      const { container } = render(
        <table>
          <TableHeader />
        </table>
      )
      expect(container.querySelector("thead")).toBeTruthy()
    })

    it("has border-b on rows class", () => {
      const { container } = render(
        <table>
          <TableHeader />
        </table>
      )
      const thead = container.querySelector("thead")
      expect(thead?.className).toContain("[&_tr]:border-b")
    })

    it("applies custom className", () => {
      const { container } = render(
        <table>
          <TableHeader className="custom-header" />
        </table>
      )
      expect(container.querySelector("thead")?.className).toContain("custom-header")
    })
  })

  describe("TableBody", () => {
    it("renders a tbody element", () => {
      const { container } = render(
        <table>
          <TableBody />
        </table>
      )
      expect(container.querySelector("tbody")).toBeTruthy()
    })

    it("has no-border-last-row class", () => {
      const { container } = render(
        <table>
          <TableBody />
        </table>
      )
      const tbody = container.querySelector("tbody")
      expect(tbody?.className).toContain("[&_tr:last-child]:border-0")
    })

    it("applies custom className", () => {
      const { container } = render(
        <table>
          <TableBody className="custom-body" />
        </table>
      )
      expect(container.querySelector("tbody")?.className).toContain("custom-body")
    })
  })

  describe("TableFooter", () => {
    it("renders a tfoot element", () => {
      const { container } = render(
        <table>
          <TableFooter />
        </table>
      )
      expect(container.querySelector("tfoot")).toBeTruthy()
    })

    it("has muted background and font-medium", () => {
      const { container } = render(
        <table>
          <TableFooter />
        </table>
      )
      const tfoot = container.querySelector("tfoot")
      expect(tfoot?.className).toContain("bg-muted/50")
      expect(tfoot?.className).toContain("font-medium")
    })

    it("applies custom className", () => {
      const { container } = render(
        <table>
          <TableFooter className="custom-footer" />
        </table>
      )
      expect(container.querySelector("tfoot")?.className).toContain("custom-footer")
    })
  })

  describe("TableRow", () => {
    it("renders a tr element", () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRow />
          </tbody>
        </table>
      )
      expect(container.querySelector("tr")).toBeTruthy()
    })

    it("has border-b and hover classes", () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRow />
          </tbody>
        </table>
      )
      const tr = container.querySelector("tr")
      expect(tr?.className).toContain("border-b")
      expect(tr?.className).toContain("hover:bg-muted/50")
      expect(tr?.className).toContain("transition-colors")
    })

    it("applies custom className", () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRow className="custom-row" />
          </tbody>
        </table>
      )
      expect(container.querySelector("tr")?.className).toContain("custom-row")
    })

    it("forwards data attributes", () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRow data-state="selected" />
          </tbody>
        </table>
      )
      expect(container.querySelector('tr[data-state="selected"]')).toBeTruthy()
    })
  })

  describe("TableHead", () => {
    it("renders a th element", () => {
      const { container } = render(
        <table>
          <thead>
            <tr>
              <TableHead>Header</TableHead>
            </tr>
          </thead>
        </table>
      )
      expect(container.querySelector("th")).toBeTruthy()
      expect(screen.getByText("Header")).toBeTruthy()
    })

    it("has height, padding, and font-medium classes", () => {
      const { container } = render(
        <table>
          <thead>
            <tr>
              <TableHead>Header</TableHead>
            </tr>
          </thead>
        </table>
      )
      const th = container.querySelector("th")
      expect(th?.className).toContain("h-12")
      expect(th?.className).toContain("px-4")
      expect(th?.className).toContain("font-medium")
      expect(th?.className).toContain("text-muted-foreground")
    })

    it("applies custom className", () => {
      const { container } = render(
        <table>
          <thead>
            <tr>
              <TableHead className="custom-head">H</TableHead>
            </tr>
          </thead>
        </table>
      )
      expect(container.querySelector("th")?.className).toContain("custom-head")
    })
  })

  describe("TableCell", () => {
    it("renders a td element", () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell</TableCell>
            </tr>
          </tbody>
        </table>
      )
      expect(container.querySelector("td")).toBeTruthy()
      expect(screen.getByText("Cell")).toBeTruthy()
    })

    it("has padding and align-middle classes", () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell</TableCell>
            </tr>
          </tbody>
        </table>
      )
      const td = container.querySelector("td")
      expect(td?.className).toContain("p-4")
      expect(td?.className).toContain("align-middle")
    })

    it("supports colSpan", () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableCell colSpan={3}>Span</TableCell>
            </tr>
          </tbody>
        </table>
      )
      expect(container.querySelector("td")?.getAttribute("colspan")).toBe("3")
    })

    it("applies custom className", () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-cell">Cell</TableCell>
            </tr>
          </tbody>
        </table>
      )
      expect(container.querySelector("td")?.className).toContain("custom-cell")
    })
  })

  describe("TableCaption", () => {
    it("renders a caption element", () => {
      const { container } = render(
        <table>
          <TableCaption>Caption text</TableCaption>
        </table>
      )
      expect(container.querySelector("caption")).toBeTruthy()
      expect(screen.getByText("Caption text")).toBeTruthy()
    })

    it("has muted foreground and text-sm classes", () => {
      const { container } = render(
        <table>
          <TableCaption>Caption</TableCaption>
        </table>
      )
      const caption = container.querySelector("caption")
      expect(caption?.className).toContain("text-sm")
      expect(caption?.className).toContain("text-muted-foreground")
    })

    it("applies custom className", () => {
      const { container } = render(
        <table>
          <TableCaption className="custom-caption">Cap</TableCaption>
        </table>
      )
      expect(container.querySelector("caption")?.className).toContain("custom-caption")
    })
  })

  describe("Full Table Composition", () => {
    it("renders a complete table", () => {
      render(<FullTable />)
      expect(screen.getByText("A list of users")).toBeTruthy()
      expect(screen.getByText("Name")).toBeTruthy()
      expect(screen.getByText("Email")).toBeTruthy()
      expect(screen.getByText("Alice")).toBeTruthy()
      expect(screen.getByText("Bob")).toBeTruthy()
      expect(screen.getByText("Total: 2 users")).toBeTruthy()
    })

    it("renders correct number of rows in body", () => {
      const { container } = render(<FullTable />)
      const rows = container.querySelectorAll("tbody tr")
      expect(rows.length).toBe(2)
    })

    it("renders correct number of header cells", () => {
      const { container } = render(<FullTable />)
      const headers = container.querySelectorAll("th")
      expect(headers.length).toBe(3)
    })

    it("renders footer row", () => {
      const { container } = render(<FullTable />)
      expect(container.querySelector("tfoot")).toBeTruthy()
    })
  })

  describe("Display Names", () => {
    it("Table has correct displayName", () => {
      expect(Table.displayName).toBe("Table")
    })

    it("TableHeader has correct displayName", () => {
      expect(TableHeader.displayName).toBe("TableHeader")
    })

    it("TableBody has correct displayName", () => {
      expect(TableBody.displayName).toBe("TableBody")
    })

    it("TableRow has correct displayName", () => {
      expect(TableRow.displayName).toBe("TableRow")
    })

    it("TableHead has correct displayName", () => {
      expect(TableHead.displayName).toBe("TableHead")
    })

    it("TableCell has correct displayName", () => {
      expect(TableCell.displayName).toBe("TableCell")
    })

    it("TableCaption has correct displayName", () => {
      expect(TableCaption.displayName).toBe("TableCaption")
    })
  })
})
