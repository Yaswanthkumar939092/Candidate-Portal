import { useQuery } from "@tanstack/react-query";
import { authPageContentService } from "../services/auth-page-content";

export function useAuthPageContent() {
  return useQuery({
    queryKey: ["auth-page-content"],
    queryFn: () => authPageContentService.getAuthPageContent(),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
}
