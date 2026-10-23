import { useQuery } from "@tanstack/react-query";
import type { PublicOpening } from "@/types/public-job";

async function fetchPublicOpenings(): Promise<PublicOpening[]> {
  const res = await fetch("/api/public/openings");
  if (!res.ok) throw new Error("Could not load open jobs");
  const data = (await res.json()) as { openings: PublicOpening[] };
  return data.openings;
}

/** Open jobs for visitors who are not logged in. */
export function usePublicOpenings() {
  return useQuery({
    queryKey: ["public-openings"],
    queryFn: fetchPublicOpenings,
    staleTime: 1000 * 60 * 5,
  });
}
