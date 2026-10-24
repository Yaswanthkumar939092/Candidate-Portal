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
 * Reads candidate feature flags server-side via the Frappe API key, so the
 * caller works for guests. Falls back to an empty object when credentials are
 * missing or the backend errors — gates built on top treat an unknown flag as
 * off, which matches the client-side `isEnabled` behaviour.
 */
export async function getServerFeatureFlags(): Promise<ServerFeatureFlags> {
  const frappeUrl = getFrappeUrl();
  const apiKey = process.env.FRAPPE_API_KEY;
  const apiSecret = process.env.FRAPPE_API_SECRET;

  if (!frappeUrl || !apiKey || !apiSecret) {
    return {};
  }

  try {
    const res = await fetch(
      `${frappeUrl}/api/method/recruitment.api.candidate_portal.get_candidate_feature_flags`,
      {
        headers: { Authorization: `token ${apiKey}:${apiSecret}` },
        cache: "no-store",
      },
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
