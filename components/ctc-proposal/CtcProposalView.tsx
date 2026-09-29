"use client";

// A direct applicant's CTC proposal, opened from the Action Center card. The
// candidate sees the CTC and its monthly / annual breakup and answers with
// Accept, Negotiate (expected CTC + comment) or Reject. Once answered, the page
// shows the outcome instead of the actions.

import * as React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCtcProposal, useRespondToCtcProposal } from "@/lib/hooks/useCtcProposal";
import type { ProposalAccess } from "@/lib/services/ctc-proposal";
import type { CtcProposalData, CtcProposalLine, CtcResponse } from "@/lib/types/ctc-proposal";
import { cn } from "@/lib/utils";

export function formatMoney(value: number | null | undefined, currency?: string | null) {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toLocaleString("en-IN");
  }
}

/** "2026-10-19" -> "19 Oct 2026", read as a calendar date (no timezone shift). */
export function formatDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

const OUTCOME: Record<string, { text: string; tone: "success" | "info" | "muted" }> = {
  Accepted: { text: "You have accepted this proposal. HR will send your offer letter shortly.", tone: "success" },
  "Offer Created": { text: "You have accepted this proposal. Your offer letter has been sent.", tone: "success" },
  "Offer Failed": { text: "You have accepted this proposal. HR will send your offer letter shortly.", tone: "success" },
  "Negotiation Requested": { text: "Your request has been sent to HR. You will receive a revised proposal.", tone: "info" },
  Rejected: { text: "You have declined this proposal. Thank you for letting us know.", tone: "muted" },
  Withdrawn: { text: "This proposal has been withdrawn. Please contact HR.", tone: "muted" },
  Superseded: { text: "This proposal has been replaced by a newer one. Please open the latest task in your Action Center.", tone: "muted" },
};

/**
 * ``access.proposal``: opened from the Action Center (logged in).
 * ``access.token``: opened from the emailed link (no login) — no portal navigation.
 */
export default function CtcProposalView({ access }: { access: ProposalAccess }) {
  const { data, isLoading, error } = useCtcProposal(access);
  // The portal page always passes `proposal` (even empty); the emailed link passes `token`.
  const inPortal = "proposal" in access;

  if (!access.proposal && !access.token) {
    return <Unavailable inPortal={inPortal} message="This link is incomplete. Please open it from your email or your Action Center." />;
  }
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !data) {
    return <Unavailable inPortal={inPortal} message={error instanceof Error ? error.message : "This proposal is not available."} />;
  }
  return <ProposalBody access={access} data={data} />;
}

function ProposalBody({ access, data }: { access: ProposalAccess; data: CtcProposalData }) {
  const money = (v: number) => formatMoney(v, data.currency);
  const outcome = data.can_respond
    ? null
    : data.expired && data.status === "Sent"
      ? { text: "This proposal has expired. Please contact HR.", tone: "muted" as const }
      : OUTCOME[data.status] || { text: data.status, tone: "muted" as const };
  // Annual totals add up the lines' own annual amounts, so yearly-only
  // components (e.g. a bonus) are counted as they appear in the rows above.
  const sumAnnual = (lines: CtcProposalLine[]) => lines.reduce((t, l) => t + Number(l.annual || 0), 0);
  const grossAnnual = sumAnnual(data.earnings);
  const deductionsAnnual = sumAnnual(data.deductions);
  const showTotal = Number(data.annual_ctc) > 0 && Math.round(data.annual_ctc) !== Math.round(data.ctc);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your CTC Proposal</h1>
        <p className="text-sm text-muted-foreground">
          {data.applicant_name} · {data.company}
          {data.version > 1 ? ` · Revision ${data.version}` : ""}
        </p>
      </div>

      {outcome && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 text-sm",
            outcome.tone === "success" && "border-success/30 bg-success-bg text-success-text",
            outcome.tone === "info" && "border-info/30 bg-info-bg text-foreground",
            outcome.tone === "muted" && "bg-muted text-muted-foreground"
          )}
        >
          {outcome.tone === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{outcome.text}</span>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Annual CTC</p>
            <p className="text-3xl font-bold text-foreground">{money(data.ctc)}</p>
            {showTotal && (
              <p className="text-sm text-muted-foreground">
                Total cost to company incl. employer contributions: {money(data.annual_ctc)}
              </p>
            )}
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 border-t pt-4 text-sm sm:grid-cols-2">
            <Detail label="Designation" value={data.designation} />
            {data.department && <Detail label="Department" value={data.department} />}
            <Detail label="Employment Type" value={data.employment_type} />
            {data.expected_doj && (
              <Detail label="Expected Joining" value={formatDate(data.expected_doj)} />
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salary Breakup</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <Lines title="Earnings" lines={data.earnings} money={money} />
              <TotalRow label="Gross" monthly={data.monthly_gross} annual={grossAnnual} money={money} />
              <Lines title="Deductions" lines={data.deductions} money={money} />
              <TotalRow label="Take-home before income tax" monthly={data.monthly_net} annual={grossAnnual - deductionsAnnual} money={money} />
            </tbody>
          </table>
        </CardContent>
      </Card>

      {data.hr_note && (
        <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
          <p className="mb-1 font-medium text-foreground">Note from HR</p>
          <p className="text-muted-foreground">{data.hr_note}</p>
        </div>
      )}

      {data.can_respond && <Respond access={access} data={data} />}

      {access.proposal && (
        <div className="flex justify-center">
          <Button asChild variant="ghost">
            <Link href="/action-center">Back to Action Center</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 sm:block">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Lines({ title, lines, money }: { title: string; lines: CtcProposalLine[]; money: (v: number) => string }) {
  if (!lines.length) return null;
  return (
    <>
      <tr className="border-b">
        <th className="py-2 text-left font-medium text-muted-foreground">{title}</th>
        <th className="py-2 text-right font-medium text-muted-foreground">Monthly</th>
        <th className="py-2 text-right font-medium text-muted-foreground">Annual</th>
      </tr>
      {lines.map((l) => (
        <tr key={`${title}-${l.component}`} className="border-b border-dashed">
          <td className="py-2 pr-4 text-foreground">{l.component}</td>
          <td className="whitespace-nowrap py-2 text-right">{money(l.monthly)}</td>
          <td className="whitespace-nowrap py-2 text-right">{money(l.annual)}</td>
        </tr>
      ))}
    </>
  );
}

function TotalRow({ label, monthly, annual, money }: { label: string; monthly: number; annual: number; money: (v: number) => string }) {
  return (
    <tr className="border-b font-semibold">
      <td className="py-2 pr-4 text-foreground">{label}</td>
      <td className="whitespace-nowrap py-2 text-right">{money(monthly)}</td>
      <td className="whitespace-nowrap py-2 text-right">{money(annual)}</td>
    </tr>
  );
}

function Respond({ access, data }: { access: ProposalAccess; data: CtcProposalData }) {
  const [mode, setMode] = React.useState<CtcResponse | null>(null);
  const [expected, setExpected] = React.useState("");
  const [comment, setComment] = React.useState("");
  const respond = useRespondToCtcProposal(access);

  const send = async () => {
    if (!mode) return;
    const expectedCtc = Number(expected.replace(/[^0-9.]/g, ""));
    if (mode === "Negotiate" && !(expectedCtc > 0)) {
      toast.error("Enter the CTC you expect.");
      return;
    }
    try {
      await respond.mutateAsync({
        response: mode,
        ...(mode === "Negotiate" ? { expected_ctc: expectedCtc } : {}),
        ...(mode !== "Accept" ? { comment } : {}),
      });
      toast.success(
        mode === "Accept" ? "You have accepted the proposal." : mode === "Negotiate" ? "Your request has been sent to HR." : "You have declined the proposal."
      );
      window.scrollTo(0, 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your response. Please try again.");
    }
  };

  const choose = (m: CtcResponse) => {
    setMode(m === mode ? null : m);
    setComment("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant={mode === "Reject" ? "destructive" : "outline"} onClick={() => choose("Reject")}>
            Reject
          </Button>
          {data.can_negotiate && (
            <Button type="button" variant={mode === "Negotiate" ? "secondary" : "outline"} onClick={() => choose("Negotiate")}>
              Negotiate
            </Button>
          )}
          <Button type="button" variant={mode === "Accept" ? "default" : "outline"} onClick={() => choose("Accept")}>
            Accept
          </Button>
        </div>
        {!data.can_negotiate && (
          <p className="text-right text-xs text-muted-foreground">This proposal can only be accepted or rejected.</p>
        )}

        {mode === "Accept" && (
          <p className="text-sm text-muted-foreground">
            By accepting, you agree to an annual CTC of {formatMoney(data.ctc, data.currency)}. Your offer letter will follow.
          </p>
        )}
        {mode === "Negotiate" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ctc-expected">Your expected Annual CTC *</Label>
              <Input id="ctc-expected" inputMode="numeric" value={expected} placeholder="e.g. 2000000"
                onChange={(e) => setExpected(e.target.value.replace(/[^0-9.]/g, ""))} />
              {Number(expected) > 0 && (
                <p className="text-xs text-muted-foreground">{formatMoney(Number(expected), data.currency)} per year</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctc-comment">Comment</Label>
              <Textarea id="ctc-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Tell HR why, e.g. your current CTC or another offer" />
            </div>
            {data.negotiations_left > 0 && (
              <p className="text-xs text-muted-foreground">
                You can negotiate {data.negotiations_left} more time{data.negotiations_left === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        )}
        {mode === "Reject" && (
          <div className="space-y-1.5">
            <Label htmlFor="ctc-reason">Reason (optional)</Label>
            <Textarea id="ctc-reason" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        )}

        {mode && (
          <div className="flex justify-end">
            <Button type="button" onClick={send} disabled={respond.isPending}
              variant={mode === "Reject" ? "destructive" : "default"}>
              {respond.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "Accept" ? "Confirm Accept" : mode === "Negotiate" ? "Send to HR" : "Confirm Reject"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Unavailable({ message, inPortal }: { message: string; inPortal: boolean }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold text-foreground">Proposal unavailable</h1>
      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{message}</p>
      {inPortal && (
        <Button asChild variant="outline" className="mt-6">
          <Link href="/action-center">Back to Action Center</Link>
        </Button>
      )}
    </div>
  );
}
