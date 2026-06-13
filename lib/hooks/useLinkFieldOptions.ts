import { useQuery } from "@tanstack/react-query";
import { linkFieldService } from "../services/link-field";

export function useLinkFieldOptions(doctype: string, searchText?: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["link-field-options", { doctype, searchText, filters }],
    queryFn: () => linkFieldService.getLinkFieldOptions(doctype, searchText, filters),
    enabled: !!doctype,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
