/**
 * Shared rules for the DPDP consent hand-off.
 *
 * The external consent journey lives on another origin (HPCP), so the portal
 * only ever holds a URL and a session id. Everything that decides *where* the
 * candidate goes next lives here, so the offer page, the consent page and the
 * dashboard card cannot drift apart.
 */

/** Where the external portal sends the candidate back to. Polls for the callback. */
export const CONSENT_RETURN_PATH = "/job_offer/consent/return";

/** The in-app consent form - still the destination in `Internal Form` mode. */
export const CONSENT_FORM_PATH = "/job_offer/consent";

/** Where a candidate lands once consent is recorded. */
export const CONSENT_ONWARD_PATH = "/onboarding";

/**
 * `appl` / `token` are how every consent endpoint identifies the candidate, and
 * they have to survive each hop of the journey.
 */
export function buildConsentQuery(appl?: string | null, token?: string | null): string {
  const params = new URLSearchParams();
  if (appl) params.append("appl", appl);
  if (token) params.append("token", token);
  return params.toString();
}

export function buildConsentPath(
  path: string,
  appl?: string | null,
  token?: string | null,
): string {
  const query = buildConsentQuery(appl, token);
  return query ? `${path}?${query}` : path;
}

/**
 * Whether a backend-supplied URL is safe to navigate to.
 *
 * The consent link is a shortener URL chosen by the backend rather than a
 * constant we control, so it is validated before use: absolute http(s) only.
 * That rejects `javascript:` and `data:` outright, and rejects a relative value
 * that would silently resolve against our own origin and look like a working
 * link while going nowhere useful.
 */
export function isSafeExternalConsentUrl(url?: string | null): url is string {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Leaves the site for the external consent portal.
 *
 * A full-page navigation, not a router push - the destination is another origin,
 * and the candidate must be able to come back to a freshly loaded return page
 * rather than a stale client-side cache. Returns false when the URL is unusable
 * so the caller can fall back to re-issuing a link.
 */
export function navigateToExternalConsent(url?: string | null): boolean {
  if (!isSafeExternalConsentUrl(url)) return false;
  if (typeof window === "undefined") return false;
  window.location.assign(url);
  return true;
}

/**
 * Where to send a candidate whose consent is already recorded.
 *
 * The backend's `redirect_url` wins when it is a usable absolute URL; otherwise
 * we keep them inside the portal on the onboarding route.
 */
export function resolveConsentOnwardUrl(
  redirectUrl?: string | null,
  appl?: string | null,
  token?: string | null,
): { url: string; isExternal: boolean } {
  if (isSafeExternalConsentUrl(redirectUrl)) {
    return { url: redirectUrl, isExternal: true };
  }
  return {
    url: buildConsentPath(CONSENT_ONWARD_PATH, appl, token),
    isExternal: false,
  };
}
