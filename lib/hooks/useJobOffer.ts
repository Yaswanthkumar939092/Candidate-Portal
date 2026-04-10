import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { jobOfferService } from "../services/jobOffer";

export const useJobOfferSummary = (appl: string, enabled = true) => {
  return useQuery({
    queryKey: ["jobOfferSummary", appl],
    queryFn: () => jobOfferService.getJobOfferSummary(appl),
    enabled: !!appl && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useJobOfferPdf = (appl: string, enabled = true) => {
  const query = useQuery({
    queryKey: ["jobOfferPdf", appl],
    queryFn: () => jobOfferService.downloadJobOfferPdf(appl),
    enabled: !!appl && enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes — PDF doesn't change often
    refetchOnWindowFocus: false,
  });

  // Revoke the object URL when the component unmounts or data changes
  useEffect(() => {
    return () => {
      if (query.data) {
        URL.revokeObjectURL(query.data);
      }
    };
  }, [query.data]);

  return {
    pdfUrl: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useUpdateJobOfferStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobOfferService.updateJobOfferStatus,
    onSuccess: (_, variables) => {
      // Invalidate the summary and status queries to reflect the new status
      queryClient.invalidateQueries({ queryKey: ["jobOfferSummary", variables.appl] });
      queryClient.invalidateQueries({ queryKey: ["jobOfferStatus", variables.appl] });
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
