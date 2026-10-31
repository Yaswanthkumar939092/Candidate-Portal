# SPEC-CAND-07: Services and hooks outside onboarding and dashboard

<a id="spec-cand-07"></a>

- Stable ID: `SPEC-CAND-07`
- Described at: repo `hybrowlabs/Candidate-Portal`, branch `develop`, commit `0d7fd6f6002cd2dff3c6b6716195cf051f5fad1c` (committer date `2026-10-31 17:27:47 +0000`)
- Also read at: branch `deploy/hybrowbase-candidate-20261025`, commit `786b53e406869986d5d5d0c81b7ae6b1605f8315`; differs: `lib/services/jobOpeningService.ts` calls `recruitment.api.v1.candidate.list_openings` with `page_length` and `search` instead of `recruitment.api.channels.careers.list_openings` with `limit` and `search_term`, builds the pagination itself, marks each opening `applied` from a second `my_applications` call, posts to `recruitment.api.v1.candidate.submit_application` with only `job_opening` and `form_data` and returns `{ status, name: receipt, source: "careers" }`, and reads careers fields from `recruitment.api.v1.candidate.get_application_fields` preferring `columns` over `table_fields`; `lib/hooks/useHomeContent.ts` adds `enabled: HOME_PROMO_ENABLED`; every other file cited here is identical there; no `pw-uat` branch exists in this repo (`git ls-remote --heads origin pw-uat` printed nothing on 2026-10-31); only `develop` is described
- Author: Frontend Developer (Yashwanth). Reviewer: Code Reviewer (Yashwanth), to be recorded in the PR.
- Status: DRAFT

## 1. Purpose

This clause describes the service modules in `lib/services/` and the React Query hooks in `lib/hooks/` that are not part of onboarding (SPEC-CAND-05, SPEC-CAND-06), not part of the dashboard (SPEC-CAND-04), and not already described as the API client or the authentication client (SPEC-CAND-02, SPEC-CAND-03). Issue: PWHR-1366 (parent PWHR-1362).

The live modules fall into three shapes:

1. **`FrappeAPI` services.** `jobOffer`, `jobOpeningService`, `action-center`, `savedJobsService`, `pre-offer`, `profileService`, `home` and `survey` call one backend method through `FrappeAPI.get`/`post`/`getresourceDocumentData` and return what the client unwrapped (`lib/services/jobOffer.ts:92`, `lib/services/jobOpeningService.ts:26-29`, `lib/services/action-center.ts:5-8`, `lib/services/savedJobsService.ts:5-10`, `lib/services/pre-offer.ts:17-20`, `lib/services/profileService.ts:19-24`, `lib/services/home.ts:6-8`, `lib/services/survey.ts:6-9`).
2. **Direct-`fetch` services.** `ctc-proposal` and `direct-applicant-form` build their own request against `frappeApiBase()`, read `message` out of the body and raise `frappeErrorMessage` text on a non-OK reply (`lib/services/ctc-proposal.ts:11-26`, `lib/services/direct-applicant-form.ts:13-31`). `jobOffer.isCultureBookAvailable` and `useNonWorkingDays` also call `fetch` directly (`lib/services/jobOffer.ts:128-147`, `lib/hooks/useNonWorkingDays.ts:28-47`).
3. **Hooks.** Each hook wraps one service call in `useQuery` or `useMutation`, fixing the query key, the `enabled` gate, the stale time and which caches a mutation invalidates (`lib/hooks/useJobOffer.ts:5-12`, `lib/hooks/useCtcProposal.ts:7-27`).

Six modules are legacy: they are built into the image but no live file imports them (section 9, G1; SPEC-CAND-02 G5, PWHR-1515). They are `lib/services/email.ts`, `sso.ts`, `sync.ts`, `frappe-env.ts`, `employee-detection.ts` and `onboarding.ts`. They talk to Supabase and to a server-side Frappe client that the portal does not otherwise use. Their tests still run; this clause maps a representative test per module and lists the rest (section 10).

What the backend does with any of these calls — who may read a proposal, how a job offer is approved, what a survey is for — is in the `recruitment` app and is not described here.

## 2. Boundaries

- In: `lib/services/{jobOffer,jobOpeningService,action-center,savedJobsService,pre-offer,profileService,ctc-proposal,direct-applicant-form,home,survey,email,sso,sync,frappe-env,employee-detection,onboarding}.ts` and `lib/hooks/{useJobOffer,useJobOpening,useSavedJobs,useAcationCenter,usePreOfferForm,useCtcProposal,useDirectApplicantForm,useUpdateProfile,useChangePassword,useHomeContent,useSurvey,useDebounce,useNonWorkingDays,useExternalConsentHandoff,usePublicBranding,usePublicOpenings}.ts`.
- Out: `lib/frappe-api.ts`, `lib/frappe-base.ts`, `lib/frappe-error.ts`, `lib/services/{feature-flags,candidate-branding,auth-page-content,uploadProofFile}.ts` and `lib/hooks/useCandidateFeatureFlags.ts` are SPEC-CAND-02. `lib/auth.ts` and `lib/hooks/useAuthSettings.ts` are SPEC-CAND-03. `lib/hooks/useDashboard.ts`, `lib/services/dashboard.ts`, `lib/hooks/useApplicantStatus.ts`, `lib/services/applicantStatusService.ts` and `lib/utils/dpdp-consent.ts` are SPEC-CAND-04. `lib/services/candidate-onboarding.ts`, `link-field.ts` and the onboarding hooks are SPEC-CAND-05. Every page and component that calls these hooks is out: this clause stops at the hook's return value.
- Neighbouring clauses: SPEC-CAND-02 for how `FrappeAPI` builds a request and turns a failure into an `Error`; SPEC-CAND-04 for `lib/utils/dpdp-consent.ts`, whose helpers `useExternalConsentHandoff` calls.
- Extension points: a new backend call is a new method on an existing service object plus a hook that names a new query key.

## 3. Behaviour rules

### A1: Job offer service

- A1.1: `getJobOfferSummary`, `getJobOfferStatus` and `getRejectionReasons` are `FrappeAPI.get` calls to `recruitment.job_offer_utils.get_job_offer_summary`, `.get_job_offer_status` and `.get_rejection_reasons`; the first two send `{ appl }` and add `token` only when one is passed, the third sends no parameters at all (`lib/services/jobOffer.ts:87-97`). [CAND-07-A1.1A] [CAND-07-A1.1B] [CAND-07-A1.1C]
- A1.2: `updateJobOfferStatus` posts the whole parameter object to `recruitment.job_offer_utils.job_offer_update`; `getConsentForm` gets `recruitment.recruitment.doctype.dpdp_act_settings.dpdp_act_settings.get_consent_form` with `appl` and `token`; `submitConsent` posts the payload to `recruitment.dpdp_consent.submit_dpdp_consent`; `startConsentSession` posts `{ appl }` plus `token` when present to `recruitment.dpdp_external_consent.start_consent_session`; `getConsentSessionStatus` gets `recruitment.dpdp_external_consent.get_consent_session_status` the same way (`lib/services/jobOffer.ts:149-215`). [CAND-07-A1.2A] [CAND-07-A1.2B] [CAND-07-A1.2C] [CAND-07-A1.2D] [CAND-07-A1.2E] [CAND-07-A1.2F]
- A1.3: `getJobOfferPdfUrl` and `getCultureBookPdfUrl` return a URL string and make no request: `<frappeApiBase()>/api/method/recruitment.job_offer_utils.download_job_offer_pdf` and `.preview_culture_book`, with `appl` and an optional `token` encoded by `URLSearchParams` (`lib/services/jobOffer.ts:99-117`). [CAND-07-A1.3A] [CAND-07-A1.3B] [CAND-07-A1.3C]
- A1.4: `isCultureBookAvailable` returns false for an empty `appl` without a request; otherwise it `fetch`es the preview URL with credentials, returns false and cancels the body when the reply is not OK, returns true and cancels the body when the content type does not contain `application/json`, and otherwise reads the JSON and returns false only when `message.available` is exactly `false`; any thrown error gives false (`lib/services/jobOffer.ts:128-147`). [CAND-07-A1.4A] [CAND-07-A1.4B] [CAND-07-A1.4C] [CAND-07-A1.4D]
- A1.5: `getJobOfferLetters` gets `recruitment.job_offer_utils.download_job_offer_pdf` with `{ appl, separate: "1" }` plus the optional token — the same method as the PDF URL, asked for as JSON (`lib/services/jobOffer.ts:224-230`). [CAND-07-A1.5A]
- A1.6: No method of this service catches a `FrappeAPI` failure; the rejection reaches the caller (`lib/services/jobOffer.ts:87-92`). [CAND-07-A1.6A]

### A2: Job offer hooks

- A2.1: `useJobOfferSummary`, `useCultureBookAvailability` and `useJobOfferLetters` key on `["<name>", appl, token]`, run only when `appl` is non-empty and the `enabled` argument is true, and keep an answer fresh for five minutes (`lib/hooks/useJobOffer.ts:5-12,34-50`). [CAND-07-A2.1A] [CAND-07-A2.1C]
- A2.2: `useJobOfferPdf` and `useCultureBookPdf` issue no query at all: they return `{ pdfUrl, isLoading: false, error: null }`, where `pdfUrl` is the service's URL when `appl` is non-empty and `enabled` is true, and otherwise the falsy left-hand value of the conditional — `null` for a disabled hook and `""` for an empty `appl` (`lib/hooks/useJobOffer.ts:19-27`). [CAND-07-A2.1B] [CAND-07-A2.3C]
- A2.3: `useJobOfferStatus` keys on `["jobOfferStatus", appl, token]` with a one-minute stale time and no `enabled` argument; `useRejectionReasons` keys on `["rejectionReasons"]` with a one-hour stale time and no gate; `useConsentForm` keys on `["consentForm", appl, token]`, needs both, and is fresh for ten minutes (`lib/hooks/useJobOffer.ts:68-91`). [CAND-07-A2.3A] [CAND-07-A2.3B] [CAND-07-A2.3D] [CAND-07-A2.3E]
- A2.4: `useUpdateJobOfferStatus` writes `{ status }` straight into the cache at `["jobOfferStatus", appl, token]` and then invalidates `["dashboard"]`; `useSubmitConsent` has no `onSuccess` and invalidates nothing (`lib/hooks/useJobOffer.ts:52-66,94-98`). [CAND-07-A2.4A] [CAND-07-A2.4B]
- A2.5: `useStartConsentSession` sets `retry: false`, so a failed `start_consent_session` is attempted exactly once (`lib/hooks/useJobOffer.ts:110-116`). [CAND-07-A2.2A]
- A2.6: `useConsentSessionStatus` keys on `["consentSessionStatus", appl, token]`, sets `staleTime: 0`, refetches every `CONSENT_STATUS_POLL_MS` (3000 ms) while the last answer has no `consent_given`, stops polling once it does, and never polls in a background tab (`lib/hooks/useJobOffer.ts:101,125-148`). [CAND-07-A2.2B]
- A2.7: Its query function invalidates `["dashboard"]` inside the fetch, as soon as an answer says `consent_given` (`lib/hooks/useJobOffer.ts:134-140`). [CAND-07-A2.2C]

### A3: External consent hand-off

- A3.1: `useExternalConsentHandoff(appl, token).handoff(preIssuedUrl)` clears its failed flag, then navigates away at once when `navigateToExternalConsent` accepts the pre-issued URL, and in that case starts no session (`lib/hooks/useExternalConsentHandoff.ts:33-35`). [CAND-07-A3.1A]
- A3.2: Otherwise it awaits `startConsentSession({ appl, token })`; when the reply says `already_consented` it resolves the onward URL and either assigns `window.location` for an absolute URL or pushes the router for the in-app path, and returns true (`lib/hooks/useExternalConsentHandoff.ts:38-52`). [CAND-07-A3.1C] [CAND-07-A3.1D]
- A3.3: When the reply is not `already_consented` it tries to navigate to `session.consent_url` and returns true if that URL is usable (`lib/hooks/useExternalConsentHandoff.ts:54`). [CAND-07-A3.1B]
- A3.4: A thrown session call is swallowed; in that case, and when no URL was usable, it sets `failed` true and returns false without navigating (`lib/hooks/useExternalConsentHandoff.ts:55-60`). [CAND-07-A3.1E]

### A4: CTC proposal and direct applicant form

- A4.1: Both services pick their endpoint from the access object: a `token` means the emailed, logged-out endpoints (`get_proposal`, `respond`, `get_form`, `search_link`, `upload_file`, `submit_form`) with the token in `t`; a name means the session endpoints (`get_my_proposal`, `respond_my_proposal`, `get_my_form`, `search_my_link`, `upload_my_file`, `submit_my_form`) with the name in `proposal` or `request` (`lib/services/ctc-proposal.ts:37-48`, `lib/services/direct-applicant-form.ts:41-79`). [CAND-07-A4.1A] [CAND-07-A4.1B] [CAND-07-A4.2A] [CAND-07-A4.2B] [CAND-07-A4.2E]
- A4.2: Both request helpers send `credentials: "include"` and `Accept: application/json`, parse the body as JSON, swallow a body that is not JSON, throw `frappeErrorMessage(body, "Something went wrong. Please try again.")` when the reply is not OK, and otherwise return the body's `message` field (`lib/services/ctc-proposal.ts:11-26`, `lib/services/direct-applicant-form.ts:13-31`). [CAND-07-A4.1C] [CAND-07-A4.2F]
- A4.3: `submit` sends the answers twice-encoded: a JSON body whose `data` field is itself the JSON string of the answers (`lib/services/direct-applicant-form.ts:74-79`, `lib/services/ctc-proposal.ts:43-48`). [CAND-07-A4.2C]
- A4.4: `uploadFile` sends `FormData` with the access parameter, `fieldname`, an optional `child_fieldname` and the file, and sets no content type of its own (`lib/services/direct-applicant-form.ts:64-71`). [CAND-07-A4.2D]
- A4.5: `searchLink` is a GET whose query carries the access parameter, `fieldname`, `txt` and `child_fieldname` only when a child column was named (`lib/services/direct-applicant-form.ts:55-62`). [CAND-07-A4.2A]
- A4.6: `proposalAccessKey` and `accessKey` prefer the token over the record name and are `""` when neither is set; the hooks use that value as the second element of the query key and as the `enabled` gate (`lib/services/ctc-proposal.ts:35`, `lib/services/direct-applicant-form.ts:47`, `lib/hooks/useCtcProposal.ts:5-11`, `lib/hooks/useDirectApplicantForm.ts:4-10`). [CAND-07-A4.1D] [CAND-07-A4.3A]
- A4.7: Both read hooks set `retry: false` and `refetchOnWindowFocus: false` (`lib/hooks/useCtcProposal.ts:12-13`, `lib/hooks/useDirectApplicantForm.ts:11-12`). [CAND-07-A4.3A]
- A4.8: Both mutations return the invalidation promise from `onSuccess`, so the mutation stays pending until `["ctc-proposal", key]` or `["direct-applicant-form", key]` and `["action-center"]` have both been invalidated (`lib/hooks/useCtcProposal.ts:22-26`, `lib/hooks/useDirectApplicantForm.ts:21-25`). [CAND-07-A4.3B] [CAND-07-A4.3C]

### A5: Pre-offer form

- A5.1: `getPreOfferForm` gets `recruitment.api.channels.pre_offer.get_application_fields`, sending `job_applicant` only when an e-mail was passed, and throws `Failed to fetch pre-offer form: Response is not a valid list of fields` when the reply is not an array (`lib/services/pre-offer.ts:11-27`). [CAND-07-A5.1B] [CAND-07-A5.3A] [CAND-07-A5.3B]
- A5.2: `getPreOfferFormState` returns `{ filled: false, filled_at: null, rejected_fields: [] }` without a request when no applicant is named, and falls back to the same object when the backend answers nothing (`lib/services/pre-offer.ts:34-39`). [CAND-07-A5.1A]
- A5.3: `submitPreOffer` throws `Job applicant is required` without a request when the applicant is empty, and otherwise posts `{ job_applicant, data: JSON.stringify(data) }` to `recruitment.api.channels.pre_offer.submit_application` (`lib/services/pre-offer.ts:42-47`). [CAND-07-A5.1B] [CAND-07-A5.3D]
- A5.4: `transformPreOfferField` takes the field name from `reference_name`, else `fieldname`, else `""`; the label from `display_name`, else `label`, else the field name; the child rows from `child_fields`, else `table_fields`; and derives `read_only` from `editability !== "Editable"` and `hidden` from `visibility === "Hidden"` only when the explicit numeric flags are absent (`lib/services/pre-offer.ts:51-72`). [CAND-07-A5.1C] [CAND-07-A5.3C]
- A5.5: `transformPreOfferForm` reads the form status from a field named `pre_offer_form_status` or `status` (its `value`, else its `default`, else `Sent`), leaves that field out of the rendered fields, and groups every other field into one tab per `section`, defaulting to `Basic Details`, each with a single section called `Details`… no: `section` named after the tab (`lib/services/pre-offer.ts:74-115`). [CAND-07-A5.1D]
- A5.6: `usePreOfferForm` keys on `["pre-offer-form", { userEmail }]` — an object, not a string — with a one-minute stale time and no `enabled` gate, so it runs with an empty e-mail too; `usePreOfferFormState` keys on `["pre-offer-form-state", jobApplicant]` and waits for an applicant (`lib/hooks/usePreOfferForm.ts:5-23`). [CAND-07-A5.2A]
- A5.7: `useSubmitPreOffer` invalidates both of those keys, rebuilding the object key from the submitted applicant (`lib/hooks/usePreOfferForm.ts:29-36`). [CAND-07-A5.2B]

### A6: Profile and survey

- A6.1: `updateProfile` posts `{ data }` — the fields nested one level down — to `recruitment.api.candidate_auth.update_me`, while `changePassword` posts the three password fields at the top level to `recruitment.api.candidate_auth.change_password` (`lib/services/profileService.ts:16-42`). [CAND-07-A6.1A]
- A6.2: Both catch, log to `console.error` and rethrow; nothing is swallowed (`lib/services/profileService.ts:25-28,38-41`). [CAND-07-A6.1B]
- A6.3: `useUpdateProfile` awaits `refreshProfile()` from the auth context after a successful update and logs an error otherwise; `useChangePassword` only logs an error and refreshes nothing (`lib/hooks/useUpdateProfile.ts:8-17`, `lib/hooks/useChangePassword.ts:5-12`). [CAND-07-A6.3A]
- A6.4: `surveyService.getPostLoginRoute` gets `recruitment.api.candidate_portal_survey.get_post_login_route` with no parameters; `submitSurvey` posts the payload unchanged to `.submit_survey` (`lib/services/survey.ts:4-16`). [CAND-07-A6.2A]
- A6.5: `useSurvey` keys on `["post-login-route"]` with a ten-minute stale time and no gate; `useSubmitSurvey` is a bare mutation with no cache work (`lib/hooks/useSurvey.ts:5-16`). [CAND-07-A7.1B]

### A7: Cached content and public queries

- A7.1: `homeService.getHomeContent` gets `recruitment.api.candidate_home.get_home_content` with no parameters (`lib/services/home.ts:4-9`). [CAND-07-A7.1C]
- A7.2: `useHomeContent` keys on `["home-content"]`, keeps the answer fresh for one hour and sets `retry: false`, so a failure is attempted once (`lib/hooks/useHomeContent.ts:4-10`). [CAND-07-A7.1A]
- A7.3: `usePublicBranding` fetches the Next route `/api/public/branding` with `cache: "no-store"`, returns `{}` for a non-OK reply, otherwise the body's `branding` field or `{}`, keys on `["public-branding"]` and is fresh for ten minutes (`lib/hooks/usePublicBranding.ts:4-21`). [CAND-07-A7.2A]
- A7.4: `usePublicOpenings` fetches `/api/public/openings`, throws `Could not load open jobs` on a non-OK reply, otherwise returns the body's `openings` field, keys on `["public-openings"]` and is fresh for five minutes (`lib/hooks/usePublicOpenings.ts:4-17`). [CAND-07-A7.2B]

### A8: Plain hooks

- A8.1: `useDebounce(value, delay)` returns the first value at once and a later value only after `delay` milliseconds pass with no further change; each change clears the previous timer (`lib/hooks/useDebounce.ts:3-16`). [CAND-07-A8.1A]
- A8.2: `JOINING_DAY_FIELDS` names the six joining-date fields the non-working-day rule covers (`lib/hooks/useNonWorkingDays.ts:17-24`). [CAND-07-A8.2A]
- A8.3: `useNonWorkingDays(enabled)` returns `[]` while loading, when disabled, when nothing is configured and when the lookup fails; the request goes to `<frappeApiBase()>/api/method/recruitment.api.joining_day.get_my_non_working_days` with credentials, is made at most once per module load because the promise is cached in a module variable, and a non-OK reply or a thrown error yields `[]` (`lib/hooks/useNonWorkingDays.ts:26-74`). [CAND-07-A8.2B]

### A9: Job opening, saved job and action centre services

- A9.1: `JobOpeningService.getJobOpening` gets `recruitment.api.channels.careers.list_openings` with `page` and `limit` as strings, adding `search_term` and `email` only when they are truthy; `getCampusInviteOpenings` gets `recruitment.api.channels.campus.get_invite_openings` with `campus_invite` and an optional `email` (`lib/services/jobOpeningService.ts:10-45`). [CAND-07-A9.1D] [CAND-07-A9.3A] [CAND-07-A9.3B] [CAND-07-A9.3C]
- A9.2: `jobApplicationService.submitApplication` posts to `recruitment.api.channels.campus.submit_invite_application` with four renamed fields only when the payload has both `isCampus` and `campus_invite`; otherwise it posts the whole payload to `recruitment.api.channels.careers.submit_application` (`lib/services/jobOpeningService.ts:73-97`). [CAND-07-A9.1C] [CAND-07-A9.3D] [CAND-07-A9.3E]
- A9.3: `getJobApplicationForm` picks the campus or careers `get_application_fields` method from `isCampus`, sends `opening` when a job is named and `email`/`campus_invite` only in the campus case, and renames every returned field into the form shape; any error is logged as `API ERROR:` and answered with `{ fields: [] }` (`lib/services/jobOpeningService.ts:99-138`). [CAND-07-A9.1A] [CAND-07-A9.1B] [CAND-07-A9.3G]
- A9.4: `draftJobApplicantService.getAllDrafts` gets `recruitment.api.channels.careers.get_draft` with `job_applicant_email`; `deleteDraftJobApplicant` posts `job_applicant_email` and `job_opening` to `.delete_draft` (`lib/services/jobOpeningService.ts:47-72`). [CAND-07-A9.3F]
- A9.5: `ActionCenterDataService.getActionCenterData` gets `recruitment.api.action_center.get_action_center_items` with `candidate_email` (`lib/services/action-center.ts:4-9`). [CAND-07-A9.4A]
- A9.6: `ActionCenterMyRequestService` reads the Candidate Raise Request resource with the doctype spelled `Candidate%20Raise%20Request` — already percent-encoded before `FrappeAPI` builds the URL — asking for all fields filtered on `candidate_email`, and returns only the reply's `data` field; `CandidateRaiseRequestService` posts a new request with the unencoded doctype and also returns `data` (`lib/services/action-center.ts:12-34`). [CAND-07-A9.2A] [CAND-07-A9.4B]
- A9.7: `SavedJobsService.getSavedJobs` gets `recruitment.api.channels.careers.get_saved_job_openings` with `candidate_email`; `toggleSavedJob` posts `candidate_email` and `job_opening` to `.toggle_saved_job_opening` (`lib/services/savedJobsService.ts:3-23`). [CAND-07-A9.5A] [CAND-07-A9.5B]

### A10: Job opening, saved job and action centre hooks

- A10.1: `useJobOpening` keys on `["job-opening", page, limit, searchTerm, email, campusInvite]` and runs unless `enabled` is explicitly false (`lib/hooks/useJobOpening.ts:26,49`). [CAND-07-A10.1A]
- A10.2: With a `campusInvite` it calls the campus method instead, copies `name` from `job_opening` for every opening, and builds a single-page `pagination` object whose `limit` is the opening count or 10 when there are none (`lib/hooks/useJobOpening.ts:28-46`). [CAND-07-A10.1B] [CAND-07-A10.3A]
- A10.3: `useCreateJobApplicant` invalidates `["job-opening"]` on success and logs an error otherwise; `useDeleteDraftJobApplicant` only logs, on both paths; `useGetAllDrafts` keys on `["all-drafts", email]`, waits for an e-mail and sets `retry: false`; `useJobApplicationForm` keys on six values including an unused `form_name` and has no gate, so it runs with no job named (`lib/hooks/useJobOpening.ts:53-89`). [CAND-07-A10.3B] [CAND-07-A10.3C] [CAND-07-A10.3D] [CAND-07-A10.3E] [CAND-07-A10.3F]
- A10.4: `useGetSavedJobs` keys on `["saved-jobs", email]`, waits for an e-mail and sets `retry: false`; `useToggleSavedJob` invalidates `["saved-jobs", email]` and `["job-opening"]` (`lib/hooks/useSavedJobs.ts:4-22`). [CAND-07-A10.2A] [CAND-07-A10.2B] [CAND-07-A10.2C]
- A10.5: `useActionCenter` keys on `["action-center", userEmail]` with no gate; `useActionCenterMyRequest` keys on `["action-center-my-request", page, limit, userEmail]` and waits for an e-mail; `useCandidateRaiseRequest` only logs on success and on error (`lib/hooks/useAcationCenter.ts:6-37`). (Section 10: existing tests cover these three and are not mapped here.)

### A11: Legacy modules

These modules have no importer in `app/`, `lib/` or `components/` outside the legacy set itself (G1). They are described, not live.

- A11.1: `FrappeClient.request` builds `<frappe_url without a trailing slash><endpoint>` with the `params` appended, sends an `Authorization: token <key>:<secret>` header when both API credentials are set, else a bearer of a session id, else logs in with username and password first; a 401 or 403 becomes `FrappeAuthError`, any other non-OK status becomes `FrappeApiError` carrying the status and the body text, and every call aborts after `timeout` milliseconds (default 30000) (`lib/services/frappe-env.ts:30-117`). [CAND-07-A11.1A] [CAND-07-A11.1B]
- A11.2: `FrappeEnvironmentManager.getActiveConfig` reads the active row of the Supabase table `frappe_environments`, caches it for five minutes and falls back to `FRAPPE_BASE_URL` and the four `FRAPPE_*` credential variables, throwing when no URL is configured (`lib/services/frappe-env.ts:249-300`). [CAND-07-A11.1C]
- A11.3: `FrappeSyncService.syncAll` runs the job, application and company syncs one after another and adds their counts into one summary (`lib/services/sync.ts:546-574`). [CAND-07-A11.2A]
- A11.4: `FrappeSSOProvider.generateAuthUrl` builds a `frappe.integrations.oauth2.authorize` URL with the client id, redirect URI, `response_type=code`, the scope `openid email profile` and the caller's state (`lib/services/sso.ts:31-40`). [CAND-07-A11.3A]
- A11.5: `EmailService.sendBulkEmails` sends each message in turn, counts sent and failed, logs and counts a thrown message as failed, and waits `delayMs` between messages when that is above zero (`lib/services/email.ts:215-257`). [CAND-07-A11.4A]
- A11.6: `InternalEmployeeDetector.detectInternal` tries the Supabase `company_domains` table first and falls back to a Frappe Employee lookup, which is skipped silently when Frappe is unreachable (`lib/services/employee-detection.ts:18-59`). [CAND-07-A11.5A]
- A11.7: `OnboardingService.submitForReview` throws `No onboarding data found` with no record, and `Missing required steps: <names>` listing every one of the seven required steps that holds no data (`lib/services/onboarding.ts:47-67`). [CAND-07-A11.6A]

## 4. Data and permissions

- These services send the candidate's e-mail or application id, the record name or link token, form answers, uploaded files, a password change and survey answers; they receive the backend's own objects and pass them to the caller unchanged (`lib/services/jobOffer.ts:87-92`, `lib/services/direct-applicant-form.ts:49-79`, `lib/services/profileService.ts:31-42`).
- Every live call is identified either by the session cookie (`credentials: "include"`) or by a link token in a query parameter (`lib/services/ctc-proposal.ts:13-17`, `lib/services/direct-applicant-form.ts:16-20`). Who may read a proposal, a form or an offer is decided by the backend and is not in this repo.
- The link token travels in the URL query for every token-mode call, including the PDF and culture-book URLs that end up in an `<img>`/`<iframe>` source (`lib/services/jobOffer.ts:99-116`, `lib/services/direct-applicant-form.ts:43`). See section 8.
- `profileService.changePassword` sends the current and new password in a POST body, never in the URL (`lib/services/profileService.ts:33-37`).
- No module in this clause writes to `localStorage`, `sessionStorage` or a cookie; the only client-side state is the React Query cache and the module-level promise in `useNonWorkingDays` (`lib/hooks/useNonWorkingDays.ts:26`).
- The legacy modules read and write Supabase tables `frappe_environments`, `sso_providers`, `company_domains`, `profiles`, `onboarding_data`, `jobs`, `applications` and `companies`, and read `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`, `FRAPPE_USERNAME`, `FRAPPE_PASSWORD` and the `SMTP_*` variables (`lib/services/frappe-env.ts:259-301`, `lib/services/sso.ts:92-114`, `lib/services/employee-detection.ts:22-27`, `lib/services/onboarding.ts:14-21`, `lib/services/email.ts:87-99`). Those variables are inventoried in SPEC-CAND-02 section 6.
- Statutory source: not applicable. The DPDP consent text, its wording and the consent record itself come from the backend; this clause only moves a URL and a session id (`lib/services/jobOffer.ts:166-215`). The data-protection rule behind that flow is described where the consent decision lives, SPEC-CAND-04.

## 5. Errors and edge behaviour

- A `FrappeAPI` failure reaches the caller as the `Error` SPEC-CAND-02 describes; no service in A1, A5, A6, A7 or A9 catches it, except `getJobApplicationForm`, which logs and answers `{ fields: [] }` (`lib/services/jobOpeningService.ts:134-137`).
- The two direct-`fetch` services turn a non-OK reply into `new Error(frappeErrorMessage(body, "Something went wrong. Please try again."))`; a body that is not JSON leaves `body` as `{}`, so such a failure carries only the fallback text (`lib/services/ctc-proposal.ts:18-24`, `lib/services/direct-applicant-form.ts:21-29`).
- `isCultureBookAvailable` and `useNonWorkingDays` swallow every failure and answer `false` / `[]`; the candidate sees a missing feature rather than an error (`lib/services/jobOffer.ts:144-146`, `lib/hooks/useNonWorkingDays.ts:44`).
- `useExternalConsentHandoff` swallows a thrown session call and reports `failed` instead, so the caller can offer a retry (`lib/hooks/useExternalConsentHandoff.ts:55-60`).
- `useCreateJobApplicant`, `useDeleteDraftJobApplicant` and `useCandidateRaiseRequest` handle a failure only by writing to the console; nothing reaches the user from the hook (`lib/hooks/useJobOpening.ts:59,76`, `lib/hooks/useAcationCenter.ts:33-35`).
- `useCtcProposal`, `useDirectApplicantForm`, `useGetAllDrafts`, `useGetSavedJobs` and `useHomeContent` set `retry: false`, so one failure is final until something invalidates the key (`lib/hooks/useCtcProposal.ts:12`, `lib/hooks/useDirectApplicantForm.ts:11`, `lib/hooks/useJobOpening.ts:69`, `lib/hooks/useSavedJobs.ts:9`, `lib/hooks/useHomeContent.ts:9`).
- `useJobOfferPdf("")` returns `pdfUrl: ""`, not `null`, because the conditional yields the empty `appl` itself; the documented guard is only exact for a non-empty string (`lib/hooks/useJobOffer.ts:20`). Section 9, G4.
- `usePreOfferForm` has no `enabled` gate, so it asks for the form with an empty e-mail and relies on the backend to answer (`lib/hooks/usePreOfferForm.ts:5-11`).
- `useJobApplicationForm` likewise has no gate and runs with `job_opening` undefined (`lib/hooks/useJobOpening.ts:81-89`).
- `getPreOfferForm` is the only service here that validates the reply's shape before using it (`lib/services/pre-offer.ts:23-25`).

## 6. Configuration

- `NEXT_PUBLIC_FRAPPE_URL` and `FRAPPE_BASE_URL` decide the base URL of every direct `fetch` through `frappeApiBase()` (SPEC-CAND-02); the `FrappeAPI` services inherit the same base (`lib/services/ctc-proposal.ts:13`, `lib/services/jobOffer.ts:107`).
- `CONSENT_STATUS_POLL_MS` is the only tunable constant in this clause: 3000 ms, exported and read by the return page (`lib/hooks/useJobOffer.ts:101,146`).
- Stale times are constants in the hook files: five minutes for the offer summary, availability and letters, one minute for the offer status and the pre-offer form, ten minutes for the consent form, the post-login route and public branding, one hour for the rejection reasons and the home content, five minutes for public openings, and zero for the consent status (`lib/hooks/useJobOffer.ts:10,39,48,73,81,90,144`, `lib/hooks/usePreOfferForm.ts:9`, `lib/hooks/useSurvey.ts:9`, `lib/hooks/useHomeContent.ts:8`, `lib/hooks/usePublicBranding.ts:20`, `lib/hooks/usePublicOpenings.ts:16`).
- The legacy modules read `FRAPPE_BASE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`, `FRAPPE_USERNAME`, `FRAPPE_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` and `FROM_NAME`, with defaults for the mail host, port and sender (`lib/services/frappe-env.ts:286-299`, `lib/services/email.ts:87-99`). The same list is in SPEC-CAND-02 section 6.
- No feature flag gates any module in this clause at `Described at`; on the deployment branch `useHomeContent` gains `enabled: HOME_PROMO_ENABLED` (header).

## 7. Scheduled jobs, hooks and patches

No cron, queue or server-side schedule exists in this repo. Two timed behaviours run in the browser:

- `useConsentSessionStatus` polls every 3000 ms until `consent_given` turns true (`lib/hooks/useJobOffer.ts:145-147`).
- `useDebounce` holds a `setTimeout` per value change and clears it on the next change or on unmount (`lib/hooks/useDebounce.ts:6-14`).

`useNonWorkingDays` runs its fetch once per module load through a module-level promise, not on a schedule (`lib/hooks/useNonWorkingDays.ts:26-47`). The legacy `FrappeSyncService` is a manual batch run with no scheduler in this repo (`lib/services/sync.ts:546-574`).

## 8. Static security and performance observations

- Security: link tokens travel in the URL query of every token-mode call, including the offer PDF and culture-book URLs that a browser loads as a document source, so the token can reach the referer header, the browser history and any proxy log (`lib/services/jobOffer.ts:104-116`, `lib/services/direct-applicant-form.ts:43`, `lib/services/ctc-proposal.ts:12-13`).
- Security: `useExternalConsentHandoff` sends the candidate to a backend-supplied URL; `isSafeExternalConsentUrl` accepts any absolute `http:` or `https:` URL, so the backend chooses the destination host without an allowlist in this repo (`lib/hooks/useExternalConsentHandoff.ts:35,54`, `lib/utils/dpdp-consent.ts:48-56`). The validation itself is SPEC-CAND-04.
- Security: no module here writes to `localStorage`, `sessionStorage` or a cookie (`lib/hooks/useJobOffer.ts:5-149`).
- Security: `jobApplicationService.getJobApplicationForm` logs the whole error object to the console, which in a browser puts the backend's message into the devtools log (`lib/services/jobOpeningService.ts:135`).
- Security: `ActionCenterMyRequestService` passes a pre-encoded doctype into `FrappeAPI.getresourceDocumentData`, which builds the URL by interpolation; an un-encoded value would be interpolated as given (`lib/services/action-center.ts:14`, `lib/frappe-api.ts:158`).
- Security: file uploads here go through `directApplicantFormService.uploadFile`, which sends the `File` as-is with no type or size check in the client; what is accepted is decided by `recruitment.api.direct_applicant_portal.upload_my_file` (`lib/services/direct-applicant-form.ts:64-71`).
- Security (legacy): `FrappeClient` puts the API key and secret in an `Authorization` header and, without them, posts the username and password to `/api/method/login` and keeps the returned `sid` in memory (`lib/services/frappe-env.ts:40-45,55-76`).
- Performance: `useConsentSessionStatus` issues one request every three seconds for as long as the return page is open and consent has not landed; it does stop in a background tab (`lib/hooks/useJobOffer.ts:145-147`).
- Performance: `isCultureBookAvailable` cancels the PDF body instead of reading it, so the probe costs the headers only (`lib/services/jobOffer.ts:134,139`).
- Performance: `useNonWorkingDays` shares one in-flight promise across every field on a form, so several date pickers make one request (`lib/hooks/useNonWorkingDays.ts:26-46`).
- Performance: `useJobOfferPdf` and `useCultureBookPdf` rebuild the URL string on every render; no query, no memo (`lib/hooks/useJobOffer.ts:19-27`).
- Performance: `usePreOfferForm` and `useJobApplicationForm` run without an `enabled` gate, so a page that mounts them before it knows the applicant or the job issues a request that is thrown away (`lib/hooks/usePreOfferForm.ts:5-11`, `lib/hooks/useJobOpening.ts:81-89`).
- Performance (legacy): `FrappeSyncService` loops over every fetched record and issues at least one Supabase query per record inside the loop (`lib/services/sync.ts:112-254`).

## 9. Known gaps / open questions

- G1: The six legacy modules have no importer outside the legacy set. A script that read every `from "…"`, `import("…")` and `require("…")` specifier in 234 files under `app/`, `lib/`, `components/`, `types/`, `middleware.ts` and `next.config.mjs` at `Described at` found zero importers of `lib/services/email.ts`, `lib/services/sso.ts`, `lib/services/sync.ts`, `lib/services/employee-detection.ts` and `lib/services/onboarding.ts`, and three importers of `lib/services/frappe-env.ts` — `lib/services/employee-detection.ts:2`, `lib/services/onboarding.ts:2` and `lib/services/sync.ts:3`, all legacy themselves. Issue: PWHR-1515 (SPEC-CAND-02 G5).
- G2: `useJobOfferPdf("")` and `useCultureBookPdf("")` return `pdfUrl: ""` rather than `null`, because the guard is `appl && enabled ? … : null` and an empty string short-circuits to itself (`lib/hooks/useJobOffer.ts:20,25`). A caller that checks `pdfUrl !== null` would treat the empty string as a URL. Issue: PWHR-1553.
- G3: `ActionCenterMyRequestService` names the doctype `Candidate%20Raise%20Request` while `CandidateRaiseRequestService` names the same doctype `Candidate Raise Request`; `FrappeAPI.getresourceDocumentData` interpolates the value into the URL without encoding it, so only the first spelling survives in a GET URL and the two paths disagree (`lib/services/action-center.ts:14,28`, `lib/frappe-api.ts:158`). Issue: PWHR-1554.
- G4: `useJobOpening`'s campus branch builds `pagination.limit` as `openings.length || 10`, so the page size reported to the UI is the row count rather than the requested limit, and 10 when the invite lists nothing (`lib/hooks/useJobOpening.ts:40`). Issue: PWHR-1555.
- G5: `useJobApplicationForm` takes a `form_name` argument that is only ever placed in the query key; nothing reads it, and no caller passes a meaningful value (`lib/hooks/useJobOpening.ts:81-83`). Not filed: dead parameter.
- G6: `usePreOfferForm` keys on an object (`{ userEmail }`) rather than a string, so the key only matches another object with the same shape; `useSubmitPreOffer` rebuilds that object to invalidate it (`lib/hooks/usePreOfferForm.ts:7,31`). It works, but a caller that invalidates `["pre-offer-form", email]` would miss. Not filed: no defect asserted.
- G7: `useCultureBookPdf` has no caller in `app/` or `components/` at `Described at`; a grep for `useCultureBookPdf` over the tree found it only in its own module and the hook's export list. Not filed: dead export.
- G8: `jobOfferService.getJobOfferLetters` and `getJobOfferPdfUrl` call the same backend method, one as JSON and one as a document URL; whether the backend distinguishes them only by the `separate` parameter is a backend fact not read (`lib/services/jobOffer.ts:107,224-230`). Not filed: backend question.
- G9: The hook file is named `useAcationCenter.ts` — a misspelling of "action" — while every export inside spells it correctly (`lib/hooks/useAcationCenter.ts:1`). Not filed: naming only.
- G10: Branch drift: on `deploy/hybrowbase-candidate-20261025` the careers list, submit and field endpoints move to `recruitment.api.v1.candidate.*` with different parameter names and a client-built pagination, and `useHomeContent` is gated by a milestone flag (header). The existing tests in `tests/lib/services/jobOpeningService.test.ts` assert the `develop` endpoints, so they describe only `develop`. Issue: PWHR-1556.
- G11: Every case here stubs `fetch`, `FrappeAPI`, the router or the service module; none talks to a real Frappe site or a real Supabase project. Hosted CI is UNVERIFIED.
- Statutory source: not applicable.

## 10. Uncovered behaviour

Counts were taken with `grep -c -E '^\s*(it|test)\('` over each file at `Described at`.

- `tests/lib/services/jobOffer.test.ts` (15 tests): 12 are mapped; the three unmapped ones (`getJobOfferSummary calls FrappeAPI.get`, `getJobOfferStatus calls FrappeAPI.get`, `updateJobOfferStatus calls FrappeAPI.post`) are the no-token twins of mapped cases. Not mapped; same behaviour class.
- `tests/lib/hooks/useJobOffer.test.tsx` (11 tests): 7 are mapped; the four unmapped ones (`useJobOfferSummary fetches data correctly`, `useJobOfferStatus fetches data correctly`, `useJobOfferPdf returns a URL string when appl and enabled are set`, `useJobOfferPdf forwards the token parameter when provided`) are no-token or URL-forwarding twins. Not mapped; same behaviour class.
- A2.1 and A2.3 stale times: the existing hook tests read no caching option; CAND-07-A2.1A and CAND-07-A2.1C pin the five-minute values, and the one-minute, one-hour and ten-minute values of A2.3 are asserted by no test. Not filed: framework config.
- `tests/lib/services/jobOpeningService.test.ts` (7 tests) and `tests/lib/hooks/useJobOpening.test.tsx` (9 tests): every test is mapped except `useJobOpening fetches data correctly`, `useJobOpening fetches data with search term correctly` and `useJobApplicationForm fetches form correctly`, which are parameter twins of mapped cases. Not mapped; same behaviour class.
- `tests/components/action-center/Useactioncenter.test.tsx` (8 tests) covers A10.5 — the three action-centre hooks, their query keys and their error paths — and is not mapped here because the file sits under `tests/components/` and belongs to the action-centre component pass. Not filed: PWHR-1368 can map it.
- A9.5 and A9.6, the action-centre services: `tests/lib/services/action-center.test.ts` has 3 tests, 2 of them mapped; the third (`getActionCenterMyRequestService calls FrappeAPI.getresourceDocumentData correctly`) is superseded by the characterization case CAND-07-A9.2A, which asserts the same call plus the return value. Not mapped; same behaviour class.
- A4.1 to A4.8 for `ctc-proposal`: no test file exists for `lib/services/ctc-proposal.ts` or `lib/hooks/useCtcProposal.ts` at `Described at`; `tests/components/ctc-proposal/CtcProposalView.test.tsx` mocks the service. The cases here are all characterization. Not filed: covered by the new cases.
- A5.5, the `default` fallback of the pre-offer status field and a form with no status field at all: CAND-07-A5.1D pins the `value` path only. Not filed: no test written.
- A8.1, `useDebounce` with a changing `delay`: the case changes the value only. Not filed: no test written.
- A8.3, a non-OK reply or a rejected fetch in `useNonWorkingDays`: the module-level promise cache makes a second outcome unreachable inside one test file, so CAND-07-A8.2B pins the success path and the disabled path only. Not filed: module-level state.
- `tests/lib/services/frappe-env.test.ts` (27 tests): 3 are mapped (A11.1, A11.2). The remaining 24 cover `FrappeClient.ping`, `getJobOpenings`, `createJobApplicant`, `createUser`, `createEmployee`, `checkEmployeeExists`, query and body building, the trailing-slash rule, the two error classes, and the manager's `switchEnvironment`, `testConnection`, `listEnvironments` and `seedLocalEnv`. Not mapped: legacy module, see G1.
- `tests/lib/services/sync.test.ts` (6 tests): 1 is mapped. The other 5 cover `syncJobs`, `syncApplications`, `syncCompanies` and both `testConnection` paths. Not mapped: legacy module, see G1.
- `tests/lib/services/sso.test.ts` (5 tests): 1 is mapped. The other 4 cover `handleCallback`, `getProvider`, `createOrLinkUser` and `validateEmailDomain`. Not mapped: legacy module, see G1.
- `tests/lib/services/email.test.ts` (9 tests): 1 is mapped. The other 8 cover `sendEmail`, `verifyConnection`, the four template senders and the bulk success path. Not mapped: legacy module, see G1.
- `tests/lib/services/employee-detection.test.ts` (9 tests): 1 is mapped. The other 8 cover `detectByDomain`, `detectByFrappe` and the remaining `detectInternal` branches. Not mapped: legacy module, see G1.
- `tests/lib/services/onboarding.test.ts` (11 tests): 1 is mapped. The other 10 cover `getOnboardingData`, `saveStep`, `approveOnboarding`, `rejectOnboarding`, `createFrappeEmployee` and the rest of `submitForReview`. Not mapped: legacy module, see G1.
- No test in this clause's scope is `it.skip`, `describe.skip`, `it.todo` or `it.each`: a grep for `(it|test)\.(skip|todo|only|each)` and `describe\.skip` over the 17 test files named above found none.

## 11. Acceptance cases

Every case is `Evidence: UNVERIFIED`. Cases that map an existing test only gained a `// Spec:` comment line above the `it(`; all other cases are characterization tests added by this change in `tests/spec/`.

<a id="cand-07-a1"></a>
### CAND-07-A1: Job offer service

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A1.1A](07-services-and-hooks.md#cand-07-a1-1a) | get_job_offer_summary is called with appl and the token, and its reply is returned unchanged. | [`getJobOfferSummary calls FrappeAPI.get with token if provided`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.1B](07-services-and-hooks.md#cand-07-a1-1b) | get_job_offer_status is called with appl and the token. | [`getJobOfferStatus calls FrappeAPI.get with token if provided`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.1C](07-services-and-hooks.md#cand-07-a1-1c) | get_rejection_reasons is called with no second argument at all. | [`getRejectionReasons calls FrappeAPI.get`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.2A](07-services-and-hooks.md#cand-07-a1-2a) | job_offer_update receives the status, application and token exactly as passed. | [`updateJobOfferStatus calls FrappeAPI.post with token`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.2B](07-services-and-hooks.md#cand-07-a1-2b) | The consent form is read from the DPDP Act Settings method with appl and token. | [`getConsentForm calls FrappeAPI.get with correct arguments`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.2C](07-services-and-hooks.md#cand-07-a1-2c) | submit_dpdp_consent receives the caller's payload object as the body. | [`submitConsent calls FrappeAPI.post with correct arguments`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.2D](07-services-and-hooks.md#cand-07-a1-2d) | start_consent_session is posted with appl and the token. | [`startConsentSession posts to the external consent endpoint`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.2E](07-services-and-hooks.md#cand-07-a1-2e) | The token key is absent from the body when no token is given. | [`startConsentSession omits the token when there isn't one`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.2F](07-services-and-hooks.md#cand-07-a1-2f) | get_consent_session_status is called with appl and the token. | [`getConsentSessionStatus calls the status endpoint`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.3A](07-services-and-hooks.md#cand-07-a1-3a) | The PDF URL names download_job_offer_pdf and carries an encoded appl and the token. | [`getJobOfferPdfUrl returns the correct API URL with token if provided`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.3B](07-services-and-hooks.md#cand-07-a1-3b) | The URL carries only the encoded application when no token is given. | [`getJobOfferPdfUrl returns the correct API URL`](../../../tests/lib/services/jobOffer.test.ts) |
| [CAND-07-A1.3C](07-services-and-hooks.md#cand-07-a1-3c) | The culture book URL is built on the same-origin proxy and gains the token only when one is given. | [`builds the culture book preview URL on the same-origin proxy and appends the token only when one is given`](../../../tests/spec/cand-07-job-offer.test.ts) |
| [CAND-07-A1.4A](07-services-and-hooks.md#cand-07-a1-4a) | An empty application answers false with no request at all. | [`answers false for an empty application without a request at all`](../../../tests/spec/cand-07-job-offer.test.ts) |
| [CAND-07-A1.4B](07-services-and-hooks.md#cand-07-a1-4b) | A non-JSON content type is treated as a real PDF, the body is cancelled and never read. | [`treats a non-JSON content type as a real PDF, cancels the body and never reads it`](../../../tests/spec/cand-07-job-offer.test.ts) |
| [CAND-07-A1.4C](07-services-and-hooks.md#cand-07-a1-4c) | available is read from the JSON body and only an exact false means unavailable. | [`reads a JSON reply and is false only when available is exactly false`](../../../tests/spec/cand-07-job-offer.test.ts) |
| [CAND-07-A1.4D](07-services-and-hooks.md#cand-07-a1-4d) | A non-OK reply and a thrown fetch both answer false, and the refused body is cancelled. | [`answers false and swallows the failure when the probe is refused or the network throws`](../../../tests/spec/cand-07-job-offer.test.ts) |
| [CAND-07-A1.5A](07-services-and-hooks.md#cand-07-a1-5a) | getJobOfferLetters uses the PDF method with separate=1 and passes the token through. | [`asks download_job_offer_pdf for separate letters and passes the token through`](../../../tests/spec/cand-07-job-offer.test.ts) |
| [CAND-07-A1.6A](07-services-and-hooks.md#cand-07-a1-6a) | A rejected FrappeAPI call is not caught by the service. | [`throws error when API fails`](../../../tests/lib/services/jobOffer.test.ts) |

<a id="cand-07-a1-1a"></a>
#### CAND-07-A1.1A: Offer summary with a link token

- Precondition: `FrappeAPI.get` is mocked to resolve a summary object.
- Action: Call `getJobOfferSummary` with an application and a token.
- Expected result: The call names a method containing `get_job_offer_summary` and passes `{ appl, token }`; the resolved object is returned as given `lib/services/jobOffer.ts:87-93`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::getJobOfferSummary calls FrappeAPI.get with token if provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It matches the method name with `stringContaining`, so the module prefix is not pinned. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-1b"></a>
#### CAND-07-A1.1B: Offer status with a link token

- Precondition: `FrappeAPI.get` is mocked to resolve `{ status: "Offered" }`.
- Action: Call `getJobOfferStatus` with an application and a token.
- Expected result: The call names a method containing `get_job_offer_status` and passes `{ appl, token }`; the reply is returned unchanged `lib/services/jobOffer.ts:158-164`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::getJobOfferStatus calls FrappeAPI.get with token if provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It matches the method name with `stringContaining`. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-1c"></a>
#### CAND-07-A1.1C: Rejection reasons take no parameters

- Precondition: `FrappeAPI.get` is mocked to resolve a one-entry list.
- Action: Call `getRejectionReasons`.
- Expected result: `FrappeAPI.get` is called with the method name only, no parameter object, and the list is returned `lib/services/jobOffer.ts:95-97`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::getRejectionReasons calls FrappeAPI.get`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It matches the method name with `stringContaining`. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-2a"></a>
#### CAND-07-A1.2A: Offer decision posts the whole parameter object

- Precondition: `FrappeAPI.post` is mocked to resolve `{ jo_id, webform }`.
- Action: Call `updateJobOfferStatus` with status, application and token.
- Expected result: The post names a method containing `job_offer_update` and the body is the same object the caller passed, unaltered `lib/services/jobOffer.ts:149-156`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::updateJobOfferStatus calls FrappeAPI.post with token`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not try a signature or a rejection reason in the payload. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-2b"></a>
#### CAND-07-A1.2B: Consent form endpoint

- Precondition: `FrappeAPI.get` is mocked to resolve a form object.
- Action: Call `getConsentForm` with an application and a token.
- Expected result: The call names `recruitment.recruitment.doctype.dpdp_act_settings.dpdp_act_settings.get_consent_form` in full and passes `{ appl, token }` `lib/services/jobOffer.ts:166-174`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::getConsentForm calls FrappeAPI.get with correct arguments`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The token is required by the signature; a missing token is not tried. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-2c"></a>
#### CAND-07-A1.2C: Consent submission posts the payload unchanged

- Precondition: `FrappeAPI.post` is mocked to resolve `{ success: true }`.
- Action: Call `submitConsent` with an application, a token and a consent flag.
- Expected result: The post names `recruitment.dpdp_consent.submit_dpdp_consent` in full and the body is the payload as given `lib/services/jobOffer.ts:217-222`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::submitConsent calls FrappeAPI.post with correct arguments`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The service declares the return as `any`; the shape of a real reply is not pinned. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-2d"></a>
#### CAND-07-A1.2D: Starting an external consent session

- Precondition: `FrappeAPI.post` is mocked to resolve a session with a consent URL.
- Action: Call `startConsentSession` with an application and a token.
- Expected result: The post names a method containing `start_consent_session` and the body is `{ appl, token }`; the session is returned unchanged `lib/services/jobOffer.ts:183-195`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::startConsentSession posts to the external consent endpoint`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A `reused: true` reply is not tried. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-2e"></a>
#### CAND-07-A1.2E: Session start without a token

- Precondition: `FrappeAPI.post` is mocked to resolve `{ already_consented: false }`.
- Action: Call `startConsentSession` with an application only.
- Expected result: The body is exactly `{ appl }`, with no `token` key `lib/services/jobOffer.ts:187-190`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::startConsentSession omits the token when there isn't one`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. An empty-string token is not tried. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-2f"></a>
#### CAND-07-A1.2F: Reading the consent session status

- Precondition: `FrappeAPI.get` is mocked to resolve a status saying consent was given.
- Action: Call `getConsentSessionStatus` with an application and a token.
- Expected result: The call names a method containing `get_consent_session_status` and passes `{ appl, token }`; the status is returned unchanged `lib/services/jobOffer.ts:203-215`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::getConsentSessionStatus calls the status endpoint`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It matches the method name with `stringContaining`. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-3a"></a>
#### CAND-07-A1.3A: Offer PDF URL with a token

- Precondition: None.
- Action: Call `getJobOfferPdfUrl` with an application and a token.
- Expected result: The string contains `download_job_offer_pdf`, the percent-encoded `appl` and `token=`, and no request is made `lib/services/jobOffer.ts:99-108`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::getJobOfferPdfUrl returns the correct API URL with token if provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It asserts substrings, so the base prefix and the parameter order are not pinned. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-3b"></a>
#### CAND-07-A1.3B: Offer PDF URL without a token

- Precondition: None.
- Action: Call `getJobOfferPdfUrl` with an application only.
- Expected result: The string contains `download_job_offer_pdf` and the percent-encoded `appl` `lib/services/jobOffer.ts:99-107`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::getJobOfferPdfUrl returns the correct API URL`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert that `token=` is absent. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a1-3c"></a>
#### CAND-07-A1.3C: Culture book URL

- Precondition: jsdom provides `window`, so `frappeApiBase()` is the `/backend` prefix.
- Action: Call `getCultureBookPdfUrl` once without and once with a token.
- Expected result: The first string is the full `/backend/api/method/recruitment.job_offer_utils.preview_culture_book?appl=…` URL with no token, the second appends `&token=` `lib/services/jobOffer.ts:110-117`
- Test: characterization: `tests/spec/cand-07-job-offer.test.ts::builds the culture book preview URL on the same-origin proxy and appends the token only when one is given`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The server-side base URL branch is not exercised.
- Evidence: UNVERIFIED

<a id="cand-07-a1-4a"></a>
#### CAND-07-A1.4A: Availability probe skips an empty application

- Precondition: `fetch` is stubbed and records every call.
- Action: Call `isCultureBookAvailable` with an empty string.
- Expected result: It resolves false and `fetch` was not called `lib/services/jobOffer.ts:128-129`
- Test: characterization: `tests/spec/cand-07-job-offer.test.ts::answers false for an empty application without a request at all`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A whitespace-only application is not tried.
- Evidence: UNVERIFIED

<a id="cand-07-a1-4b"></a>
#### CAND-07-A1.4B: A PDF content type means available

- Precondition: `fetch` answers OK with `content-type: application/pdf` and a cancellable body.
- Action: Call `isCultureBookAvailable` with an application and a token.
- Expected result: It resolves true, the request went to the preview URL with `credentials: "include"`, `body.cancel()` ran once and `json()` was never called `lib/services/jobOffer.ts:130-141`
- Test: characterization: `tests/spec/cand-07-job-offer.test.ts::treats a non-JSON content type as a real PDF, cancels the body and never reads it`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A reply with no content-type header at all is not tried.
- Evidence: UNVERIFIED

<a id="cand-07-a1-4c"></a>
#### CAND-07-A1.4C: A JSON reply is available unless it says otherwise

- Precondition: `fetch` answers OK with `application/json` three times: `available: false`, `available: true`, then an empty object.
- Action: Call `isCultureBookAvailable` three times.
- Expected result: It resolves false, true, true: a missing `message.available` is not `false`, so it counts as available `lib/services/jobOffer.ts:142-143`
- Test: characterization: `tests/spec/cand-07-job-offer.test.ts::reads a JSON reply and is false only when available is exactly false`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A body that is not JSON despite the header would throw and be caught; that path is CAND-07-A1.4D.
- Evidence: UNVERIFIED

<a id="cand-07-a1-4d"></a>
#### CAND-07-A1.4D: A refused or broken probe is not an error

- Precondition: `fetch` answers a non-OK reply, then rejects.
- Action: Call `isCultureBookAvailable` twice.
- Expected result: Both resolve false, neither rejects, and the refused reply's `body.cancel()` ran once `lib/services/jobOffer.ts:133-146`
- Test: characterization: `tests/spec/cand-07-job-offer.test.ts::answers false and swallows the failure when the probe is refused or the network throws`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not check that nothing was logged.
- Evidence: UNVERIFIED

<a id="cand-07-a1-5a"></a>
#### CAND-07-A1.5A: Letter list asks the PDF method for separate letters

- Precondition: `FrappeAPI.get` is mocked to resolve a letter count.
- Action: Call `getJobOfferLetters` once without and once with a token.
- Expected result: Both calls name `recruitment.job_offer_utils.download_job_offer_pdf` in full with `separate: "1"`; only the second carries `token` `lib/services/jobOffer.ts:224-230`
- Test: characterization: `tests/spec/cand-07-job-offer.test.ts::asks download_job_offer_pdf for separate letters and passes the token through`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The base64 letter payload itself is not exercised.
- Evidence: UNVERIFIED

<a id="cand-07-a1-6a"></a>
#### CAND-07-A1.6A: A backend failure reaches the caller

- Precondition: `FrappeAPI.get` is mocked to reject with an error.
- Action: Call `getJobOfferSummary`.
- Expected result: The promise rejects with that same error; the service catches nothing `lib/services/jobOffer.ts:87-93`
- Test: mapped: `tests/lib/services/jobOffer.test.ts::throws error when API fails`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Only the summary method is tried; the others share the shape. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a2"></a>
### CAND-07-A2: Job offer hooks

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A2.1A](07-services-and-hooks.md#cand-07-a2-1a) | The summary key carries application and token, and the query is idle for an empty application or a disabled hook. | [`keys the summary on application and token and makes no request for an empty application or a disabled hook`](../../../tests/spec/cand-07-job-offer-hooks.test.tsx) |
| [CAND-07-A2.1B](07-services-and-hooks.md#cand-07-a2-1b) | The culture book hook returns a URL with no query, and null once the hook is off or the application is empty. | [`returns a culture book URL without any request and null once the application is empty or the hook is off`](../../../tests/spec/cand-07-job-offer-hooks.test.tsx) |
| [CAND-07-A2.1C](07-services-and-hooks.md#cand-07-a2-1c) | Both queries carry their own key and a five-minute stale time. | [`gives the availability probe and the letter list their own keys and five-minute stale times`](../../../tests/spec/cand-07-job-offer-hooks.test.tsx) |
| [CAND-07-A2.2A](07-services-and-hooks.md#cand-07-a2-2a) | A failed start_consent_session is attempted exactly once. | [`never retries a failed start_consent_session`](../../../tests/spec/cand-07-job-offer-hooks.test.tsx) |
| [CAND-07-A2.2B](07-services-and-hooks.md#cand-07-a2-2b) | The poll is three seconds while consent is missing and stops once it is given. | [`polls the consent status every three seconds while consent is missing and stops once it is given`](../../../tests/spec/cand-07-job-offer-hooks.test.tsx) |
| [CAND-07-A2.2C](07-services-and-hooks.md#cand-07-a2-2c) | The dashboard cache is invalidated only when the status says consent was given. | [`drops the dashboard cache as soon as the status says consent was given, and leaves it alone otherwise`](../../../tests/spec/cand-07-job-offer-hooks.test.tsx) |
| [CAND-07-A2.3A](07-services-and-hooks.md#cand-07-a2-3a) | useJobOfferSummary passes its token argument to the service. | [`useJobOfferSummary hook passes token to the service`](../../../tests/lib/hooks/useJobOffer.test.tsx) |
| [CAND-07-A2.3B](07-services-and-hooks.md#cand-07-a2-3b) | useJobOfferStatus passes its token argument to the service. | [`useJobOfferStatus hook passes token to the service`](../../../tests/lib/hooks/useJobOffer.test.tsx) |
| [CAND-07-A2.3C](07-services-and-hooks.md#cand-07-a2-3c) | useJobOfferPdf returns a null URL and is never loading when disabled. | [`useJobOfferPdf returns null when disabled`](../../../tests/lib/hooks/useJobOffer.test.tsx) |
| [CAND-07-A2.3D](07-services-and-hooks.md#cand-07-a2-3d) | useRejectionReasons fetches without any parameter and returns the list. | [`useRejectionReasons fetches data correctly`](../../../tests/lib/hooks/useJobOffer.test.tsx) |
| [CAND-07-A2.3E](07-services-and-hooks.md#cand-07-a2-3e) | useConsentForm calls the service with the application and the token. | [`useConsentForm fetches data correctly`](../../../tests/lib/hooks/useJobOffer.test.tsx) |
| [CAND-07-A2.4A](07-services-and-hooks.md#cand-07-a2-4a) | A successful decision sets the status cache entry and invalidates the dashboard. | [`useUpdateJobOfferStatus calls service and updates cache directly`](../../../tests/lib/hooks/useJobOffer.test.tsx) |
| [CAND-07-A2.4B](07-services-and-hooks.md#cand-07-a2-4b) | useSubmitConsent forwards the payload and returns the service reply. | [`useSubmitConsent calls service method on mutateAsync`](../../../tests/lib/hooks/useJobOffer.test.tsx) |

<a id="cand-07-a2-1a"></a>
#### CAND-07-A2.1A: Summary key and enabled gate

- Precondition: The service module is mocked; a fresh QueryClient is used per test.
- Action: Render `useJobOfferSummary` with an application and a token, then with an empty application, then with `enabled` false.
- Expected result: The cached key is `["jobOfferSummary", appl, token]`, the first render fetched once, and both other renders stay in fetch status `idle` with no further service call `lib/hooks/useJobOffer.ts:5-12`
- Test: characterization: `tests/spec/cand-07-job-offer-hooks.test.tsx::keys the summary on application and token and makes no request for an empty application or a disabled hook`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert what the hook returns while the query is idle.
- Evidence: UNVERIFIED

<a id="cand-07-a2-1b"></a>
#### CAND-07-A2.1B: PDF hooks make no request

- Precondition: `getCultureBookPdfUrl` is mocked to return a fixed string.
- Action: Render `useCultureBookPdf` enabled, then disabled, then with an empty application.
- Expected result: The first returns `{ pdfUrl, isLoading: false, error: null }` built from the service call; the second returns a null URL; the third returns a falsy URL and makes no service call `lib/hooks/useJobOffer.ts:24-27`
- Test: characterization: `tests/spec/cand-07-job-offer-hooks.test.tsx::returns a culture book URL without any request and null once the application is empty or the hook is off`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The empty-application case is asserted as falsy through `toBeNull` on the value the hook returned; see section 9, G2 for the `useJobOfferPdf` twin, which returns the empty string.
- Evidence: UNVERIFIED

<a id="cand-07-a2-1c"></a>
#### CAND-07-A2.1C: Availability and letter keys and stale times

- Precondition: `isCultureBookAvailable` and `getJobOfferLetters` are mocked to resolve.
- Action: Render `useCultureBookAvailability` and `useJobOfferLetters` with the same application and token.
- Expected result: The cache holds `["cultureBookAvailability", appl, token]` and `["jobOfferLetters", appl, token]`, and every observer reports a stale time of 300000 ms `lib/hooks/useJobOffer.ts:34-50`
- Test: characterization: `tests/spec/cand-07-job-offer-hooks.test.tsx::gives the availability probe and the letter list their own keys and five-minute stale times`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not watch a refetch happen after the stale time elapses.
- Evidence: UNVERIFIED

<a id="cand-07-a2-2a"></a>
#### CAND-07-A2.2A: The consent session is never retried

- Precondition: `startConsentSession` is mocked to reject.
- Action: Call the mutation and await its rejection.
- Expected result: The mutation rejects with the service error, the service ran once, and it was called with the application and an undefined token `lib/hooks/useJobOffer.ts:110-116`
- Test: characterization: `tests/spec/cand-07-job-offer-hooks.test.tsx::never retries a failed start_consent_session`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A `reused: true` success is not tried here.
- Evidence: UNVERIFIED

<a id="cand-07-a2-2b"></a>
#### CAND-07-A2.2B: Consent status polling interval

- Precondition: `getConsentSessionStatus` resolves a status with `consent_given: false`.
- Action: Render the hook, read the query options, then set the cached data to a status with `consent_given: true`.
- Expected result: `CONSENT_STATUS_POLL_MS` is 3000; the observer reports stale time 0 and no background refetch; the refetch-interval function returns 3000 for the pending state and false for the consented one `lib/hooks/useJobOffer.ts:101,133-148`
- Test: characterization: `tests/spec/cand-07-job-offer-hooks.test.tsx::polls the consent status every three seconds while consent is missing and stops once it is given`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It reads the interval function rather than waiting three seconds for a real refetch.
- Evidence: UNVERIFIED

<a id="cand-07-a2-2c"></a>
#### CAND-07-A2.2C: Consent arrival drops the dashboard cache

- Precondition: `invalidateQueries` is spied on; the service answers first without and then with consent.
- Action: Render the hook twice, once per answer.
- Expected result: No invalidation follows the pending answer; the consented answer invalidates `["dashboard"]` `lib/hooks/useJobOffer.ts:134-140`
- Test: characterization: `tests/spec/cand-07-job-offer-hooks.test.tsx::drops the dashboard cache as soon as the status says consent was given, and leaves it alone otherwise`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert that the dashboard query actually refetched.
- Evidence: UNVERIFIED

<a id="cand-07-a2-3a"></a>
#### CAND-07-A2.3A: Summary hook forwards the token

- Precondition: The service module is mocked to resolve a summary.
- Action: Render `useJobOfferSummary` with an application, enabled, and a token.
- Expected result: The query succeeds with that data and the service was called with the application and the token `lib/hooks/useJobOffer.ts:5-9`
- Test: mapped: `tests/lib/hooks/useJobOffer.test.tsx::useJobOfferSummary hook passes token to the service`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It reads no caching option. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a2-3b"></a>
#### CAND-07-A2.3B: Status hook forwards the token

- Precondition: The service module is mocked to resolve a status.
- Action: Render `useJobOfferStatus` with an application and a token.
- Expected result: The query succeeds with that data and the service was called with the application and the token `lib/hooks/useJobOffer.ts:68-74`
- Test: mapped: `tests/lib/hooks/useJobOffer.test.tsx::useJobOfferStatus hook passes token to the service`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The one-minute stale time is not asserted. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a2-3c"></a>
#### CAND-07-A2.3C: A disabled PDF hook yields no URL

- Precondition: The service module is mocked.
- Action: Render `useJobOfferPdf` with an application and `enabled` false.
- Expected result: `pdfUrl` is null and `isLoading` is false `lib/hooks/useJobOffer.ts:19-22`
- Test: mapped: `tests/lib/hooks/useJobOffer.test.tsx::useJobOfferPdf returns null when disabled`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert that the service was not called, and does not try an empty application (section 9, G2). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a2-3d"></a>
#### CAND-07-A2.3D: Rejection reasons need no argument

- Precondition: The service module is mocked to resolve a one-entry list.
- Action: Render `useRejectionReasons`.
- Expected result: The query succeeds and holds that list `lib/hooks/useJobOffer.ts:77-83`
- Test: mapped: `tests/lib/hooks/useJobOffer.test.tsx::useRejectionReasons fetches data correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Neither the key nor the one-hour stale time is asserted. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a2-3e"></a>
#### CAND-07-A2.3E: Consent form hook passes both values

- Precondition: The service module is mocked to resolve a form object.
- Action: Render `useConsentForm` with an application and a token.
- Expected result: The query succeeds with that data and the service was called with both values `lib/hooks/useJobOffer.ts:85-92`
- Test: mapped: `tests/lib/hooks/useJobOffer.test.tsx::useConsentForm fetches data correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The gate that needs both values is not exercised with one missing. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a2-4a"></a>
#### CAND-07-A2.4A: The offer decision writes the cache directly

- Precondition: The service module is mocked to resolve; `setQueryData` and `invalidateQueries` are spied on.
- Action: Run the mutation with an application and the status Accepted.
- Expected result: `setQueryData` wrote `{ status: "Accepted" }` at `["jobOfferStatus", appl, undefined]` and `invalidateQueries` was called with `{ queryKey: ["dashboard"] }` `lib/hooks/useJobOffer.ts:52-66`
- Test: mapped: `tests/lib/hooks/useJobOffer.test.tsx::useUpdateJobOfferStatus calls service and updates cache directly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not try a token, so the third key element is only ever undefined. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a2-4b"></a>
#### CAND-07-A2.4B: Consent submission touches no cache

- Precondition: The service module is mocked to resolve `{ success: true }`.
- Action: Run the mutation with a consent payload.
- Expected result: The result is the service reply and the service received the payload `lib/hooks/useJobOffer.ts:94-98`
- Test: mapped: `tests/lib/hooks/useJobOffer.test.tsx::useSubmitConsent calls service method on mutateAsync`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert that no cache was invalidated. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a3"></a>
### CAND-07-A3: External consent hand-off

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A3.1A](07-services-and-hooks.md#cand-07-a3-1a) | An absolute pre-issued URL is navigated to without starting a session. | [`uses a pre-issued absolute link straight away and asks for no new session`](../../../tests/spec/cand-07-consent-handoff.test.tsx) |
| [CAND-07-A3.1B](07-services-and-hooks.md#cand-07-a3-1b) | A relative pre-issued URL makes the hook start a session and leave for the new link. | [`re-issues a link when the pre-issued one is relative or unusable, and leaves for the new one`](../../../tests/spec/cand-07-consent-handoff.test.tsx) |
| [CAND-07-A3.1C](07-services-and-hooks.md#cand-07-a3-1c) | already_consented without a usable redirect pushes the onward path with appl and token. | [`skips the portal for an already consented candidate and pushes the in-app onward route when the backend sends no usable redirect`](../../../tests/spec/cand-07-consent-handoff.test.tsx) |
| [CAND-07-A3.1D](07-services-and-hooks.md#cand-07-a3-1d) | An absolute redirect_url is assigned rather than pushed. | [`leaves the site when an already consented candidate gets an absolute redirect from the backend`](../../../tests/spec/cand-07-consent-handoff.test.tsx) |
| [CAND-07-A3.1E](07-services-and-hooks.md#cand-07-a3-1e) | A thrown session call and an unusable consent URL both set failed and navigate nowhere. | [`reports failure without navigating when the session call throws or hands back no usable link`](../../../tests/spec/cand-07-consent-handoff.test.tsx) |

<a id="cand-07-a3-1a"></a>
#### CAND-07-A3.1A: A usable pre-issued link is used at once

- Precondition: `window.location.assign` and the session mutation are mocked.
- Action: Call `handoff` with an absolute https URL.
- Expected result: It resolves true, `assign` was called with that URL, the session mutation was not called and `failed` stays false `lib/hooks/useExternalConsentHandoff.ts:33-35`
- Test: characterization: `tests/spec/cand-07-consent-handoff.test.tsx::uses a pre-issued absolute link straight away and asks for no new session`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not try an `http:` link or one with a query string.
- Evidence: UNVERIFIED

<a id="cand-07-a3-1b"></a>
#### CAND-07-A3.1B: An unusable link is re-issued

- Precondition: The session mutation resolves a session carrying an absolute consent URL.
- Action: Call `handoff` with a relative path.
- Expected result: It resolves true, the session was started with `{ appl, token }`, and `assign` was called exactly once, with the session's URL `lib/hooks/useExternalConsentHandoff.ts:35-54`
- Test: characterization: `tests/spec/cand-07-consent-handoff.test.tsx::re-issues a link when the pre-issued one is relative or unusable, and leaves for the new one`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A null pre-issued URL takes the same branch and is not asserted separately here.
- Evidence: UNVERIFIED

<a id="cand-07-a3-1c"></a>
#### CAND-07-A3.1C: An already consented candidate goes to the in-app route

- Precondition: The session mutation resolves `{ already_consented: true, redirect_url: null }`.
- Action: Call `handoff` with no pre-issued URL.
- Expected result: It resolves true, the router was pushed to `/onboarding` with the encoded `appl` and `token` in the query, and `assign` was not called `lib/hooks/useExternalConsentHandoff.ts:40-51`
- Test: characterization: `tests/spec/cand-07-consent-handoff.test.tsx::skips the portal for an already consented candidate and pushes the in-app onward route when the backend sends no usable redirect`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The onward path and the query builder themselves are SPEC-CAND-04.
- Evidence: UNVERIFIED

<a id="cand-07-a3-1d"></a>
#### CAND-07-A3.1D: An already consented candidate with an absolute redirect leaves the site

- Precondition: The session mutation resolves `already_consented: true` with an absolute https `redirect_url`.
- Action: Call `handoff` with no pre-issued URL.
- Expected result: It resolves true, `assign` was called with that URL and the router was not pushed `lib/hooks/useExternalConsentHandoff.ts:41-50`
- Test: characterization: `tests/spec/cand-07-consent-handoff.test.tsx::leaves the site when an already consented candidate gets an absolute redirect from the backend`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. No allowlist is applied to the host; see section 8.
- Evidence: UNVERIFIED

<a id="cand-07-a3-1e"></a>
#### CAND-07-A3.1E: A dead end reports failure

- Precondition: The session mutation rejects once, then resolves a session whose consent URL uses a `javascript:` scheme.
- Action: Call `handoff` on two separate hook instances.
- Expected result: Both resolve false, neither assigned nor pushed, and both hooks report `failed` true `lib/hooks/useExternalConsentHandoff.ts:54-60`
- Test: characterization: `tests/spec/cand-07-consent-handoff.test.tsx::reports failure without navigating when the session call throws or hands back no usable link`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert that the caught error was not logged.
- Evidence: UNVERIFIED

<a id="cand-07-a4"></a>
### CAND-07-A4: CTC proposal and direct applicant form

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A4.1A](07-services-and-hooks.md#cand-07-a4-1a) | A proposal name reaches get_my_proposal and a token reaches get_proposal. | [`reads the session proposal by name and the emailed proposal by token, on different endpoints`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A4.1B](07-services-and-hooks.md#cand-07-a4-1b) | The response body carries the proposal name or the token plus the payload, and only message is returned. | [`posts the response with the identifying field merged into the payload, and returns only the message`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A4.1C](07-services-and-hooks.md#cand-07-a4-1c) | A non-OK reply throws the server message, and a body that will not parse throws the fixed fallback. | [`raises the backend's own text on an error, and its own fallback for a body it cannot read`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A4.1D](07-services-and-hooks.md#cand-07-a4-1d) | Both key helpers return the token first, then the record name, then an empty string. | [`prefers the token over the proposal name as the cache key and is empty for neither`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A4.2A](07-services-and-hooks.md#cand-07-a4-2a) | The search text and the child column travel in the query, and the column is dropped when absent. | [`sends the search text and the child column as query parameters and drops the column when absent`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A4.2B](07-services-and-hooks.md#cand-07-a4-2b) | get_my_form is called with the request name and the session cookie. | [`getForm asks for the request by name with the session cookie`](../../../tests/lib/services/direct-applicant-form.test.ts) |
| [CAND-07-A4.2C](07-services-and-hooks.md#cand-07-a4-2c) | The posted body holds the request name and the answers as a JSON string. | [`submit posts the data as a JSON string`](../../../tests/lib/services/direct-applicant-form.test.ts) |
| [CAND-07-A4.2D](07-services-and-hooks.md#cand-07-a4-2d) | The upload form carries the access value, the field name, the child column and the file. | [`uploadFile sends multipart with the table column when given`](../../../tests/lib/services/direct-applicant-form.test.ts) |
| [CAND-07-A4.2E](07-services-and-hooks.md#cand-07-a4-2e) | A token selects get_form and submit_form and travels as the t parameter. | [`the emailed link uses the token endpoints, no session`](../../../tests/lib/services/direct-applicant-form.test.ts) |
| [CAND-07-A4.2F](07-services-and-hooks.md#cand-07-a4-2f) | A 403 carrying _server_messages rejects with that sentence. | [`throws the server's own message`](../../../tests/lib/services/direct-applicant-form.test.ts) |
| [CAND-07-A4.3A](07-services-and-hooks.md#cand-07-a4-3a) | Both read hooks key on the access value and stay idle when neither a token nor a name is set. | [`keys the CTC proposal and the direct applicant form on whichever access value was given, and stays idle when neither is`](../../../tests/spec/cand-07-hooks.test.tsx) |
| [CAND-07-A4.3B](07-services-and-hooks.md#cand-07-a4-3b) | The proposal key and the action centre key are both invalidated after a response. | [`waits for both the proposal and the action centre caches to be invalidated before a CTC response settles`](../../../tests/spec/cand-07-hooks.test.tsx) |
| [CAND-07-A4.3C](07-services-and-hooks.md#cand-07-a4-3c) | The form key and the action centre key are invalidated, and the answers reach the service unchanged. | [`invalidates the same two caches after a direct applicant form submission`](../../../tests/spec/cand-07-hooks.test.tsx) |

<a id="cand-07-a4-1a"></a>
#### CAND-07-A4.1A: Proposal access mode picks the endpoint

- Precondition: `fetch` is stubbed to answer OK with a `message` object.
- Action: Call `getProposal` once with a proposal name and once with a token.
- Expected result: The first URL is the `get_my_proposal` method with `?proposal=…`, sent as a GET with `credentials: "include"` and an `Accept: application/json` header; the second is the `get_proposal` method with `?t=…` `lib/services/ctc-proposal.ts:11-17,37-41`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::reads the session proposal by name and the emailed proposal by token, on different endpoints`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The server-side base URL branch is not exercised.
- Evidence: UNVERIFIED

<a id="cand-07-a4-1b"></a>
#### CAND-07-A4.1B: Proposal response merges the identifier

- Precondition: `fetch` is stubbed to answer OK with `{ message: { status: "Accepted" } }`.
- Action: Call `respond` once with a proposal name and once with a token.
- Expected result: The first posts to `respond_my_proposal` with the JSON content type and a body of `{ proposal, …payload }`; the second posts to `respond` with `{ t, …payload }`; the resolved value is the body's `message` `lib/services/ctc-proposal.ts:25,43-48`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::posts the response with the identifying field merged into the payload, and returns only the message`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A payload key that collides with `proposal` or `t` is not tried.
- Evidence: UNVERIFIED

<a id="cand-07-a4-1c"></a>
#### CAND-07-A4.1C: Proposal errors use the backend text

- Precondition: `fetch` answers a 403 carrying `_server_messages`, then a 500 whose `json()` rejects.
- Action: Call `getProposal` twice.
- Expected result: The first rejects with the server's own sentence; the second rejects with `Something went wrong. Please try again.` because the unreadable body leaves the parser nothing `lib/services/ctc-proposal.ts:18-24`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::raises the backend's own text on an error, and its own fallback for a body it cannot read`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The message parser itself is SPEC-CAND-02 (`lib/frappe-error.ts`).
- Evidence: UNVERIFIED

<a id="cand-07-a4-1d"></a>
#### CAND-07-A4.1D: Access keys prefer the token

- Precondition: None.
- Action: Call `proposalAccessKey` and `accessKey` with a token, with a record name, and with an empty object.
- Expected result: Each returns the token, then the record name, then `""` `lib/services/ctc-proposal.ts:35`, `lib/services/direct-applicant-form.ts:47`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::prefers the token over the proposal name as the cache key and is empty for neither`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The empty-object case is only reachable through a cast; the types forbid it.
- Evidence: UNVERIFIED

<a id="cand-07-a4-2a"></a>
#### CAND-07-A4.2A: Link search parameters

- Precondition: `fetch` answers OK with a one-entry option list.
- Action: Call `searchLink` once with a request name and a child column, once with a token and no column.
- Expected result: The first URL is `search_my_link?request=…&fieldname=…&txt=…&child_fieldname=…`; the second is `search_link?t=…&fieldname=…&txt=…` with no column; the options list is returned `lib/services/direct-applicant-form.ts:55-62`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::sends the search text and the child column as query parameters and drops the column when absent`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A search text needing percent encoding is not tried.
- Evidence: UNVERIFIED

<a id="cand-07-a4-2b"></a>
#### CAND-07-A4.2B: Session form read

- Precondition: `fetch` is stubbed to answer OK with a form in `message`.
- Action: Call `getForm` with a request name.
- Expected result: The returned object is the body's `message`, the URL contains `direct_applicant_portal.get_my_form?request=…` and the request carries `credentials: "include"` `lib/services/direct-applicant-form.ts:16-20,50-53`
- Test: mapped: `tests/lib/services/direct-applicant-form.test.ts::getForm asks for the request by name with the session cookie`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It asserts a URL substring, so the base prefix is not pinned. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a4-2c"></a>
#### CAND-07-A4.2C: Form submission double-encodes the answers

- Precondition: `fetch` is stubbed to answer OK.
- Action: Call `submit` with a request name and one answer field.
- Expected result: The URL contains `submit_my_form` and the parsed body holds `request` plus a `data` field that is itself the answers encoded as a JSON string `lib/services/direct-applicant-form.ts:74-79`
- Test: mapped: `tests/lib/services/direct-applicant-form.test.ts::submit posts the data as a JSON string`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert the JSON content-type header. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a4-2d"></a>
#### CAND-07-A4.2D: Upload sends multipart

- Precondition: `fetch` is stubbed to answer OK with a file URL and name.
- Action: Call `uploadFile` with a request name, a field, a synthetic file and a child column.
- Expected result: The result is the `message` object, and the sent `FormData` holds `request`, `fieldname` and `child_fieldname` `lib/services/direct-applicant-form.ts:64-71`
- Test: mapped: `tests/lib/services/direct-applicant-form.test.ts::uploadFile sends multipart with the table column when given`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert that the `file` entry is the File, nor that no content type was set by hand. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a4-2e"></a>
#### CAND-07-A4.2E: The emailed link uses the token endpoints

- Precondition: `fetch` is stubbed to answer OK.
- Action: Call `getForm` and then `submit` with a token.
- Expected result: The first URL contains `direct_applicant_portal.get_form?t=…`; the second contains `direct_applicant_portal.submit_form` and the body is `{ t, data }` `lib/services/direct-applicant-form.ts:41-44,50-79`
- Test: mapped: `tests/lib/services/direct-applicant-form.test.ts::the emailed link uses the token endpoints, no session`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert that no `request` parameter is sent. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a4-2f"></a>
#### CAND-07-A4.2F: Form errors use the backend text

- Precondition: `fetch` answers 403 with a `_server_messages` payload.
- Action: Call `getForm` with a request name.
- Expected result: The promise rejects with the server's own sentence, not with a status text `lib/services/direct-applicant-form.ts:26-29`
- Test: mapped: `tests/lib/services/direct-applicant-form.test.ts::throws the server's own message`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The fallback path for an unreadable body is covered by CAND-07-A4.1C on the sibling service. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a4-3a"></a>
#### CAND-07-A4.3A: Access-keyed query keys and gates

- Precondition: Both service modules are mocked; the real key helpers are kept.
- Action: Render `useCtcProposal` with a token and `useDirectApplicantForm` with a request name, then `useCtcProposal` with an empty access object.
- Expected result: The cache holds `["ctc-proposal", token]` and `["direct-applicant-form", request]`; the third render is idle and issues no further service call `lib/hooks/useCtcProposal.ts:5-14`, `lib/hooks/useDirectApplicantForm.ts:4-13`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::keys the CTC proposal and the direct applicant form on whichever access value was given, and stays idle when neither is`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. `retry: false` and `refetchOnWindowFocus: false` are not asserted.
- Evidence: UNVERIFIED

<a id="cand-07-a4-3b"></a>
#### CAND-07-A4.3B: A CTC response waits for both invalidations

- Precondition: `respond` is mocked to resolve; `invalidateQueries` is spied on.
- Action: Run the mutation with an Accept payload.
- Expected result: `invalidateQueries` was called with `{ queryKey: ["ctc-proposal", proposal] }` and with `{ queryKey: ["action-center"] }` `lib/hooks/useCtcProposal.ts:22-26`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::waits for both the proposal and the action centre caches to be invalidated before a CTC response settles`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not prove the mutation stayed pending until both promises settled.
- Evidence: UNVERIFIED

<a id="cand-07-a4-3c"></a>
#### CAND-07-A4.3C: A form submission invalidates the same two caches

- Precondition: `submit` is mocked to resolve; `invalidateQueries` is spied on.
- Action: Run the mutation with one answer field.
- Expected result: The service received the access object and the answers; `invalidateQueries` was called with `{ queryKey: ["direct-applicant-form", token] }` and with `{ queryKey: ["action-center"] }` `lib/hooks/useDirectApplicantForm.ts:18-25`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::invalidates the same two caches after a direct applicant form submission`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not prove the mutation stayed pending until both promises settled.
- Evidence: UNVERIFIED

<a id="cand-07-a5"></a>
### CAND-07-A5: Pre-offer form

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A5.1A](07-services-and-hooks.md#cand-07-a5-1a) | An empty applicant answers the unfilled shape with no request, and an empty reply falls back to the same shape. | [`reports an unfilled form without a request when no applicant is named, and falls back to the same shape for an empty reply`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A5.1B](07-services-and-hooks.md#cand-07-a5-1b) | A non-list form reply throws, and a submission without an applicant throws before any request. | [`refuses a form reply that is not a list, and refuses to submit without an applicant`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A5.1C](07-services-and-hooks.md#cand-07-a5-1c) | read_only and hidden come from editability and visibility unless the explicit numeric flags are present. | [`derives read_only and hidden from editability and visibility only when the explicit flags are absent`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A5.1D](07-services-and-hooks.md#cand-07-a5-1d) | The status field sets the form status, is not rendered, and the rest group by section with a default tab. | [`takes the form status from a status field, keeps it out of the rendered fields and groups the rest by section`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A5.2A](07-services-and-hooks.md#cand-07-a5-2a) | The state query is idle without an applicant and keyed on the applicant otherwise. | [`holds the form-state query back until an applicant is named and keys it on that applicant`](../../../tests/spec/cand-07-hooks.test.tsx) |
| [CAND-07-A5.2B](07-services-and-hooks.md#cand-07-a5-2b) | The object-shaped form key and the state key are both invalidated after a submission. | [`invalidates the form and the form-state caches, using the object-shaped form key, after a pre-offer submission`](../../../tests/spec/cand-07-hooks.test.tsx) |
| [CAND-07-A5.3A](07-services-and-hooks.md#cand-07-a5-3a) | get_application_fields is called with the applicant and the reply becomes tabs and fields. | [`calls FrappeAPI.get with correct arguments and transforms data`](../../../tests/lib/services/pre-offer.test.ts) |
| [CAND-07-A5.3B](07-services-and-hooks.md#cand-07-a5-3b) | An empty e-mail sends an empty parameter object. | [`calls FrappeAPI.get without job_applicant param if email is not provided`](../../../tests/lib/services/pre-offer.test.ts) |
| [CAND-07-A5.3C](07-services-and-hooks.md#cand-07-a5-3c) | A table field's table_fields become child_fields recursively. | [`maps table_fields into child_fields for table fields`](../../../tests/lib/services/pre-offer.test.ts) |
| [CAND-07-A5.3D](07-services-and-hooks.md#cand-07-a5-3d) | submit_application receives the applicant and the answers as a JSON string. | [`calls FrappeAPI.post with correct arguments`](../../../tests/lib/services/pre-offer.test.ts) |

<a id="cand-07-a5-1a"></a>
#### CAND-07-A5.1A: Form state without an applicant

- Precondition: `FrappeAPI.get` is mocked and records every call.
- Action: Call `getPreOfferFormState` with an empty string, then with an applicant while the backend answers null.
- Expected result: Both resolve `{ filled: false, filled_at: null, rejected_fields: [] }`; the first made no call, the second called `recruitment.api.channels.pre_offer.get_form_state` with `{ job_applicant }` `lib/services/pre-offer.ts:34-39`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::reports an unfilled form without a request when no applicant is named, and falls back to the same shape for an empty reply`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A filled reply is not asserted here.
- Evidence: UNVERIFIED

<a id="cand-07-a5-1b"></a>
#### CAND-07-A5.1B: Shape and applicant guards

- Precondition: `FrappeAPI.get` answers an object instead of an array; `FrappeAPI.post` records every call.
- Action: Call `getPreOfferForm` with an applicant, then `submitPreOffer` with an empty applicant.
- Expected result: The first rejects with `Failed to fetch pre-offer form: Response is not a valid list of fields`; the second rejects with `Job applicant is required` and `FrappeAPI.post` was not called `lib/services/pre-offer.ts:23-25,42-43`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::refuses a form reply that is not a list, and refuses to submit without an applicant`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A null reply takes the same first branch and is not asserted separately.
- Evidence: UNVERIFIED

<a id="cand-07-a5-1c"></a>
#### CAND-07-A5.1C: Field flags are derived only when absent

- Precondition: None.
- Action: Call `transformPreOfferField` on a field with only the text settings, then on one that also carries explicit zero flags.
- Expected result: The first yields `read_only: 1`, `hidden: 1`, a name from `reference_name`, a label from `display_name`, `reqd: 0` and an empty value; the second keeps both explicit zeroes and labels itself with its own field name `lib/services/pre-offer.ts:51-72`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::derives read_only and hidden from editability and visibility only when the explicit flags are absent`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Nested child fields are not recursed here.
- Evidence: UNVERIFIED

<a id="cand-07-a5-1d"></a>
#### CAND-07-A5.1D: Status field and section grouping

- Precondition: `FrappeAPI.get` answers a status field, a sectioned field and a field with no section.
- Action: Call `getPreOfferForm` with an applicant.
- Expected result: The form status is the status field's value; the tabs are the named section and `Basic Details`, each holding only its own field, and the status field appears in neither `lib/services/pre-offer.ts:74-115`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::takes the form status from a status field, keeps it out of the rendered fields and groups the rest by section`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The `default` fallback and a form with no status field are not tried (section 10).
- Evidence: UNVERIFIED

<a id="cand-07-a5-2a"></a>
#### CAND-07-A5.2A: Form-state hook waits for an applicant

- Precondition: The pre-offer service module is mocked to resolve a filled state.
- Action: Render `usePreOfferFormState` with no argument, then with an applicant.
- Expected result: The first is in fetch status `idle` and made no service call; the second succeeds and the cache holds `["pre-offer-form-state", applicant]` `lib/hooks/usePreOfferForm.ts:17-23`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::holds the form-state query back until an applicant is named and keys it on that applicant`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The ungated `usePreOfferForm` twin is not rendered here (section 5).
- Evidence: UNVERIFIED

<a id="cand-07-a5-2b"></a>
#### CAND-07-A5.2B: Submission invalidates both pre-offer keys

- Precondition: `submitPreOffer` is mocked to resolve; `invalidateQueries` is spied on.
- Action: Run the mutation with an applicant and one answer field.
- Expected result: The service received the applicant and the answers; `invalidateQueries` was called with `{ queryKey: ["pre-offer-form", { userEmail: applicant }] }` and with `{ queryKey: ["pre-offer-form-state", applicant] }` `lib/hooks/usePreOfferForm.ts:29-36`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::invalidates the form and the form-state caches, using the object-shaped form key, after a pre-offer submission`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not prove a mounted form query actually refetched; the object key is discussed in section 9, G6.
- Evidence: UNVERIFIED

<a id="cand-07-a5-3a"></a>
#### CAND-07-A5.3A: Form fields are read and reshaped

- Precondition: `FrappeAPI.get` is mocked to resolve one sectioned field.
- Action: Call `getPreOfferForm` with an e-mail.
- Expected result: The call names `recruitment.api.channels.pre_offer.get_application_fields` with `{ job_applicant }`; the result carries that e-mail as `applicantId`, one tab named after the section and the field under its `reference_name` `lib/services/pre-offer.ts:11-27,74-115`
- Test: mapped: `tests/lib/services/pre-offer.test.ts::calls FrappeAPI.get with correct arguments and transforms data`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The form status defaults to `Sent` and is not asserted. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a5-3b"></a>
#### CAND-07-A5.3B: No applicant means no parameter

- Precondition: `FrappeAPI.get` is mocked to resolve an empty array.
- Action: Call `getPreOfferForm` with an empty string.
- Expected result: The call passes `{}` and the result's `applicantId` is the empty string `lib/services/pre-offer.ts:12-16`
- Test: mapped: `tests/lib/services/pre-offer.test.ts::calls FrappeAPI.get without job_applicant param if email is not provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not try an undefined argument. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a5-3c"></a>
#### CAND-07-A5.3C: Child rows come from table_fields

- Precondition: `FrappeAPI.get` is mocked to resolve a table field carrying `table_fields`.
- Action: Call `getPreOfferForm`.
- Expected result: The mapped field holds its child rows under `child_fields`, each one transformed by the same rules `lib/services/pre-offer.ts:53,67`
- Test: mapped: `tests/lib/services/pre-offer.test.ts::maps table_fields into child_fields for table fields`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A field carrying both `child_fields` and `table_fields` is not tried. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a5-3d"></a>
#### CAND-07-A5.3D: Submission payload

- Precondition: `FrappeAPI.post` is mocked to resolve.
- Action: Call `submitPreOffer` with an applicant and one answer field.
- Expected result: The post names `recruitment.api.channels.pre_offer.submit_application` with `job_applicant` and a `data` field that is the answers encoded as a JSON string `lib/services/pre-offer.ts:44-47`
- Test: mapped: `tests/lib/services/pre-offer.test.ts::calls FrappeAPI.post with correct arguments`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The empty-applicant guard is CAND-07-A5.1B. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a6"></a>
### CAND-07-A6: Profile and survey

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A6.1A](07-services-and-hooks.md#cand-07-a6-1a) | update_me receives the fields under a data key and change_password receives them flat. | [`wraps the profile update in a data object but posts the password change flat`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A6.1B](07-services-and-hooks.md#cand-07-a6-1b) | Both profile calls log to console.error and let the error through. | [`logs and re-raises a failed profile update instead of swallowing it`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A6.2A](07-services-and-hooks.md#cand-07-a6-2a) | The post-login route is read with no parameters and the survey answers are posted unchanged. | [`reads the post-login route with no parameters and posts the survey answers as given`](../../../tests/spec/cand-07-forms-services.test.ts) |
| [CAND-07-A6.3A](07-services-and-hooks.md#cand-07-a6-3a) | A successful update awaits refreshProfile while the password change touches no session state. | [`refreshes the signed-in profile after an update, but the password change touches no session state`](../../../tests/spec/cand-07-hooks.test.tsx) |

<a id="cand-07-a6-1a"></a>
#### CAND-07-A6.1A: Profile update nests its fields, the password change does not

- Precondition: `FrappeAPI.post` is mocked to resolve.
- Action: Call `updateProfile` with a name and a mobile number, then `changePassword` with three synthetic passwords.
- Expected result: The first post names `recruitment.api.candidate_auth.update_me` with `{ data: { … } }`; the second names `recruitment.api.candidate_auth.change_password` with the three fields at the top level `lib/services/profileService.ts:16-38`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::wraps the profile update in a data object but posts the password change flat`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The avatar field of the update type is not exercised.
- Evidence: UNVERIFIED

<a id="cand-07-a6-1b"></a>
#### CAND-07-A6.1B: Profile failures are logged and re-raised

- Precondition: `console.error` is spied on; `FrappeAPI.post` is mocked to reject.
- Action: Call `updateProfile` and `changePassword` and await both rejections.
- Expected result: Both reject with the backend error and `console.error` ran twice `lib/services/profileService.ts:25-28,38-41`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::logs and re-raises a failed profile update instead of swallowing it`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert the exact log text.
- Evidence: UNVERIFIED

<a id="cand-07-a6-2a"></a>
#### CAND-07-A6.2A: Survey endpoints

- Precondition: `FrappeAPI.get` and `.post` are mocked to resolve.
- Action: Call `getPostLoginRoute`, then `submitSurvey` with a payload.
- Expected result: The get names `recruitment.api.candidate_portal_survey.get_post_login_route` with no second argument; the post names `.submit_survey` and the body is the payload as given `lib/services/survey.ts:4-16`
- Test: characterization: `tests/spec/cand-07-forms-services.test.ts::reads the post-login route with no parameters and posts the survey answers as given`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The login page's use of the route is SPEC-CAND-03.
- Evidence: UNVERIFIED

<a id="cand-07-a6-3a"></a>
#### CAND-07-A6.3A: Only the profile update refreshes the session

- Precondition: The profile service and the auth context are mocked; both calls resolve.
- Action: Run `useUpdateProfile`, then `useChangePassword`.
- Expected result: `refreshProfile` ran exactly once after the update and not again after the password change `lib/hooks/useUpdateProfile.ts:11-13`, `lib/hooks/useChangePassword.ts:5-12`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::refreshes the signed-in profile after an update, but the password change touches no session state`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The error branches of both hooks only log and are not asserted here.
- Evidence: UNVERIFIED

<a id="cand-07-a7"></a>
### CAND-07-A7: Cached content and public queries

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A7.1A](07-services-and-hooks.md#cand-07-a7-1a) | One key, a one-hour stale time, and a single attempt on failure. | [`caches the guest home content for an hour under one key and never retries a failure`](../../../tests/spec/cand-07-hooks.test.tsx) |
| [CAND-07-A7.1B](07-services-and-hooks.md#cand-07-a7-1b) | The route query is fresh for ten minutes and the survey submission creates no cache entry. | [`caches the post-login route for ten minutes and leaves the survey submission un-cached`](../../../tests/spec/cand-07-hooks.test.tsx) |
| [CAND-07-A7.1C](07-services-and-hooks.md#cand-07-a7-1c) | get_home_content is called with no parameters and its reply is returned. | [`gets guest home content through the Frappe API`](../../../tests/lib/services/home.test.ts) |
| [CAND-07-A7.2A](07-services-and-hooks.md#cand-07-a7-2a) | The server route is read with no store and a refusal yields empty branding. | [`reads public branding from the server route with no store and treats a refusal as empty branding`](../../../tests/spec/cand-07-hooks.test.tsx) |
| [CAND-07-A7.2B](07-services-and-hooks.md#cand-07-a7-2b) | The openings array is unwrapped, and a refusal raises Could not load open jobs. | [`unwraps the openings array from the public route and raises a fixed message when the route refuses`](../../../tests/spec/cand-07-hooks.test.tsx) |

<a id="cand-07-a7-1a"></a>
#### CAND-07-A7.1A: Home content is cached for an hour and not retried

- Precondition: `homeService.getHomeContent` is mocked to reject.
- Action: Render `useHomeContent` and wait for the error state.
- Expected result: The service ran once and the `["home-content"]` observer reports a stale time of 3600000 ms `lib/hooks/useHomeContent.ts:4-10`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::caches the guest home content for an hour under one key and never retries a failure`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The QueryClient in the test also sets `retry: false`, so the hook's own setting is confirmed only by the single call under a client whose default matches.
- Evidence: UNVERIFIED

<a id="cand-07-a7-1b"></a>
#### CAND-07-A7.1B: Post-login route caching and the bare survey mutation

- Precondition: Both survey service methods are mocked to resolve.
- Action: Render `useSurvey`, then run `useSubmitSurvey`.
- Expected result: The `["post-login-route"]` observer reports a stale time of 600000 ms, and after the mutation the cache still holds exactly one query `lib/hooks/useSurvey.ts:5-16`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::caches the post-login route for ten minutes and leaves the survey submission un-cached`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert what the mutation returned.
- Evidence: UNVERIFIED

<a id="cand-07-a7-1c"></a>
#### CAND-07-A7.1C: Guest home content endpoint

- Precondition: `FrappeAPI.get` is mocked to resolve a content object.
- Action: Call `getHomeContent`.
- Expected result: The call names `recruitment.api.candidate_home.get_home_content` with no second argument and the object is returned unchanged `lib/services/home.ts:4-9`
- Test: mapped: `tests/lib/services/home.test.ts::gets guest home content through the Frappe API`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. On the deployment branch the hook that calls this is flag-gated (header). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a7-2a"></a>
#### CAND-07-A7.2A: Public branding falls back to an empty object

- Precondition: `fetch` is stubbed to answer a non-OK reply.
- Action: Render `usePublicBranding` and wait for success.
- Expected result: The request was `/api/public/branding` with `{ cache: "no-store" }`, the data is `{}` — a refusal is not an error — and the observer reports a stale time of 600000 ms `lib/hooks/usePublicBranding.ts:4-21`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::reads public branding from the server route with no store and treats a refusal as empty branding`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A successful reply whose body has no `branding` key takes the same fallback and is not asserted separately.
- Evidence: UNVERIFIED

<a id="cand-07-a7-2b"></a>
#### CAND-07-A7.2B: Public openings unwrap or fail with a fixed message

- Precondition: `fetch` is stubbed to answer OK with an openings array, then a non-OK reply.
- Action: Render `usePublicOpenings` twice, clearing the cache in between.
- Expected result: The first holds the openings array and asked for `/api/public/openings`; the second errors with the message `Could not load open jobs` `lib/hooks/usePublicOpenings.ts:4-17`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::unwraps the openings array from the public route and raises a fixed message when the route refuses`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The five-minute stale time is not asserted; the route handler itself is SPEC-CAND-02.
- Evidence: UNVERIFIED

<a id="cand-07-a8"></a>
### CAND-07-A8: Plain hooks

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A8.1A](07-services-and-hooks.md#cand-07-a8-1a) | The first value is immediate and a later one lands only after the full delay with no change. | [`returns the first value at once and the newest value only after the delay has passed without a change`](../../../tests/spec/cand-07-hooks.test.tsx) |
| [CAND-07-A8.2A](07-services-and-hooks.md#cand-07-a8-2a) | Six joining-date field names are listed and each maps to true. | [`names the joining-date fields the non-working-day rule covers`](../../../tests/spec/cand-07-hooks.test.tsx) |
| [CAND-07-A8.2B](07-services-and-hooks.md#cand-07-a8-2b) | The candidate-scoped endpoint is asked once per module load and later callers reuse that answer. | [`asks the candidate-scoped joining-day endpoint once for the whole module and shares that answer with every later caller`](../../../tests/spec/cand-07-hooks.test.tsx) |

<a id="cand-07-a8-1a"></a>
#### CAND-07-A8.1A: Debounce timing

- Precondition: Fake timers are installed; the hook is rendered with a 300 ms delay.
- Action: Read the first value, change it twice 200 ms apart, then advance a further 100 ms.
- Expected result: The first value is returned at once; neither change lands while a newer change restarts the timer; after the full 300 ms since the last change the newest value is returned `lib/hooks/useDebounce.ts:3-16`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::returns the first value at once and the newest value only after the delay has passed without a change`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A changing `delay` is not tried (section 10).
- Evidence: UNVERIFIED

<a id="cand-07-a8-2a"></a>
#### CAND-07-A8.2A: The joining-date field list

- Precondition: None.
- Action: Read `JOINING_DAY_FIELDS`.
- Expected result: Its keys, sorted, are the six joining-date field names and every value is `true` `lib/hooks/useNonWorkingDays.ts:17-24`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::names the joining-date fields the non-working-day rule covers`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Which component consults this map is out of scope here.
- Evidence: UNVERIFIED

<a id="cand-07-a8-2b"></a>
#### CAND-07-A8.2B: One shared joining-day request

- Precondition: `fetch` is stubbed to answer OK with two dates.
- Action: Render the hook, then render it again, then render it with `enabled` false.
- Expected result: The first render resolves both dates from `recruitment.api.joining_day.get_my_non_working_days` with credentials and an Accept header; the second gets the same dates without a second request; the disabled one returns an empty list and adds no request `lib/hooks/useNonWorkingDays.ts:26-74`
- Test: characterization: `tests/spec/cand-07-hooks.test.tsx::asks the candidate-scoped joining-day endpoint once for the whole module and shares that answer with every later caller`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The module-level promise cache makes the failure and non-OK branches unreachable after a success, so they are untested (section 10).
- Evidence: UNVERIFIED

<a id="cand-07-a9"></a>
### CAND-07-A9: Job opening, saved job and action centre services

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A9.1A](07-services-and-hooks.md#cand-07-a9-1a) | An error is logged and the caller gets an empty field list instead of a rejection. | [`swallows a failed field lookup, logs it and hands back an empty field list`](../../../tests/spec/cand-07-job-opening.test.tsx) |
| [CAND-07-A9.1B](07-services-and-hooks.md#cand-07-a9-1b) | The e-mail and the invite are sent only when isCampus is true, and the endpoint changes with it. | [`sends the campus e-mail and invite only on the campus endpoint and leaves them off the careers one`](../../../tests/spec/cand-07-job-opening.test.tsx) |
| [CAND-07-A9.1C](07-services-and-hooks.md#cand-07-a9-1c) | The campus endpoint is used only when isCampus and campus_invite are both set; otherwise the whole payload goes to careers. | [`uses the campus submit endpoint only when the payload carries both the campus flag and the invite`](../../../tests/spec/cand-07-job-opening.test.tsx) |
| [CAND-07-A9.1D](07-services-and-hooks.md#cand-07-a9-1d) | Page and limit become strings and empty optional values are left out. | [`stringifies the page and limit of the opening list and leaves out an empty search term or e-mail`](../../../tests/spec/cand-07-job-opening.test.tsx) |
| [CAND-07-A9.2A](07-services-and-hooks.md#cand-07-a9-2a) | The resource call names the percent-encoded doctype with paging and a filter, and only data is returned. | [`asks the Candidate Raise Request resource with a percent-encoded doctype and returns only the data field`](../../../tests/spec/cand-07-job-opening.test.tsx) |
| [CAND-07-A9.3A](07-services-and-hooks.md#cand-07-a9-3a) | list_openings is called with page and limit as strings. | [`getJobOpening calls FrappeAPI.get`](../../../tests/lib/services/jobOpeningService.test.ts) |
| [CAND-07-A9.3B](07-services-and-hooks.md#cand-07-a9-3b) | A search term is sent as search_term alongside page and limit. | [`getJobOpening calls FrappeAPI.get with search_term parameter`](../../../tests/lib/services/jobOpeningService.test.ts) |
| [CAND-07-A9.3C](07-services-and-hooks.md#cand-07-a9-3c) | get_invite_openings is called with the invite and the e-mail. | [`getCampusInviteOpenings calls FrappeAPI.get with campus_invite`](../../../tests/lib/services/jobOpeningService.test.ts) |
| [CAND-07-A9.3D](07-services-and-hooks.md#cand-07-a9-3d) | A non-campus payload is posted whole to submit_application. | [`submitApplication calls FrappeAPI.post with submit_application`](../../../tests/lib/services/jobOpeningService.test.ts) |
| [CAND-07-A9.3E](07-services-and-hooks.md#cand-07-a9-3e) | A campus payload is posted to submit_invite_application with renamed fields. | [`submitApplication calls submit_invite_application when isCampus is true`](../../../tests/lib/services/jobOpeningService.test.ts) |
| [CAND-07-A9.3F](07-services-and-hooks.md#cand-07-a9-3f) | delete_draft is posted with the applicant e-mail and the job opening. | [`deleteDraftJobApplicant calls FrappeAPI.post`](../../../tests/lib/services/jobOpeningService.test.ts) |
| [CAND-07-A9.3G](07-services-and-hooks.md#cand-07-a9-3g) | Backend fields are renamed into the form shape and a null reply yields an empty list. | [`getJobApplicationForm returns data or fallback`](../../../tests/lib/services/jobOpeningService.test.ts) |
| [CAND-07-A9.4A](07-services-and-hooks.md#cand-07-a9-4a) | get_action_center_items is called with candidate_email. | [`getActionCenterData calls FrappeAPI.get with correct arguments`](../../../tests/lib/services/action-center.test.ts) |
| [CAND-07-A9.4B](07-services-and-hooks.md#cand-07-a9-4b) | A new request posts to the unencoded doctype and returns only data. | [`createCandidateRaiseRequest calls FrappeAPI.getresourceDocumentData correctly`](../../../tests/lib/services/action-center.test.ts) |
| [CAND-07-A9.5A](07-services-and-hooks.md#cand-07-a9-5a) | get_saved_job_openings is called with candidate_email. | [`getSavedJobs calls FrappeAPI.get`](../../../tests/lib/services/savedJobsService.test.ts) |
| [CAND-07-A9.5B](07-services-and-hooks.md#cand-07-a9-5b) | toggle_saved_job_opening is posted with the e-mail and the job id. | [`toggleSavedJob calls FrappeAPI.post`](../../../tests/lib/services/savedJobsService.test.ts) |

<a id="cand-07-a9-1a"></a>
#### CAND-07-A9.1A: A failed field lookup becomes an empty form

- Precondition: `console.error` is spied on; `FrappeAPI.get` is mocked to reject.
- Action: Call `getJobApplicationForm` with a job opening.
- Expected result: It resolves `{ fields: [] }` and `console.error` was called with the prefix `API ERROR:` and the error `lib/services/jobOpeningService.ts:134-137`
- Test: characterization: `tests/spec/cand-07-job-opening.test.tsx::swallows a failed field lookup, logs it and hands back an empty field list`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The logged value includes the backend error object; see section 8.
- Evidence: UNVERIFIED

<a id="cand-07-a9-1b"></a>
#### CAND-07-A9.1B: Campus parameters only on the campus endpoint

- Precondition: `FrappeAPI.get` is mocked to resolve an empty list.
- Action: Call `getJobApplicationForm` with the same four arguments, once with `isCampus` false and once true.
- Expected result: The first names the careers `get_application_fields` with `{ opening }` only; the second names the campus method with `{ opening, email, campus_invite }` `lib/services/jobOpeningService.ts:105-115`
- Test: characterization: `tests/spec/cand-07-job-opening.test.tsx::sends the campus e-mail and invite only on the campus endpoint and leaves them off the careers one`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. On the deployment branch the careers endpoint differs (header).
- Evidence: UNVERIFIED

<a id="cand-07-a9-1c"></a>
#### CAND-07-A9.1C: Campus submission needs both the flag and the invite

- Precondition: `FrappeAPI.post` is mocked to resolve.
- Action: Call `submitApplication` with the campus flag and an invite, then with the flag but no invite.
- Expected result: The first posts to `recruitment.api.channels.campus.submit_invite_application` with the four renamed fields; the second posts the whole payload — campus flag included — to `recruitment.api.channels.careers.submit_application` `lib/services/jobOpeningService.ts:76-97`
- Test: characterization: `tests/spec/cand-07-job-opening.test.tsx::uses the campus submit endpoint only when the payload carries both the campus flag and the invite`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. On the deployment branch the careers submission has a different body and return shape (header).
- Evidence: UNVERIFIED

<a id="cand-07-a9-1d"></a>
#### CAND-07-A9.1D: Opening list parameters

- Precondition: `FrappeAPI.get` is mocked to resolve an openings object.
- Action: Call `getJobOpening` once with empty strings for the search term and the e-mail, once with both set.
- Expected result: The first passes `{ page: "2", limit: "25" }` only; the second adds `search_term` and `email` `lib/services/jobOpeningService.ts:10-30`
- Test: characterization: `tests/spec/cand-07-job-opening.test.tsx::stringifies the page and limit of the opening list and leaves out an empty search term or e-mail`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. On the deployment branch this method calls a different endpoint with different parameter names (header).
- Evidence: UNVERIFIED

<a id="cand-07-a9-2a"></a>
#### CAND-07-A9.2A: Raise request listing uses a pre-encoded doctype

- Precondition: `FrappeAPI.getresourceDocumentData` is mocked to resolve `{ data: [...] }`.
- Action: Call `getActionCenterMyRequestService` with a page, a limit and an e-mail.
- Expected result: The returned value is the reply's `data` array; the call named `Candidate%20Raise%20Request` with the method, page, limit, all fields and the `candidate_email` filter `lib/services/action-center.ts:12-24`
- Test: characterization: `tests/spec/cand-07-job-opening.test.tsx::asks the Candidate Raise Request resource with a percent-encoded doctype and returns only the data field`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The sibling create path spells the same doctype unencoded; see section 9, G3.
- Evidence: UNVERIFIED

<a id="cand-07-a9-3a"></a>
#### CAND-07-A9.3A: Opening list endpoint

- Precondition: `FrappeAPI.get` is mocked to resolve a one-entry list.
- Action: Call `getJobOpening` with page 1 and limit 10.
- Expected result: The call names `recruitment.api.channels.careers.list_openings` with `{ page: "1", limit: "10" }` and the reply is returned `lib/services/jobOpeningService.ts:10-30`
- Test: mapped: `tests/lib/services/jobOpeningService.test.ts::getJobOpening calls FrappeAPI.get`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The endpoint differs on the deployment branch (header). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-3b"></a>
#### CAND-07-A9.3B: Search term parameter

- Precondition: `FrappeAPI.get` is mocked to resolve a one-entry list.
- Action: Call `getJobOpening` with a search term.
- Expected result: The parameters are `{ page, limit, search_term }` `lib/services/jobOpeningService.ts:17-19`
- Test: mapped: `tests/lib/services/jobOpeningService.test.ts::getJobOpening calls FrappeAPI.get with search_term parameter`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The parameter is renamed on the deployment branch (header). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-3c"></a>
#### CAND-07-A9.3C: Campus invite openings

- Precondition: `FrappeAPI.get` is mocked to resolve an invite object.
- Action: Call `getCampusInviteOpenings` with an invite and an e-mail.
- Expected result: The call names `recruitment.api.channels.campus.get_invite_openings` with `{ campus_invite, email }` and the reply is returned `lib/services/jobOpeningService.ts:32-45`
- Test: mapped: `tests/lib/services/jobOpeningService.test.ts::getCampusInviteOpenings calls FrappeAPI.get with campus_invite`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. A call without an e-mail is not tried. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-3d"></a>
#### CAND-07-A9.3D: Careers submission

- Precondition: `FrappeAPI.post` is mocked to resolve a receipt.
- Action: Call `submitApplication` with a careers payload.
- Expected result: The post names `recruitment.api.channels.careers.submit_application` and the body is the payload as given `lib/services/jobOpeningService.ts:92-96`
- Test: mapped: `tests/lib/services/jobOpeningService.test.ts::submitApplication calls FrappeAPI.post with submit_application`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The body and the return shape differ on the deployment branch (header). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-3e"></a>
#### CAND-07-A9.3E: Campus submission

- Precondition: `FrappeAPI.post` is mocked to resolve.
- Action: Call `submitApplication` with the campus flag and an invite.
- Expected result: The post names `recruitment.api.channels.campus.submit_invite_application` with `campus_invite`, `job_opening`, `email` and `form_data` `lib/services/jobOpeningService.ts:77-90`
- Test: mapped: `tests/lib/services/jobOpeningService.test.ts::submitApplication calls submit_invite_application when isCampus is true`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The flag-without-invite branch is CAND-07-A9.1C. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-3f"></a>
#### CAND-07-A9.3F: Draft deletion

- Precondition: `FrappeAPI.post` is mocked to resolve.
- Action: Call `deleteDraftJobApplicant` with an e-mail and a job id.
- Expected result: The post names a method containing `delete_draft` with `{ job_applicant_email, job_opening }` `lib/services/jobOpeningService.ts:60-72`
- Test: mapped: `tests/lib/services/jobOpeningService.test.ts::deleteDraftJobApplicant calls FrappeAPI.post`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The sibling `getAllDrafts` is exercised only through its hook. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-3g"></a>
#### CAND-07-A9.3G: Field renaming and the empty fallback

- Precondition: `FrappeAPI.get` is mocked to resolve one raw field, then a campus call, then null.
- Action: Call `getJobApplicationForm` three times.
- Expected result: The first result renames `reference_name`, `display_name`, `reqd` and `section` into `fieldname`, `label`, `is_mandatory` and `tab_label` with the constant `section_label` of `Details`; the campus call switches the endpoint; the null reply yields `{ fields: [] }` `lib/services/jobOpeningService.ts:116-131`
- Test: mapped: `tests/lib/services/jobOpeningService.test.ts::getJobApplicationForm returns data or fallback`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The error path is CAND-07-A9.1A. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-4a"></a>
#### CAND-07-A9.4A: Action centre items

- Precondition: `FrappeAPI.get` is mocked to resolve an items object.
- Action: Call `getActionCenterData` with an e-mail.
- Expected result: The call names `recruitment.api.action_center.get_action_center_items` in full with `{ candidate_email }` and the reply is returned `lib/services/action-center.ts:4-9`
- Test: mapped: `tests/lib/services/action-center.test.ts::getActionCenterData calls FrappeAPI.get with correct arguments`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The item shape is not pinned. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-4b"></a>
#### CAND-07-A9.4B: Raise request creation

- Precondition: `FrappeAPI.getresourceDocumentData` is mocked to resolve `{ data: {...} }`.
- Action: Call `createCandidateRaiseRequest` with a payload.
- Expected result: The call names `Candidate Raise Request` with `{ method: "POST", data }` and only the reply's `data` is returned `lib/services/action-center.ts:26-34`
- Test: mapped: `tests/lib/services/action-center.test.ts::createCandidateRaiseRequest calls FrappeAPI.getresourceDocumentData correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The doctype spelling differs from the listing path; see section 9, G3. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-5a"></a>
#### CAND-07-A9.5A: Saved jobs read

- Precondition: `FrappeAPI.get` is mocked to resolve a saved-job list.
- Action: Call `getSavedJobs` with an e-mail.
- Expected result: The call names `recruitment.api.channels.careers.get_saved_job_openings` in full with `{ candidate_email }` and the reply is returned `lib/services/savedJobsService.ts:4-11`
- Test: mapped: `tests/lib/services/savedJobsService.test.ts::getSavedJobs calls FrappeAPI.get`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. An empty e-mail is not tried; the service has no guard. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a9-5b"></a>
#### CAND-07-A9.5B: Saved job toggle

- Precondition: `FrappeAPI.post` is mocked to resolve a toggle result.
- Action: Call `toggleSavedJob` with an e-mail and a job id.
- Expected result: The post names `recruitment.api.channels.careers.toggle_saved_job_opening` in full with `{ candidate_email, job_opening }` and the reply is returned `lib/services/savedJobsService.ts:13-21`
- Test: mapped: `tests/lib/services/savedJobsService.test.ts::toggleSavedJob calls FrappeAPI.post`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Whether the backend saved or unsaved is decided server-side and not pinned. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a10"></a>
### CAND-07-A10: Job opening, saved job and action centre hooks

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A10.1A](07-services-and-hooks.md#cand-07-a10-1a) | enabled false keeps it idle and the key carries every list parameter. | [`stays idle only when enabled is explicitly false and keys the list on every list parameter`](../../../tests/spec/cand-07-job-opening.test.tsx) |
| [CAND-07-A10.1B](07-services-and-hooks.md#cand-07-a10-1b) | A flat campus reply is reshaped into a single-page result whose limit falls back to ten when empty. | [`builds a single-page result from a flat campus reply and falls back to a limit of ten when the invite lists nothing`](../../../tests/spec/cand-07-job-opening.test.tsx) |
| [CAND-07-A10.2A](07-services-and-hooks.md#cand-07-a10-2a) | An empty e-mail keeps the query idle and a failure is attempted once. | [`holds the saved-jobs query back until an e-mail is known and never retries the lookup`](../../../tests/spec/cand-07-job-opening.test.tsx) |
| [CAND-07-A10.2B](07-services-and-hooks.md#cand-07-a10-2b) | The hook calls the service with the e-mail and returns its reply. | [`useGetSavedJobs queries and returns saved jobs list`](../../../tests/lib/hooks/useSavedJobs.test.tsx) |
| [CAND-07-A10.2C](07-services-and-hooks.md#cand-07-a10-2c) | A successful toggle invalidates the saved-jobs key for that e-mail. | [`useToggleSavedJob mutation triggers API call and invalidates query`](../../../tests/lib/hooks/useSavedJobs.test.tsx) |
| [CAND-07-A10.3A](07-services-and-hooks.md#cand-07-a10-3a) | Each campus opening gets name copied from job_opening and the result is one page. | [`useJobOpening fetches campus invite openings correctly and maps job_opening to name`](../../../tests/lib/hooks/useJobOpening.test.tsx) |
| [CAND-07-A10.3B](07-services-and-hooks.md#cand-07-a10-3b) | The mutation calls the submit service with the payload it was given. | [`useCreateJobApplicant calls service on mutate`](../../../tests/lib/hooks/useJobOpening.test.tsx) |
| [CAND-07-A10.3C](07-services-and-hooks.md#cand-07-a10-3c) | The drafts hook returns what the service resolved for that e-mail. | [`useGetAllDrafts fetches all drafts`](../../../tests/lib/hooks/useJobOpening.test.tsx) |
| [CAND-07-A10.3D](07-services-and-hooks.md#cand-07-a10-3d) | The hook reorders its arguments so the campus flag reaches the service in second place. | [`useJobApplicationForm fetches form correctly with isCampus = true`](../../../tests/lib/hooks/useJobOpening.test.tsx) |
| [CAND-07-A10.3E](07-services-and-hooks.md#cand-07-a10-3e) | The error callback writes to console.error and nothing else. | [`useCreateJobApplicant onError is called on failure`](../../../tests/lib/hooks/useJobOpening.test.tsx) |
| [CAND-07-A10.3F](07-services-and-hooks.md#cand-07-a10-3f) | Success logs to console.log and failure logs to console.error. | [`useDeleteDraftJobApplicant callbacks work`](../../../tests/lib/hooks/useJobOpening.test.tsx) |

<a id="cand-07-a10-1a"></a>
#### CAND-07-A10.1A: The list hook runs unless explicitly disabled

- Precondition: `FrappeAPI.get` is mocked to resolve an openings object.
- Action: Render `useJobOpening` with `enabled` false, then with a page, limit, search term and e-mail.
- Expected result: The first is in fetch status `idle` with no call; the cache then holds `["job-opening", page, limit, searchTerm, email, undefined]` `lib/hooks/useJobOpening.ts:26,49`
- Test: characterization: `tests/spec/cand-07-job-opening.test.tsx::stays idle only when enabled is explicitly false and keys the list on every list parameter`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not render the hook with `enabled` undefined to show the default.
- Evidence: UNVERIFIED

<a id="cand-07-a10-1b"></a>
#### CAND-07-A10.1B: Campus replies become one page

- Precondition: `FrappeAPI.get` is mocked to resolve `{ openings: [] }`.
- Action: Render `useJobOpening` with page 3, limit 25 and a campus invite.
- Expected result: The data is an empty openings list with pagination `{ total: 0, page: 1, limit: 10, total_pages: 1, has_more: false }` — the requested page and limit are discarded — and the call went to the campus endpoint `lib/hooks/useJobOpening.ts:28-46`
- Test: characterization: `tests/spec/cand-07-job-opening.test.tsx::builds a single-page result from a flat campus reply and falls back to a limit of ten when the invite lists nothing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The limit fallback is discussed in section 9, G4.
- Evidence: UNVERIFIED

<a id="cand-07-a10-2a"></a>
#### CAND-07-A10.2A: Saved jobs wait for an e-mail and never retry

- Precondition: `FrappeAPI.get` is mocked to reject.
- Action: Render `useGetSavedJobs` with an empty string, then with an e-mail.
- Expected result: The first is idle with no call; the second errors after exactly one call and the cache holds `["saved-jobs", email]` `lib/hooks/useSavedJobs.ts:4-10`
- Test: characterization: `tests/spec/cand-07-job-opening.test.tsx::holds the saved-jobs query back until an e-mail is known and never retries the lookup`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The QueryClient in the test also sets `retry: false`.
- Evidence: UNVERIFIED

<a id="cand-07-a10-2b"></a>
#### CAND-07-A10.2B: Saved jobs hook returns the service list

- Precondition: The saved-jobs service is mocked to resolve a list.
- Action: Render `useGetSavedJobs` with an e-mail.
- Expected result: The query succeeds with that list and the service was called with the e-mail `lib/hooks/useSavedJobs.ts:4-10`
- Test: mapped: `tests/lib/hooks/useSavedJobs.test.tsx::useGetSavedJobs queries and returns saved jobs list`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The gate and `retry: false` are CAND-07-A10.2A. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a10-2c"></a>
#### CAND-07-A10.2C: Toggling a saved job invalidates its list

- Precondition: The service is mocked to resolve; `invalidateQueries` is spied on.
- Action: Run the mutation with an e-mail and a job id.
- Expected result: The service was called with both values and `invalidateQueries` was called with `{ queryKey: ["saved-jobs", email] }` `lib/hooks/useSavedJobs.ts:13-22`
- Test: mapped: `tests/lib/hooks/useSavedJobs.test.tsx::useToggleSavedJob mutation triggers API call and invalidates query`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert the second invalidation of `["job-opening"]`. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a10-3a"></a>
#### CAND-07-A10.3A: Campus openings gain a name field

- Precondition: The service is mocked to resolve a nested `data.openings` reply with one opening.
- Action: Render `useJobOpening` with a campus invite and an e-mail.
- Expected result: The data holds the opening with `name` equal to its `job_opening`, empty columns and filters, and pagination of one row; the service was called with the invite and the e-mail `lib/hooks/useJobOpening.ts:28-46`
- Test: mapped: `tests/lib/hooks/useJobOpening.test.tsx::useJobOpening fetches campus invite openings correctly and maps job_opening to name`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The empty-invite fallback of the limit is CAND-07-A10.1B. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a10-3b"></a>
#### CAND-07-A10.3B: Application creation forwards the payload

- Precondition: The service is mocked to resolve a receipt.
- Action: Run the mutation with a payload.
- Expected result: The mutation succeeds and the service's first argument is that payload `lib/hooks/useJobOpening.ts:53-61`
- Test: mapped: `tests/lib/hooks/useJobOpening.test.tsx::useCreateJobApplicant calls service on mutate`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. The `["job-opening"]` invalidation is not asserted. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a10-3c"></a>
#### CAND-07-A10.3C: Draft listing

- Precondition: The draft service is mocked to resolve a one-entry list.
- Action: Render `useGetAllDrafts` with an e-mail.
- Expected result: The query succeeds and holds that list `lib/hooks/useJobOpening.ts:64-71`
- Test: mapped: `tests/lib/hooks/useJobOpening.test.tsx::useGetAllDrafts fetches all drafts`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Neither the key, the e-mail gate nor `retry: false` is asserted. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a10-3d"></a>
#### CAND-07-A10.3D: Application form hook passes the campus flag

- Precondition: The service is mocked to resolve a field list.
- Action: Render `useJobApplicationForm` with a job opening, a form name and the campus flag.
- Expected result: The service was called with the job opening, `true`, and two undefined values — the hook's `form_name` argument is not forwarded `lib/hooks/useJobOpening.ts:81-89`
- Test: mapped: `tests/lib/hooks/useJobOpening.test.tsx::useJobApplicationForm fetches form correctly with isCampus = true`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. `form_name` only reaches the query key; see section 9, G5. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a10-3e"></a>
#### CAND-07-A10.3E: A failed application creation only logs

- Precondition: `console.error` is spied on; the service is mocked to reject.
- Action: Run the mutation and wait for the error state.
- Expected result: The mutation ends in error and `console.error` was called `lib/hooks/useJobOpening.ts:59`
- Test: mapped: `tests/lib/hooks/useJobOpening.test.tsx::useCreateJobApplicant onError is called on failure`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. It does not assert the log text, nor that no cache was touched. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a10-3f"></a>
#### CAND-07-A10.3F: Draft deletion logs on both paths

- Precondition: Both console methods are spied on; the service resolves, then rejects.
- Action: Run the mutation twice.
- Expected result: The first succeeds and `console.log` was called; the second errors and `console.error` was called `lib/hooks/useJobOpening.ts:73-78`
- Test: mapped: `tests/lib/hooks/useJobOpening.test.tsx::useDeleteDraftJobApplicant callbacks work`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. No cache is invalidated by this hook and that is not asserted. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a11"></a>
### CAND-07-A11: Legacy modules

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-07-A11.1A](07-services-and-hooks.md#cand-07-a11-1a) | A request carries a token Authorization header and the endpoint is appended to the configured URL. | [`sends authenticated request with token header`](../../../tests/lib/services/frappe-env.test.ts) |
| [CAND-07-A11.1B](07-services-and-hooks.md#cand-07-a11-1b) | An unauthorised status raises FrappeAuthError. | [`throws FrappeAuthError on 401`](../../../tests/lib/services/frappe-env.test.ts) |
| [CAND-07-A11.1C](07-services-and-hooks.md#cand-07-a11-1c) | A second read inside the cache window makes no further database call. | [`caches config for 5 minutes (no second DB call)`](../../../tests/lib/services/frappe-env.test.ts) |
| [CAND-07-A11.2A](07-services-and-hooks.md#cand-07-a11-2a) | syncAll returns the three results and a summary of their counts. | [`syncAll runs all syncs and returns summary`](../../../tests/lib/services/sync.test.ts) |
| [CAND-07-A11.3A](07-services-and-hooks.md#cand-07-a11-3a) | The URL carries the client id, the encoded redirect URI and the caller's state. | [`generateAuthUrl returns correct URL`](../../../tests/lib/services/sso.test.ts) |
| [CAND-07-A11.4A](07-services-and-hooks.md#cand-07-a11-4a) | A thrown send is counted as failed and the next message is still attempted. | [`sendBulkEmails handles failures`](../../../tests/lib/services/email.test.ts) |
| [CAND-07-A11.5A](07-services-and-hooks.md#cand-07-a11-5a) | An unrecognised domain makes the detector ask the Frappe Employee lookup. | [`falls back to Frappe when domain is not recognized`](../../../tests/lib/services/employee-detection.test.ts) |
| [CAND-07-A11.6A](07-services-and-hooks.md#cand-07-a11-6a) | The error message lists exactly which required steps hold no data. | [`error message includes specific missing step names`](../../../tests/lib/services/onboarding.test.ts) |

<a id="cand-07-a11-1a"></a>
#### CAND-07-A11.1A: The legacy client authenticates with an API token

- Precondition: `fetch` is replaced; a client is built with an API key and secret.
- Action: Call `request` for a resource path containing a space.
- Expected result: One request is made, its URL encodes the space as `%20`, the `Authorization` header is the word `token` followed by the API key and secret joined by a colon, and the parsed body is returned `lib/services/frappe-env.ts:34-45,78-114`
- Test: mapped: `tests/lib/services/frappe-env.test.ts::sends authenticated request with token header`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Legacy module: no live file imports it (section 9, G1). The username and password login branch is not exercised. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a11-1b"></a>
#### CAND-07-A11.1B: A 401 is an auth error, not an API error

- Precondition: `fetch` answers a 401.
- Action: Call `request`.
- Expected result: The promise rejects with a `FrappeAuthError` `lib/services/frappe-env.ts:96-98`
- Test: mapped: `tests/lib/services/frappe-env.test.ts::throws FrappeAuthError on 401`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Legacy module (section 9, G1). The 403 twin and the `FrappeApiError` branch are unmapped (section 10). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a11-1c"></a>
#### CAND-07-A11.1C: The environment config is cached

- Precondition: The Supabase client is mocked to return one active environment row.
- Action: Call `getActiveConfig` twice in a row.
- Expected result: Both return the same configuration and the Supabase table was queried exactly once `lib/services/frappe-env.ts:249-277`
- Test: mapped: `tests/lib/services/frappe-env.test.ts::caches config for 5 minutes (no second DB call)`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Legacy module (section 9, G1). It does not advance time past the five-minute window. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a11-2a"></a>
#### CAND-07-A11.2A: The legacy sync adds its three runs into one summary

- Precondition: The Supabase client and a Frappe client are mocked; every fetch answers an empty data array.
- Action: Call `syncAll` with a batch size.
- Expected result: The result carries `jobs`, `applications`, `companies` and a `summary` whose `total_created` is 0 `lib/services/sync.ts:546-574`
- Test: mapped: `tests/lib/services/sync.test.ts::syncAll runs all syncs and returns summary`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Legacy module (section 9, G1). The per-entity sync branches are unmapped (section 10). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a11-3a"></a>
#### CAND-07-A11.3A: The legacy SSO authorise URL

- Precondition: A provider is built with a synthetic URL, client id and secret.
- Action: Call `generateAuthUrl` with a state and a redirect URI.
- Expected result: The string contains `client_id=`, `state=` and the percent-encoded `redirect_uri=` `lib/services/sso.ts:31-40`
- Test: mapped: `tests/lib/services/sso.test.ts::generateAuthUrl returns correct URL`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Legacy module (section 9, G1). The scope and `response_type` are not asserted. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a11-4a"></a>
#### CAND-07-A11.4A: Bulk mail counts a failure instead of stopping

- Precondition: The mail transport is mocked to reject once and then resolve; `console.error` is spied on.
- Action: Call `sendBulkEmails` with two messages and no delay.
- Expected result: The result is one sent and one failed; the loop did not stop at the rejection `lib/services/email.ts:215-257`
- Test: mapped: `tests/lib/services/email.test.ts::sendBulkEmails handles failures`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Legacy module (section 9, G1). The delay branch is not exercised because the delay is zero. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a11-5a"></a>
#### CAND-07-A11.5A: Employee detection falls back to Frappe

- Precondition: The Supabase domain lookup answers nothing; the Frappe client reports an employee.
- Action: Call `detectInternal` with an e-mail.
- Expected result: The result is internal with the method `frappe_lookup`, so the domain check ran first and the Frappe check second `lib/services/employee-detection.ts:50-59`
- Test: mapped: `tests/lib/services/employee-detection.test.ts::falls back to Frappe when domain is not recognized`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Legacy module (section 9, G1). It does not assert that the profile row was written. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-07-a11-6a"></a>
#### CAND-07-A11.6A: Review submission names the missing steps

- Precondition: The Supabase lookup answers a record with only some of the seven required steps filled.
- Action: Call `submitForReview`.
- Expected result: It rejects with `Missing required steps:` followed by the names of the steps with no data `lib/services/onboarding.ts:49-67`
- Test: mapped: `tests/lib/services/onboarding.test.ts::error message includes specific missing step names`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, `FrappeAPI`, the router or the service module is mocked; no real HTTP, Frappe or Supabase backend. Legacy module (section 9, G1). This is not the live onboarding flow, which is SPEC-CAND-05. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED
