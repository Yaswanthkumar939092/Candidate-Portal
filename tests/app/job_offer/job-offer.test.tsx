import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JobOfferPage from "@/app/job_offer/page";

// Mocks
vi.mock("next/dynamic", () => ({
  default: () => {
    const DynamicComponent = () => <div data-testid="pdf-viewer">PDF Viewer Form Mock</div>;
    return DynamicComponent;
  },
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue("deepakrajput0006@gmail.com"),
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockUseJobOfferSummary = vi.fn();
const mockUseJobOfferPdf = vi.fn();
const mockUseUpdateJobOfferStatus = vi.fn();
const mockUseJobOfferStatus = vi.fn();
const mockUseRejectionReasons = vi.fn();

vi.mock("@/lib/hooks/useJobOffer", () => ({
  useJobOfferSummary: (...args: any[]) => mockUseJobOfferSummary(...args),
  useJobOfferPdf: (...args: any[]) => mockUseJobOfferPdf(...args),
  useUpdateJobOfferStatus: () => mockUseUpdateJobOfferStatus(),
  useJobOfferStatus: (...args: any[]) => mockUseJobOfferStatus(...args),
  useRejectionReasons: (...args: any[]) => mockUseRejectionReasons(...args),
}));

const mockUseCurrentUser = vi.fn();
vi.mock("@/lib/hooks/useUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

const mockUseCompanyLogo = vi.fn();
vi.mock("@/lib/hooks/useCompanyLogo", () => ({
  useCompanyLogo: (...args: any[]) => mockUseCompanyLogo(...args),
}));

describe("JobOfferPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks for loading state
    mockUseCurrentUser.mockReturnValue({ userEmail: "deepakrajput0006@gmail.com", isLoading: false });
    mockUseJobOfferStatus.mockReturnValue({ data: { status: "Awaiting Response" }, isLoading: false });
    mockUseJobOfferSummary.mockReturnValue({ 
      data: { applicant_name: "Test User", designation: "Software Engineer", duration_display: "6 Months", stipend_display: "$5000" }, 
      isLoading: false 
    });
    mockUseJobOfferPdf.mockReturnValue({ pdfUrl: "http://test.com/pdf", isLoading: false });
    mockUseUpdateJobOfferStatus.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseRejectionReasons.mockReturnValue({ data: [{ reason: "Salary", name: "Salary too low" }], isLoading: false });
    mockUseCompanyLogo.mockReturnValue({ data: { logo_url: "/logo.png" }, isLoading: false });
  });

  it("renders loading state initially if user is loading", () => {
    mockUseCurrentUser.mockReturnValue({ userEmail: null, isLoading: true });
    render(<JobOfferPage />);
    expect(screen.getByText("Loading offer...")).toBeTruthy();
  });

  it("renders main offer state with offer details", () => {
    render(<JobOfferPage />);
    expect(screen.getAllByText("Offer of Employment")[0]).toBeTruthy();
    expect(screen.getByText("Test User")).toBeTruthy();
    expect(screen.getByText("Software Engineer")).toBeTruthy();
    expect(screen.getByText("$5000")).toBeTruthy();
  });

  it("checks terms and conditions and allows accepting offer", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseUpdateJobOfferStatus.mockReturnValue({ mutateAsync });

    render(<JobOfferPage />);
    
    const acceptBtn = screen.getByRole("button", { name: /Accept Offer/i });
    expect(acceptBtn).toBeDisabled();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(acceptBtn).not.toBeDisabled();

    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        status: "Accepted",
        appl: "deepakrajput0006@gmail.com",
      });
    });

    expect(screen.getByText("OFFER ACCEPTED")).toBeTruthy();
    expect(screen.getByText(/Welcome to the team/)).toBeTruthy();
  });

  it("handles rejection flow correctly", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseUpdateJobOfferStatus.mockReturnValue({ mutateAsync });

    render(<JobOfferPage />);
    
    const rejectBtn = screen.getByRole("button", { name: /Reject Offer/i });
    fireEvent.click(rejectBtn);

    expect(screen.getByText("Reject Offer")).toBeTruthy();
    expect(screen.getByText(/We're sorry to see you go/)).toBeTruthy();

    const confirmRejectBtn = screen.getByRole("button", { name: /Confirm Rejection/i });
    
    // Attempting to reject without selecting a reason shows a popup
    fireEvent.click(confirmRejectBtn);
    expect(screen.getByText("Reason Required")).toBeTruthy();

    const okBtn = screen.getByRole("button", { name: /OK/i });
    fireEvent.click(okBtn);

    // Select reason
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Salary" } });

    // Confirm again
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        status: "Rejected",
        appl: "deepakrajput0006@gmail.com",
        reason: "Salary",
        message: "",
      });
    });
  });

  it("renders processed state if offer was already accepted", () => {
    mockUseJobOfferStatus.mockReturnValue({ data: { status: "Accepted" }, isLoading: false });
    mockUseJobOfferSummary.mockReturnValue({ data: null, isLoading: false }); // summary not strictly needed now
    
    render(<JobOfferPage />);
    
    expect(screen.getByText(/You have already accepted or rejected the Offer Letter/)).toBeTruthy();
  });
});
