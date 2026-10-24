import { useQuery } from "@tanstack/react-query";
import type { CandidateBranding } from "../services/candidate-branding";

async function fetchPublicBranding(): Promise<CandidateBranding> {
  const res = await fetch("/api/public/branding", { cache: "no-store" });
  if (!res.ok) return {};
  const data = (await res.json()) as { branding?: CandidateBranding };
  return data.branding ?? {};
}

/**
 * Branding for the public Careers shell. Uses the server API key, so it works
 * for logged-out visitors (unlike `useCandidateBranding`, which forwards the
 * session cookie).
 */
export function usePublicBranding() {
  return useQuery({
    queryKey: ["public-branding"],
    queryFn: fetchPublicBranding,
    staleTime: 1000 * 60 * 10,
  });
}
