import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyContacts } from "@/components/dashboard/key-contacts";

const mockContacts = [
  {
    name: "John Doe",
    role: "Onboarding Buddy",
    email: "john@example.com",
    phone: "+1234567890",
  },
  {
    name: "Jane Smith",
    role: "HR Manager",
    email: "jane@example.com",
  },
];

describe("KeyContacts", () => {
  it("renders the list of contacts correctly", () => {
    render(<KeyContacts contacts={mockContacts} />);
    
    expect(screen.getByText("Your Key Contacts")).toBeTruthy();
    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("Onboarding Buddy")).toBeTruthy();
    expect(screen.getByText("Jane Smith")).toBeTruthy();
    expect(screen.getByText("HR Manager")).toBeTruthy();
  });

  it("renders action buttons when email or phone is provided", () => {
    render(<KeyContacts contacts={mockContacts} />);
    
    expect(screen.getAllByText("Email")).toHaveLength(2);
    expect(screen.getByText("Call")).toBeTruthy();
    
    const emailLinks = screen.getAllByRole("link", { name: /Email/i });
    expect(emailLinks[0].getAttribute("href")).toBe("mailto:john@example.com");
    expect(emailLinks[1].getAttribute("href")).toBe("mailto:jane@example.com");

    const phoneLink = screen.getByRole("link", { name: /Call/i });
    expect(phoneLink.getAttribute("href")).toBe("tel:+1234567890");
  });

  it("calculates initials correctly for avatar fallback", () => {
    render(<KeyContacts contacts={mockContacts} />);
    
    expect(screen.getByText("JD")).toBeTruthy();
    expect(screen.getByText("JS")).toBeTruthy();
  });

  it("returns null when contacts list is empty", () => {
    const { container } = render(<KeyContacts contacts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders fallbacks for missing name, role, and calculates initials for single word names", () => {
    const incompleteContacts = [
      {
        name: "", // empty name
        email: "missing@example.com",
        phone: "000",
        avatar: "https://example.com/avatar.png"
      },
      {
        name: "Prince", // single word
        role: ""
      }
    ];

    render(<KeyContacts contacts={incompleteContacts as any} />);
    
    // Avatar image logic is handled by Radix which requires onLoad in DOM to show the image.
    // Initials "U" for missing name, "P" for Prince
    expect(screen.getByText("U")).toBeTruthy();
    expect(screen.getByText("P")).toBeTruthy();

    // Fallback texts
    expect(screen.getByText("Unknown Contact")).toBeTruthy();
    expect(screen.getAllByText("Role not assigned")).toHaveLength(2);

    // Fallback aria labels
    const emailLink = screen.getByRole("link", { name: "Email Contact" });
    expect(emailLink).toBeTruthy();

    const phoneLink = screen.getByRole("link", { name: "Call Contact" });
    expect(phoneLink).toBeTruthy();
  });
});
