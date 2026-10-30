import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import PublicJobsPage from "@/app/(public)/jobs/page";
import { usePublicOpenings } from "@/lib/hooks/usePublicOpenings";
import type { PublicOpening } from "@/types/public-job";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/hooks/usePublicOpenings", () => ({ usePublicOpenings: vi.fn() }));
vi.mock("@/components/careers/resume-dropzone", () => ({ ResumeDropzone: () => null }));

const opening = (id: string, title: string, evergreen = false): PublicOpening => ({
  id,
  title,
  designation: "",
  department: "",
  company: "Acme",
  location: "Pune",
  employmentType: "Full-time",
  hiringType: "",
  experience: "",
  description: `<p>About ${title}</p>`,
  postedOn: "2026-10-01",
  closesOn: evergreen ? null : "2099-01-01",
  salary: null,
  evergreen,
});

const OPENINGS = [opening("HR-OPN-1", "Backend Developer"), opening("HR-OPN-2", "Data Analyst", true)];

function visit(search: string) {
  window.history.pushState({}, "", `/jobs${search}`);
}

describe("PublicJobsPage shared job link", () => {
  beforeEach(() => {
    vi.mocked(usePublicOpenings).mockReturnValue({
      data: OPENINGS,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it("opens the details of the job in ?job= straight away", async () => {
    visit("?job=HR-OPN-1");
    render(<PublicJobsPage />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByText("Backend Developer")).toBeInTheDocument();
  });

  it("opens an evergreen job too, on the tab it lives on", async () => {
    visit("?job=HR-OPN-2");
    render(<PublicJobsPage />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Data Analyst")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Evergreen Jobs/, hidden: true })).toHaveAttribute("data-state", "active");
  });

  it("opens nothing for the plain careers page", () => {
    visit("");
    render(<PublicJobsPage />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("says so when the shared job is no longer open, and still lists the open ones", async () => {
    visit("?job=HR-OPN-GONE");
    render(<PublicJobsPage />);
    expect(await screen.findByRole("status")).toHaveTextContent(/no longer open/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Backend Developer")).toBeInTheDocument();
  });

  it("does not claim a job is closed while the openings are still loading", async () => {
    vi.mocked(usePublicOpenings).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);
    visit("?job=HR-OPN-1");
    render(<PublicJobsPage />);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });
});
