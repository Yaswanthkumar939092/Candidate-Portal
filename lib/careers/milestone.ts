// Each gate opens only once every backend method its screens call has passed review
// and is in the proxy's ALLOWED_METHODS (OPS-507). The three still closed call methods
// that failed that review (get_saved_job_openings, toggle_saved_job_opening and
// delete_draft; get_job_applicant; the job-offer and onboarding-form methods).
export const SAVED_AND_DRAFTS_ENABLED = false;
export const APPLICATION_DETAIL_ENABLED = false;
export const HOME_PROMO_ENABLED = true;
export const ONBOARDING_DASHBOARD_ENABLED = false;
