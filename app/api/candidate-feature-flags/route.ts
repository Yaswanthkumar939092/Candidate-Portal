import { NextResponse } from "next/server";
import { getServerFeatureFlags } from "@/lib/server/feature-flags";

export async function GET() {
  const flags = await getServerFeatureFlags();
  return NextResponse.json({ flags });
}
