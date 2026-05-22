import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { UserManagementTable } from "@/components/user-management-table"

 
const mockUsers: any[] = [
  {
    id: "1",
    email: "john@example.com",
    full_name: "John Doe",
    role: "candidate",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    email: "admin@example.com",
    full_name: "Admin User",
    role: "admin",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z"
  }
]

describe("UserManagementTable", () => {
  const onRoleChange = vi.fn()
  const onActivateUser = vi.fn()
  const onDeactivateUser = vi.fn()

  it("renders loading state", () => {
    render(
      <UserManagementTable
        users={[]}
        onRoleChange={onRoleChange}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        loading={true}
      />
    )
    expect(screen.getByPlaceholderText("Search users...")).toBeDisabled()
    const pulseDivs = document.querySelectorAll(".animate-pulse")
    expect(pulseDivs.length).toBeGreaterThan(0)
  })

  it("renders users in the table", () => {
    render(
      <UserManagementTable
        users={mockUsers}
        onRoleChange={onRoleChange}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
      />
    )
    expect(screen.getByText("John Doe")).toBeTruthy()
    expect(screen.getByText("john@example.com")).toBeTruthy()
    expect(screen.getByText("Admin User")).toBeTruthy()
    expect(screen.getByText("ADMIN")).toBeTruthy()
  })

  it("filters users by search term", () => {
    render(
      <UserManagementTable
        users={mockUsers}
        onRoleChange={onRoleChange}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
      />
    )
    const input = screen.getByPlaceholderText("Search users...")
    fireEvent.change(input, { target: { value: "john" } })

    expect(screen.getByText("John Doe")).toBeTruthy()
    expect(screen.queryByText("Admin User")).toBeNull()
  })

  it("shows empty state when no users match search", () => {
    render(
      <UserManagementTable
        users={mockUsers}
        onRoleChange={onRoleChange}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
      />
    )
    const input = screen.getByPlaceholderText("Search users...")
    fireEvent.change(input, { target: { value: "nonexistent" } })

    expect(screen.getByText("No users found")).toBeTruthy()
  })

  it("triggers role change action", async () => {
    render(
      <UserManagementTable
        users={mockUsers}
        onRoleChange={onRoleChange}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
      />
    )

    const menuButtons = screen.getAllByRole("button", { name: /open menu/i })
    // Click the first user's menu
    fireEvent.pointerDown(menuButtons[0])
    fireEvent.click(menuButtons[0])

    const setAdminOption = await screen.findByText("Set as Admin")
    fireEvent.click(setAdminOption)

    expect(onRoleChange).toHaveBeenCalledWith("1", "admin")
  })

  it("triggers activate action", async () => {
    render(
      <UserManagementTable
        users={mockUsers}
        onRoleChange={onRoleChange}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
      />
    )

    const menuButtons = screen.getAllByRole("button", { name: /open menu/i })

    // Test activate
    fireEvent.pointerDown(menuButtons[0])
    fireEvent.click(menuButtons[0])
    fireEvent.click(await screen.findByText("Activate User"))
    expect(onActivateUser).toHaveBeenCalledWith("1")
  })

  it("triggers deactivate action", async () => {
    render(
      <UserManagementTable
        users={mockUsers}
        onRoleChange={onRoleChange}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
      />
    )

    const menuButtons = screen.getAllByRole("button", { name: /open menu/i })

    // Test deactivate
    fireEvent.pointerDown(menuButtons[1])
    fireEvent.click(menuButtons[1])
    fireEvent.click(await screen.findByText("Deactivate User"))
    expect(onDeactivateUser).toHaveBeenCalledWith("2")
  })
})
