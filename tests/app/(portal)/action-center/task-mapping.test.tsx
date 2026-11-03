import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ActionCenterPage from "@/app/(portal)/action-center/page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => "/action-center",
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { email: "user@example.com" },
    loading: false,
  }),
}));

// The raw API items the page maps; swapped per test via `renderWithItems`.
const fixture = vi.hoisted(() => ({ items: [] as unknown[] }));

vi.mock("@/lib/hooks/useAcationCenter", () => ({
  useActionCenter: () => ({
    data: { items: fixture.items },
    isLoading: false,
    isError: false,
  }),
  useActionCenterMyRequest: () => ({ data: [], isLoading: false }),
  useCandidateRaiseRequest: () => ({ mutate: vi.fn() }),
}));

/** Renders the Action Center with the given raw API items as assigned tasks. */
const renderWithItems = (items: unknown[]) => {
  fixture.items = items;
  return renderWithProviders(<ActionCenterPage />);
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================================
//  PWHR-1901 – PENDING ACTION SHOWS ITS ACTION TYPE, NOT "Task"
// =====================================================================
describe("ActionCenterPage – task title derivation", () => {
  it.each([
    ["Job Applicant Pre Offer Form", "Pre-Offer Form"],
    ["Job Offer", "Offer Letter"],
    ["Employee Onboarding", "Onboarding"],
    ["Job Applicant", "Pre-Onboarding Form"],
    ["Direct Applicant Form Request", "Applicant Form"],
    ["CTC Proposal", "CTC Proposal"],
  ])(
    "shows the %s action type when the item has no configured title",
    (referenceDoctype, expected) => {
      renderWithItems([
        {
          name: "ITEM-0001",
          title: "",
          status: "Action Required",
          reference_doctype: referenceDoctype,
          reference_docname: "REF-0001",
        },
      ]);

      expect(screen.getByRole("heading", { name: expected })).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "Task" })).toBeNull();
    }
  );

  it("keeps a configured title even when the doctype is known", () => {
    renderWithItems([
      {
        name: "ITEM-0002",
        title: "Review and sign your offer",
        status: "Action Required",
        reference_doctype: "Job Offer",
        reference_docname: "REF-0002",
      },
    ]);

    expect(
      screen.getByRole("heading", { name: "Review and sign your offer" })
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Offer Letter" })).toBeNull();
  });

  it("falls back to the doctype name for an unmapped doctype", () => {
    renderWithItems([
      {
        name: "ITEM-0003",
        title: "",
        status: "Action Required",
        reference_doctype: "background_check_request",
        reference_docname: "REF-0003",
      },
    ]);

    expect(
      screen.getByRole("heading", { name: "Background Check Request" })
    ).toBeTruthy();
  });

  it("only shows the generic 'Task' when the doctype is blank too", () => {
    renderWithItems([
      {
        name: "ITEM-0004",
        title: "",
        status: "Action Required",
        reference_doctype: "",
        reference_docname: "REF-0004",
      },
    ]);

    expect(screen.getByRole("heading", { name: "Task" })).toBeTruthy();
  });
});

// =====================================================================
//  PWHR-1903 – JOB DETAIL ORDER ON THE TASK TILE
// =====================================================================
describe("ActionCenterPage – job detail order", () => {
  const job = {
    job_title: "Senior Backend Engineer",
    company_name: "Northwind Technologies",
    department_name: "Platform Engineering",
    designation_name: "Staff Engineer",
    employment_type_name: "Full-time Permanent",
    location_name: "Pune, Maharashtra",
  };

  /** Positions of the given texts within the rendered task card, in DOM order. */
  const positionsOf = (texts: string[]) => {
    const card = screen.getByRole("heading", { name: "Pre-Offer Form" })
      .closest("[data-slot='card']") as HTMLElement;
    const content = card.textContent ?? "";
    return texts.map((text) => content.indexOf(text));
  };

  it("renders job details as Title, Company, Department, Designation, Employee Type, Location", () => {
    renderWithItems([
      {
        name: "ITEM-0101",
        title: "",
        status: "Action Required",
        reference_doctype: "Job Applicant Pre Offer Form",
        reference_docname: "REF-0101",
        job,
      },
    ]);

    const positions = positionsOf([
      job.job_title,
      job.company_name,
      job.department_name,
      job.designation_name,
      job.employment_type_name,
      job.location_name,
    ]);

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("skips blank job fields and de-duplicates repeated values, keeping the order", () => {
    renderWithItems([
      {
        name: "ITEM-0102",
        title: "",
        status: "Action Required",
        reference_doctype: "Job Applicant Pre Offer Form",
        reference_docname: "REF-0102",
        job: {
          job_title: "Staff Engineer",
          company_name: "Northwind Technologies",
          department_name: "   ",
          designation_name: "Staff Engineer",
          employment_type: "",
          location_name: "Pune, Maharashtra",
        },
      },
    ]);

    const positions = positionsOf([
      "Staff Engineer",
      "Northwind Technologies",
      "Pune, Maharashtra",
    ]);

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    // "Staff Engineer" is both the job title and the designation: shown once.
    expect(screen.getAllByText("Staff Engineer")).toHaveLength(1);
  });
});
