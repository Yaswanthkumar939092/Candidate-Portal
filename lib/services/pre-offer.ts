import { FrappeAPI } from "../frappe-api";
import { PreOfferForm, PreOfferTab, PreOfferField, FrappePreOfferFieldResponse } from "../types/pre-offer";

export const preOfferService = {
  getPreOfferForm: async (userEmail?: string): Promise<PreOfferForm> => {
    const params: Record<string, string> = {};
    if (userEmail) {
      params.job_applicant = userEmail;
    }

    const message = (await FrappeAPI.get(
      "recruitment.api.channels.pre_offer.get_application_fields",
      params
    )) as FrappePreOfferFieldResponse[];

    if (!message || !Array.isArray(message)) {
      throw new Error("Failed to fetch pre-offer form: Response is not a valid list of fields");
    }

    return transformPreOfferForm(message, userEmail || "");
  },

  submitPreOffer: async (jobApplicant: string, data: Record<string, unknown>): Promise<any> => {
    if (!jobApplicant) throw new Error("Job applicant is required");
    return FrappeAPI.post("recruitment.api.channels.pre_offer.submit_application", {
      job_applicant: jobApplicant,
      data: JSON.stringify(data),
    });
  },
};

// Helper for transforming field responses recursively
export function transformPreOfferField(field: FrappePreOfferFieldResponse): PreOfferField {
  const fieldname = field.reference_name || field.fieldname || "";
  const label = field.display_name || field.label || fieldname;
  const childFields = field.child_fields || field.table_fields;

  return {
    fieldname,
    label,
    fieldtype: field.fieldtype,
    is_mandatory: field.reqd || 0,
    reqd: field.reqd || 0,
    read_only: field.read_only !== undefined ? field.read_only : (field.editability === "Editable" ? 0 : 1),
    hidden: field.hidden !== undefined ? field.hidden : (field.visibility === "Hidden" ? 1 : 0),
    options: field.options,
    child_doctype: field.child_doctype,
    child_fields: childFields ? childFields.map(transformPreOfferField) : undefined,
    value: field.value !== undefined ? field.value : "",
    default: field.default,
    approval_status: field.approval_status,
    hr_comment: field.hr_comment,
  };
}

// Backend to frontend transformation
export function transformPreOfferForm(
  fields: FrappePreOfferFieldResponse[],
  userEmail: string,
): PreOfferForm {
  const tabMap: Record<string, PreOfferTab> = {};
  let status = "Sent";

  // Look for status field in the list of fields first
  const statusField = fields.find(
    (f) => f.reference_name === "pre_offer_form_status" || f.reference_name === "status"
  );
  if (statusField) {
    status = (statusField.value as string) || (statusField.default as string) || "Sent";
  }

  fields.forEach((field) => {
    // Skip status field from being rendered as an input form field if it's purely metadata
    if (field.reference_name === "pre_offer_form_status" || field.reference_name === "status") {
      return;
    }

    const sectionName = field.section || "Basic Details";

    if (!tabMap[sectionName]) {
      tabMap[sectionName] = {
        tab: sectionName,
        sections: [
          {
            section: sectionName,
            fields: [],
          },
        ],
      };
    }

    const mappedField = transformPreOfferField(field);
    tabMap[sectionName].sections[0].fields.push(mappedField);
  });

  return {
    applicantId: userEmail,
    status,
    tabs: Object.values(tabMap),
  };
}
