import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CareersShell } from "@/components/careers/careers-shell";

const replace = vi.fn();
let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({ user: { email: "synth-a@example.invalid" } }),
}));
vi.mock("@/lib/hooks/usePublicBranding", () => ({
  usePublicBranding: () => ({ data: undefined }),
}));

describe("CareersShell for a logged-in visitor in milestone 1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = "/";
  });

  it("moves / to /open-jobs, not to the onboarding dashboard", () => {
    render(<CareersShell>content</CareersShell>);
    expect(replace).toHaveBeenCalledWith("/open-jobs");
    expect(replace).not.toHaveBeenCalledWith("/dashboard");
  });

  it("still moves /jobs to /open-jobs", () => {
    pathname = "/jobs";
    render(<CareersShell>content</CareersShell>);
    expect(replace).toHaveBeenCalledWith("/open-jobs");
  });
});
