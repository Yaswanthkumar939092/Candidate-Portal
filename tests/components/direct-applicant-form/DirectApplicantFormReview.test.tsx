import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DirectApplicantForm from "@/components/direct-applicant-form/DirectApplicantForm";
import type * as React from "react";
import type { FormAccess } from "@/lib/services/direct-applicant-form";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const getForm = vi.fn();
vi.mock("@/lib/services/direct-applicant-form", () => ({
  accessKey: (a: { token?: string; request?: string }) => a.token ?? a.request ?? "",
  directApplicantFormService: {
    getForm: (...a: unknown[]) => getForm(...a),
    submit: vi.fn(),
    searchLink: vi.fn().mockResolvedValue([]),
    uploadFile: vi.fn(),
  },
}));

function renderForm(access: FormAccess = { request: "DAFR-1" }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DirectApplicantForm access={access} />
    </QueryClientProvider>
  );
}

// Mirrors what the backend now returns from get_my_form for a Submitted request.
const reviewPayload = {
  applicant_name: "Asha", company: "PW", form_title: "Joining Details",
  instructions: "", status: "Submitted", expires_on: null, resubmit_note: "",
  review: true, submitted_on: "2026-10-13 11:30:00",
  fields: [
    { fieldname: "custom_pan_number", label: "PAN", fieldtype: "Data", reqd: 1, section: "Identity", value: "ABCDE1234F", editable: false },
    { fieldname: "custom_expected_doj", label: "Expected DOJ", fieldtype: "Date", reqd: 0, section: "Identity", value: "2026-10-19", editable: false },
    {
      fieldname: "edu", label: "Education", fieldtype: "Table", reqd: 1, section: "Education", editable: false,
      value: [{ school: "IIT Delhi" }],
      child: [{ fieldname: "school", label: "School", fieldtype: "Data", reqd: 1 }],
    },
  ],
};

describe("completed Action Center item is reviewable", () => {
  it("shows the submitted values read-only instead of a dead-end thank-you", async () => {
    getForm.mockResolvedValue(reviewPayload);
    renderForm();

    await waitFor(() => expect(screen.getByText("You have already submitted this form.")).toBeTruthy());

    // the candidate's own answers are visible
    expect(screen.getByText("ABCDE1234F")).toBeTruthy();
    expect(screen.getByText("2026-10-19")).toBeTruthy();
    expect(screen.getByText("IIT Delhi")).toBeTruthy();

    // ...and nothing is editable, nor submittable
    expect(document.querySelectorAll("input, textarea, select").length).toBe(0);
    expect(screen.queryByRole("button", { name: /submit/i })).toBeNull();
    expect(screen.getByText("Back to Action Center")).toBeTruthy();
  });

  it("still shows the plain thank-you on the emailed link (no portal session)", async () => {
    getForm.mockResolvedValue(reviewPayload);
    renderForm({ token: "tok-1" });
    await waitFor(() => expect(screen.getByText("Thank you")).toBeTruthy());
    expect(screen.queryByText("ABCDE1234F")).toBeNull();
  });

  it("leaves an unsubmitted form editable", async () => {
    getForm.mockResolvedValue({
      ...reviewPayload, status: "Sent", review: false, submitted_on: null,
      fields: reviewPayload.fields.map((f) => ({ ...f, editable: true, value: null })),
    });
    renderForm();
    await waitFor(() => expect(screen.getByRole("button", { name: /submit/i })).toBeTruthy());
    expect(screen.queryByText("You have already submitted this form.")).toBeNull();
  });
});
