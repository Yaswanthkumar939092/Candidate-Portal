# SPEC-CAND-02: Backend contract, proxy and server routes

<a id="spec-cand-02"></a>

- Stable ID: `SPEC-CAND-02`
- Described at: repo `hybrowlabs/Candidate-Portal`, branch `develop`, commit `97dbcd5d3ce79fbc49dc0ba254c7a52375fbd8e5` (committer date `2026-10-30 22:32:12 +0530`)
- Also read at: branch `deploy/hybrowbase-candidate-20261025`, commit `786b53e406869986d5d5d0c81b7ae6b1605f8315`; differs: `app/backend/[...path]/route.ts` is deleted and `middleware.ts` (a method allowlist) is added there; `app/api/parse-resume/route.ts`, `app/api/public/branding/route.ts`, `app/api/public/openings/route.ts`, `app/api/candidate-feature-flags/route.ts`, `lib/server/feature-flags.ts`, `lib/contexts/feature-flags.tsx` and `next.config.ts` are modified; `lib/frappe-api.ts`, `lib/frappe-base.ts`, `lib/frappe-error.ts`, `lib/auth.ts`, `Dockerfile` and `docker-compose.yml` are identical; no `pw-uat` branch exists in this repo; only `develop` is described
- Author: Frontend Developer (Yashwanth). Reviewer: Code Reviewer (Yashwanth), to be recorded in the PR.
- Status: DRAFT

## 1. Purpose

This clause describes how the portal reaches the Frappe backend: the base URL rule, the shared client, the same-origin proxy under `/backend`, the five server routes under `/api`, the feature-flag path, and the list of backend methods the front end calls. Issue: PWHR-1364 (parent PWHR-1362).

How a browser call travels. Browser code builds a URL from `frappeApiBase()`, which in the browser is the fixed prefix `/backend` (`lib/frappe-base.ts:17,19-29`). The Next.js route handler at `app/backend/[...path]/route.ts` forwards that request to `FRAPPE_BASE_URL` with the browser's cookie and with `Host` and `X-Frappe-Site-Name` rewritten (`app/backend/[...path]/route.ts:82-122`). The reason given in source is that the session cookie then belongs to the portal origin (`lib/frappe-base.ts:1-16`). Server code (route handlers and server components) uses the absolute `FRAPPE_BASE_URL`, else `NEXT_PUBLIC_FRAPPE_URL` (`lib/frappe-base.ts:23-25`).

Two clients exist. `FrappeAPI` (`lib/frappe-api.ts:28-198`) is for method calls, resources, blobs and uploads. `frappeMethod` in `lib/auth.ts:115-140` is a second, private client used only for the sign-in methods and described in SPEC-CAND-03. A third shape appears in `lib/services/direct-applicant-form.ts:13-31` and `lib/services/ctc-proposal.ts:11-26`, which call `fetch` directly for the token-link pages.

Server routes. `/api/health` answers process health only (`app/api/health/route.ts:3-8`). `/api/candidate-feature-flags`, `/api/public/branding` and `/api/public/openings` call Frappe with an API key and secret held in server environment (`app/api/candidate-feature-flags/route.ts:10`, `app/api/public/branding/route.ts:15-26`, `app/api/public/openings/route.ts:14-21`). `/api/parse-resume` extracts text from an uploaded PDF in the portal process (`app/api/parse-resume/route.ts:4-32`).

Backend methods the front end calls (grouped by hand from a script that listed every string literal starting `recruitment.`, plus `frappe.client.get_meta` and `upload_file`, in `app/`, `lib/` and `components/` at `Described at`, leaving out the four legacy service files named in G5). HTTP verb is the `FrappeAPI` method used, or the `fetch` options where the call is direct.

| Backend method (under `/api/method/`) | Verb | Called from |
|---|---|---|
| `recruitment.api.candidate_auth.{signup, login, request_otp, request_email_signup_otp, verify_otp, logout, set_password, me, get_auth_settings}` | POST, except `me` and `get_auth_settings` GET | `lib/auth.ts:4,202-279` (SPEC-CAND-03) |
| `recruitment.api.candidate_auth.get_auth_page_content` | GET | `lib/services/auth-page-content.ts:25` |
| `recruitment.api.candidate_auth.update_me`, `.change_password` | POST | `lib/services/profileService.ts:20,35` |
| `recruitment.api.candidate_portal.get_website_branding` | GET | `lib/services/candidate-branding.ts:12`, `app/api/public/branding/route.ts:24` |
| `recruitment.api.candidate_portal.get_candidate_feature_flags` | GET, API key | `lib/server/feature-flags.ts:34` |
| `recruitment.api.candidate_portal.get_candidate_portal_form` | GET | `lib/services/candidate-onboarding.ts:6,15` |
| `recruitment.api.candidate_portal.get_link_field_options` | GET | `lib/services/link-field.ts:34` |
| `recruitment.api.candidate_portal_survey.{get_post_login_route, submit_survey}` | GET, POST | `lib/services/survey.ts:7,13` |
| `recruitment.api.candidate_home.get_home_content` | GET | `lib/services/home.ts:7` |
| `recruitment.api.onboarding_dashboard.get_dashboard` | GET | `lib/services/dashboard.ts:8,15` |
| `recruitment.api.employee_onboarding.update_onboarding_details` | POST | `lib/services/candidate-onboarding.ts:8,35` |
| `recruitment.api.action_center.get_action_center_items` | GET | `lib/services/action-center.ts:6` |
| `recruitment.api.channels.careers.{list_openings, get_draft, get_applied_jobs, get_saved_job_openings, get_application_fields}` | GET | `lib/services/jobOpeningService.ts:27,54,116`, `lib/services/applicantStatusService.ts:29`, `lib/services/savedJobsService.ts:6` |
| `recruitment.api.channels.careers.{delete_draft, submit_application, toggle_saved_job_opening}` | POST | `lib/services/jobOpeningService.ts:70,96`, `lib/services/savedJobsService.ts:15` |
| `recruitment.api.channels.campus.{get_invite_openings, get_application_fields}` | GET | `lib/services/jobOpeningService.ts:44,115` |
| `recruitment.api.channels.campus.submit_invite_application` | POST | `lib/services/jobOpeningService.ts:84` |
| `recruitment.api.channels.pre_offer.{get_application_fields, get_form_state}` | GET | `lib/services/pre-offer.ts:18,36` |
| `recruitment.api.channels.pre_offer.submit_application` | POST | `lib/services/pre-offer.ts:44` |
| `recruitment.api.draft_application.get_job_applicant` | GET | `lib/services/applicantStatusService.ts:38` |
| `recruitment.api.joining_day.get_my_non_working_days` | GET (direct `fetch`) | `lib/hooks/useNonWorkingDays.ts:37` |
| `recruitment.api.ctc_proposal_portal.{get_proposal, get_my_proposal}` | GET | `lib/services/ctc-proposal.ts:9,40-41` |
| `recruitment.api.ctc_proposal_portal.{respond, respond_my_proposal}` | POST | `lib/services/ctc-proposal.ts:44-48` |
| `recruitment.api.direct_applicant_portal.{get_form, get_my_form, search_link, search_my_link}` | GET | `lib/services/direct-applicant-form.ts:9,50-60` |
| `recruitment.api.direct_applicant_portal.{upload_file, upload_my_file, submit_form, submit_my_form}` | POST | `lib/services/direct-applicant-form.ts:63-80` |
| `recruitment.job_offer_utils.{get_job_offer_summary, get_rejection_reasons, get_job_offer_status, download_job_offer_pdf}` | GET | `lib/services/jobOffer.ts:92,96,163,229` |
| `recruitment.job_offer_utils.job_offer_update` | POST | `lib/services/jobOffer.ts:153` |
| `recruitment.job_offer_utils.download_job_offer_pdf`, `.preview_culture_book` as URLs | GET (browser fetch or link) | `lib/services/jobOffer.ts:107,116,132` |
| `recruitment.recruitment.doctype.dpdp_act_settings.dpdp_act_settings.get_consent_form` | GET | `lib/services/jobOffer.ts:168` |
| `recruitment.dpdp_external_consent.{start_consent_session, get_consent_session_status}` | POST, GET | `lib/services/jobOffer.ts:192,212` |
| `recruitment.dpdp_consent.submit_dpdp_consent` | POST | `lib/services/jobOffer.ts:219` |
| `frappe.client.get_meta` | GET | `components/pre-offer-form/ChildTable.tsx:93` (via `FrappeAPI`), `components/jobs/job-applicant/ChildTable.tsx:87` (relative URL, see G6) |
| `upload_file` (Frappe built-in) | POST multipart | `lib/frappe-api.ts:41` |

Resources (under `/api/resource/`): `Candidate Raise Request`, read as a list and created by `POST` (`lib/services/action-center.ts:14,28`); `Job Opening` and `Employment Type`, read with the API key by the server route (`app/api/public/openings/route.ts:30,36`).

Callers of these methods are specced in PWHR-1366 (onboarding, dashboard, jobs, offer, survey) and not here.

## 2. Boundaries

- In: `lib/frappe-base.ts`, `lib/frappe-error.ts`, `lib/frappe-api.ts`, `app/backend/[...path]/route.ts`, `app/api/health/route.ts`, `app/api/candidate-feature-flags/route.ts`, `app/api/public/branding/route.ts`, `app/api/public/openings/route.ts`, `app/api/parse-resume/route.ts`, `lib/server/feature-flags.ts`, `lib/services/feature-flags.ts`, `lib/contexts/feature-flags.tsx`, `lib/hooks/useCandidateFeatureFlags.ts`, `lib/services/candidate-branding.ts`, `lib/services/auth-page-content.ts`, `lib/services/uploadProofFile.ts`, `next.config.ts`, `Dockerfile`, `docker-compose.yml`, `.github/workflows/pr-checks.yml`.
- Out: `lib/auth.ts` (SPEC-CAND-03); pages and hooks that call the services (SPEC-CAND-01 for the session, PWHR-1366 for the rest). `lib/careers/openings.ts` is used by the openings route and is read only as far as the route calls it.
- Legacy, read for the importer scan only: `lib/supabase*.ts`, `lib/middleware/*`, `lib/api-utils.ts`, `lib/utils/{api,response,errors}.ts`, `lib/services/{sso,sync,email,onboarding,employee-detection,frappe-env}.ts` (G5).
- Extension points: a new backend call is a new `FrappeAPI.get` or `.post` with a method name; there is no registry. A new server route is a new `route.ts` under `app/api`.

## 3. Behaviour rules

### A1: Base URL and client

- A1.1: On the server `frappeApiBase()` returns `FRAPPE_BASE_URL`, else `NEXT_PUBLIC_FRAPPE_URL`, else an empty string, with one trailing slash removed (`lib/frappe-base.ts:20,23-25`). [CAND-02-A1.1A]
- A1.2: In the browser it always returns `/backend`, whatever the environment says (`lib/frappe-base.ts:29`). [CAND-02-A1.1B]
- A1.3: `frappeErrorMessage` joins the `message` of every entry of `_server_messages` with a newline after removing HTML tags and blank entries; failing that it removes a leading `module.Class:` from `exception`; failing that it returns the fallback (`lib/frappe-error.ts:4-26`). [CAND-02-A1.2A]
- A1.4: `FrappeAPI` throws on a non-OK response with this text, in order: `message.message`, `message` (both only when a non-blank string), the `frappeErrorMessage` result, and `API request failed: <statusText>` or `API request failed (<status>)` when the body is not JSON (`lib/frappe-api.ts:13-26`). [CAND-02-A1.3A]
- A1.5: Every `FrappeAPI` call sends `credentials: "include"`; `post` sends a JSON body with `Content-Type: application/json`; `get` and `getBlob` put parameters in the query string; `getResource` turns `%5B` and `%5D` back into `[` and `]` (`lib/frappe-api.ts:40-47,57-73,75-95,97-112,114-132`). [CAND-02-A1.3B]
- A1.6: `get`, `post` and `uploadFile` return the `message` property of the reply; `getResource` and `getresourceDocumentData` return the whole body; `getBlob` returns the response blob (`lib/frappe-api.ts:53-54,71-72,93-94,111,130-131,196`). [CAND-02-A1.3B] [CAND-02-A1.3C] [CAND-02-A1.3D]
- A1.7: `getresourceDocumentData` defaults to `GET`, page 1 and limit 20; for a list it sends `fields` and `filters` as JSON strings plus `limit_page_length` and `limit_start = (page - 1) * limit`; for a non-GET method it sends `data` as the JSON body (`lib/frappe-api.ts:148-190`). [CAND-02-A1.3C]
- A1.8: `uploadFile(file, docName?, doctype?)` posts multipart form data with `file`, and `doctype` and `docname` only when given; it sets no `Content-Type` header (`lib/frappe-api.ts:29-47`). [CAND-02-A1.3D]
- A1.9: `fileUploadService.uploadFile(file, doctype, docName)` calls `FrappeAPI.uploadFile(file, "", docName, doctype)`, so its `docName` reaches the `doctype` form field and the fourth argument is ignored (`lib/services/uploadProofFile.ts:11`, `lib/frappe-api.ts:29-33`). [CAND-02-A1.4A] [CAND-02-A1.4B]

### A2: Server routes that use the API key

- A2.1: `getServerFeatureFlags` returns `{}` without calling Frappe when the URL, key or secret is missing, calls `get_candidate_feature_flags` with `Authorization: token <key>:<secret>` and `cache: "no-store"`, turns each value into true only for `1`, `true`, `"1"` or `"true"`, and returns `{}` on a non-OK reply or a thrown error (`lib/server/feature-flags.ts:5-7,23-49`). [CAND-02-A2.1A]
- A2.2: `isServerFeatureEnabled(key)` is true only when that flag is `true` after the conversion above (`lib/server/feature-flags.ts:51-54`). [CAND-02-A2.1B]
- A2.3: `GET /api/candidate-feature-flags` answers 500 with `{ error: "Frappe API credentials are not configured" }` when the URL, key or secret is missing and otherwise `{ flags }`; it checks no session (`app/api/candidate-feature-flags/route.ts:4-19`). [CAND-02-A2.2A]
- A2.4: `GET /api/public/branding` returns `{ branding }` from `get_website_branding` with `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`, and returns `{ branding: {} }` with status 200 and no cache header when credentials are missing, the reply is not OK or the call throws (`app/api/public/branding/route.ts:9-41`). [CAND-02-A2.3A]
- A2.5: `GET /api/public/openings` reads `Job Opening` filtered to `status = Open`, ordered `posted_on desc`, 500 rows, with the whitelisted fields, and `Employment Type` with `limit_page_length` 0, in parallel, both with the API key header; it returns `{ openings }` normalised by `listLiveOpenings` with `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` (`app/api/public/openings/route.ts:21-58`). [CAND-02-A2.4A]
- A2.6: The openings route answers 500 `{ error: "Frappe API credentials are not configured" }` without credentials and 502 `{ error: "Failed to fetch open jobs" }` when the openings read is not OK or anything throws; a failed `Employment Type` read is ignored and the raw type name is used (`app/api/public/openings/route.ts:17-19,42-44,47-52,59-61`). [CAND-02-A2.4B]
- A2.7: `POST /api/parse-resume` reads `formData`, answers 400 `{ error: "Invalid file" }` when `file` is missing or not a `File`, otherwise runs `pdf-parse` on the bytes and returns `{ text }`; it has no session check, no size limit and no content-type check (`app/api/parse-resume/route.ts:6-23`). [CAND-02-A2.5A]
- A2.8: A parser or form-data error answers 500 with `{ error: <error.message> }` and logs the error (`app/api/parse-resume/route.ts:25-31`). [CAND-02-A2.5B]

### A3: The /backend proxy

- A3.1: The proxy copies every client request header except `host`, the three `x-forwarded-*` headers, the hop-by-hop headers and `content-length`, then sets `host` to the backend host and `x-frappe-site-name` to the backend hostname (`app/backend/[...path]/route.ts:51-65,93-103`). [CAND-02-A3.1A]
- A3.2: It builds the upstream URL as `FRAPPE_BASE_URL` with the pathname `/` plus the catch-all segments joined by `/` and the original query string (`app/backend/[...path]/route.ts:88-91`). [CAND-02-A3.4A] [CAND-02-A3.4B]
- A3.3: For methods other than GET and HEAD it streams the request body with `duplex: "half"`; GET and HEAD carry no body; every call uses `redirect: "manual"` and `cache: "no-store"` (`app/backend/[...path]/route.ts:105-119`). [CAND-02-A3.1B]
- A3.4: The proxy exports one handler for each of GET, POST, PUT, PATCH, DELETE, OPTIONS and HEAD, with runtime `nodejs` and `force-dynamic`; it has no path or method allowlist (`app/backend/[...path]/route.ts:3,6,138-144`). [CAND-02-A3.1C]
- A3.5: It returns the upstream status, status text and body and every upstream header except the hop-by-hop ones, `content-encoding` and `content-length`; it appends repeated headers, so `Set-Cookie` passes through (`app/backend/[...path]/route.ts:69-80,124-135`). [CAND-02-A3.2A]
- A3.6: When the upstream `fetch` throws it answers 502 `{ error: "Backend request failed" }`; an upstream redirect is returned as it is, not followed (`app/backend/[...path]/route.ts:108-122`). [CAND-02-A3.2B]
- A3.7: It answers 503 `{ error: "Backend unavailable" }` and makes no upstream call when `FRAPPE_BASE_URL` is empty, is not `http` or `https`, carries a user name, password, query or hash, or has a path other than `/`; `NEXT_PUBLIC_FRAPPE_URL` is not consulted (`app/backend/[...path]/route.ts:27-45,83-86`). [CAND-02-A3.3A]
- A3.8: A catch-all of `["", "evil.test", "file"]` still goes to the configured host, because only the pathname is assigned (`app/backend/[...path]/route.ts:89-90`). [CAND-02-A3.4B]

### A4: Health and feature flags in the browser

- A4.1: `GET /api/health` returns `{ status: "ok" }` with `Cache-Control: no-store`, is `force-dynamic`, and does not call the backend (`app/api/health/route.ts:1-8`). [CAND-02-A4.1A] [CAND-02-A4.1B]
- A4.2: `featureFlagsService.getFeatureFlags` calls `GET /api/candidate-feature-flags` with `credentials: "include"`, returns `flags`, and throws `Feature flags request failed: <statusText>` when the reply is not OK (`lib/services/feature-flags.ts:2-14`). [CAND-02-A4.2A] [CAND-02-A4.2B]
- A4.3: `useCandidateFeatureFlags` caches for 5 minutes, keeps for 30, does not retry and does not refetch on focus (`lib/hooks/useCandidateFeatureFlags.ts:11-14`).
- A4.4: `FeatureFlagProvider` layers the built-in defaults, then `initialFlags`, then the remote flags, and a remote value is true only for `1` or `true`; a remote string `"1"` or `"true"` is false there, unlike the server rule in A2.1 (`lib/contexts/feature-flags.tsx:17-33,49-57`). [CAND-02-A4.3A]
- A4.5: `isEnabled` is false for a flag that is missing or not a boolean; `getFlag` returns the caller's default only when the flag is undefined (`lib/contexts/feature-flags.tsx:65-76`). [CAND-02-A4.3B]
- A4.6: `useFeatureFlags` throws `useFeatureFlags must be used within a FeatureFlagProvider` outside the provider (`lib/contexts/feature-flags.tsx:95-101`).

### A5: Branding and page-content services

- A5.1: `candidateBrandingService.getCandidateBranding` calls `FrappeAPI.get("recruitment.api.candidate_portal.get_website_branding")` with no parameters (`lib/services/candidate-branding.ts:10-14`). [CAND-02-A5.1A]
- A5.2: `authPageContentService.getAuthPageContent` calls `FrappeAPI.get("recruitment.api.candidate_auth.get_auth_page_content")` with no parameters (`lib/services/auth-page-content.ts:24-28`). [CAND-02-A5.2A]

## 4. Data and permissions

- No data is stored by this layer. The session cookie is set by Frappe and passes through the proxy in both directions (`app/backend/[...path]/route.ts:96,127`).
- Permission is the backend's. The client sends the cookie and nothing else; it reads no role. The server routes act with one API key and secret shared by all callers, so `/api/public/*` and `/api/candidate-feature-flags` return the same answer to any visitor (`app/api/public/openings/route.ts:21`, `app/api/candidate-feature-flags/route.ts:17-18`).
- `/api/public/openings` returns only the fields named in `PUBLIC_OPENING_FIELDS` (`lib/careers/openings.ts:4-23`, `app/api/public/openings/route.ts:31`).
- The upstream cannot read the visitor's address from forwarded headers: the proxy drops `x-forwarded-for`, `x-forwarded-host` and `x-forwarded-proto` and sets none (`app/backend/[...path]/route.ts:53-55,93-98`). Whether the backend needs them was not read.
- Statutory source: not applicable.

## 5. Errors and edge behaviour

- Client error text comes from the backend (`message`, `_server_messages`, `exception`) and is shown by callers as given (`lib/frappe-api.ts:21-25`, `lib/frappe-error.ts:7-24`).
- `frappeErrorMessage` swallows a malformed `_server_messages` and falls through to `exception` (`lib/frappe-error.ts:6-22`).
- `getBlob` and the proxy cope with non-JSON bodies; `FrappeAPI.get` does not: a 200 reply that is not JSON makes `res.json()` throw a `SyntaxError` (`lib/frappe-api.ts:71`). [INFERENCE: `Response.json` behaviour not run here]
- The proxy turns any upstream network failure into one fixed 502 body; the cause is not logged (`app/backend/[...path]/route.ts:120-122`).
- The branding, flags and openings routes hide upstream status from the browser: branding and flags degrade to empty or 500, openings to 502 (`app/api/public/branding/route.ts:30,38-39`, `lib/server/feature-flags.ts:40,46-47`, `app/api/public/openings/route.ts:42-44,59-61`).
- `app/api/parse-resume/route.ts` returns the internal error message of the parser to the caller (`app/api/parse-resume/route.ts:28-31`).

## 6. Configuration

Names only. Readers are from a script run over `app/`, `lib/`, `components/` and `next.config.ts` at `Described at`; no value is written here.

| Name | Read at | Used for |
|---|---|---|
| `NEXT_PUBLIC_FRAPPE_URL` | `lib/frappe-base.ts:20`, `lib/server/feature-flags.ts:12`, `app/api/public/branding/route.ts:12`, `app/api/public/openings/route.ts:13`, `app/api/candidate-feature-flags/route.ts:7`, `app/layout.tsx:38`, `components/auth-form.tsx:64`, `components/brand-lockup.tsx:9`, `components/dynamic-favicon.tsx:20`, `next.config.ts:5` | backend URL fallback on the server, image URLs, image host; also a build argument (`Dockerfile:22,29`) |
| `FRAPPE_BASE_URL` | `lib/frappe-base.ts:24`, `app/backend/[...path]/route.ts:28`, and the three server routes and `lib/server/feature-flags.ts:11` | runtime backend URL; the only variable the proxy reads |
| `FRAPPE_API_KEY`, `FRAPPE_API_SECRET` | `lib/server/feature-flags.ts:25-26`, `app/api/public/branding/route.ts:15-16`, `app/api/public/openings/route.ts:14-15`, `app/api/candidate-feature-flags/route.ts:10` | server-side token for guest routes (secret) |
| `FRAPPE_USERNAME`, `FRAPPE_PASSWORD` | `lib/services/frappe-env.ts:294-295,412-413` | legacy module only (G5) (secret) |
| `FRAPPE_WEBHOOK_SECRET` | `docker-compose.yml:30` only; no source file reads it | passed to the container, unused (G5) (secret) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase.ts:4-5`, `lib/supabase-admin.ts:7-8` | legacy modules only (G5); `Dockerfile:19-20,33` and `docker-compose.yml:6-7,24` still pass them |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, `FROM_NAME` | `lib/services/email.ts:89-99` | legacy module only (G5) |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` | `Dockerfile:21,23-24,28,30-31`, `docker-compose.yml:8,10-11,20,22-23`; no source file under `app/`, `lib/` or `components/` reads them | build arguments with no reader |
| `NODE_ENV` | `next.config.ts:6`, `app/(portal)/job_offer/page.tsx:287`, `lib/utils/errors.ts:158,173,233,241` | development image host; test branch; error detail |
| `PORT` | `docker-compose.yml:15`; image sets `PORT=3000` (`Dockerfile:42`) | listen port |

Build and image facts. `output: "standalone"` (`next.config.ts:40`); `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are both true (`next.config.ts:42-47`); server actions allow the origin `localhost:3000` (`next.config.ts:48-52`); remote images are allowed from the Frappe host, `images.unsplash.com` and `upload.wikimedia.org` (`next.config.ts:18-30,55`). The image is a multi-stage build ending on a pinned distroless Node 22 base, runs as user 1001 with a health check (`Dockerfile:36,52,55`) and builds with `SUPABASE_SERVICE_ROLE_KEY` set to a placeholder string (`Dockerfile:33`). The PR workflow runs install, lint, audit, tests with coverage, build, then a container smoke test (`.github/workflows/pr-checks.yml:37-49,102`); coverage thresholds apply to `components/**` only (`vitest.config.ts:19-26`). Hosted CI results are UNVERIFIED here.

## 7. Scheduled jobs, hooks and patches

None. No scheduler, no server hooks, no patches. The container health check is the only periodic call: it runs `container-health.mjs` every 30 seconds (`Dockerfile:55`), which requests `/api/health` on `127.0.0.1` and exits 1 unless the status is 200 (`scripts/container-health.mjs:2-9`).

## 8. Static security and performance observations

- Security: the `/backend` proxy has no allowlist, forwards the visitor's cookie and all methods, and rewrites `Host`, so any Frappe whitelisted method or `/api/resource` path is reachable from the portal origin (`app/backend/[...path]/route.ts:82-144`). The branch `deploy/hybrowbase-candidate-20261025` replaces it with an allowlist. Issue: PWHR-1510.
- Security: `/api/parse-resume` is unauthenticated and uncapped, and returns parser error text (`app/api/parse-resume/route.ts:4-32`). Issue: PWHR-1511.
- Security: three routes hold one shared API key and secret and answer any caller; the openings route can read `Job Opening` for anyone, filtered to the whitelisted fields (`app/api/public/openings/route.ts:21,31`). Whether the key's permission is limited to those reads was not checked here.
- Security: the proxy sets no response header of its own and passes upstream `Set-Cookie` through (`app/backend/[...path]/route.ts:124-135`).
- Security: `FRAPPE_WEBHOOK_SECRET` and Supabase service-role variables are injected into the runtime container although no live source reads them (`docker-compose.yml:24,30`). Issue: PWHR-1515.
- Security: type errors and lint errors do not fail the build (`next.config.ts:42-47`); `tsc` reports 22 errors at `Described at`, 5 outside `tests/`. Issue: PWHR-1514.
- Security: no secret value appears in any file read for this clause; secret scan with a script over tracked files at `Described at` found one placeholder `password` literal in `agents/backend-agent.md:1816` (documentation, not a credential). [script result; not a full secret audit]
- Performance: each careers page render calls the flag method with `cache: "no-store"` (`app/(public)/layout.tsx:8`, `lib/server/feature-flags.ts:36-38`) and each portal page waits for `/api/candidate-feature-flags` before it renders (`lib/contexts/feature-flags.tsx:133-145`, `app/(portal)/layout.tsx:56-57`).
- Performance: the openings route fetches up to 500 rows including `description` on every cache miss and filters closed ones in memory (`app/api/public/openings/route.ts:30-35,54-56`, `lib/careers/openings.ts:4-23,69`). Edge cache is 60 seconds.
- Performance: `/api/parse-resume` reads the whole upload into memory (`app/api/parse-resume/route.ts:16-17`).
- Performance: the proxy streams request and response bodies and does no buffering of its own (`app/backend/[...path]/route.ts:113-116,131`).
- Performance: the inline `get_meta` fetch in `components/jobs/job-applicant/ChildTable.tsx:86-89` has no cache; the same doctype meta is fetched on each mount of the table. [INFERENCE: mount frequency not observed]

## 9. Known gaps / open questions

- G1: `/backend` has no allowlist (A3.4). Issue: PWHR-1510.
- G2: `/api/parse-resume` is open and returns error text (A2.7, A2.8). Issue: PWHR-1511.
- G3: `fileUploadService.uploadFile` passes arguments in the wrong order (A1.9). Issue: PWHR-1513.
- G4: The build ignores type and lint errors (section 6). Issue: PWHR-1514.
- G5: Legacy modules are unreferenced by live code but still wired into the image build. A script found no importer outside the legacy set for `lib/supabase.ts`, `lib/supabase-admin.ts`, `lib/middleware/auth.ts` and `rate-limit.ts`, `lib/api-utils.ts`, `lib/utils/api.ts`, `lib/utils/response.ts`, `lib/utils/errors.ts`, `lib/services/sso.ts`, `sync.ts`, `email.ts`, `onboarding.ts`, `employee-detection.ts` and `frappe-env.ts`; tests for them exist under `tests/lib/` and are not mapped. Issue: PWHR-1515.
- G6: `components/jobs/job-applicant/ChildTable.tsx:86-89` calls `/api/method/frappe.client.get_meta` with a relative URL, so it bypasses `frappeApiBase()` and `credentials: "include"`. Issue: PWHR-1516.
- G7: Comments say `/backend` is rewritten by `middleware.ts` (`lib/frappe-base.ts:11`, `next.config.ts:41`), but no `middleware.ts` exists at `Described at` (`git show <commit>:middleware.ts` fails) and the route handler does the work. The branch `deploy/hybrowbase-candidate-20261025` does add one. Not filed: stale comment.
- G8: The server flag rule (`"1"` and `"true"` count as true) and the browser rule (only `1` and `true`) differ (A2.1, A4.4). Not filed: Frappe returns `1` or `0` in the cases read, so the difference is unreachable there `[INFERENCE: backend reply shape not read]`.
- G9: The proxy drops `x-forwarded-for` and does not set a replacement (A3.1, section 4). Whether the backend or a WAF needs the visitor address is a question for the owner. Not filed: product and infrastructure question.
- G10: `/api/candidate-feature-flags` and `/api/public/*` answer any caller from one shared key. Whether the key is read-only and field-limited is a backend fact not read here. Not filed: backend permission, outside this repo.
- G11: `tests/components/ui/field-renderer.test.tsx` has one failing test (the `custom_account_number` case: expected `123456`, received `12AB3456`). A full `npx vitest run` at the head that adds this spec gave 161 files, 1 failed, 1992 passed, 3 skipped (1996 tests). It is outside the scope of this clause. Issue: PWHR-1517.
- G12: Branch drift (see the header). Issue: PWHR-1518.
- G13: `lib/services/action-center.ts:14` passes the doctype as `Candidate%20Raise%20Request` and `:28` as `Candidate Raise Request`; both reach the same resource. The string is interpolated into the URL and handed to `fetch` (`lib/frappe-api.ts:158,183`), and the URL parser percent-encodes the space itself: `node -e 'console.log(new URL("http://h/api/resource/Candidate Raise Request").pathname)'` printed `/api/resource/Candidate%20Raise%20Request`, the same pathname as the pre-encoded spelling. The pre-encoding at `:14` is therefore redundant, not divergent. Not a defect: the two spellings produce one request. PWHR-1554 was filed on the premise that only one spelling survives; that premise does not hold and the issue needs re-triage.
- G14: Every case stubs `fetch`, the router, the services or the API-key routes; none talks to a real Frappe site. Hosted CI is UNVERIFIED.
- Statutory source: not applicable.

## 10. Uncovered behaviour

- A1.4 / A1.5: `tests/lib/frappe-api.test.ts` has 25 existing tests for `FrappeAPI` that are not mapped to cases; most assert with `toContain` on a URL fragment. Characterization tests were added instead for the rules that matter (CAND-02-A1.3A to CAND-02-A1.3D). Not filed: no defect.
- A1.6, `getResource` bracket handling and `getBlob` errors: exercised by existing tests but not mapped. Not filed: no test written in this pass.
- A2.5, the closing-date filter and field normalisation in `lib/careers/openings.ts`: `tests/lib/careers-openings.test.ts` exists but is not mapped (PWHR-1366 covers careers pages). Not filed: owned by PWHR-1366.
- A2.7, a real PDF through `pdf-parse`: the parser is mocked, so extraction itself is untested. Not filed: needs a fixture PDF.
- A3.4, behaviour of PUT, PATCH, DELETE and OPTIONS through the proxy: only the exports are asserted; the same function serves all of them. Not filed: no test written.
- A3.1, `x-frappe-site-name` for a host with a port: the case asserts the hostname without the port for the synthetic host used. Not filed: covered by that case.
- A4.3, query caching options of `useCandidateFeatureFlags`: no test reads them. Not filed: framework config.
- A4.6, the `useFeatureFlags` error: `tests/lib/contexts/feature-flags-context.test.tsx` has a test for it that is not mapped. Not filed: not mapped in this pass.
- `Dockerfile`, `docker-compose.yml` and the workflows: not executed. Not filed: container and CI evidence is outside the unit tests.
- `lib/services/frappe-env.ts`, `sync.ts`, `sso.ts`, `email.ts`, `onboarding.ts`, `employee-detection.ts`, `lib/middleware/*`, `lib/api-utils.ts`, `lib/utils/*`: have tests but are not mapped; see G5.
- The direct `fetch` helpers in `lib/services/direct-applicant-form.ts` and `lib/services/ctc-proposal.ts`: `tests/lib/services/direct-applicant-form.test.ts` exists but is not mapped (PWHR-1366). Not filed: owned by PWHR-1366.

## 11. Acceptance cases

Every case is `Evidence: UNVERIFIED`. Cases that map an existing test only gained a `// Spec:` comment line above the `it(`; all other cases are characterization tests added by this change in `tests/spec/`.

<a id="cand-02-a1"></a>
### CAND-02-A1: Base URL and client

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-02-A1.1A](02-api-client-and-backend-contract.md#cand-02-a1-1a) | The server base URL prefers the runtime variable, falls back, and strips one trailing slash. | [`returns the runtime FRAPPE_BASE_URL, else NEXT_PUBLIC_FRAPPE_URL, without a trailing slash`](../../../tests/spec/cand-02-frappe-client.test.ts) |
| [CAND-02-A1.1B](02-api-client-and-backend-contract.md#cand-02-a1-1b) | In the browser the base is always /backend. | [`returns the same-origin /backend prefix whatever the environment names`](../../../tests/spec/cand-02-frappe-client.test.ts) |
| [CAND-02-A1.2A](02-api-client-and-backend-contract.md#cand-02-a1-2a) | Message extraction order and fallbacks of the Frappe error parser. | [`joins _server_messages with markup stripped, else strips the exception class, else returns the fallback`](../../../tests/spec/cand-02-frappe-client.test.ts) |
| [CAND-02-A1.3A](02-api-client-and-backend-contract.md#cand-02-a1-3a) | Order of error text sources in FrappeAPI. | [`prefers message.message, then message, then the Frappe parser, then a status-based fallback`](../../../tests/spec/cand-02-frappe-client.test.ts) |
| [CAND-02-A1.3B](02-api-client-and-backend-contract.md#cand-02-a1-3b) | GET query string, POST JSON body, unencoded brackets and credentials on every call. | [`sends POST bodies as JSON, GET params in the query, and every request with credentials include`](../../../tests/spec/cand-02-frappe-client.test.ts) |
| [CAND-02-A1.3C](02-api-client-and-backend-contract.md#cand-02-a1-3c) | Resource listing parameters and the unwrapped return value. | [`getresourceDocumentData serialises fields and filters as JSON and does not unwrap the response`](../../../tests/spec/cand-02-frappe-client.test.ts) |
| [CAND-02-A1.3D](02-api-client-and-backend-contract.md#cand-02-a1-3d) | Multipart upload fields and blob return. | [`uploadFile posts multipart form data with file, doctype and docname and returns message, and getBlob returns the response blob`](../../../tests/spec/cand-02-frappe-client.test.ts) |
| [CAND-02-A1.4A](02-api-client-and-backend-contract.md#cand-02-a1-4a) | The service's docName ends up in the doctype field. | [`fileUploadService passes its docName in the doctype form field and sends no docname field, because it calls uploadFile(file, '', docName, doctype)`](../../../tests/spec/cand-02-more.test.ts) |
| [CAND-02-A1.4B](02-api-client-and-backend-contract.md#cand-02-a1-4b) | The service passes (file, empty string, docName, doctype) and returns the reply. | [`uploadFile calls FrappeAPI.uploadFile correctly`](../../../tests/lib/services/uploadProofFile.test.ts) |

<a id="cand-02-a1-1a"></a>
#### CAND-02-A1.1A: Server base URL

- Precondition: `window` is undefined; `FRAPPE_BASE_URL` and `NEXT_PUBLIC_FRAPPE_URL` are set to synthetic hosts with trailing slashes, then the first is blank, then both blank.
- Action: Call `frappeApiBase()` three times.
- Expected result: The first call returns the runtime URL without the slash, the second the public URL, the third an empty string `lib/frappe-base.ts:20,23-25`
- Test: characterization: `tests/spec/cand-02-frappe-client.test.ts::returns the runtime FRAPPE_BASE_URL, else NEXT_PUBLIC_FRAPPE_URL, without a trailing slash`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a1-1b"></a>
#### CAND-02-A1.1B: Browser base URL

- Precondition: jsdom provides `window`; both variables are set.
- Action: Call `frappeApiBase()`.
- Expected result: It returns `/backend` `lib/frappe-base.ts:29`
- Test: characterization: `tests/spec/cand-02-frappe-client.test.ts::returns the same-origin /backend prefix whatever the environment names`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a1-2a"></a>
#### CAND-02-A1.2A: Frappe error parser

- Precondition: None.
- Action: Call `frappeErrorMessage` with `_server_messages` holding HTML, a plain string and a blank entry; with a bad `_server_messages` plus an `exception`; with only an `exception`; with `{}`; with null.
- Expected result: The first returns the two non-blank texts with tags removed joined by a newline; the second strips the `module.Class:` prefix; the third returns the exception text; `{}` and null return the fallback `lib/frappe-error.ts:4-26`
- Test: characterization: `tests/spec/cand-02-frappe-client.test.ts::joins _server_messages with markup stripped, else strips the exception class, else returns the fallback`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The shape of real Frappe error bodies is not checked.
- Evidence: UNVERIFIED

<a id="cand-02-a1-3a"></a>
#### CAND-02-A1.3A: FrappeAPI error text order

- Precondition: `fetch` returns a non-OK reply with, in turn, `message.message`; `message` plus `_server_messages`; a blank `message` plus an `exception`; a non-JSON body with a status text; a non-JSON body with no status text.
- Action: Call `FrappeAPI.get` or `post` each time.
- Expected result: The thrown messages are the nested text, the top-level text, the parsed exception text, `API request failed: Internal Server Error` and `API request failed (502)` `lib/frappe-api.ts:13-26`
- Test: characterization: `tests/spec/cand-02-frappe-client.test.ts::prefers message.message, then message, then the Frappe parser, then a status-based fallback`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a1-3b"></a>
#### CAND-02-A1.3B: FrappeAPI request shape

- Precondition: `fetch` is stubbed to answer OK with a message.
- Action: Call `get` with parameters, `post` with a body and `getResource` with a bracketed key.
- Expected result: The GET URL is `/backend/api/method/a.b.c?x=1+2&y=z`; the POST carries method `POST`, the JSON header and the JSON body; the resource URL keeps `[` and `]` unencoded; every call has `credentials: include` `lib/frappe-api.ts:57-95,114-132`
- Test: characterization: `tests/spec/cand-02-frappe-client.test.ts::sends POST bodies as JSON, GET params in the query, and every request with credentials include`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. Only these three methods are checked here; `getBlob` is in CAND-02-A1.3D.
- Evidence: UNVERIFIED

<a id="cand-02-a1-3c"></a>
#### CAND-02-A1.3C: getresourceDocumentData

- Precondition: `fetch` returns `{ data: [...] }`.
- Action: Call it for `Candidate Raise Request` with fields, a filter, page 3 and limit 5.
- Expected result: The whole body is returned unchanged; the URL starts with the resource path and carries `fields` and `filters` as JSON, `limit_page_length=5` and `limit_start=10` `lib/frappe-api.ts:134-197`
- Test: characterization: `tests/spec/cand-02-frappe-client.test.ts::getresourceDocumentData serialises fields and filters as JSON and does not unwrap the response`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The POST branch is not driven here; the doctype is not URL-encoded by this function (G13).
- Evidence: UNVERIFIED

<a id="cand-02-a1-3d"></a>
#### CAND-02-A1.3D: uploadFile and getBlob

- Precondition: `fetch` answers once with a `message` and once with a blob.
- Action: Call `uploadFile(file, 'DOC-TEST-1', 'Job Applicant')`, then `getBlob('a.b.pdf', { appl: 'X' })`.
- Expected result: The upload is a `POST` to `/backend/api/method/upload_file` with `credentials: include`, no headers, and form fields `docname`, `doctype` and `file`; the result is the message; `getBlob` returns the blob from a URL with the query `appl=X` `lib/frappe-api.ts:29-55,97-112`
- Test: characterization: `tests/spec/cand-02-frappe-client.test.ts::uploadFile posts multipart form data with file, doctype and docname and returns message, and getBlob returns the response blob`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The file is a synthetic text file; no real upload.
- Evidence: UNVERIFIED

<a id="cand-02-a1-4a"></a>
#### CAND-02-A1.4A: fileUploadService argument order

- Precondition: `fetch` answers OK.
- Action: Call `fileUploadService.uploadFile(file, 'Job Applicant', 'HR-APP-TEST-1')` through the real `FrappeAPI`.
- Expected result: The form field `doctype` is `HR-APP-TEST-1` and the form has no `docname` field `lib/services/uploadProofFile.ts:11`
- Test: characterization: `tests/spec/cand-02-more.test.ts::fileUploadService passes its docName in the doctype form field and sends no docname field, because it calls uploadFile(file, '', docName, doctype)`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. Pins a suspected defect, not endorsed. Issue: PWHR-1513.
- Evidence: UNVERIFIED

<a id="cand-02-a1-4b"></a>
#### CAND-02-A1.4B: fileUploadService delegates to FrappeAPI

- Precondition: `FrappeAPI.uploadFile` is mocked.
- Action: Call the service with a file, a doctype and a name.
- Expected result: `FrappeAPI.uploadFile` is called with the file, an empty string, the name and the doctype in that order, and the service returns the reply unchanged `lib/services/uploadProofFile.ts:9-12`
- Test: mapped: `tests/lib/services/uploadProofFile.test.ts::uploadFile calls FrappeAPI.uploadFile correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The test asserts the call as it is, which is the wrong order (PWHR-1513). The rethrow-after-logging path (`lib/services/uploadProofFile.ts:13-16`) is not driven by this test; the sibling test `handles upload errors` in the same file drives it and is mapped to CAND-05-A9.2A. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-02-a2"></a>
### CAND-02-A2: Server routes that use the API key

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-02-A2.1A](02-api-client-and-backend-contract.md#cand-02-a2-1a) | Conversion of flag values, the request header and the empty fallbacks. | [`calls the flag method with the API key header, coerces values to booleans and returns {} on any failure`](../../../tests/spec/cand-02-routes.test.ts) |
| [CAND-02-A2.1B](02-api-client-and-backend-contract.md#cand-02-a2-1b) | A server flag is enabled only when exactly true. | [`treats a flag as enabled only when it is exactly true after coercion`](../../../tests/spec/cand-02-routes.test.ts) |
| [CAND-02-A2.2A](02-api-client-and-backend-contract.md#cand-02-a2-2a) | The flags route answers 500 when the credentials are blank and the flags when they are set. | [`returns 500 when the URL or either API credential is missing, else {flags}`](../../../tests/spec/cand-02-routes.test.ts) |
| [CAND-02-A2.3A](02-api-client-and-backend-contract.md#cand-02-a2-3a) | Branding route payload, cache header and empty fallbacks. | [`returns the branding with a 300 s edge cache, and an empty object without credentials or on upstream failure`](../../../tests/spec/cand-02-routes.test.ts) |
| [CAND-02-A2.4A](02-api-client-and-backend-contract.md#cand-02-a2-4a) | Openings route requests, normalised output and cache header. | [`reads Job Opening and Employment Type with the API key, filters Open, and returns normalised openings with a 60 s edge cache`](../../../tests/spec/cand-02-routes.test.ts) |
| [CAND-02-A2.4B](02-api-client-and-backend-contract.md#cand-02-a2-4b) | Openings route status codes for missing credentials, upstream failure and a failed type lookup. | [`answers 500 without credentials and 502 when the openings read fails or throws, but tolerates a failed type lookup`](../../../tests/spec/cand-02-routes.test.ts) |
| [CAND-02-A2.5A](02-api-client-and-backend-contract.md#cand-02-a2-5a) | The route runs the parser on a non-PDF with no checks and rejects a missing file part. | [`returns the extracted text for any uploaded file with no authentication, size or type check, and 400 when the file part is missing or not a file`](../../../tests/spec/cand-02-more.test.ts) |
| [CAND-02-A2.5B](02-api-client-and-backend-contract.md#cand-02-a2-5b) | The parser's error message is returned to the caller. | [`answers 500 with the parser's own error message and logs the error`](../../../tests/spec/cand-02-more.test.ts) |

<a id="cand-02-a2-1a"></a>
#### CAND-02-A2.1A: Server feature flags

- Precondition: `fetch` is stubbed; key, secret and a synthetic URL are set.
- Action: Call `getServerFeatureFlags` with a mixed reply, then a non-OK reply, a rejection, then with the credentials removed.
- Expected result: Values `1`, `"1"`, `"true"` and `true` become true and the rest false; the request has the token header and `no-store`; failures return `{}`; with no credentials there is no request `lib/server/feature-flags.ts:5-7,23-49`
- Test: characterization: `tests/spec/cand-02-routes.test.ts::calls the flag method with the API key header, coerces values to booleans and returns {} on any failure`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The `server-only` import has no package in `node_modules`; this change adds a `vitest.config.ts` alias and `tests/stubs/server-only.ts` so the module loads under Vitest (neither exists at `Described at`).
- Evidence: UNVERIFIED

<a id="cand-02-a2-1b"></a>
#### CAND-02-A2.1B: isServerFeatureEnabled

- Precondition: `fetch` returns two flags, one on and one off.
- Action: Call it for the on flag, the off flag and a missing flag.
- Expected result: It returns true, false and false `lib/server/feature-flags.ts:51-54`
- Test: characterization: `tests/spec/cand-02-routes.test.ts::treats a flag as enabled only when it is exactly true after coercion`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a2-2a"></a>
#### CAND-02-A2.2A: Flags route credentials guard

- Precondition: Both URL variables and both API credentials are blanked together, then all four are set.
- Action: Call `GET` of the route twice.
- Expected result: With all four blank the answer is 500 with the fixed error text; with all four set it is 200 with `{ flags: { open_jobs: true } }` `app/api/candidate-feature-flags/route.ts:10-18`
- Test: characterization: `tests/spec/cand-02-routes.test.ts::returns 500 when the URL or either API credential is missing, else {flags}`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. No session is sent in either call, which is the behaviour (A2.3). The guard is an `or` over the URL, the key and the secret (`app/api/candidate-feature-flags/route.ts:10`), but the test blanks all four variables in one step, so no single missing credential is exercised on its own; the test title says "either API credential" and the assertions do not separate them.
- Evidence: UNVERIFIED

<a id="cand-02-a2-3a"></a>
#### CAND-02-A2.3A: Branding route

- Precondition: `fetch` is stubbed: OK, then not OK, then a rejection; then credentials are removed.
- Action: Call `GET` four times.
- Expected result: The first returns the branding with the 300-second cache header and the expected upstream URL and header; the others return `{ branding: {} }` with status 200 and no cache header; the last makes no request `app/api/public/branding/route.ts:15-39`
- Test: characterization: `tests/spec/cand-02-routes.test.ts::returns the branding with a 300 s edge cache, and an empty object without credentials or on upstream failure`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a2-4a"></a>
#### CAND-02-A2.4A: Openings route happy path

- Precondition: `fetch` returns one open opening with a null closing date and one employment type.
- Action: Call `GET`.
- Expected result: Status 200 with the 60-second cache header; one opening with the normalised title, employment type `Full Time`, `evergreen` true and `postedOn` `2026-01-02`; the first request filters `status = Open`, orders `posted_on desc`, limits 500; the second reads `Employment Type`; both carry the token header `app/api/public/openings/route.ts:21-58`
- Test: characterization: `tests/spec/cand-02-routes.test.ts::reads Job Opening and Employment Type with the API key, filters Open, and returns normalised openings with a 60 s edge cache`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The closing-date filter is in `lib/careers/openings.ts` and is not driven by a case here.
- Evidence: UNVERIFIED

<a id="cand-02-a2-4b"></a>
#### CAND-02-A2.4B: Openings route failures

- Precondition: `fetch` is stubbed for: no credentials; openings not OK; a rejection; openings OK with a failing type lookup.
- Action: Call `GET` for each.
- Expected result: 500 with the credentials text; 502 with `Failed to fetch open jobs` twice; 200 with the raw type name when the lookup fails `app/api/public/openings/route.ts:17-19,42-44,47-52,59-61`
- Test: characterization: `tests/spec/cand-02-routes.test.ts::answers 500 without credentials and 502 when the openings read fails or throws, but tolerates a failed type lookup`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a2-5a"></a>
#### CAND-02-A2.5A: parse-resume accepts any file

- Precondition: `pdf-parse` is mocked; the request is a stand-in with a form map holding a text file named `x.txt`, then no file, then a string.
- Action: Call `POST` three times.
- Expected result: The text file is passed as a buffer to the parser and `{ text }` returned with status 200; the other two give 400 `Invalid file` `app/api/parse-resume/route.ts:6-23`
- Test: characterization: `tests/spec/cand-02-more.test.ts::returns the extracted text for any uploaded file with no authentication, size or type check, and 400 when the file part is missing or not a file`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. No real PDF is parsed. The request is a stand-in object, not a real multipart request. Pins a suspected defect, not endorsed. Issue: PWHR-1511.
- Evidence: UNVERIFIED

<a id="cand-02-a2-5b"></a>
#### CAND-02-A2.5B: parse-resume error text

- Precondition: `pdf-parse` rejects with `Error('internal parser detail')`.
- Action: Call `POST` with a file.
- Expected result: Status 500 and the body `{ error: 'internal parser detail' }`; the error is logged `app/api/parse-resume/route.ts:25-31`
- Test: characterization: `tests/spec/cand-02-more.test.ts::answers 500 with the parser's own error message and logs the error`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. Pins a suspected defect, not endorsed. Issue: PWHR-1511.
- Evidence: UNVERIFIED

<a id="cand-02-a3"></a>
### CAND-02-A3: The /backend proxy

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-02-A3.1A](02-api-client-and-backend-contract.md#cand-02-a3-1a) | Which headers the proxy forwards, drops and rewrites. | [`forwards the cookie and other client headers, drops host and hop-by-hop headers, and sets Host and X-Frappe-Site-Name from FRAPPE_BASE_URL`](../../../tests/spec/cand-02-proxy.test.ts) |
| [CAND-02-A3.1B](02-api-client-and-backend-contract.md#cand-02-a3-1b) | Body and fetch options per method. | [`streams the body with duplex half for POST and sends no body for GET and HEAD, with manual redirects and no caching`](../../../tests/spec/cand-02-proxy.test.ts) |
| [CAND-02-A3.1C](02-api-client-and-backend-contract.md#cand-02-a3-1c) | Seven handlers are exported and an arbitrary backend path is forwarded. | [`exports one handler for each of GET, POST, PUT, PATCH, DELETE, OPTIONS and HEAD and no path allowlist`](../../../tests/spec/cand-02-proxy.test.ts) |
| [CAND-02-A3.2A](02-api-client-and-backend-contract.md#cand-02-a3-2a) | Status, body and header pass-through of the proxy response. | [`returns the upstream status, statusText and body, passes set-cookie and other headers, and drops hop-by-hop, content-encoding and content-length`](../../../tests/spec/cand-02-proxy.test.ts) |
| [CAND-02-A3.2B](02-api-client-and-backend-contract.md#cand-02-a3-2b) | A network failure gives a fixed 502 and redirects are passed through. | [`answers 502 with a fixed JSON body when the upstream fetch throws and does not follow upstream redirects`](../../../tests/spec/cand-02-proxy.test.ts) |
| [CAND-02-A3.3A](02-api-client-and-backend-contract.md#cand-02-a3-3a) | The proxy refuses an invalid or missing runtime backend URL. | [`answers 503 with a fixed body and makes no upstream call when FRAPPE_BASE_URL is unset, has credentials, a query, a path, or a non-http scheme, and ignores NEXT_PUBLIC_FRAPPE_URL`](../../../tests/spec/cand-02-more.test.ts) |
| [CAND-02-A3.4A](02-api-client-and-backend-contract.md#cand-02-a3-4a) | Path and query are preserved. | [`uses runtime upstream and preserves the path and query`](../../../tests/delivery/proxy.test.ts) |
| [CAND-02-A3.4B](02-api-client-and-backend-contract.md#cand-02-a3-4b) | A double-slash path stays on the configured host. | [`cannot replace the configured origin with a double slash path`](../../../tests/delivery/proxy.test.ts) |

<a id="cand-02-a3-1a"></a>
#### CAND-02-A3.1A: Proxy request headers

- Precondition: `FRAPPE_BASE_URL` is a synthetic host with a port; `fetch` is stubbed.
- Action: POST through the proxy with a cookie, a custom header, three forwarded headers and a proxy-authorization header.
- Expected result: The upstream request keeps the cookie, custom and content-type headers, drops the forwarded and proxy-authorization headers, and has `host` equal to the host with port and `x-frappe-site-name` equal to the hostname `app/backend/[...path]/route.ts:51-65,93-103`
- Test: characterization: `tests/spec/cand-02-proxy.test.ts::forwards the cookie and other client headers, drops host and hop-by-hop headers, and sets Host and X-Frappe-Site-Name from FRAPPE_BASE_URL`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The header set is a sample, not every dropped name.
- Evidence: UNVERIFIED

<a id="cand-02-a3-1b"></a>
#### CAND-02-A3.1B: Proxy body streaming and fetch options

- Precondition: `fetch` is stubbed.
- Action: Call `POST` with a body, then `GET` and `HEAD`.
- Expected result: POST sends a body with `duplex: half`; GET and HEAD send none and no `duplex`; all use `redirect: manual` and `cache: no-store`; the GET URL keeps the query `app/backend/[...path]/route.ts:105-119`
- Test: characterization: `tests/spec/cand-02-proxy.test.ts::streams the body with duplex half for POST and sends no body for GET and HEAD, with manual redirects and no caching`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The body is not read back; only its presence.
- Evidence: UNVERIFIED

<a id="cand-02-a3-1c"></a>
#### CAND-02-A3.1C: Proxy exports and no allowlist

- Precondition: `fetch` is stubbed.
- Action: Read the seven exports and the two config exports; call `GET` for an arbitrary method name `frappe.utils.some_anything`.
- Expected result: All seven are functions; runtime is `nodejs`; `dynamic` is `force-dynamic`; the arbitrary path is forwarded to the backend `app/backend/[...path]/route.ts:3,6,138-144`
- Test: characterization: `tests/spec/cand-02-proxy.test.ts::exports one handler for each of GET, POST, PUT, PATCH, DELETE, OPTIONS and HEAD and no path allowlist`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. Pins a suspected defect, not endorsed. Issue: PWHR-1510.
- Evidence: UNVERIFIED

<a id="cand-02-a3-2a"></a>
#### CAND-02-A3.2A: Proxy response mapping

- Precondition: The stubbed upstream answers 201 with `Set-Cookie`, a custom header and hop-by-hop headers.
- Action: Call `GET`.
- Expected result: The response has status 201, text `Created` and the body; `set-cookie`, the custom header and content-type pass; `connection`, `content-encoding` and `content-length` are removed `app/backend/[...path]/route.ts:69-80,124-135`
- Test: characterization: `tests/spec/cand-02-proxy.test.ts::returns the upstream status, statusText and body, passes set-cookie and other headers, and drops hop-by-hop, content-encoding and content-length`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a3-2b"></a>
#### CAND-02-A3.2B: Proxy upstream failure and redirect

- Precondition: `fetch` rejects, then returns a 302 with a `location`.
- Action: Call `GET` twice.
- Expected result: The first answer is 502 with `Backend request failed`; the second is the 302 with its `location` unchanged `app/backend/[...path]/route.ts:108-122,131-135`
- Test: characterization: `tests/spec/cand-02-proxy.test.ts::answers 502 with a fixed JSON body when the upstream fetch throws and does not follow upstream redirects`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a3-3a"></a>
#### CAND-02-A3.3A: Proxy configuration guard

- Precondition: `NEXT_PUBLIC_FRAPPE_URL` is set; `FRAPPE_BASE_URL` is, in turn, empty, `ftp`, with credentials, with a path, with a query, with a hash.
- Action: Call `GET` each time.
- Expected result: Each answers 503 `Backend unavailable` and `fetch` is never called `app/backend/[...path]/route.ts:27-45,83-86`
- Test: characterization: `tests/spec/cand-02-more.test.ts::answers 503 with a fixed body and makes no upstream call when FRAPPE_BASE_URL is unset, has credentials, a query, a path, or a non-http scheme, and ignores NEXT_PUBLIC_FRAPPE_URL`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a3-4a"></a>
#### CAND-02-A3.4A: Proxy path and query

- Precondition: `FRAPPE_BASE_URL` is `http://frappe:8000`.
- Action: GET `/backend/api/method/login?a=1`.
- Expected result: The upstream URL is `http://frappe:8000/api/method/login?a=1` and the status is 200 `app/backend/[...path]/route.ts:88-91`
- Test: mapped: `tests/delivery/proxy.test.ts::uses runtime upstream and preserves the path and query`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-02-a3-4b"></a>
#### CAND-02-A3.4B: Proxy cannot be sent to another host

- Precondition: `FRAPPE_BASE_URL` is `http://frappe:8000`.
- Action: Call the proxy with the catch-all `['', 'evil.test', 'file']`.
- Expected result: The upstream host is `frappe:8000` `app/backend/[...path]/route.ts:89-90`
- Test: mapped: `tests/delivery/proxy.test.ts::cannot replace the configured origin with a double slash path`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-02-a4"></a>
### CAND-02-A4: Health and feature flags in the browser

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-02-A4.1A](02-api-client-and-backend-contract.md#cand-02-a4-1a) | Health sends no-store and is force-dynamic. | [`sends Cache-Control no-store and is force-dynamic`](../../../tests/spec/cand-02-more.test.ts) |
| [CAND-02-A4.1B](02-api-client-and-backend-contract.md#cand-02-a4-1b) | Health does not depend on the backend. | [`health is independent of backend availability`](../../../tests/delivery/proxy.test.ts) |
| [CAND-02-A4.2A](02-api-client-and-backend-contract.md#cand-02-a4-2a) | A failed flag request throws with the status text. | [`throws an Error carrying the status text when /api/candidate-feature-flags answers not ok`](../../../tests/spec/cand-02-more.test.ts) |
| [CAND-02-A4.2B](02-api-client-and-backend-contract.md#cand-02-a4-2b) | The flag client returns the flags from the portal route. | [`getFeatureFlags calls the server-side proxy route`](../../../tests/lib/services/feature-flags.test.ts) |
| [CAND-02-A4.3A](02-api-client-and-backend-contract.md#cand-02-a4-3a) | Layering of defaults, initial flags and remote flags, with initialFlags set against its defaults so the middle layer is pinned. | [`layers built-in defaults, then initialFlags, then remote flags, and turns a remote flag on only for 1 or true`](../../../tests/spec/cand-02-flag-context.test.tsx) |
| [CAND-02-A4.3B](02-api-client-and-backend-contract.md#cand-02-a4-3b) | isEnabled is false for unknown flags and getFlag uses its default only when the flag is missing. | [`isEnabled is false for a flag that is missing or not a boolean, and getFlag returns the caller's default only when the flag is missing`](../../../tests/spec/cand-02-flag-context.test.tsx) |

<a id="cand-02-a4-1a"></a>
#### CAND-02-A4.1A: Health cache header

- Precondition: None.
- Action: Call the health handler and read its exports.
- Expected result: `Cache-Control` is `no-store` and `dynamic` is `force-dynamic` `app/api/health/route.ts:1-7`
- Test: characterization: `tests/spec/cand-02-more.test.ts::sends Cache-Control no-store and is force-dynamic`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a4-1b"></a>
#### CAND-02-A4.1B: Health ignores the backend

- Precondition: `FRAPPE_BASE_URL` is empty.
- Action: Call the health handler twice.
- Expected result: Status 200 and the body `{ status: ok }` `app/api/health/route.ts:4-8`
- Test: mapped: `tests/delivery/proxy.test.ts::health is independent of backend availability`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-02-a4-2a"></a>
#### CAND-02-A4.2A: Flag client failure

- Precondition: `fetch` answers not OK with status text `Internal Server Error`.
- Action: Call `getFeatureFlags`.
- Expected result: It throws `Feature flags request failed: Internal Server Error` `lib/services/feature-flags.ts:8-10`
- Test: characterization: `tests/spec/cand-02-more.test.ts::throws an Error carrying the status text when /api/candidate-feature-flags answers not ok`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a4-2b"></a>
#### CAND-02-A4.2B: Flag client success

- Precondition: `fetch` answers OK with `{ flags: { 'feature-1': 1 } }`.
- Action: Call `getFeatureFlags`.
- Expected result: It returns the flags and has called `/api/candidate-feature-flags` with method GET and credentials include `lib/services/feature-flags.ts:3-13`
- Test: mapped: `tests/lib/services/feature-flags.test.ts::getFeatureFlags calls the server-side proxy route`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-02-a4-3a"></a>
#### CAND-02-A4.3A: Flag precedence

- Precondition: `useCandidateFeatureFlags` is mocked with mixed remote values; `initialFlags` sets `social_job_sharing` and `action_center` to `true`, the opposite of their built-in defaults, and `my_jobs` to `false`.
- Action: Render the provider and read `flags`.
- Expected result: Remote `1` and `true` become true, remote `0` false, remote `"1"` and `"true"` false; `social_job_sharing`, which `initialFlags` turns on and no remote key names, stays true, so `initialFlags` beats the defaults; `action_center`, which `initialFlags` also turns on, is false because the remote `"true"` overrides it, so remote beats `initialFlags`; `careers_public_enabled` stays at its default false `lib/contexts/feature-flags.tsx:17-33,49-57`
- Test: characterization: `tests/spec/cand-02-flag-context.test.tsx::layers built-in defaults, then initialFlags, then remote flags, and turns a remote flag on only for 1 or true`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The default values of the other flags are not each asserted. Both layered keys are checked through one render; no test re-renders with a changed `initialFlags` object to drive the `useMemo` dependency.
- Evidence: UNVERIFIED

<a id="cand-02-a4-3b"></a>
#### CAND-02-A4.3B: isEnabled and getFlag

- Precondition: Remote data is null.
- Action: Read `isEnabled('home')`, `isEnabled('nope')`, `getFlag('nope', true)` and `getFlag('documents', true)`.
- Expected result: They return true, false, true and false `lib/contexts/feature-flags.tsx:65-76`
- Test: characterization: `tests/spec/cand-02-flag-context.test.tsx::isEnabled is false for a flag that is missing or not a boolean, and getFlag returns the caller's default only when the flag is missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-02-a5"></a>
### CAND-02-A5: Branding and page-content services

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-02-A5.1A](02-api-client-and-backend-contract.md#cand-02-a5-1a) | The branding service calls the branding method with no parameters. | [`getCandidateBranding calls FrappeAPI.get correctly`](../../../tests/lib/services/candidate-branding.test.ts) |
| [CAND-02-A5.2A](02-api-client-and-backend-contract.md#cand-02-a5-2a) | The auth page content service calls its method with no parameters. | [`getAuthPageContent calls FrappeAPI.get correctly`](../../../tests/lib/services/auth-page-content.test.ts) |

<a id="cand-02-a5-1a"></a>
#### CAND-02-A5.1A: Branding service

- Precondition: `FrappeAPI.get` is mocked.
- Action: Call `getCandidateBranding`.
- Expected result: `FrappeAPI.get` is called with only the method name and its reply is returned `lib/services/candidate-branding.ts:10-14`
- Test: mapped: `tests/lib/services/candidate-branding.test.ts::getCandidateBranding calls FrappeAPI.get correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The test mocks `FrappeAPI`; the method name is the only contract it checks. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-02-a5-2a"></a>
#### CAND-02-A5.2A: Auth page content service

- Precondition: `FrappeAPI.get` is mocked.
- Action: Call `getAuthPageContent`.
- Expected result: `FrappeAPI.get` is called with only the method name and its reply is returned `lib/services/auth-page-content.ts:24-28`
- Test: mapped: `tests/lib/services/auth-page-content.test.ts::getAuthPageContent calls FrappeAPI.get correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and routes are tested with `fetch`, the router or the services mocked; no real HTTP or Frappe backend. The method name is the only contract it checks. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED
