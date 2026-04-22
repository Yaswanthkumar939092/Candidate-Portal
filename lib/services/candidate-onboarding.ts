import { FrappeAPI } from "../frappe-api";

/**
 * Service specifically for candidate-facing onboarding API operations.
 */
export const candidateOnboardingService = {
  /**
   * Submit the final onboarding data to Frappe.
   */
  submitOnboarding: async (stepData: Record<string, Record<string, unknown>>, userEmail: string) => {
    const payload = mapOnboardingDataToFrappe(stepData, userEmail);
    
    return FrappeAPI.post(
      "recruitment.api.employee_onboarding.update_onboarding_details",
      payload
    );
  },

  /**
   * Fetch the dynamic onboarding form configuration.
   */
  getOnboardingForm: async (userEmail: string) => {
    return FrappeAPI.get(
      "recruitment.api.candidate_portal.get_candidate_portal_form",
      { job_applicant_id: userEmail }
    );
  },

};

/**
 * Maps the flat onboarding state from the UI/Context into the
 * format expected by the Frappe Employee Onboarding endpoint.
 *
 * This version is fully dynamic and relies on the fact that fieldnames in the UI
 * match the fieldnames expected by the Frappe API.
 */
function mapOnboardingDataToFrappe(onboardingData: Record<string, Record<string, unknown>>, userEmail: string) {
  // Collect all fields from all steps into a single object
  const mappedData: Record<string, unknown> = {
    boarding_status: "Pending",
    custom_email: userEmail,
    // Add other essential defaults if required by the Frappe DocType
    boarding_begins_on: new Date().toISOString().split('T')[0],
    notify_users_by_email: 1,
  }
  
  Object.values(onboardingData).forEach(stepValues => {
    Object.entries(stepValues).forEach(([key, val]) => {
      // Direct mapping of fieldname to value
      // This includes Table fields (which are arrays of objects)
      mappedData[key] = val
    })
  })

  // Ensure date_of_joining is present
  if (!mappedData.date_of_joining) {
    mappedData.date_of_joining = mappedData.custom_date_of_joining || new Date().toISOString().split('T')[0]
  }

  return { email: userEmail, data: mappedData };
}
