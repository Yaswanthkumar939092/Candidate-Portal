# SPEC-CAND-01: Overview, routes and session

<a id="spec-cand-01"></a>

- Stable ID: `SPEC-CAND-01`
- Described at: repo `hybrowlabs/Candidate-Portal`, branch `develop`, commit `97dbcd5d3ce79fbc49dc0ba254c7a52375fbd8e5` (committer date `2026-10-30 22:32:12 +0530`)
- Also read at: branch `deploy/hybrowbase-candidate-20261025`, commit `786b53e406869986d5d5d0c81b7ae6b1605f8315`; differs: 26 of the source and configuration files cited by clauses 01 to 03 differ there (full list and counting method in section 9 G1; across all seven clauses the same method gives 33) (`app/backend/[...path]/route.ts` is deleted and `middleware.ts` added; `components/careers/careers-shell.tsx`, `lib/careers/login-redirect.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/campus-apply/page.tsx` and `lib/contexts/feature-flags.tsx` are modified); no `pw-uat` branch exists in this repo (`git ls-remote --heads origin pw-uat` printed nothing on 2026-10-31); only `develop` is described and no other branch was read
- Author: Frontend Developer (Yashwanth). Reviewer: Code Reviewer (Yashwanth), to be recorded in the PR.
- Status: DRAFT

## 1. Purpose

This clause describes how the candidate portal starts, which URLs exist, who may see them, and the session state the pages share. It also carries the repository overview for the whole spec set. Issue: PWHR-1364 (parent PWHR-1362).

Module map. The app is a Next.js 15 App Router project (`package.json:47`) with React 19 (`package.json:51`). `app/layout.tsx` is the root: it builds the page title and icon from the branding method (`app/layout.tsx:26-62`) and wraps every page in `Providers`, then `AuthProvider`, then a `Toaster` (`app/layout.tsx:85-88`). `app/providers.tsx` supplies the theme and one React Query client (`app/providers.tsx:9-18`). `lib/contexts/auth-context.tsx` holds the session (`lib/contexts/auth-context.tsx:37-101`). Pages sit in four places: the `(auth)` group, the `(portal)` group behind a guard, the `(public)` group behind a feature flag, and three top-level pages (`app/campus-apply/page.tsx:747`, `app/ctc-proposal/page.tsx:16`, `app/direct-applicant-form/page.tsx:16`) plus the root layout. Server routes are described in SPEC-CAND-02 and the sign-in client in SPEC-CAND-03.

Entry flow: browser request → `app/layout.tsx` → route group layout → page. Only the `(portal)` layout checks the session (`app/(portal)/layout.tsx:31-35`); the `(public)` layout checks a server-side feature flag (`app/(public)/layout.tsx:8-11`); `app/campus-apply/page.tsx` runs its own check (`app/campus-apply/page.tsx:42-48`). The two token-link pages, `/ctc-proposal` and `/direct-applicant-form`, check no session: the emailed token in `?t=` is the access (`app/ctc-proposal/page.tsx:10-13`).

Repository facts counted by script at `Described at` (not from memory): 149 test files, 24 files under `lib/services`, 27 under `lib/hooks`, 25 `page.tsx` files, 5 `layout.tsx` files, 6 `route.ts` files. The number of spec cases is in `test-traceability.md`.

Route table (the 25 `page.tsx` files, listed by script from `git ls-tree` at `Described at`):

| URL | Group | Page component |
|---|---|---|
| `/login` | `(auth)` | `app/(auth)/login/page.tsx:13` |
| `/register` | `(auth)` | `app/(auth)/register/page.tsx:15` |
| `/verify-email` | `(auth)` | `app/(auth)/verify-email/page.tsx:11` |
| `/dashboard` | `(portal)` | `app/(portal)/dashboard/page.tsx:142` |
| `/onboarding` | `(portal)` | `app/(portal)/onboarding/page.tsx:375` |
| `/action-center` | `(portal)` | `app/(portal)/action-center/page.tsx:423` |
| `/open-jobs` | `(portal)` | `app/(portal)/open-jobs/page.tsx:113` |
| `/open-jobs/[id]/apply-job` | `(portal)` | `app/(portal)/open-jobs/[id]/apply-job/page.tsx:6` |
| `/open-jobs/[id]/apply-job/thank-you` | `(portal)` | `app/(portal)/open-jobs/[id]/apply-job/thank-you/page.tsx:6` |
| `/my-jobs` | `(portal)` | `app/(portal)/my-jobs/page.tsx:34` |
| `/job_offer` | `(portal)` | `app/(portal)/job_offer/page.tsx:108` |
| `/job_offer/consent` | `(portal)` | `app/(portal)/job_offer/consent/page.tsx:12` |
| `/job_offer/consent/return` | `(portal)` | `app/(portal)/job_offer/consent/return/page.tsx:31` |
| `/pre_offer_form` | `(portal)` | `app/(portal)/pre_offer_form/page.tsx:22` |
| `/ctc_proposal` | `(portal)` | `app/(portal)/ctc_proposal/page.tsx:15` |
| `/direct_applicant_form` | `(portal)` | `app/(portal)/direct_applicant_form/page.tsx:15` |
| `/survey` | `(portal)` | `app/(portal)/survey/page.tsx:44` |
| `/profile` | `(portal)` | `app/(portal)/profile/page.tsx:11` |
| `/feature-flag` | `(portal)` | `app/(portal)/feature-flag/page.tsx:4-11` |
| `/` | `(public)` | `app/(public)/page.tsx:33` |
| `/jobs` | `(public)` | `app/(public)/jobs/page.tsx:24` |
| `/ai-match` | `(public)` | `app/(public)/ai-match/page.tsx:6` |
| `/campus-apply` | none | `app/campus-apply/page.tsx:747` |
| `/ctc-proposal` | none | `app/ctc-proposal/page.tsx:16` |
| `/direct-applicant-form` | none | `app/direct-applicant-form/page.tsx:16` |

The pages of the onboarding, dashboard, jobs, offer and survey flows are specced in PWHR-1366 (SPEC-CAND-04 onward, not written here). This clause names them only as routes.

## 2. Boundaries

- In: `app/layout.tsx`, `app/providers.tsx`, `app/(portal)/layout.tsx`, `app/(public)/layout.tsx`, `app/ctc-proposal/layout.tsx`, `app/direct-applicant-form/layout.tsx`, the guard at the top of `app/campus-apply/page.tsx`, `components/careers/careers-shell.tsx`, `lib/contexts/auth-context.tsx`, `lib/hooks/useUser.ts`, `lib/careers/login-redirect.ts`.
- Out: the sign-in client and the three auth pages (SPEC-CAND-03). The Frappe client, the `/backend` proxy, the `/api/*` routes and feature flags (SPEC-CAND-02). The pages the route table names, and `lib/services/*` other than those, are for PWHR-1366.
- Not read: `components/portal/portal-navigation.tsx`, `components/portal/survey-offer-navigation.tsx` and `lib/contexts/theme-context.tsx` are named where the entry flow passes through them and are not described.
- Extension points: a page is added by creating a `page.tsx` in a group; there is no route table in code. The `(portal)` layout is the only place a session is required for a group.

## 3. Behaviour rules

### A1: Layouts and route guards

- A1.1: The `(portal)` layout shows a full-screen spinner with the text "Loading..." while auth is loading, renders nothing when loading is done and there is no user, and renders the page inside the feature-flag provider and loader once a user exists (`app/(portal)/layout.tsx:37-67`). [CAND-01-A1.1A]
- A1.2: When loading is done and there is no user, the `(portal)` layout calls `router.push('/login')` from an effect, with no `redirect` query value (`app/(portal)/layout.tsx:31-35`). [CAND-01-A1.1A]
- A1.3: On `/survey` the `(portal)` layout shows `SurveyOfferNavigation` instead of `PortalNavigation`; on `/profile` it passes `hideNavLinks` to `PortalNavigation`; the content area gets the top padding class `pt-16` whenever either navigation is shown (`app/(portal)/layout.tsx:28-29,59-61`). [CAND-01-A1.1B]
- A1.4: The `(public)` layout asks the server for the flag `careers_public_enabled`; when it is not true it calls `redirect("/login")`, otherwise it renders `CareersShell` around the page (`app/(public)/layout.tsx:8-12`). [CAND-01-A1.2A]
- A1.5: `CareersShell` renders nothing for a signed-in user and, from an effect, replaces the URL with the portal page that matches the careers page (`/` → `/dashboard`, `/ai-match` → `/open-jobs?tab=smart-match`, `/jobs` → `/open-jobs`, anything else → `/dashboard`) (`components/careers/careers-shell.tsx:30-34`, `lib/careers/login-redirect.ts:10-14,25`). [CAND-01-A1.3A]
- A1.6: For a guest, `CareersShell` renders a header with three tabs (Home, AI Resume / Job Match, All Open Jobs) twice (desktop and mobile navigation), marks the tab for the current path with `aria-current="page"`, and shows a Login link to `/login?redirect=%2Fdashboard` (`components/careers/careers-shell.tsx:13-17,44-63,67-83`). [CAND-01-A1.3B]
- A1.7: `CareersShell` does not read the loading flag of auth; a guest sees the header while the session check is still running (`components/careers/careers-shell.tsx:27`). No case covers this (section 10).
- A1.8: `/campus-apply` pushes a signed-out visitor to `/login?redirect=<encoded /campus-apply plus its whole query string>` once loading is done, shows "Verifying authorization status..." while loading, and renders nothing when there is no user (`app/campus-apply/page.tsx:42-48,81-96`). [CAND-01-A1.4A] [CAND-01-A1.4B]

### A2: Session state

- A2.1: `AuthProvider` starts with `isLoading` true, no user and no profile (`lib/contexts/auth-context.tsx:38-40`). [CAND-01-A2.1A]
- A2.2: One effect on mount calls `auth.getSession()`; on success it stores the user and a profile built from it by `profileFromFrappeUser`, and in `finally` it sets `isLoading` false if the provider is still mounted (`lib/contexts/auth-context.tsx:64-88`). [CAND-01-A2.1A] [CAND-01-A2.5A]
- A2.3: When the session call rejects, the provider logs "Unexpected error initializing auth:", stores no user and no profile, and ends loading; a rejection is not shown to the visitor (`lib/contexts/auth-context.tsx:74-78`). [CAND-01-A2.1B]
- A2.4: `isOnboardingComplete` is true only when a profile exists and its `lifecycle_stage` is not `candidate`; because `profileFromFrappeUser` always sets `candidate`, the value from this provider is always false (`lib/contexts/auth-context.tsx:90-92`, `lib/auth.ts:191`). [CAND-01-A2.1A]
- A2.5: `refreshProfile` reads the session again and replaces user and profile; it has no `try`, so a rejection reaches the caller (`lib/contexts/auth-context.tsx:53-62`). [CAND-01-A2.1C]
- A2.6: `useAuth` throws `Error("useAuth must be used within an AuthProvider")` when no provider is above it (`lib/contexts/auth-context.tsx:103-108`). [CAND-01-A2.2A]
- A2.7: On every pathname change the provider reads `sessionStorage.showLoginToast`; when it is `"true"` it shows the toast "Successfully logged in!" and removes the key (`lib/contexts/auth-context.tsx:43-51`). [CAND-01-A2.4A]
- A2.8: `useCurrentUser` returns the session user's e-mail, and a fixed fallback e-mail when there is no user or the lookup rejects; it logs "Error fetching user:" on rejection (`lib/hooks/useUser.ts:8-22`). [CAND-01-A2.3A] [CAND-01-A2.3B] [CAND-01-A2.3C]

### A3: Root metadata

- A3.1: The page title is `<prefix> - Candidate Portal` with template `%s | <prefix>`; the prefix is the branding `title_prefix` and `ERP` when branding has none or the call rejects (`app/layout.tsx:27,31-34,44-47`). [CAND-01-A3.1A] [CAND-01-A3.1B]
- A3.2: The icon is the branding `app_logo` unchanged when it starts with `http`, otherwise `NEXT_PUBLIC_FRAPPE_URL` (trailing slash removed) plus the logo path with a leading slash added; with no logo it is `/favicon.svg` (`app/layout.tsx:28,35-39`). [CAND-01-A3.1A] [CAND-01-A3.1B]
- A3.3: `/ctc-proposal` and `/direct-applicant-form` set `referrer: "no-referrer"` so the token in the URL is not sent as a Referer (`app/ctc-proposal/layout.tsx:5`, `app/direct-applicant-form/layout.tsx:5`). [CAND-01-A3.2A]
- A3.4: The root layout writes an inline script into the head that reads `localStorage` keys `candidate-portal-theme` and `candidate-portal-brand` before first paint (`app/layout.tsx:76-78`).

### A4: Careers redirect helpers

- A4.1: `loginHref(path)` returns `/login?redirect=` plus the URI-encoded path (`lib/careers/login-redirect.ts:2-4`). [CAND-01-A4.1A]
- A4.2: `portalEquivalent("/jobs", search)` keeps a `job` query value and appends it, encoded, to `/open-jobs`; other paths ignore it (`lib/careers/login-redirect.ts:24-28`). [CAND-01-A4.2A] [CAND-01-A4.2B] [CAND-01-A4.2C] [CAND-01-A4.2D]

## 4. Data and permissions

- The session held in memory is the mapped Frappe user, a profile built from it and two flags (`lib/contexts/auth-context.tsx:20-26`). No token or password is stored by the provider; the session cookie is set and sent by the browser (`lib/auth.ts:125-130`).
- `profileFromFrappeUser` fixes `role` to `candidate`, `provider` to `frappe` and `lifecycle_stage` to `candidate`, and sets `is_internal_employee` false and `frappe_employee_id` null whatever the server said (`lib/auth.ts:189-193`). Whether the user is a candidate is therefore not read from the backend by the client.
- Permission in the front end is only the presence of a user in the `(portal)` layout and in `/campus-apply` (`app/(portal)/layout.tsx:31-35`, `app/campus-apply/page.tsx:42-48`). No role or permission name is read. Authorisation is the backend's.
- The two `sessionStorage` / `localStorage` uses in this clause are the login toast flag and the theme and brand keys (`lib/contexts/auth-context.tsx:45-48`, `app/layout.tsx:77`; writes at `app/(auth)/login/page.tsx:57`, `lib/contexts/theme-context.tsx:41`, `components/dynamic-primary-color.tsx:58`). Nothing in the app writes `document.cookie` (script count of `document.cookie` at `Described at`: 0).
- Statutory source: not applicable.

## 5. Errors and edge behaviour

- A session lookup that rejects leaves a signed-out state without a message (`lib/contexts/auth-context.tsx:74-78`).
- A signed-out visitor to any `(portal)` page sees nothing for one render and is then pushed to `/login`; the requested URL is not kept (`app/(portal)/layout.tsx:31-35,49-52`).
- A URL that matches no page: Not found in code. The tree has no `not-found.tsx`, `error.tsx` or `loading.tsx` (`git ls-tree` at `Described at` printed none), so Next.js defaults apply `[INFERENCE: framework default not read]`.
- `/feature-flag` is a "Feature Flags Coming Soon!!" placeholder page with a Go Back button, inside the signed-in layout (`app/(portal)/feature-flag/page.tsx:4-11`).
- The branding call in `generateMetadata` swallows any error (`app/layout.tsx:40-42`).

## 6. Configuration

Names only; no values appear here.

| Name | Read at | Used for |
|---|---|---|
| `NEXT_PUBLIC_FRAPPE_URL` | `app/layout.tsx:38`, `lib/frappe-base.ts:20`, `next.config.ts:5` | backend base URL, icon URL, image host |
| `FRAPPE_BASE_URL` | `lib/frappe-base.ts:24`, `app/backend/[...path]/route.ts:28` | runtime backend URL on the server |
| `NODE_ENV` | `next.config.ts:6` | development fallback image host |

The remaining variables (Frappe API key and secret, Supabase, SMTP, Google and LinkedIn client IDs, site URL) are listed with their readers in SPEC-CAND-02 section 6.

- The two localStorage keys are `candidate-portal-theme` and `candidate-portal-brand` (`app/layout.tsx:77`).
- The sessionStorage key is `showLoginToast` (`lib/contexts/auth-context.tsx:45`).
- The `@` import alias maps to the repo root (`vitest.config.ts:29-33`).

## 7. Scheduled jobs, hooks and patches

None. This is a browser and Node front end with no scheduler, no server hooks and no data patches of its own. The equivalents are effects:

- `AuthProvider` runs the toast check on each pathname change and the session lookup once after mount (`lib/contexts/auth-context.tsx:43-51,64-88`).
- The `(portal)` layout runs its redirect effect when loading, user or router changes (`app/(portal)/layout.tsx:31-35`).
- `CareersShell` runs its redirect effect when pathname, router or user changes (`components/careers/careers-shell.tsx:30-32`).

## 8. Static security and performance observations

- Security: route protection is client-side. The `(portal)` layout is a client component that renders nothing without a user; the page code is still shipped to the browser, so hiding a page is not an access control (`app/(portal)/layout.tsx:1,49-52`).
- Security: the redirect after sign-in is taken from the `redirect` query value without a same-origin check (SPEC-CAND-03, issue PWHR-1519).
- Security: `useCurrentUser` falls back to a fixed personal e-mail address and its callers use it as the applicant e-mail for offer and onboarding calls (`lib/hooks/useUser.ts:12-16`, `app/(portal)/job_offer/page.tsx:127,133`). Issue: PWHR-1512.
- Security: `app/layout.tsx` inserts a script with `dangerouslySetInnerHTML`; its content is a constant string with no input from the request (`app/layout.tsx:76-78`).
- Security: the page `app/(public)/page.tsx:17-18` names a customer in its fallback text. Core clauses are customer-neutral; this is a fact about the code, listed here for the owner (Not filed: copy text, no behaviour).
- Performance: the one React Query client is `new QueryClient()` with no `defaultOptions`, built at module scope, and the auth provider and that client wrap every route, so each hook decides its own freshness and ten of them set no `staleTime` (`app/providers.tsx:9,14`, `app/layout.tsx:85-88`). Issue: PWHR-1754.
- Performance: the branding method is called twice per first page view, once on the server in `generateMetadata` with no cache option and once in the browser by `DynamicFavicon`, which `Providers` renders on every route (`app/layout.tsx:31`, `app/providers.tsx:15`, `components/dynamic-favicon.tsx:11`, `lib/hooks/useCandidateBranding.ts:5-8`). Whether Next.js caches or dedups the server call was not read. Issue: PWHR-1755. [INFERENCE]
- Performance: `(portal)` pages sit behind `FeatureFlagLoader`, which renders a spinner instead of the page until the flag request settles, and the flag context value is a fresh object on every provider render (`app/(portal)/layout.tsx:56-57`, `lib/contexts/feature-flags.tsx:133-136,78-85`). Issue: PWHR-1756.
- Performance: `useCurrentUser` re-requests the session the provider already fetched, in a mount effect with no cache, dedup or staleness gate, once per mounting component (`lib/hooks/useUser.ts:8-22`, `lib/contexts/auth-context.tsx:69`). Issue: PWHR-1757.

## 9. Known gaps / open questions

- G1: Branch drift. There is no `pw-uat` branch. `deploy/hybrowbase-candidate-20261025` (`786b53e406869986d5d5d0c81b7ae6b1605f8315`) differs in 26 of the source and configuration files that clauses 01 to 03 cite. Counting method, reproducible at `Described at`: take every backtick-quoted path in `docs/spec/clauses/01-*.md`, `02-*.md` and `03-*.md` that is a tracked file at either commit, intersect that set with `git diff --name-only 97dbcd5d3ce79fbc49dc0ba254c7a52375fbd8e5 786b53e406869986d5d5d0c81b7ae6b1605f8315`, then drop the files under `tests/` (8 there) and the two dependency and runner files `package.json` and `vitest.config.ts`; what remains is the 26 below. The same method over all seven clause files gives 33. The changes were read for these 14: `app/backend/[...path]/route.ts` (deleted there), `middleware.ts` (added), `components/careers/careers-shell.tsx`, `lib/careers/login-redirect.ts` (the `portalEquivalent` function and `SHARED_JOB_PARAM` are removed and `/` maps to `/open-jobs`), `app/(auth)/login/page.tsx` (the post-login route call is removed), `app/(auth)/register/page.tsx`, `app/campus-apply/page.tsx`, `lib/server/feature-flags.ts`, `app/api/candidate-feature-flags/route.ts`, `app/api/public/branding/route.ts`, `app/api/public/openings/route.ts`, `app/api/parse-resume/route.ts`, `lib/contexts/feature-flags.tsx` and `next.config.ts`. The other 12 in the count were not read for what changed: `app/(portal)/dashboard/page.tsx`, `app/(portal)/job_offer/page.tsx`, `app/(portal)/my-jobs/page.tsx`, `app/(portal)/onboarding/page.tsx`, `app/(portal)/open-jobs/page.tsx`, `app/(public)/jobs/page.tsx`, `components/auth-form.tsx`, `components/brand-lockup.tsx`, `components/portal/portal-navigation.tsx`, `lib/services/applicantStatusService.ts`, `lib/services/jobOpeningService.ts` and `lib/careers/openings.ts`. No rule in this clause was re-read there. Issue: PWHR-1518.
- G2: `isOnboardingComplete` is always false from this provider because the profile is built with the stage `candidate` (`lib/contexts/auth-context.tsx:90-92`, `lib/auth.ts:191`). No code reads it outside the provider (`git grep isOnboardingComplete` at `Described at` finds only the provider). Not filed: no consumer.
- G3: `lib/contexts/auth-context.tsx:14` imports `getProfile`, which `lib/auth.ts` does not export (TS2305). Issue: PWHR-1514.
- G4: `useCurrentUser` falls back to a personal address (`lib/hooks/useUser.ts:12-16`). Issue: PWHR-1512.
- G5: The `(portal)` layout drops the requested URL when it sends a visitor to `/login` (`app/(portal)/layout.tsx:33`), while `/campus-apply` keeps it (`app/campus-apply/page.tsx:45`). Whether that is intended is a question for the owner. Not filed: product question.
- G6: Every case stubs the backend; none talks to a real Frappe site or a browser. Hosted CI is UNVERIFIED.
- G7: `CareersShell` shows the guest header while auth is still loading and then redirects a signed-in visitor; a signed-in visitor may see a flash of the guest header (`components/careers/careers-shell.tsx:27,34`). [INFERENCE: render timing was not observed]
- G8: `app/(public)/page.tsx:17-18` contains a customer name in core source. Not filed: copy text.
- Statutory source: not applicable.

## 10. Uncovered behaviour

- A1.7 (guest header while loading) and G7: no test renders `CareersShell` with `isLoading` true. Not filed: no test written in this pass; PWHR-1366 and PWHR-1368 can pick it up.
- A2.2, the unmount guard in the session effect (`lib/contexts/auth-context.tsx:70,76,80`): no test resolves the session after unmount. Not filed: no test written.
- A2.5, the rejection of `refreshProfile`: not driven; the characterization test covers only the success path. Not filed: no test written.
- A3.4, the inline theme script: not executed by any test (`app/layout.tsx:76-78`). Not filed: needs a real browser.
- `app/providers.tsx` and `components/portal/portal-navigation.tsx`: `tests/components/portal-navigation.test.tsx` exists but is not mapped here (out of scope). Not filed: PWHR-1366.
- `/feature-flag` placeholder page (`app/(portal)/feature-flag/page.tsx:4-11`): no test. Not filed: placeholder text.
- The route list in section 1 is not asserted by any test; a new `page.tsx` would not fail a test. Not filed: a count test would pin file layout, not behaviour.
- Hooks and services outside this clause (`lib/services/*`, `lib/hooks/*` other than `useUser.ts`, 149 test files in total): see PWHR-1366 for onboarding and dashboard. Not filed: owned by PWHR-1366.

## 11. Acceptance cases

Every case is `Evidence: UNVERIFIED`. Cases that map an existing test only gained a `// Spec:` comment line above the `it(`; all other cases are characterization tests added by this change in `tests/spec/`. Environment is stated once for the repo: tests run Vitest with jsdom and stub the backend.

<a id="cand-01-a1"></a>
### CAND-01-A1: Layouts and route guards

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-01-A1.1A](01-overview-routing-and-session.md#cand-01-a1-1a) | Three states of the portal layout: spinner, empty with a push to /login, and the page with navigation. | [`shows a spinner while loading, nothing and a push to /login without a user, and the page with a user`](../../../tests/spec/cand-01-layouts.test.tsx) |
| [CAND-01-A1.1B](01-overview-routing-and-session.md#cand-01-a1-1b) | Survey swaps the navigation component and /profile passes hideNavLinks. | [`swaps the navigation on /survey and hides the nav links on /profile`](../../../tests/spec/cand-01-layouts.test.tsx) |
| [CAND-01-A1.2A](01-overview-routing-and-session.md#cand-01-a1-2a) | The public layout redirects to /login when the flag is off and renders the careers shell when on. | [`redirects to /login when careers_public_enabled is off and renders the careers shell when it is on`](../../../tests/spec/cand-01-layouts.test.tsx) |
| [CAND-01-A1.3A](01-overview-routing-and-session.md#cand-01-a1-3a) | A signed-in visitor sees nothing and is redirected with the shared job id kept. | [`renders nothing and replaces the URL with the portal page that matches the careers page`](../../../tests/spec/cand-01-layouts.test.tsx) |
| [CAND-01-A1.3B](01-overview-routing-and-session.md#cand-01-a1-3b) | A guest sees the tabs with the current one marked, a Login link, and no redirect. | [`renders the careers header and children for a guest and does not redirect`](../../../tests/spec/cand-01-layouts.test.tsx) |
| [CAND-01-A1.4A](01-overview-routing-and-session.md#cand-01-a1-4a) | A signed-out visitor is pushed to /login with the full campus-apply URL encoded in redirect. | [`sends a signed-out visitor to /login with the whole campus-apply URL, query included, encoded in redirect and renders nothing`](../../../tests/spec/cand-01-campus-guard.test.tsx) |
| [CAND-01-A1.4B](01-overview-routing-and-session.md#cand-01-a1-4b) | Loading shows the verifying message without a push, and a signed-in visitor gets no push. | [`shows a verifying message and does not redirect while auth is loading, and does not redirect a signed-in visitor`](../../../tests/spec/cand-01-campus-guard.test.tsx) |

<a id="cand-01-a1-1a"></a>
#### CAND-01-A1.1A: Portal layout: spinner, nothing, then page

- Precondition: `useAuth` is mocked three times: loading, done with no user, done with user `CAND-TEST-0001@example.invalid`; navigation components are stubbed.
- Action: Render the `(portal)` layout with a child paragraph in each state.
- Expected result: Loading shows the text Loading... and no child and no push; no user renders an empty container and calls `router.push('/login')`; a user renders the child inside the flag provider and the portal navigation with no push `app/(portal)/layout.tsx:31-67`
- Test: characterization: `tests/spec/cand-01-layouts.test.tsx::shows a spinner while loading, nothing and a push to /login without a user, and the page with a user`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. The assertions do not check the real flag request, the spinner styling, or that the push carries no `redirect` value beyond the exact string `/login`. The no-user step waits for the push with `waitFor` and asserts no call count, so a repeated push would not fail it.
- Evidence: UNVERIFIED

<a id="cand-01-a1-1b"></a>
#### CAND-01-A1.1B: Portal layout: survey and profile navigation

- Precondition: `useAuth` returns a user; the pathname is `/survey`, then `/profile`.
- Action: Render the layout at each pathname.
- Expected result: On `/survey` the survey navigation shows, the portal navigation does not, and `main` has the classes `flex-1 pt-16`; on `/profile` the portal navigation receives exactly `{ hideNavLinks: true }` `app/(portal)/layout.tsx:28-29,59-61`
- Test: characterization: `tests/spec/cand-01-layouts.test.tsx::swaps the navigation on /survey and hides the nav links on /profile`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Navigation components are stubs, so their own rendering is not checked; other pathnames are not tried.
- Evidence: UNVERIFIED

<a id="cand-01-a1-2a"></a>
#### CAND-01-A1.2A: Public layout gate on careers_public_enabled

- Precondition: `isServerFeatureEnabled` is mocked to resolve false, then true; `redirect` is mocked to throw.
- Action: Await the `(public)` layout function with a child paragraph in each case.
- Expected result: With false it asks for `careers_public_enabled` and calls `redirect('/login')`; with true it returns the careers shell, which shows the child and the Careers home link `app/(public)/layout.tsx:8-12`
- Test: characterization: `tests/spec/cand-01-layouts.test.tsx::redirects to /login when careers_public_enabled is off and renders the careers shell when it is on`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. The server flag helper is mocked, so the Frappe call and the `server-only` guard are not exercised here (see CAND-02-A2.1A).
- Evidence: UNVERIFIED

<a id="cand-01-a1-3a"></a>
#### CAND-01-A1.3A: Careers shell sends a signed-in visitor to the portal page

- Precondition: `useAuth` returns a user; the pathname is `/jobs`; the browser URL is `/jobs?job=HR-OPN-TEST-1`.
- Action: Render `CareersShell` with a child paragraph.
- Expected result: The container is empty and `router.replace` is called with `/open-jobs?job=HR-OPN-TEST-1` `components/careers/careers-shell.tsx:30-34`
- Test: characterization: `tests/spec/cand-01-layouts.test.tsx::renders nothing and replaces the URL with the portal page that matches the careers page`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Only the `/jobs` mapping is exercised here; the other mappings are covered by the helper cases CAND-01-A4.2A to CAND-01-A4.2D.
- Evidence: UNVERIFIED

<a id="cand-01-a1-3b"></a>
#### CAND-01-A1.3B: Careers shell for a guest

- Precondition: `useAuth` returns no user; the pathname is `/ai-match`.
- Action: Render `CareersShell` with a child paragraph.
- Expected result: The child shows; the AI Resume / Job Match link appears twice with `aria-current=page` and the Home links have none; the Login link points to `/login?redirect=%2Fdashboard`; `router.replace` is not called `components/careers/careers-shell.tsx:44-63,67-83`
- Test: characterization: `tests/spec/cand-01-layouts.test.tsx::renders the careers header and children for a guest and does not redirect`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. The branding hook and brand lockup are stubbed; layout and responsive classes are not checked.
- Evidence: UNVERIFIED

<a id="cand-01-a1-4a"></a>
#### CAND-01-A1.4A: Campus-apply redirects a signed-out visitor to login

- Precondition: `useAuth` returns no user and loading false; the query is `campus_invite=CINV-TEST-1&email=a%40example.invalid`.
- Action: Render the campus-apply page.
- Expected result: `router.push` is called once with `/login?redirect=` plus the encoded `/campus-apply?...` URL including the whole query, and nothing is rendered `app/campus-apply/page.tsx:42-48,94-96`
- Test: characterization: `tests/spec/cand-01-campus-guard.test.tsx::sends a signed-out visitor to /login with the whole campus-apply URL, query included, encoded in redirect and renders nothing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. The job-opening hook, navigation and wizard are stubbed.
- Evidence: UNVERIFIED

<a id="cand-01-a1-4b"></a>
#### CAND-01-A1.4B: Campus-apply while loading and when signed in

- Precondition: `useAuth` returns loading true with no user, then a user.
- Action: Render the page in each state.
- Expected result: Loading shows Verifying authorization status... and does not push; a signed-in visitor sees the portal navigation and is not pushed `app/campus-apply/page.tsx:42-48,81-93`
- Test: characterization: `tests/spec/cand-01-campus-guard.test.tsx::shows a verifying message and does not redirect while auth is loading, and does not redirect a signed-in visitor`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. The wizard steps after login are not rendered (the job-opening hook returns loading).
- Evidence: UNVERIFIED

<a id="cand-01-a2"></a>
### CAND-01-A2: Session state

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-01-A2.1A](01-overview-routing-and-session.md#cand-01-a2-1a) | Loading flag, user, candidate-stage profile and the constant-false onboarding flag. | [`starts loading, then holds the user and a candidate-stage profile built from the session, with isOnboardingComplete false`](../../../tests/spec/cand-01-auth-context.test.tsx) |
| [CAND-01-A2.1B](01-overview-routing-and-session.md#cand-01-a2-1b) | A rejection ends loading with no user and logs the error. | [`ends loading with no user and no profile when the session lookup rejects, and logs the error`](../../../tests/spec/cand-01-auth-context.test.tsx) |
| [CAND-01-A2.1C](01-overview-routing-and-session.md#cand-01-a2-1c) | refreshProfile reads the session again and the new user appears. | [`refreshProfile reads the session again and replaces the user`](../../../tests/spec/cand-01-auth-context.test.tsx) |
| [CAND-01-A2.2A](01-overview-routing-and-session.md#cand-01-a2-2a) | useAuth throws the named error without a provider. | [`useAuth throws a named error outside the provider`](../../../tests/spec/cand-01-auth-context.test.tsx) |
| [CAND-01-A2.3A](01-overview-routing-and-session.md#cand-01-a2-3a) | With no user the hook returns a fixed fallback e-mail. | [`falls back to the default email when no user is returned`](../../../tests/lib/hooks/useUser.test.tsx) |
| [CAND-01-A2.3B](01-overview-routing-and-session.md#cand-01-a2-3b) | The hook starts loading, then returns the session user's e-mail. | [`returns the logged-in user's email`](../../../tests/lib/hooks/useUser.test.tsx) |
| [CAND-01-A2.3C](01-overview-routing-and-session.md#cand-01-a2-3c) | A rejection yields the same fallback e-mail and logs the error. | [`falls back to the default email when fetching the user fails`](../../../tests/lib/hooks/useUser.test.tsx) |
| [CAND-01-A2.4A](01-overview-routing-and-session.md#cand-01-a2-4a) | The login toast appears and the flag is removed from sessionStorage. | [`displays success toast and clears sessionStorage when showLoginToast is set to true`](../../../tests/lib/contexts/auth-context.test.tsx) |
| [CAND-01-A2.5A](01-overview-routing-and-session.md#cand-01-a2-5a) | The provider calls profileFromFrappeUser with the session user and derives the onboarding flag from its stage. | [`hydrates profile state directly from the Frappe session user`](../../../tests/lib/contexts/auth-context.test.tsx) |

<a id="cand-01-a2-1a"></a>
#### CAND-01-A2.1A: Auth provider starts loading, then holds the session

- Precondition: `auth.getSession` resolves with a synthetic user `c1@example.invalid`.
- Action: Render a probe inside `AuthProvider`.
- Expected result: The probe first reads loading true, then loading false with the user's e-mail, lifecycle stage `candidate` and `isOnboardingComplete` false; the session was read once `lib/contexts/auth-context.tsx:38-40,64-92`
- Test: characterization: `tests/spec/cand-01-auth-context.test.tsx::starts loading, then holds the user and a candidate-stage profile built from the session, with isOnboardingComplete false`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Only `auth.getSession` is mocked (the rest of `lib/auth.ts` is real); no network.
- Evidence: UNVERIFIED

<a id="cand-01-a2-1b"></a>
#### CAND-01-A2.1B: Auth provider when the session lookup rejects

- Precondition: `auth.getSession` rejects with `Error('offline')`; `console.error` is silenced.
- Action: Render the probe.
- Expected result: Loading ends with no user and no profile and the error is logged as Unexpected error initializing auth: `lib/contexts/auth-context.tsx:74-80`
- Test: characterization: `tests/spec/cand-01-auth-context.test.tsx::ends loading with no user and no profile when the session lookup rejects, and logs the error`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. The unmount guard is not driven (section 10).
- Evidence: UNVERIFIED

<a id="cand-01-a2-1c"></a>
#### CAND-01-A2.1C: refreshProfile replaces the user

- Precondition: The first lookup resolves null; the second resolves a user `c2@example.invalid`.
- Action: Render the probe, then click the refresh button.
- Expected result: The user changes from none to the second e-mail and `getSession` was called twice `lib/contexts/auth-context.tsx:53-62`
- Test: characterization: `tests/spec/cand-01-auth-context.test.tsx::refreshProfile reads the session again and replaces the user`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. A rejecting refresh is not driven (section 10).
- Evidence: UNVERIFIED

<a id="cand-01-a2-2a"></a>
#### CAND-01-A2.2A: useAuth outside the provider

- Precondition: No provider is rendered; `console.error` is silenced.
- Action: Render the probe alone.
- Expected result: Rendering throws `useAuth must be used within an AuthProvider` `lib/contexts/auth-context.tsx:103-108`
- Test: characterization: `tests/spec/cand-01-auth-context.test.tsx::useAuth throws a named error outside the provider`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser.
- Evidence: UNVERIFIED

<a id="cand-01-a2-3a"></a>
#### CAND-01-A2.3A: useCurrentUser falls back when there is no user

- Precondition: `auth.getCurrentUser` resolves null.
- Action: Render the hook and wait for loading to end.
- Expected result: The returned e-mail equals the fixed fallback address in source `lib/hooks/useUser.ts:13`
- Test: mapped: `tests/lib/hooks/useUser.test.tsx::falls back to the default email when no user is returned`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. The address is not repeated here; the existing test asserts it as a literal. Pinned defect: PWHR-1512. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-01-a2-3b"></a>
#### CAND-01-A2.3B: useCurrentUser returns the user's e-mail

- Precondition: `auth.getCurrentUser` resolves `{ email: 'ava@example.com' }` — the synthetic address the existing test uses; `example.com` is a reserved documentation domain (RFC 2606), so it names no real mailbox, but it is not the `.invalid` form `conventions.md` section 8.3 asks for.
- Action: Render the hook; wait for loading to end.
- Expected result: Loading starts true with no e-mail, then the e-mail is returned and the lookup ran once `lib/hooks/useUser.ts:8-22`
- Test: mapped: `tests/lib/hooks/useUser.test.tsx::returns the logged-in user's email`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. `auth` is mocked. The fixture address uses `example.com` rather than `example.invalid`; changing it is a test-data change for the maker, not this spec pass. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-01-a2-3c"></a>
#### CAND-01-A2.3C: useCurrentUser falls back when the lookup rejects

- Precondition: `auth.getCurrentUser` rejects; `console.error` is spied.
- Action: Render the hook; wait for loading to end.
- Expected result: The fixed fallback e-mail is returned and `Error fetching user:` is logged with the error `lib/hooks/useUser.ts:14-16`
- Test: mapped: `tests/lib/hooks/useUser.test.tsx::falls back to the default email when fetching the user fails`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Pinned defect: PWHR-1512. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-01-a2-4a"></a>
#### CAND-01-A2.4A: Login toast is shown once and cleared

- Precondition: `sessionStorage.getItem` is spied to return `true`; the pathname is `/dashboard`.
- Action: Render the provider.
- Expected result: The toast Successfully logged in! is shown and `showLoginToast` is removed `lib/contexts/auth-context.tsx:43-51`
- Test: mapped: `tests/lib/contexts/auth-context.test.tsx::displays success toast and clears sessionStorage when showLoginToast is set to true`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. `Storage.prototype.getItem` is spied for every key, so the assertion does not prove the key name read. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-01-a2-5a"></a>
#### CAND-01-A2.5A: Profile is built from the session user

- Precondition: `auth.getSession` resolves a user; `profileFromFrappeUser` is mocked to return stage `onboarded`.
- Action: Render the probe.
- Expected result: The mock is called with the session user, the stage shown is `onboarded` and `isOnboardingComplete` is true `lib/contexts/auth-context.tsx:64-88,90-92`
- Test: mapped: `tests/lib/contexts/auth-context.test.tsx::hydrates profile state directly from the Frappe session user`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. The real `profileFromFrappeUser` always returns `candidate`, so this state is unreachable in the app (G2). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-01-a3"></a>
### CAND-01-A3: Root metadata

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-01-A3.1A](01-overview-routing-and-session.md#cand-01-a3-1a) | Title prefix and icon URL are derived from branding, with ERP as default. | [`builds the title and favicon from the branding: title_prefix, and app_logo made absolute against NEXT_PUBLIC_FRAPPE_URL unless it already starts with http`](../../../tests/spec/cand-01-metadata-and-redirects.test.tsx) |
| [CAND-01-A3.1B](01-overview-routing-and-session.md#cand-01-a3-1b) | A rejecting branding call falls back to ERP and /favicon.svg. | [`falls back to the prefix ERP and /favicon.svg when the branding call rejects`](../../../tests/spec/cand-01-metadata-and-redirects.test.tsx) |
| [CAND-01-A3.2A](01-overview-routing-and-session.md#cand-01-a3-2a) | The two token-link layouts set referrer no-referrer. | [`sets referrer no-referrer on the two token-link layouts`](../../../tests/spec/cand-01-metadata-and-redirects.test.tsx) |

<a id="cand-01-a3-1a"></a>
#### CAND-01-A3.1A: Metadata from branding

- Precondition: `getCandidateBranding` resolves in turn: prefix and `/files/logo.png`; prefix and `files/logo.png`; only an `https` logo. `NEXT_PUBLIC_FRAPPE_URL` is a synthetic host with a trailing slash.
- Action: Call `generateMetadata` three times.
- Expected result: The title default and template use the prefix; relative logos become the host plus a single leading-slash path; an `https` logo is unchanged; with no prefix the title uses `ERP` `app/layout.tsx:27-39,44-47`
- Test: characterization: `tests/spec/cand-01-metadata-and-redirects.test.tsx::builds the title and favicon from the branding: title_prefix, and app_logo made absolute against NEXT_PUBLIC_FRAPPE_URL unless it already starts with http`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Fonts and `Providers` are stubbed; the favicon is not fetched.
- Evidence: UNVERIFIED

<a id="cand-01-a3-1b"></a>
#### CAND-01-A3.1B: Metadata fallback

- Precondition: `getCandidateBranding` rejects.
- Action: Call `generateMetadata`.
- Expected result: The icon is `/favicon.svg`, the title uses `ERP` and the first keyword is `erp` `app/layout.tsx:26-28,40-42`
- Test: characterization: `tests/spec/cand-01-metadata-and-redirects.test.tsx::falls back to the prefix ERP and /favicon.svg when the branding call rejects`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser.
- Evidence: UNVERIFIED

<a id="cand-01-a3-2a"></a>
#### CAND-01-A3.2A: No-referrer on token-link layouts

- Precondition: None.
- Action: Import the `metadata` export of both layouts.
- Expected result: Both have `referrer` equal to `no-referrer` `app/ctc-proposal/layout.tsx:5`
- Test: characterization: `tests/spec/cand-01-metadata-and-redirects.test.tsx::sets referrer no-referrer on the two token-link layouts`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. The header that Next.js emits is not observed; only the exported object.
- Evidence: UNVERIFIED

<a id="cand-01-a4"></a>
### CAND-01-A4: Careers redirect helpers

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-01-A4.1A](01-overview-routing-and-session.md#cand-01-a4-1a) | loginHref encodes its argument and portalEquivalent defaults to /dashboard. | [`loginHref encodes the destination, and an unknown careers path maps to /dashboard`](../../../tests/spec/cand-01-metadata-and-redirects.test.tsx) |
| [CAND-01-A4.2A](01-overview-routing-and-session.md#cand-01-a4-2a) | A shared job id is carried to the portal URL. | [`keeps the shared job when a logged-in visitor opens /jobs?job=`](../../../tests/lib/login-redirect.test.ts) |
| [CAND-01-A4.2B](01-overview-routing-and-session.md#cand-01-a4-2b) | The job id is URI-encoded in the result. | [`encodes the job id`](../../../tests/lib/login-redirect.test.ts) |
| [CAND-01-A4.2C](01-overview-routing-and-session.md#cand-01-a4-2c) | Without a job parameter the plain list URL is returned. | [`sends /jobs without a job to the plain list`](../../../tests/lib/login-redirect.test.ts) |
| [CAND-01-A4.2D](01-overview-routing-and-session.md#cand-01-a4-2d) | Other careers pages ignore the job parameter. | [`ignores a job param on other careers pages`](../../../tests/lib/login-redirect.test.ts) |

<a id="cand-01-a4-1a"></a>
#### CAND-01-A4.1A: Login link and unknown-path mapping

- Precondition: None.
- Action: Call `loginHref` with a path containing `?`, `&` and `/`; call `portalEquivalent` with an unknown path; read the exported map and constants.
- Expected result: The redirect value is fully URI-encoded; the unknown path maps to `/dashboard`; the map has exactly three entries and the shared-job parameter is `job` `lib/careers/login-redirect.ts:2-4,10-17,25`
- Test: characterization: `tests/spec/cand-01-metadata-and-redirects.test.tsx::loginHref encodes the destination, and an unknown careers path maps to /dashboard`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Pure functions; no router.
- Evidence: UNVERIFIED

<a id="cand-01-a4-2a"></a>
#### CAND-01-A4.2A: Shared job link is kept

- Precondition: None.
- Action: Call `portalEquivalent('/jobs', '?job=HR-OPN-2026-0007')`.
- Expected result: The result is `/open-jobs?job=HR-OPN-2026-0007` `lib/careers/login-redirect.ts:24-28`
- Test: mapped: `tests/lib/login-redirect.test.ts::keeps the shared job when a logged-in visitor opens /jobs?job=`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-01-a4-2b"></a>
#### CAND-01-A4.2B: Job id is encoded

- Precondition: None.
- Action: Call `portalEquivalent('/jobs', '?job=A%26B')`.
- Expected result: The result is `/open-jobs?job=A%26B` `lib/careers/login-redirect.ts:26-27`
- Test: mapped: `tests/lib/login-redirect.test.ts::encodes the job id`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-01-a4-2c"></a>
#### CAND-01-A4.2C: No job gives the plain list

- Precondition: None.
- Action: Call `portalEquivalent('/jobs', '')` and with `?q=x`.
- Expected result: Both return `/open-jobs` `lib/careers/login-redirect.ts:26-27`
- Test: mapped: `tests/lib/login-redirect.test.ts::sends /jobs without a job to the plain list`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-01-a4-2d"></a>
#### CAND-01-A4.2D: Job parameter ignored off /jobs

- Precondition: None.
- Action: Call `portalEquivalent` for `/` and `/ai-match` with `?job=HR-OPN-1`.
- Expected result: The results are `/dashboard` and `/open-jobs?tab=smart-match` without the job `lib/careers/login-redirect.ts:25-27`
- Test: mapped: `tests/lib/login-redirect.test.ts::ignores a job param on other careers pages`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: Services and hooks are mocked with `vi.mock`; no real HTTP, Frappe backend or browser. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED
