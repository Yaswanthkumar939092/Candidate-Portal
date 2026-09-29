import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CtcProposalView, { formatMoney } from "@/components/ctc-proposal/CtcProposalView";
import type { CtcProposalData } from "@/lib/types/ctc-proposal";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/link", () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }));

const getProposal = vi.fn();
const respond = vi.fn();
vi.mock("@/lib/services/ctc-proposal", () => ({
  proposalAccessKey: (a: { token?: string; proposal?: string }) => a.token ?? a.proposal ?? "",
  ctcProposalService: {
    getProposal: (...a: unknown[]) => getProposal(...a),
    respond: (...a: unknown[]) => respond(...a),
  },
}));

const base: CtcProposalData = {
  applicant_name: "Asha", company: "PW", designation: "Professor", department: "Academics",
  employment_type: "Full-time", expected_doj: "2026-10-19", currency: "INR", ctc: 1800000, annual_ctc: 1800000,
  earnings: [{ component: "Basic", monthly: 60000, annual: 720000 }],
  deductions: [{ component: "Professional Tax", monthly: 200, annual: 2400 }],
  monthly_gross: 150000, monthly_deductions: 200, monthly_net: 149800, hr_note: "Welcome!", version: 1,
  status: "Sent", expired: false, expires_on: null, can_respond: true, can_negotiate: true, negotiations_left: 3, response: "",
};

function renderView(access: { proposal: string } | { token: string } = { proposal: "CTCP-1" }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CtcProposalView access={access} />
    </QueryClientProvider>
  );
}

describe("CtcProposalView", () => {
  beforeEach(() => {
    getProposal.mockReset();
    respond.mockReset();
  });

  it("shows the CTC, breakup and HR note", async () => {
    getProposal.mockResolvedValue(base);
    renderView();
    expect((await screen.findAllByText(formatMoney(1800000, "INR"))).length).toBeGreaterThan(0);
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Welcome!")).toBeInTheDocument();
  });

  it("accepts after confirmation", async () => {
    getProposal.mockResolvedValue(base);
    respond.mockResolvedValue({ status: "Accepted" });
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Accept" }));
    await waitFor(() => expect(respond).toHaveBeenCalledWith({ proposal: "CTCP-1" }, { response: "Accept" }));
  });

  it("negotiates with an expected CTC and comment", async () => {
    getProposal.mockResolvedValue(base);
    respond.mockResolvedValue({ status: "Negotiation Requested" });
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "Negotiate" }));
    fireEvent.click(screen.getByRole("button", { name: "Send to HR" }));
    expect(respond).not.toHaveBeenCalled(); // no amount yet
    fireEvent.change(screen.getByLabelText(/expected Annual CTC/), { target: { value: "2000000" } });
    fireEvent.change(screen.getByLabelText("Comment"), { target: { value: "Market rate" } });
    fireEvent.click(screen.getByRole("button", { name: "Send to HR" }));
    await waitFor(() =>
      expect(respond).toHaveBeenCalledWith({ proposal: "CTCP-1" }, { response: "Negotiate", expected_ctc: 2000000, comment: "Market rate" })
    );
  });

  it("hides Negotiate when no rounds are left", async () => {
    getProposal.mockResolvedValue({ ...base, can_negotiate: false, negotiations_left: 0 });
    renderView();
    await screen.findByRole("button", { name: "Accept" });
    expect(screen.queryByRole("button", { name: "Negotiate" })).not.toBeInTheDocument();
  });

  it("shows the outcome instead of actions once answered", async () => {
    getProposal.mockResolvedValue({ ...base, status: "Accepted", can_respond: false });
    renderView();
    expect(await screen.findByText(/You have accepted this proposal/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
  });

  it("from the emailed link: responds with the token", async () => {
    getProposal.mockResolvedValue(base);
    respond.mockResolvedValue({ status: "Accepted" });
    renderView({ token: "tok" });
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Accept" }));
    await waitFor(() => expect(respond).toHaveBeenCalledWith({ token: "tok" }, { response: "Accept" }));
    expect(screen.queryByText("Back to Action Center")).not.toBeInTheDocument();
  });

  it("explains when the proposal is not available", async () => {
    getProposal.mockRejectedValue(new Error("This proposal is not available."));
    renderView();
    expect(await screen.findByText("Proposal unavailable")).toBeInTheDocument();
  });
});
