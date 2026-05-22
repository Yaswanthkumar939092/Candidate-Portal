import { useQuery } from "@tanstack/react-query";
import { linkFieldService } from "../services/link-field";

export function useLinkFieldOptions(doctype: string, searchText?: string) {
  return useQuery({
    queryKey: ["link-field-options", { doctype, searchText }],
    queryFn: () => linkFieldService.getLinkFieldOptions(doctype, searchText),
    enabled: !!doctype,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
