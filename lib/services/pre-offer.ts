import { PreOfferForm, PreOfferFormMessage } from "../types/pre-offer";

export const preOfferService = {
  getPreOfferForm: async (userEmail: string): Promise<PreOfferForm> => {
    if (!userEmail) throw new Error("User email is required");

    const res = await fetch("/api/pre-offer");

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch pre-offer form");
    }

    const data = await res.json();
    const message = data?.message || data;

    if (!message || (message.status !== "success" && data.status !== "success")) {
      throw new Error("Failed to fetch pre-offer form");
    }

    return transformPreOfferForm(message);
  },

  submitPreOffer: async (
    stepData: Record<string, Record<string, unknown>>,
    userEmail: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (!userEmail) throw new Error("User email is required");

    const res = await fetch("/api/pre-offer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stepData }),
    });

    const data = await res.json();
    const message = data?.message || data;

    if (!res.ok || !message || (message.status !== "success" && data.status !== "success")) {
      throw new Error(message?.message || data?.message || data?.error || "Submission failed");
    }

    return {
      success: true,
      message: message.message || data.message || "Form submitted successfully!",
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
