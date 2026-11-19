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
 * Reads the Guest-allowed `get_public_flags` method, which returns only
 * `careers_public_enabled` today. Safe for everyone: no credentials.
 */
async function readGuestFlags(frappeUrl: string): Promise<ServerFeatureFlags> {
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

/**
 * With the browser's candidate-session cookie forwarded, reads the
 * Candidate Portal Feature Flag doctype via
 * `recruitment.api.candidate_portal.get_candidate_feature_flags`. The response
 * is `{page_name_snake_case: 0|1}` for each row in the doctype, so admins can
 * toggle Open Jobs, My Jobs, Action Center, Documents, Candidate Dashboard …
 * on or off per deployment. Any failure yields an empty object so the Guest
 * flags still stand.
 */
async function readAuthenticatedFlags(
  frappeUrl: string,
  cookie: string,
): Promise<ServerFeatureFlags> {
  try {
    const res = await fetch(
      `${frappeUrl}/api/method/recruitment.api.candidate_portal.get_candidate_feature_flags`,
      {
        headers: { Accept: "application/json", cookie },
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

/**
 * Returns the merged public + authenticated feature flags for the caller.
 * When a candidate-session cookie is forwarded, the Candidate Portal Feature
 * Flag doctype values (open_jobs, my_jobs, action_center, …) override the
 * Guest set. Falls back to an empty object when no backend is configured.
 */
export async function getServerFeatureFlags(cookie?: string): Promise<ServerFeatureFlags> {
  const frappeUrl = getFrappeUrl();
  if (!frappeUrl) {
    return {};
  }

  const guest = await readGuestFlags(frappeUrl);
  if (!cookie) {
    return guest;
  }

  const authenticated = await readAuthenticatedFlags(frappeUrl, cookie);
  return { ...guest, ...authenticated };
}

export async function isServerFeatureEnabled(key: string): Promise<boolean> {
  const flags = await getServerFeatureFlags();
  return flags[key] === true;
}
