import type { Metadata } from "next";

// The page URL carries the candidate's access token (?t=...): never send it
// on as a Referer, not even to our own /backend proxy.
export const metadata: Metadata = { referrer: "no-referrer" };

export default function TokenLinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
