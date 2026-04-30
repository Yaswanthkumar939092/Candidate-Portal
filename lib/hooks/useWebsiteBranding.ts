import { useQuery } from "@tanstack/react-query";
import { websiteBrandingService } from "../services/website-branding";

export function useWebsiteBranding() {
  return useQuery({
    queryKey: ["website-branding"],
    queryFn: () => websiteBrandingService.getWebsiteBranding(),
    staleTime: 1000 * 60 * 60,
  });
}
