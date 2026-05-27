import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { DynamicFavicon } from "@/components/dynamic-favicon";
import * as candidateBrandingHook from "@/lib/hooks/useCandidateBranding";

// Mock the useCandidateBranding hook
vi.mock("@/lib/hooks/useCandidateBranding");

describe("DynamicFavicon", () => {
  let initialEnvFrappeUrl: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    initialEnvFrappeUrl = process.env.NEXT_PUBLIC_FRAPPE_URL;
    process.env.NEXT_PUBLIC_FRAPPE_URL = "https://frappe.test";

    // Clean up head link elements before each test
    document.head.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_FRAPPE_URL = initialEnvFrappeUrl;
  });

  it("creates a link element with /favicon.svg fallback if branding is not loaded or missing logo", () => {
    vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({
      data: undefined,
    } as any);

    render(<DynamicFavicon />);

    const link = document.head.querySelector("link[rel*='icon']") as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/favicon.svg");
    expect(link.getAttribute("type")).toBe("image/svg+xml");
  });

  it("updates existing link elements when branding logo is fetched", () => {
    // Manually insert an initial favicon link element (simulating SSR layout)
    const initialLink = document.createElement("link");
    initialLink.rel = "icon";
    initialLink.href = "/initial.ico";
    initialLink.type = "image/x-icon";
    document.head.appendChild(initialLink);

    vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({
      data: {
        app_logo: "/files/company_logo.png",
      },
    } as any);

    render(<DynamicFavicon />);

    const link = document.head.querySelector("link[rel*='icon']") as HTMLLinkElement;
    expect(link).toBeTruthy();
    // Prepend NEXT_PUBLIC_FRAPPE_URL for relative paths
    expect(link.getAttribute("href")).toBe("https://frappe.test/files/company_logo.png");
    expect(link.getAttribute("type")).toBe("image/png");
  });

  it("uses absolute URLs directly without modifying them", () => {
    vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({
      data: {
        app_logo: "https://external.cdn/logo.svg",
      },
    } as any);

    render(<DynamicFavicon />);

    const link = document.head.querySelector("link[rel*='icon']") as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("https://external.cdn/logo.svg");
    expect(link.getAttribute("type")).toBe("image/svg+xml");
  });
});
