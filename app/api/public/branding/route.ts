import { NextResponse } from "next/server";

/**
 * Guest-safe branding proxy for the public Careers pages. The portal's
 * `useCandidateBranding` hits the same Frappe method with a session cookie,
 * which a guest does not have — so this route calls it with the server-side
 * API key and returns a stripped-down branding payload.
 */
export async function GET() {
  const frappeUrl = (
    process.env.FRAPPE_BASE_URL ||
    process.env.NEXT_PUBLIC_FRAPPE_URL ||
    ""
  ).replace(/\/$/, "");
  const apiKey = process.env.FRAPPE_API_KEY;
  const apiSecret = process.env.FRAPPE_API_SECRET;

  if (!frappeUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ branding: {} });
  }

  try {
    const res = await fetch(
      `${frappeUrl}/api/method/recruitment.api.candidate_portal.get_website_branding`,
      {
        headers: { Authorization: `token ${apiKey}:${apiSecret}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return NextResponse.json({ branding: {} });
    const data = (await res.json()) as { message?: unknown };
    return NextResponse.json(
      { branding: data.message ?? {} },
      // Branding changes rarely — a short edge cache keeps the public shell snappy
      // without hiding a logo swap for long.
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch {
    return NextResponse.json({ branding: {} });
  }
}
