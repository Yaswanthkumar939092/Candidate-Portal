import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { SurveyOfferNavigation } from "@/components/portal/survey-offer-navigation"
import * as authContext from "@/lib/contexts/auth-context"
import * as candidateBrandingHook from "@/lib/hooks/useCandidateBranding"
import * as companyLogoHook from "@/lib/hooks/useCompanyLogo"

vi.mock("@/lib/contexts/auth-context")
vi.mock("@/lib/hooks/useCandidateBranding")
vi.mock("@/lib/hooks/useCompanyLogo")

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, className }: any) => <div className={className} data-testid="mock-avatar">{children}</div>,
  AvatarImage: ({ src, alt }: any) => src ? <img src={src} alt={alt} data-testid="mock-avatar-image" /> : null,
  AvatarFallback: ({ children }: any) => <span data-testid="mock-avatar-fallback">{children}</span>,
}))

describe("SurveyOfferNavigation", () => {
  const originalEnv = process.env.NEXT_PUBLIC_FRAPPE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_FRAPPE_URL = "https://frappe-api.example.com";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_FRAPPE_URL = originalEnv;
  });

  const renderComponent = () => render(<SurveyOfferNavigation />);

  it("renders navigation header", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: { email: "test@example.com" },
      profile: null,
      isLoading: false,
    } as any);

    vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({
      data: null,
    } as any);

    vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({
      data: null,
    } as any);

    renderComponent();
    expect(screen.getByRole("banner")).toBeTruthy();
  });

  describe("Name and Avatar display", () => {
    it("displays profile.full_name if available", () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: { email: "test@example.com" },
        profile: { full_name: "Profile Full Name", avatar_url: "https://example.com/profile-avatar.png" },
        isLoading: false,
      } as any);
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({ data: null } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      expect(screen.getByText("Profile Full Name")).toBeTruthy();
      expect(screen.getByText("PF")).toBeTruthy();
      const img = screen.getByAltText("Profile Full Name");
      expect(img.getAttribute("src")).toBe("https://example.com/profile-avatar.png");
    });

    it("displays user.user_metadata.full_name if profile.full_name is missing", () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: {
          email: "test@example.com",
          user_metadata: {
            full_name: "Metadata Full Name",
            avatar_url: "https://example.com/metadata-avatar.png"
          }
        },
        profile: { full_name: "" },
        isLoading: false,
      } as any);
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({ data: null } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      expect(screen.getByText("Metadata Full Name")).toBeTruthy();
      expect(screen.getByText("MF")).toBeTruthy();
      const img = screen.getByAltText("Metadata Full Name");
      expect(img.getAttribute("src")).toBe("https://example.com/metadata-avatar.png");
    });

    it("displays user.user_metadata.name if full_names are missing", () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: {
          email: "test@example.com",
          user_metadata: {
            name: "Metadata Name"
          }
        },
        profile: null,
        isLoading: false,
      } as any);
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({ data: null } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      expect(screen.getByText("Metadata Name")).toBeTruthy();
      expect(screen.getByText("MN")).toBeTruthy();
    });

    it("displays email prefix if names are missing", () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: { email: "john.doe@example.com" },
        profile: null,
        isLoading: false,
      } as any);
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({ data: null } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      expect(screen.getByText("john.doe")).toBeTruthy();
      expect(screen.getByText("J")).toBeTruthy();
    });

    it("falls back to User if email and name are missing", () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: {},
        profile: null,
        isLoading: false,
      } as any);
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({ data: null } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      expect(screen.getByText("User")).toBeTruthy();
      expect(screen.getByText("U")).toBeTruthy();
    });
  });

  describe("Logo source resolution", () => {
    beforeEach(() => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: { email: "test@example.com" },
        profile: null,
        isLoading: false,
      } as any);
    });

    it("uses branding.app_logo if it starts with http", () => {
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({
        data: { app_logo: "http://example.com/logo.png", title_prefix: "Branded Prefix" },
      } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      const logo = screen.getByAltText("Branded Prefix");
      expect(logo.getAttribute("src")).toBe("http://example.com/logo.png");
    });

    it("uses branding.app_logo with base URL if it starts with slash", () => {
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({
        data: { app_logo: "/logo-relative.png", title_prefix: "Branded Prefix" },
      } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      const logo = screen.getByAltText("Branded Prefix");
      expect(logo.getAttribute("src")).toBe("https://frappe-api.example.com/logo-relative.png");
    });

    it("uses branding.app_logo with base URL if it does not start with slash", () => {
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({
        data: { app_logo: "logo-relative.png", title_prefix: "Branded Prefix" },
      } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      const logo = screen.getByAltText("Branded Prefix");
      expect(logo.getAttribute("src")).toBe("https://frappe-api.example.com/logo-relative.png");
    });

    it("uses companyLogo if branding.app_logo is absent", () => {
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({ data: null } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({
        data: { logo_url: "/company-logo.png" },
      } as any);

      renderComponent();
      const logo = screen.getByAltText("Company Logo");
      expect(logo.getAttribute("src")).toBe("https://frappe-api.example.com/company-logo.png");
    });

    it("falls back to default logo if all logos are absent", () => {
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({ data: null } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      const logo = screen.getByAltText("Company Logo");
      expect(logo.getAttribute("src")).toBe("/Logo.jpg");
    });

    it("handles missing environment variable for relative logos nicely", () => {
      process.env.NEXT_PUBLIC_FRAPPE_URL = "";
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({
        data: { app_logo: "/logo-relative.png" },
      } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({ data: null } as any);

      renderComponent();
      const logo = screen.getByAltText("Company Logo");
      expect(logo.getAttribute("src")).toBe("/logo-relative.png");
    });

    it("handles missing environment variable for logoData.logo_url relative logos nicely", () => {
      process.env.NEXT_PUBLIC_FRAPPE_URL = "";
      vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({ data: null } as any);
      vi.mocked(companyLogoHook.useCompanyLogo).mockReturnValue({
        data: { logo_url: "/company-logo.png" },
      } as any);

      renderComponent();
      const logo = screen.getByAltText("Company Logo");
      expect(logo.getAttribute("src")).toBe("/company-logo.png");
    });
  });
});
