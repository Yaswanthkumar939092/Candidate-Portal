import { NextResponse } from "next/server";
import { listLiveOpenings, PUBLIC_OPENING_FIELDS } from "@/lib/careers/openings";
import type { RawPublicOpening } from "@/types/public-job";

/**
 * Guest-readable list of open Job Openings for the public careers pages.
 *
 * `recruitment.api.channels.careers.list_openings` requires a session, so this
 * route reads the Job Opening resource with the server-side API key and returns
 * only the whitelisted fields in `PUBLIC_OPENING_FIELDS`.
 */
export async function GET() {
  const frappeUrl = (process.env.FRAPPE_BASE_URL || process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
  const apiKey = process.env.FRAPPE_API_KEY;
  const apiSecret = process.env.FRAPPE_API_SECRET;

  if (!frappeUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Frappe API credentials are not configured" }, { status: 500 });
  }

  const headers = { Authorization: `token ${apiKey}:${apiSecret}` };
  const resource = (doctype: string, params: Record<string, string>) =>
    fetch(`${frappeUrl}/api/resource/${encodeURIComponent(doctype)}?${new URLSearchParams(params)}`, {
      headers,
      cache: "no-store",
    });

  try {
    const [openingsRes, typesRes] = await Promise.all([
      resource("Job Opening", {
        fields: JSON.stringify(PUBLIC_OPENING_FIELDS),
        filters: JSON.stringify([["status", "=", "Open"]]),
        order_by: "posted_on desc",
        limit_page_length: "500",
      }),
      resource("Employment Type", {
        fields: JSON.stringify(["name", "employee_type_name"]),
        limit_page_length: "0",
      }),
    ]);

    if (!openingsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch open jobs" }, { status: 502 });
    }

    const raws: RawPublicOpening[] = (await openingsRes.json()).data ?? [];
    const employmentTypes: Record<string, string> = {};
    if (typesRes.ok) {
      for (const row of (await typesRes.json()).data ?? []) {
        employmentTypes[row.name] = row.employee_type_name || row.name;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    return NextResponse.json(
      { openings: listLiveOpenings(raws, employmentTypes, today) },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch open jobs" }, { status: 502 });
  }
}
