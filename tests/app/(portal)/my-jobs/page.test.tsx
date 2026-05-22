import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyJobsPage from "@/app/(portal)/my-jobs/page";
import { useAuth } from "@/lib/contexts/auth-context";
import { useApplicantStatus } from "@/lib/hooks/useApplicantStatus";
import { useGetAllDrafts, useDeleteDraftJobApplicant } from "@/lib/hooks/useJobOpening";
import { useGetSavedJobs, useGetSavedJobDetails, useToggleSavedJob } from "@/lib/hooks/useSavedJobs";
import { toast } from "sonner";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock auth context
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

// Mock hooks
vi.mock("@/lib/hooks/useApplicantStatus", () => ({
  useApplicantStatus: vi.fn(),
}));

vi.mock("@/lib/hooks/useJobOpening", () => ({
  useGetAllDrafts: vi.fn(),
  useDeleteDraftJobApplicant: vi.fn(),
}));

vi.mock("@/lib/hooks/useSavedJobs", () => ({
  useGetSavedJobs: vi.fn(),
  useGetSavedJobDetails: vi.fn(),
  useToggleSavedJob: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("MyJobsPage - Saved Jobs", () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { email: "candidate@test.com" },
    } as any);

    vi.mocked(useApplicantStatus).mockReturnValue({
      data: {
        name: "Candidate Name",
        applications: [],
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGetAllDrafts).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useDeleteDraftJobApplicant).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useGetSavedJobs).mockReturnValue({
      data: { saved_job_openings: ["HR-OPN-1"] },
      isLoading: false,
    } as any);

    vi.mocked(useGetSavedJobDetails).mockReturnValue({
      data: {
        data: [
          {
            name: "HR-OPN-1",
            job_title: "Saved Developer Job",
            company: "Test Corp",
            location: "Remote",
            employment_type: "Full-time",
            custom_work_experience: "3 years",
            lower_range: 10,
            upper_range: 15,
            skills: [{ skill: "React" }],
            description: "<p>Job Description HTML</p>",
          },
        ],
      },
      isLoading: false,
    } as any);

    vi.mocked(useToggleSavedJob).mockReturnValue({
      mutate: mockMutate,
    } as any);
  });

  it("renders Saved Jobs tab and counts correctly", () => {
    render(<MyJobsPage />);
    expect(screen.getByRole("button", { name: /Saved Jobs/ })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("displays saved jobs when tab is active", async () => {
    render(<MyJobsPage />);

    const savedJobsTab = screen.getByRole("button", { name: /Saved Jobs/ });
    fireEvent.click(savedJobsTab);

    expect(screen.getByText("Saved Developer Job")).toBeInTheDocument();
    expect(screen.getByText("Test Corp")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("10 - 15 LPA")).toBeInTheDocument();
  });

  it("handles toggling bookmark (unsaving) click from Saved Jobs tab", async () => {
    render(<MyJobsPage />);

    const savedJobsTab = screen.getByRole("button", { name: /Saved Jobs/ });
    fireEvent.click(savedJobsTab);

    const bookmarkBtn = screen.getByRole("button", { name: "Remove bookmark" });
    fireEvent.click(bookmarkBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      { email: "candidate@test.com", jobId: "HR-OPN-1" },
      expect.any(Object)
    );
  });

  it("shows details when clicking View Details", async () => {
    render(<MyJobsPage />);

    const savedJobsTab = screen.getByRole("button", { name: /Saved Jobs/ });
    fireEvent.click(savedJobsTab);

    const viewDetailsBtn = screen.getByRole("button", { name: "View Details" });
    fireEvent.click(viewDetailsBtn);

    expect(screen.getAllByText("Saved Developer Job").length).toBe(2);
    expect(screen.getByText("Job Description HTML")).toBeInTheDocument();
  });
});
