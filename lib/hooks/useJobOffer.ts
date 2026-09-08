import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobOfferService } from "../services/jobOffer";
import type { ConsentSessionStatusResponse } from "@/types/consent";

export const useJobOfferSummary = (appl: string, enabled = true, token?: string) => {
  return useQuery({
    queryKey: ["jobOfferSummary", appl, token],
    queryFn: () => jobOfferService.getJobOfferSummary(appl, token),
    enabled: !!appl && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Returns the direct Frappe API URL for the PDF.
 * The browser loads it with cookies, so no fetch/blob is needed.
 * Returns null when appl is empty so consumers can guard the UI.
 */
export const useJobOfferPdf = (appl: string, enabled = true, token?: string) => {
  const pdfUrl = appl && enabled ? jobOfferService.getJobOfferPdfUrl(appl, token) : null;
  return { pdfUrl, isLoading: false, error: null };
};

export const useCultureBookPdf = (appl: string, enabled = true, token?: string) => {
  const pdfUrl = appl && enabled ? jobOfferService.getCultureBookPdfUrl(appl, token) : null;
  return { pdfUrl, isLoading: false, error: null };
};

/**
 * Whether a culture book exists for this application. `useCultureBookPdf` only
 * builds a URL and is always truthy, so callers that need to hide the entry
 * point entirely must ask the endpoint.
 */
export const useCultureBookAvailability = (appl: string, enabled = true, token?: string) => {
  return useQuery({
    queryKey: ["cultureBookAvailability", appl, token],
    queryFn: () => jobOfferService.isCultureBookAvailable(appl, token),
    enabled: !!appl && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useJobOfferLetters = (appl: string, enabled = true, token?: string) => {
  return useQuery({
    queryKey: ["jobOfferLetters", appl, token],
    queryFn: () => jobOfferService.getJobOfferLetters(appl, token),
    enabled: !!appl && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateJobOfferStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobOfferService.updateJobOfferStatus,
    onSuccess: (_data, variables) => {
      // Update cache directly to avoid redundant network calls
      queryClient.setQueryData(
        ["jobOfferStatus", variables.appl, variables.token],
        { status: variables.status }
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useJobOfferStatus = (appl: string, token?: string) => {
  return useQuery({
    queryKey: ["jobOfferStatus", appl, token],
    queryFn: () => jobOfferService.getJobOfferStatus(appl, token),
    enabled: !!appl,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

export const useRejectionReasons = () => {
  return useQuery({
    queryKey: ["rejectionReasons"],
    queryFn: () => jobOfferService.getRejectionReasons(),
    staleTime: 1000 * 60 * 60, // 1 hour — common set of reasons
  });
};

export const useConsentForm = (appl: string, token: string) => {
  return useQuery({
    queryKey: ["consentForm", appl, token],
    queryFn: () => jobOfferService.getConsentForm(appl, token),
    enabled: !!appl && !!token,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useSubmitConsent = () => {
  return useMutation({
    mutationFn: jobOfferService.submitConsent,
  });
};

/** How often the return page asks whether the external portal's callback landed. */
export const CONSENT_STATUS_POLL_MS = 3000;

/**
 * Issues or re-issues an external consent link.
 *
 * Deliberately not retried by react-query: the endpoint hands back an in-flight
 * link (`reused: true`) rather than minting a new one, so a retry would only add
 * load without changing the answer.
 */
export const useStartConsentSession = () => {
  return useMutation({
    mutationFn: ({ appl, token }: { appl: string; token?: string }) =>
      jobOfferService.startConsentSession(appl, token),
    retry: false,
  });
};

/**
 * Polls whether the external portal's consent callback has reached our backend.
 *
 * The candidate's browser can beat the callback home, so the return page keeps
 * asking until `consent_given` flips true - at which point polling stops on its
 * own and the dashboard cache is dropped so the consent card disappears.
 */
export const useConsentSessionStatus = (
  appl: string,
  token?: string,
  enabled = true,
) => {
  const queryClient = useQueryClient();

  return useQuery<ConsentSessionStatusResponse>({
    queryKey: ["consentSessionStatus", appl, token],
    queryFn: async () => {
      const status = await jobOfferService.getConsentSessionStatus(appl, token);
      if (status?.consent_given) {
        // The dashboard's dpdp_consent_submitted flag is now stale.
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
      return status;
    },
    enabled: !!appl && enabled,
    // Consent state changes out of band, so a cached answer is never good enough.
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.consent_given ? false : CONSENT_STATUS_POLL_MS,
    refetchIntervalInBackground: false,
  });
};
