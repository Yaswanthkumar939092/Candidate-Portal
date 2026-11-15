import "server-only";

export type ServerFeatureFlags = Record<string, boolean>;

function toBool(v: unknown): boolean {
  return v === 1 || v === true || v === "1" || v === "true";
}

function getFrappeUrl(): string {
  return (
    process.env.FRAPPE_BASE_URL ||
    process.env.NEXT_PUBLIC_FRAPPE_URL ||
    ""
  ).replace(/\/$/, "");
}

/**
 * Reads the public candidate feature flags server-side from the Guest v1 method
 * `get_public_flags`, so it needs no Frappe API key and works for guests. Falls back to
 * an empty object when no backend is configured or the backend errors: gates built on
 * top treat an unknown flag as off.
 */
export async function getServerFeatureFlags(): Promise<ServerFeatureFlags> {
  const frappeUrl = getFrappeUrl();
  if (!frappeUrl) {
    return {};
  }

  try {
    const res = await fetch(
      `${frappeUrl}/api/method/recruitment.api.v1.candidate.get_public_flags`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!res.ok) return {};
    const data = (await res.json()) as { message?: Record<string, unknown> };
    const raw = data.message ?? {};
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, toBool(v)]),
    );
  } catch {
    return {};
  }
}

export async function isServerFeatureEnabled(key: string): Promise<boolean> {
  const flags = await getServerFeatureFlags();
  return flags[key] === true;
}
