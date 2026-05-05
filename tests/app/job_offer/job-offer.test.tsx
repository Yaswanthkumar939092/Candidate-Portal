import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUseJobOfferSummary = vi.fn();
const mockUseJobOfferPdf = vi.fn();
const mockUseUpdateJobOfferStatus = vi.fn();
const mockUseJobOfferStatus = vi.fn();
const mockUseRejectionReasons = vi.fn();

vi.mock("@/lib/hooks/useJobOffer", () => ({
  useJobOfferSummary: (...args: unknown[]) => mockUseJobOfferSummary(...args),
  useJobOfferPdf: (...args: unknown[]) => mockUseJobOfferPdf(...args),
  useUpdateJobOfferStatus: () => mockUseUpdateJobOfferStatus(),
  useJobOfferStatus: (...args: unknown[]) => mockUseJobOfferStatus(...args),
  useRejectionReasons: (...args: unknown[]) => mockUseRejectionReasons(...args),
}));

const mockUseCurrentUser = vi.fn();
vi.mock("@/lib/hooks/useUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

const mockUseCompanyLogo = vi.fn();
vi.mock("@/lib/hooks/useCompanyLogo", () => ({
  useCompanyLogo: (...args: unknown[]) => mockUseCompanyLogo(...args),
}));

const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock window.scrollTo and window.location.reload
window.scrollTo = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true
});

describe("JobOfferPage", () => {
  const DEFAULT_EMAIL = "test@example.com";

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks for loading state
    mockUseCurrentUser.mockReturnValue({ userEmail: DEFAULT_EMAIL, isLoading: false });
    mockUseJobOfferStatus.mockReturnValue({ data: { status: "Awaiting Response" }, isLoading: false });
    mockUseJobOfferSummary.mockReturnValue({ 
      data: { applicant_name: "Test User", designation: "Software Engineer", duration_display: "6 Months", stipend_display: "$5000" }, 
      isLoading: false 
    });
    mockUseJobOfferPdf.mockReturnValue({ pdfUrl: "http://test.com/pdf", isLoading: false });
    mockUseUpdateJobOfferStatus.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseRejectionReasons.mockReturnValue({ data: [{ reason: "Salary", name: "Salary too low" }], isLoading: false });
    mockUseCompanyLogo.mockReturnValue({ data: { logo_url: "/logo.png" }, isLoading: false });
    mockGet.mockReturnValue(null); // No ?appl= param by default
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
    expect(screen.getByText(/OFFER EXPIRES IN 48 HOURS/)).toBeTruthy();
  });

  it("uses applicant email from search params if available", () => {
    const paramEmail = "param@example.com";
    mockGet.mockReturnValue(paramEmail);
    render(<JobOfferPage />);
    expect(mockUseJobOfferStatus).toHaveBeenCalledWith(paramEmail);
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
        appl: DEFAULT_EMAIL,
      });
    });

    expect(screen.getByText("OFFER ACCEPTED")).toBeTruthy();
    expect(screen.getByText(/Welcome to the team/)).toBeTruthy();
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it("handles rejection flow correctly and shows declined popup", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseUpdateJobOfferStatus.mockReturnValue({ mutateAsync });

    render(<JobOfferPage />);

    const rejectBtn = screen.getByRole("button", { name: /Reject Offer/i });
    fireEvent.click(rejectBtn);

    expect(screen.getByText("Reject Offer")).toBeTruthy();

    const confirmRejectBtn = screen.getByRole("button", { name: /Confirm Rejection/i });

    // Select reason
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Salary" } });

    // Confirm
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        status: "Rejected",
        appl: DEFAULT_EMAIL,
        reason: "Salary",
        message: "",
      });
    });

    // Should show declined popup - wait for it to render
    await waitFor(() => {
      expect(screen.getByText("Offer Rejected")).toBeTruthy();
    });

    expect(screen.getByText(/We appreciate the time and effort/)).toBeTruthy();

    // Close popup should reload
    const closeBtn = screen.getByRole("button", { name: "" }); // The X button
    fireEvent.click(closeBtn);
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("renders processed state if offer was already accepted", () => {
    mockUseJobOfferStatus.mockReturnValue({ data: { status: "Accepted" }, isLoading: false });
    mockUseJobOfferSummary.mockReturnValue({ data: null, isLoading: false }); 
    
    render(<JobOfferPage />);
    
    expect(screen.getByText(/You have already accepted or rejected the Offer Letter/)).toBeTruthy();
  });

  it("renders expired state if offer has expired", () => {
    mockUseJobOfferStatus.mockReturnValue({ data: { status: "Expired" }, isLoading: false });
    
    render(<JobOfferPage />);
    
    expect(screen.getByText("Your Offer Letter Has Expired")).toBeTruthy();
  });

  it("renders error state if status fetch fails and allows retry", () => {
    mockUseJobOfferStatus.mockReturnValue({ isError: true, error: new Error("Fetch failed"), isLoading: false });
    
    render(<JobOfferPage />);
    
    expect(screen.getByText("Oops! Something went wrong")).toBeTruthy();
    expect(screen.getByText("Fetch failed")).toBeTruthy();

    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    fireEvent.click(retryBtn);
    expect(window.location.reload).toHaveBeenCalled();
  });
});
