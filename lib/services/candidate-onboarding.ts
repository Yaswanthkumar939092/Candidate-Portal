import { OnboardingForm, OnboardingFormMessage } from "@/types/onboarding";
import { FrappeAPI } from "../frappe-api";

const API_METHODS = {
  GET_ONBOARDING_FORM:
    "recruitment.api.candidate_portal.get_candidate_portal_form",
  SUBMIT_ONBOARDING:
    "recruitment.api.employee_onboarding.update_onboarding_details",
};

export const candidateOnboardingService = {
  getOnboardingForm: async (userEmail: string): Promise<OnboardingForm> => {
    if (!userEmail) throw new Error("User email is required");

    const res = await FrappeAPI.get(API_METHODS.GET_ONBOARDING_FORM, {
      job_applicant_id: userEmail,
    });

    if (!res || res.status !== "success") {
      throw new Error("Failed to fetch onboarding form");
    }

    return transformOnboardingForm(res);
  },

  submitOnboarding: async (
    stepData: Record<string, Record<string, unknown>>,
    userEmail: string,
    action: "save" | "submit",
  ): Promise<{ success: boolean; message: string }> => {
    if (!userEmail) throw new Error("User email is required");

    const payload = mapOnboardingDataToFrappe(stepData, userEmail, action);

    const res = await FrappeAPI.post(API_METHODS.SUBMIT_ONBOARDING, payload);

    if (!res || res.status !== "success") {
      throw new Error(res?.message || "Submission failed");
    }

    return {
      success: true,
      message: res.message,
    };
  },
};

//Backend to frontend transformation
export function transformOnboardingForm(
  data: OnboardingFormMessage,
): OnboardingForm {
  return {
    applicantId: data.job_applicant,
    status: data.boarding_status,
    tabs: data.tabs,
    field_status_counts: data.field_status_counts,
  };
}

const getToday = () => new Date().toISOString().split("T")[0];

//Mapping of frontend data to Frappe's expected format for submission
function mapOnboardingDataToFrappe(
  onboardingData: Record<string, Record<string, unknown>>,
  userEmail: string,
  action: "save" | "submit",
) {
  if (!userEmail) throw new Error("User email is required");

  const mappedData: Record<string, unknown> = {
    boarding_status: "Pending",
    custom_email: userEmail,
    boarding_begins_on: getToday(),
    notify_users_by_email: 1,
  };

  for (const stepValues of Object.values(onboardingData)) {
    for (const [key, val] of Object.entries(stepValues)) {
      // Skip undefined values (important)
      if (val === undefined) continue;

      mappedData[key] = val;
    }
  }

  // Ensure date_of_joining
  if (!mappedData.date_of_joining) {
    mappedData.date_of_joining =
      mappedData.custom_date_of_joining || getToday();
  }

  return {
    email: userEmail,
    data: mappedData,
    action,
  };
}
