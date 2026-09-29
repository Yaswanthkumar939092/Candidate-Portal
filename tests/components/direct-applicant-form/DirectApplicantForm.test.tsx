import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DirectApplicantForm, { initialValues, validate } from "@/components/direct-applicant-form/DirectApplicantForm";
import type { DirectApplicantField } from "@/lib/types/direct-applicant-form";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/link", () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }));

const getForm = vi.fn();
const submit = vi.fn();
vi.mock("@/lib/services/direct-applicant-form", () => ({
  accessKey: (a: { token?: string; request?: string }) => a.token ?? a.request ?? "",
  directApplicantFormService: {
    getForm: (...a: unknown[]) => getForm(...a),
    submit: (...a: unknown[]) => submit(...a),
    searchLink: vi.fn().mockResolvedValue([]),
    uploadFile: vi.fn(),
  },
}));

const pan: DirectApplicantField = {
  fieldname: "custom_pan_number", label: "PAN", fieldtype: "Data", reqd: 1, section: "Identity", value: null, editable: true,
};
const edu: DirectApplicantField = {
  fieldname: "edu", label: "Education", fieldtype: "Table", reqd: 1, section: "Education", value: [], editable: true,
  child: [{ fieldname: "school", label: "School", fieldtype: "Data", reqd: 1 }],
};

function renderForm(access: { request: string } | { token: string } = { request: "DAFR-1" }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DirectApplicantForm access={access} />
    </QueryClientProvider>
  );
}

describe("validate / initialValues", () => {
  it("flags missing required fields and required table cells", () => {
    const fields = [pan, edu];
    const values = initialValues(fields);
    expect(values.edu).toEqual([{}]); // a required table starts with one row
    let result = validate(fields, values);
    expect(result.missing).toEqual(["PAN", "Education"]);
    result = validate(fields, { custom_pan_number: "ABCDE1234F", edu: [{ school: "", other: "x" }] });
    expect(result.missing).toEqual(["Education: School"]);
    expect(result.cellErrors.edu.has("0:school")).toBe(true);
    expect(validate(fields, { custom_pan_number: "A", edu: [{ school: "IIT" }] }).missing).toEqual([]);
  });
});

describe("DirectApplicantForm", () => {
  it("shows HR's note and only the reopened fields on a resubmission", async () => {
    getForm.mockResolvedValue({
      applicant_name: "Asha", company: "PW", form_title: "Joining Details", instructions: "Read me",
      status: "Resubmission Requested", expires_on: null, resubmit_note: "PAN is wrong",
      fields: [pan, { ...edu, editable: false }],
    });
    renderForm();
    expect(await screen.findByText("Joining Details")).toBeInTheDocument();
    expect(screen.getByText("PAN is wrong")).toBeInTheDocument();
    expect(screen.getByText("PAN")).toBeInTheDocument();
    expect(screen.queryByText("Education")).not.toBeInTheDocument();
  });

  it("submits and thanks the candidate", async () => {
    getForm.mockResolvedValue({
      applicant_name: "Asha", company: "PW", form_title: "Joining Details", instructions: "",
      status: "Sent", expires_on: null, resubmit_note: "", fields: [pan],
    });
    submit.mockResolvedValue({ status: "ok" });
    renderForm();
    fireEvent.change(await screen.findByLabelText(/PAN/), { target: { value: "ABCDE1234F" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith({ request: "DAFR-1" }, { custom_pan_number: "ABCDE1234F" }));
    expect(await screen.findByText("Thank you")).toBeInTheDocument();
  });

  it("explains when the form is not available", async () => {
    getForm.mockRejectedValue(new Error("This form is not available."));
    renderForm();
    expect(await screen.findByText("Form unavailable")).toBeInTheDocument();
    expect(screen.getByText("This form is not available.")).toBeInTheDocument();
  });

  it("from the emailed link: no Action Center link", async () => {
    getForm.mockResolvedValue({
      applicant_name: "Asha", company: "PW", form_title: "F", instructions: "",
      status: "Submitted", expires_on: null, resubmit_note: "", fields: [],
    });
    renderForm({ token: "tok" });
    expect(await screen.findByText("Thank you")).toBeInTheDocument();
    expect(getForm).toHaveBeenLastCalledWith({ token: "tok" });
    expect(screen.queryByText("Back to Action Center")).not.toBeInTheDocument();
  });

  it("shows the thank-you page for an already submitted form", async () => {
    getForm.mockResolvedValue({
      applicant_name: "Asha", company: "PW", form_title: "F", instructions: "",
      status: "Submitted", expires_on: null, resubmit_note: "", fields: [],
    });
    renderForm();
    expect(await screen.findByText("Thank you")).toBeInTheDocument();
  });
});
