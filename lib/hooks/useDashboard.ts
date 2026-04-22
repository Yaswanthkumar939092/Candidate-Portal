import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard";

export function useDashboard(email?: string) {
  return useQuery({
    queryKey: ["dashboard-data", email],
    queryFn: () => dashboardService.getDashboard(email!),
    enabled: !!email,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
