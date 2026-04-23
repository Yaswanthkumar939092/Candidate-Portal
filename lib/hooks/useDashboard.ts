import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard";


export function useDashboard(email?: string) {
  return useQuery({
    queryKey: ["dashboard-data", email],
    queryFn: ({ queryKey }) => {
      const [, email] = queryKey;
      if (!email) throw new Error("Email is required");
      return dashboardService.getDashboard(email);
    },
    enabled: !!email,
    staleTime: 1000 * 60 * 5,
  });
}