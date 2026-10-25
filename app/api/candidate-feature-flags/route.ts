import { NextResponse } from "next/server";
import { getServerFeatureFlags } from "@/lib/server/feature-flags";

export async function GET() {
  const frappeUrl = (
    process.env.FRAPPE_BASE_URL ||
    process.env.NEXT_PUBLIC_FRAPPE_URL ||
    ""
  ).replace(/\/$/, "");
  if (!frappeUrl || !process.env.FRAPPE_API_KEY || !process.env.FRAPPE_API_SECRET) {
    return NextResponse.json(
      { error: "Frappe API credentials are not configured" },
      { status: 500 },
    );
  }

  const flags = await getServerFeatureFlags();
  return NextResponse.json({ flags });
}
