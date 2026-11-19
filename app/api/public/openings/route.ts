import { NextResponse } from "next/server";
import { fromV1Opening, type V1OpeningRow } from "@/lib/careers/openings";
import type { PublicOpening } from "@/types/public-job";

const METHOD = "recruitment.api.v1.candidate";
const PAGE_LENGTH = 50;
const MAX_PAGES = 10;
const DETAIL_CONCURRENCY = 8;

function frappeUrl(): string {
  return (process.env.FRAPPE_BASE_URL || process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
}

async function call<T>(base: string, method: string, params: Record<string, string>): Promise<T | null> {
  const res = await fetch(`${base}/api/method/${METHOD}.${method}?${new URLSearchParams(params)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return ((await res.json()) as { message?: T }).message ?? null;
}

interface ListPayload {
  openings: V1OpeningRow[];
  total?: number;
}

async function withDescription(base: string, row: V1OpeningRow): Promise<PublicOpening> {
  try {
    const d = await call<{ description?: string }>(base, "get_opening", { name: row.name });
    return fromV1Opening(row, d?.description ?? "");
  } catch {
    return fromV1Opening(row, "");
  }
}

/**
 * Guest-readable list of open Job Openings. Uses only the narrow Guest methods of the
 * reviewed v1 API, so it needs no Frappe API key and no DocType read permission.
 */
export async function GET() {
  const base = frappeUrl();
  if (!base) return NextResponse.json({ error: "Backend URL is not configured" }, { status: 500 });

  try {
    const rows: V1OpeningRow[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const data = await call<ListPayload>(base, "list_openings", { page: String(page), page_length: String(PAGE_LENGTH) });
      if (!data) {
        if (page === 1) return NextResponse.json({ error: "Failed to fetch open jobs" }, { status: 502 });
        break;
      }
      rows.push(...(data.openings ?? []));
      if (!data.openings?.length || rows.length >= (data.total ?? 0)) break;
    }

    const today = new Date().toISOString().slice(0, 10);
    const live = rows.filter((r) => !r.closes_on || r.closes_on.slice(0, 10) >= today);
    const openings: PublicOpening[] = [];
    for (let i = 0; i < live.length; i += DETAIL_CONCURRENCY) {
      openings.push(...(await Promise.all(live.slice(i, i + DETAIL_CONCURRENCY).map((r) => withDescription(base, r)))));
    }
    openings.sort((a, b) => (b.postedOn ?? "").localeCompare(a.postedOn ?? ""));

    return NextResponse.json(
      { openings },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch open jobs" }, { status: 502 });
  }
}
