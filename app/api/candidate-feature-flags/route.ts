import { NextResponse } from "next/server";

function getFrappeUrl() {
  return (
    process.env.FRAPPE_BASE_URL ||
    process.env.NEXT_PUBLIC_FRAPPE_URL ||
    ""
  ).replace(/\/$/, "");
}

export async function GET() {
  const frappeUrl = getFrappeUrl();
  const apiKey = process.env.FRAPPE_API_KEY;
  const apiSecret = process.env.FRAPPE_API_SECRET;

  if (!frappeUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Frappe API credentials are not configured" },
      { status: 500 }
    );
  }

  const response = await fetch(
    `${frappeUrl}/api/method/recruitment.api.candidate_portal.get_candidate_feature_flags`,
    {
      headers: {
        Authorization: `token ${apiKey}:${apiSecret}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch candidate feature flags" },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json({ flags: data.message || {} });
}
