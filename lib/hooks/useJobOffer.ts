import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobOfferService } from "../services/jobOffer";

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
