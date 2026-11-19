import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MyJobsPage from "@/app/(portal)/my-jobs/page";
import { useAuth } from "@/lib/contexts/auth-context";
import { useApplicantStatus } from "@/lib/hooks/useApplicantStatus";
import { useGetAllDrafts, useDeleteDraftJobApplicant } from "@/lib/hooks/useJobOpening";
import { useGetSavedJobs, useToggleSavedJob } from "@/lib/hooks/useSavedJobs";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/hooks/useApplicantStatus", () => ({ useApplicantStatus: vi.fn() }));
vi.mock("@/lib/hooks/useJobOpening", () => ({
  useGetAllDrafts: vi.fn(),
  useDeleteDraftJobApplicant: vi.fn(),
}));
vi.mock("@/lib/hooks/useSavedJobs", () => ({
  useGetSavedJobs: vi.fn(),
  useToggleSavedJob: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// The gate is open since OPS-15; this keeps covering the closed-gate path.
vi.mock("@/lib/careers/milestone", async (orig) => ({
  ...(await orig<typeof import("@/lib/careers/milestone")>()),
  SAVED_AND_DRAFTS_ENABLED: false,
}));

describe("MyJobsPage in milestone 1 (applied jobs only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { email: "candidate@test.com" } } as any);
    vi.mocked(useApplicantStatus).mockReturnValue({
      data: { success: true, data: { name: "C", applications: [] } },
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(useGetAllDrafts).mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() } as any);
    vi.mocked(useDeleteDraftJobApplicant).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    vi.mocked(useGetSavedJobs).mockReturnValue({ data: {}, isLoading: false } as any);
    vi.mocked(useToggleSavedJob).mockReturnValue({ mutate: vi.fn() } as any);
  });

  it("shows only the Applied Jobs tab", () => {
    render(<MyJobsPage />);
    expect(screen.getByText("Applied Jobs")).toBeTruthy();
    expect(screen.queryByText("Draft Applications")).toBeNull();
    expect(screen.queryByText("Saved Jobs")).toBeNull();
  });

  it("says plainly that drafts and saved jobs are not available in this test", () => {
    render(<MyJobsPage />);
    expect(screen.getByText(/Saved jobs and draft applications are not available in this test/i)).toBeTruthy();
  });

  it("does not query drafts or saved jobs, whose endpoints the proxy denies", () => {
    render(<MyJobsPage />);
    const emails = [
      ...vi.mocked(useGetAllDrafts).mock.calls.map((c) => c[0]),
      ...vi.mocked(useGetSavedJobs).mock.calls.map((c) => c[0]),
    ];
    expect(emails.filter(Boolean)).toEqual([]);
  });
});
