import { PreOfferForm, PreOfferFormMessage } from "../types/pre-offer";
import { FrappeAPI } from "../frappe-api";

const API_METHODS = {
  GET_PRE_OFFER_FORM:
    "recruitment.api.candidate_portal.get_pre_offer_form",
  SUBMIT_PRE_OFFER:
    "recruitment.api.candidate_portal.save_pre_offer_form_data",
};

export const preOfferService = {
  getPreOfferForm: async (userEmail: string): Promise<PreOfferForm> => {
    if (!userEmail) throw new Error("User email is required");

    const res = await FrappeAPI.get(API_METHODS.GET_PRE_OFFER_FORM, {
      job_applicant_id: userEmail,
    });

    // Handling response wrappers if applicable
    const message = res?.message || res;

    if (!message || (message.status !== "success" && res.status !== "success")) {
      throw new Error("Failed to fetch pre-offer form");
    }

    return transformPreOfferForm(message);
  },

  submitPreOffer: async (
    stepData: Record<string, Record<string, unknown>>,
    userEmail: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (!userEmail) throw new Error("User email is required");

    const payload = mapPreOfferDataToFrappe(stepData, userEmail);

    const res = await FrappeAPI.post(API_METHODS.SUBMIT_PRE_OFFER, payload);

    const message = res?.message || res;

    if (!message || (message.status !== "success" && res.status !== "success")) {
      throw new Error(message?.message || res?.message || "Submission failed");
    }

    return {
      success: true,
      message: message.message || res.message || "Form submitted successfully!",
    };
  },
};

// Backend to frontend transformation
export function transformPreOfferForm(
  data: PreOfferFormMessage,
): PreOfferForm {
  return {
    applicantId: data.job_applicant,
    status: data.pre_offer_form_status,
    tabs: data.tabs,
  };
}

const getToday = () => new Date().toISOString().split("T")[0];

// Mapping of frontend data to Frappe's expected format for submission
function mapPreOfferDataToFrappe(
  formData: Record<string, Record<string, unknown>>,
  userEmail: string,
) {
  if (!userEmail) throw new Error("User email is required");

  const mappedData: Record<string, unknown> = {
    pre_offer_form_status: "Submitted",
    custom_email: userEmail,
    submission_date: getToday(),
  };

  for (const stepValues of Object.values(formData)) {
    for (const [key, val] of Object.entries(stepValues)) {
      // Skip undefined values (important)
      if (val === undefined) continue;

      mappedData[key] = val;
    }
  }

  return {
    job_applicant_id: userEmail,
    data: mappedData,
  };
}
