import { useQuery } from "@tanstack/react-query";
import { homeService } from "../services/home";

export function useHomeContent() {
  return useQuery({
    queryKey: ["home-content"],
    queryFn: () => homeService.getHomeContent(),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
}
