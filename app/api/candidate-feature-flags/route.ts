import { NextResponse } from "next/server";
import { getServerFeatureFlags } from "@/lib/server/feature-flags";

export async function GET(req: Request) {
  // Forward the candidate's session cookie so Frappe can resolve the caller
  // and return the Candidate Portal Feature Flag doctype values for them,
  // on top of the Guest-allowed public flag.
  const cookie = req.headers.get("cookie") ?? undefined;
  const flags = await getServerFeatureFlags(cookie);
  return NextResponse.json({ flags });
}
