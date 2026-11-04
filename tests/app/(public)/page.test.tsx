import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CareersHomePage from "@/app/(public)/page";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/lib/hooks/usePublicOpenings", () => ({ usePublicOpenings: () => ({ data: [] }) }));
// Every promo section switched off (as on PAPL UAT) → the built-in fallback shows.
vi.mock("@/components/home/home-promo", () => ({
  HomePromo: ({ fallback }: { fallback: React.ReactNode }) => <>{fallback}</>,
}));

describe("public careers home", () => {
  it("shows company-neutral fallback copy, no Physics Wallah branding", () => {
    const { container } = render(<CareersHomePage />);
    expect(screen.getByRole("heading", { name: "Why work with us" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/physics\s*wallah|education|learner/i);
    // The rest of the page is unchanged.
    expect(screen.getByText("AI Resume / Job Match")).toBeInTheDocument();
    expect(screen.getByText("All Open Jobs")).toBeInTheDocument();
  });
});
