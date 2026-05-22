import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Create/revoke the object URL when the component mounts/unmounts or query data changes
  useEffect(() => {
    if (query.data) {
      const url = URL.createObjectURL(query.data);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setPdfUrl(null);
      };
    }
  }, [query.data]);

  return {
    pdfUrl,
    isLoading: query.isLoading,
    error: query.error,
  };
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
