import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OpenJobsPage from "@/app/(portal)/open-jobs/page";
import { useAuth } from "@/lib/contexts/auth-context";
import { useJobOpening } from "@/lib/hooks/useJobOpening";
import { useGetSavedJobs, useToggleSavedJob } from "@/lib/hooks/useSavedJobs";
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
vi.mock("@/lib/hooks/useJobOpening", () => ({
  useJobOpening: vi.fn(),
}));

vi.mock("@/lib/hooks/useSavedJobs", () => ({
  useGetSavedJobs: vi.fn(),
  useToggleSavedJob: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("OpenJobsPage - Saved Jobs", () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { email: "candidate@test.com" },
    } as any);

    vi.mocked(useJobOpening).mockReturnValue({
      data: [
        {
          name: "HR-OPN-1",
          job_title: "Developer Job",
          company: "Test Corp",
          location: "Remote",
          employment_type: "Full-time",
          custom_work_experience: "3 years",
          lower_range: 10,
          upper_range: 15,
          description: "<p>Job Description HTML</p>",
          status: "Open",
        },
      ],
    } as any);

    vi.mocked(useGetSavedJobs).mockReturnValue({
      data: { saved_job_openings: ["HR-OPN-1"] },
      isLoading: false,
    } as any);

    vi.mocked(useToggleSavedJob).mockReturnValue({
      mutate: mockMutate,
    } as any);
  });

  it("renders open jobs list with correct bookmark status", async () => {
    render(<OpenJobsPage />);

    // Go to "View All" tab
    const viewAllTab = screen.getByRole("button", { name: "View All" });
    fireEvent.click(viewAllTab);

    expect(screen.getByText("Developer Job")).toBeInTheDocument();
    
    // Check if the bookmark button is rendered as "Remove bookmark" because HR-OPN-1 is bookmarked
    expect(screen.getByRole("button", { name: "Remove bookmark" })).toBeInTheDocument();
  });

  it("calls toggle mutation on bookmark button click", async () => {
    render(<OpenJobsPage />);

    // Go to "View All" tab
    const viewAllTab = screen.getByRole("button", { name: "View All" });
    fireEvent.click(viewAllTab);

    const bookmarkBtn = screen.getByRole("button", { name: "Remove bookmark" });
    fireEvent.click(bookmarkBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      { email: "candidate@test.com", jobId: "HR-OPN-1" },
      expect.any(Object)
    );
  });
});
