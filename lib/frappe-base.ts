// Single source of truth for the base URL used to reach the Frappe backend.
//
// Why this exists: the frontend (Netlify) and Frappe (frappe.cloud) live on
// different domains. The `candidate_portal_session` cookie is therefore a
// cross-site cookie, which iOS Safari/Chrome (WebKit ITP) silently drop — so
// authenticated requests fail on iPhone even though they work everywhere else.
//
// The fix is to make the cookie first-party: in the browser we send every
// credentialed request to a SAME-ORIGIN path (`/backend/...`) that Next.js
// rewrites to the real Frappe host (see `rewrites()` in next.config.ts). The
// browser then sees the session cookie as belonging to our own origin, so it
// stores and resends it like any first-party cookie — ITP no longer applies.
//
// On the server (SSR / route handlers) relative URLs can't be fetched, and
// there is no ITP concern, so we use the absolute configured URL directly.

export const FRAPPE_PROXY_PREFIX = "/backend";

export function frappeApiBase(): string {
  const configuredUrl = (process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");

  // Server-side rendering / API routes: must use an absolute URL.
  if (typeof window === "undefined") {
    return configuredUrl;
  }

  // Browser: always go through the same-origin proxy so the session cookie is
  // first-party. This also works in local dev (`next dev` honours rewrites).
  return FRAPPE_PROXY_PREFIX;
}
