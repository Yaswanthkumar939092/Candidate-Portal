import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobOfferService } from "../services/jobOffer";

export const useJobOfferSummary = (appl: string, enabled = true) => {
  return useQuery({
    queryKey: ["jobOfferSummary", appl],
    queryFn: () => jobOfferService.getJobOfferSummary(appl),
    enabled: !!appl && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Returns the direct Frappe API URL for the PDF.
 * The browser loads it with cookies, so no fetch/blob is needed.
 * Returns null when appl is empty so consumers can guard the UI.
 */
export const useJobOfferPdf = (appl: string, enabled = true) => {
  const pdfUrl = appl && enabled ? jobOfferService.getJobOfferPdfUrl(appl) : null;
  return { pdfUrl, isLoading: false, error: null };
};

export const useUpdateJobOfferStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobOfferService.updateJobOfferStatus,
    onSuccess: (_data, variables) => {
      // Invalidate the summary and status queries to reflect the new status
      queryClient.invalidateQueries({ queryKey: ["jobOfferSummary", variables.appl] });
      queryClient.invalidateQueries({ queryKey: ["jobOfferStatus", variables.appl] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useJobOfferStatus = (appl: string) => {
  return useQuery({
    queryKey: ["jobOfferStatus", appl],
    queryFn: () => jobOfferService.getJobOfferStatus(appl),
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
