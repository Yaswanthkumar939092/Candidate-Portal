// services/applicantStatusService.ts

import { FrappeAPI } from "../frappe-api";

export interface ApplicantFlag {
  status: string;
  flag: boolean;
}

export interface ApplicantStatusData {
  id: string;
  name: string;
  status: string;
  flags: ApplicantFlag[];
  applications: any[]; // Added this as it's used in the UI
}

export interface ApplicantStatusResponse {
  success: boolean;
  data: ApplicantStatusData;
}

interface V1ApplicationRow {
  receipt: string;
  job_opening: string;
  job_title?: string | null;
  status: string;
  submitted_on?: string | null;
}

const PUBLIC_STATUS_FLAGS: Record<string, string[]> = {
  Received: ["Open"],
  "In review": ["Open", "Replied"],
  Accepted: ["Open", "Replied", "Accepted"],
  Closed: ["Open", "Rejected"],
};

function toTimelineApplication(row: V1ApplicationRow) {
  const reached = PUBLIC_STATUS_FLAGS[row.status] ?? ["Open"];
  const flags = ["Open", "Replied", "Accepted", "Rejected"].map((status) => ({
    status,
    flag: reached.includes(status),
    date: status === "Open" ? (row.submitted_on ?? null) : null,
  }));
  return {
    id: row.receipt,
    applied_on: row.submitted_on ?? "",
    job: {
      designation: row.job_title || row.job_opening,
      company: null,
      location: null,
      experience_range: null,
      employment_type: null,
    },
    status: row.status,
    flags,
  };
}

export const ApplicantStatusResponse = {
  // ✅ GET — fetch existing draft by email
  getApplicantStatusResponse: async (
    _email: string,
  ): Promise<ApplicantStatusResponse> => {
    const rows = (await FrappeAPI.get(
      "recruitment.api.v1.candidate.my_applications",
      {},
    )) as V1ApplicationRow[] | null;
    const applications = (rows ?? []).map(toTimelineApplication);
    return {
      success: true,
      data: { id: "", name: "", status: "", flags: [], applications },
    };
  },

  // GET - the candidate's own application by its opaque receipt (the id that
  // my_applications returns). The legacy get_job_applicant below takes a Job
  // Applicant document name, which the portal never sees, so it answers 403 for
  // a receipt.
  getApplication: async (receipt: string): Promise<V1ApplicationRow> => {
    return (await FrappeAPI.get("recruitment.api.v1.candidate.get_application", {
      receipt,
    })) as V1ApplicationRow
  },

  // ✅ GET — fetch detailed job applicant by name
  getJobApplicant: async (jobApplicantName: string): Promise<any> => {
    const response = await FrappeAPI.get(
      "recruitment.api.draft_application.get_job_applicant",
      { job_applicant: jobApplicantName },
    );
    return response;
  },
};
