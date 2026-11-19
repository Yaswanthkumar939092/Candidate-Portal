// Each gate opens only once every backend method its screens call has passed review
// and is in the proxy's ALLOWED_METHODS (OPS-507). Saved jobs, drafts and application
// detail opened after cn-recruitment #1688 fixed their methods (OPS-508, OPS-15). The
// onboarding dashboard stays closed: save_candidate_portal_data and the onboarding-form
// methods are still under OPS-509.
export const SAVED_AND_DRAFTS_ENABLED = true;
export const APPLICATION_DETAIL_ENABLED = true;
export const HOME_PROMO_ENABLED = true;
export const ONBOARDING_DASHBOARD_ENABLED = false;
