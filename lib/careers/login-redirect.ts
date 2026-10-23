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
