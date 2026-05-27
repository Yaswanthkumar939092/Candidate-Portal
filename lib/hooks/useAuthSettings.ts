import { useQuery } from "@tanstack/react-query";
import { auth } from "../auth";

export function useAuthSettings() {
  return useQuery({
    queryKey: ["auth-settings"],
    queryFn: () => auth.getAuthSettings(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
