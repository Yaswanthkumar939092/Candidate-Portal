/** Login URL that returns the user to `redirect` after a successful sign-in. */
export function loginHref(redirect: string): string {
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}

/** Portal page that continues a resume upload; opens the AI Resume / Job Match tab. */
export const RESUME_CONTINUE_PATH = "/open-jobs?tab=smart-match";

/** Candidate Portal page a logged-in visitor is moved to from each public careers page. */
export const PORTAL_EQUIVALENT: Record<string, string> = {
  "/": "/dashboard",
  "/ai-match": RESUME_CONTINUE_PATH,
  "/jobs": "/open-jobs",
};

/** Query parameter of a shared job link (`/jobs?job=<Job Opening id>`). */
export const SHARED_JOB_PARAM = "job";

/**
 * Where a logged-in visitor on public careers page `pathname` is sent. A shared job
 * link (`/jobs?job=HR-OPN-1`) keeps its job, so the portal opens that job's details
 * instead of the general list.
 */
export function portalEquivalent(pathname: string, search: string): string {
  const target = PORTAL_EQUIVALENT[pathname] ?? "/dashboard";
  const job = pathname === "/jobs" ? new URLSearchParams(search).get(SHARED_JOB_PARAM) : null;
  return job ? `${target}?${SHARED_JOB_PARAM}=${encodeURIComponent(job)}` : target;
}
