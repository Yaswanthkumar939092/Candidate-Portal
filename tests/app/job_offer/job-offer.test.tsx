import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JobOfferPage from "@/app/(portal)/job_offer/page";
import { toast } from "sonner";

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

const mockGet = vi.fn();
const mockPush = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/auth", () => ({
  auth: {
    signOut: () => mockSignOut(),
  },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
  useRouter: () => ({
    push: mockPush,
  }),
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

vi.mock("@/lib/hooks/useSurvey", () => ({
  useSurvey: () => ({
    data: null,
    isLoading: false,
    error: null,
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
  const DEFAULT_EMAIL = "deepakrajput0006@gmail.com";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks for loading state
    mockUseCurrentUser.mockReturnValue({ userEmail: DEFAULT_EMAIL, isLoading: false });
    mockUseJobOfferStatus.mockReturnValue({ data: { status: "Awaiting Response" }, isLoading: false });
    mockUseJobOfferSummary.mockReturnValue({
      data: { applicant_name: "Test User", designation: "Software Engineer", duration_display: "6 Months", stipend_display: "$5000", expiry_display: "48 HOURS" },
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
    expect(screen.getByText("Software Engineer")).toBeTruthy();
    expect(screen.getByText("$5000")).toBeTruthy();
    expect(screen.getByText(/OFFER EXPIRES IN 48 HOURS/)).toBeTruthy();
  });

  it("renders the offer details loading state while summary data is being fetched", () => {
    mockUseJobOfferSummary.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<JobOfferPage />);

    expect(screen.getByText("Fetching offer details...")).toBeTruthy();
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

    const dashboardBtn = screen.getByRole("button", { name: /Go to Dashboard/i });
    fireEvent.click(dashboardBtn);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("handles rejection flow correctly and displays the Offer Declined page", async () => {
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

    // Check that we render the OFFER DECLINED page
    expect(screen.getByText("OFFER DECLINED")).toBeTruthy();
    expect(screen.getByText("Offer Letter Declined")).toBeTruthy();
    expect(screen.getByText("Reason for Rejection:")).toBeTruthy();
    expect(screen.getByText("Salary")).toBeTruthy();

    // Verify "Raise Request" button navigates to /action-center
    const raiseRequestBtn = screen.getByRole("button", { name: /Raise Request/i });
    fireEvent.click(raiseRequestBtn);
    expect(mockPush).toHaveBeenCalledWith("/action-center?tab=requests");

    // Verify "Logout" button signs out and routes to /login
    const logoutBtn = screen.getByRole("button", { name: /Logout/i });
    fireEvent.click(logoutBtn);
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("updates rejection comments, allows cancelling, and dismisses the missing-reason popup", async () => {
    render(<JobOfferPage />);

    fireEvent.click(screen.getByRole("button", { name: /Reject Offer/i }));

    const comments = screen.getByPlaceholderText("Share any additional feedback...");
    fireEvent.change(comments, { target: { value: "I accepted another role." } });
    expect(comments).toHaveValue("I accepted another role.");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getAllByText("Offer of Employment")[0]).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Reject Offer/i }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm Rejection/i }));

    expect(screen.getByText("Reason Required")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => {
      expect(screen.queryByText("Reason Required")).toBeNull();
    });
  });

  it("shows a toast error when rejecting the offer fails", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error("Reject failed"));
    mockUseUpdateJobOfferStatus.mockReturnValue({ mutateAsync });

    render(<JobOfferPage />);

    fireEvent.click(screen.getByRole("button", { name: /Reject Offer/i }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Salary" } });
    fireEvent.change(screen.getByPlaceholderText("Share any additional feedback..."), {
      target: { value: "This package does not work for me." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirm Rejection/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        status: "Rejected",
        appl: DEFAULT_EMAIL,
        reason: "Salary",
        message: "This package does not work for me.",
      });
      expect(toast.error).toHaveBeenCalledWith("Reject failed");
    });
  });

  it("renders processed state if offer was already accepted", () => {
    mockUseJobOfferStatus.mockReturnValue({ data: { status: "Accepted" }, isLoading: false });
    mockUseJobOfferSummary.mockReturnValue({ data: null, isLoading: false });

    render(<JobOfferPage />);

    expect(screen.getByText(/You have already accepted or rejected the Offer Letter/)).toBeTruthy();
    
    const dashboardBtn = screen.getByRole("button", { name: /Go to Dashboard/i });
    fireEvent.click(dashboardBtn);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
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
