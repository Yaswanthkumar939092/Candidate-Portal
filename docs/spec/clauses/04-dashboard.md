# SPEC-CAND-04: Candidate dashboard

<a id="spec-cand-04"></a>

- Stable ID: `SPEC-CAND-04`
- Described at: repo `hybrowlabs/Candidate-Portal`, branch `develop`, commit `0d7fd6f6002cd2dff3c6b6716195cf051f5fad1c` (committer date `2026-10-31 17:27:47 +0000`)
- Also read at: branch `deploy/hybrowbase-candidate-20261025`, commit `786b53e406869986d5d5d0c81b7ae6b1605f8315`; differs: `app/(portal)/dashboard/page.tsx` there reads a build constant `ONBOARDING_DASHBOARD_ENABLED` (`false`) from `lib/careers/milestone.ts`, passes no e-mail to `useDashboard`, renders `null` and replaces the URL with `/open-jobs`; `lib/hooks/useHomeContent.ts` there sets `enabled: HOME_PROMO_ENABLED` (`false`); `lib/services/applicantStatusService.ts` there calls `recruitment.api.v1.candidate.my_applications` and builds the timeline rows itself; `components/portal/portal-navigation.tsx` there has no Home and no Action Center item and a different brand block; the other files cited here are identical there; no `pw-uat` branch exists in this repo (`git ls-remote --heads origin pw-uat` printed nothing on 2026-11-01); only `develop` is described
- Author: Frontend Developer (Yashwanth). Reviewer: Code Reviewer (Yashwanth), to be recorded in the PR.
- Status: DRAFT

## 1. Purpose

This clause describes the page a candidate lands on at `/dashboard` and the parts it is built from: the page state machine, the three info cards, the key-contacts list, the welcome header, the joining-date countdown, the onboarding snapshot card with its offer-letter and culture-book buttons, the data-protection consent card, the company promotion block, and the portal top bar that links to the page. Issue: PWHR-1366 (parent PWHR-1362).

How the page is built. `DashboardPage` reads the signed-in user and profile from the auth context and asks `useDashboard(user?.email)` for one payload (`app/(portal)/dashboard/page.tsx:142-150`). The hook is a TanStack query keyed `["dashboard", { email }]`, enabled only with an e-mail, fresh for five minutes (`lib/hooks/useDashboard.ts:4-10`), that calls the backend method `recruitment.api.onboarding_dashboard.get_dashboard` through `FrappeAPI.get` (`lib/services/dashboard.ts:7-24`). The page chooses one region from that query (A1), shows a welcome header above it and the company promotion block below it (`app/(portal)/dashboard/page.tsx:227-236`).

The page never decides what a candidate may see: the payload, the consent flags and the stage text come from the backend, and the page only reads them (section 4).

The order of the page's region choice, as coded:

1. loading: skeleton;
2. no `user.email`: error card;
3. query error or no data: error card;
4. consent required and not submitted: consent card only;
5. `onboarding_status` false: nothing (the promo block shows an empty state);
6. otherwise: snapshot, three info cards, key contacts.


## 2. Boundaries

- In: `app/(portal)/dashboard/page.tsx`; `components/dashboard/{dpdp-consent-card,info-card,journey-countdown,key-contacts,onboarding-snapshot,welcome-header}.tsx`; `lib/hooks/useDashboard.ts`; `lib/services/dashboard.ts`; `lib/hooks/useApplicantStatus.ts` and `lib/services/applicantStatusService.ts` (the applied-jobs data the top bar and the My Jobs page read); `lib/utils/dpdp-consent.ts`; `types/dashboard.ts`; `types/consent.ts` (only `isExternalConsentMode`); `components/home/{home-promo,promo-carousel,promo-hero,promo-artwork,value-grid}.tsx`; `components/shared/empty-state.tsx`; the parts of `components/portal/portal-navigation.tsx` and `components/portal/survey-offer-navigation.tsx` that link to or refresh the dashboard.
- Out: the auth context and the portal layout that wraps the page (SPEC-CAND-01). The Frappe client, the proxy and the backend method list (SPEC-CAND-02). The offer pages and the consent pages that the consent card links to, and `lib/hooks/useJobOffer.ts`, `lib/services/jobOffer.ts`, `lib/hooks/useHomeContent.ts`, `lib/services/home.ts`, `lib/hooks/useUser.ts` (read here only through the calls the snapshot makes; their own rules are in SPEC-CAND-07 or SPEC-CAND-01). The onboarding wizard the snapshot's Complete your onboarding link opens (SPEC-CAND-05 and SPEC-CAND-06). `components/shared/circular-progress.tsx` (SPEC-CAND-06). The My Jobs page that also reads the applied-jobs hook. The public home page that also renders `HomePromo` (`app/(public)/page.tsx:39`).
- Extension points: a new dashboard region is a new branch in the `dashboardRegion` expression (`app/(portal)/dashboard/page.tsx:152-225`); a new payload field is a new member of `DashboardData` (`types/dashboard.ts:38-57`).

## 3. Behaviour rules

### A1: Which region the page shows

- A1.1: While `useDashboard` reports `isLoading` the page shows the skeleton, before it looks at the e-mail or the data (`app/(portal)/dashboard/page.tsx:152-153`). [CAND-04-A1.1A] [CAND-04-A1.1B]
- A1.2: With no `user.email` and not loading, the page shows the error card with the text "We couldn't identify your account email for  dashboard yet." (two spaces between "for" and "dashboard"); its Try again button calls `refetch` (`app/(portal)/dashboard/page.tsx:154-158,117-140`). [CAND-04-A1.2A]
- A1.3: With an e-mail and a query error, or with no data, the page shows the error card titled "Unable to load dashboard" with the `Error` message, else the text "Something went wrong while fetching your dashboard data."; a query that reports no error and returns no data shows the same card with the generic text (`app/(portal)/dashboard/page.tsx:159-167`). [CAND-04-A1.3A] [CAND-04-A1.3B] [CAND-04-A1.3C]
- A1.4: When `dpdp_consent_required` is truthy and `dpdp_consent_submitted` is exactly `false`, the page shows only the consent card, given `dpdp_consent_url`, `dpdp_consent_mode` and the user's e-mail; with `submitted` true, `submitted` missing or `required` false, the dashboard body shows instead (`app/(portal)/dashboard/page.tsx:168-174`). [CAND-04-A1.4A] [CAND-04-A1.4B]
- A1.5: When `onboarding_status` is exactly `false` the region is `null`; the promo block then receives the empty state ("No Data Available") as its fallback, and in every other state it receives `null` (`app/(portal)/dashboard/page.tsx:175,234`). [CAND-04-A1.5A] [CAND-04-A1.5B]
- A1.6: The welcome header gets the greeting "Welcome back" and the name `profile.full_name`, else the payload `name`, else "User" (`app/(portal)/dashboard/page.tsx:229-232`). [CAND-04-A1.6A]
- A1.7: The page makes no redirect and reads no query string; it reads the e-mail only from the auth context (`app/(portal)/dashboard/page.tsx:143-150`).

### A2: Info cards, joining date and contacts

- A2.1: The snapshot gets `completedSteps` 8 when the payload has a `date_of_joining` and 0 when it has none, and `totalSteps` 8, a constant of the page (`app/(portal)/dashboard/page.tsx:18,35-37,177-182`). [CAND-04-A2.1A] Issue: PWHR-1543.
- A2.2: The Joining Date card shows the formatted date or " Not available" (with a leading space) and the countdown as its tag (`app/(portal)/dashboard/page.tsx:185-194`). [CAND-04-A2.3A]
- A2.3: The Office Location card shows `work_location` or "Not available"; its subtitle is `custom_address`, else the non-empty `custom_office_city`, `custom_state` and `custom_country` joined with ", ", else "Address not available", and "Address not available" when `work_location_details` is missing (`app/(portal)/dashboard/page.tsx:39-51,196-200`). [CAND-04-A2.2B] [CAND-04-A2.2C] [CAND-04-A2.2D] [CAND-04-A2.2E]
- A2.4: The card's tag is a link "View on Map" to `custom_google_map_link` with `target="_blank"` and `rel="noreferrer"` when that field is set, and nothing otherwise (`app/(portal)/dashboard/page.tsx:201-212`). [CAND-04-A2.2A]
- A2.5: The Role & Department card shows `designation` or "Not assigned", with `department` or "Department not available" as the subtitle (`app/(portal)/dashboard/page.tsx:215-220`). [CAND-04-A2.2B]
- A2.6: The date shows as "Weekday, day Mon year" in US English in the browser's time zone; an unparseable string is shown unchanged and an empty value gives an empty string (`app/(portal)/dashboard/page.tsx:20-33`). [CAND-04-A2.3A] Issue: PWHR-1542.
- A2.7: Each contact is named by `employee_name`, else `name`, else `role`, else `email`; `email` and `phone_number` become `undefined` when empty; a missing list becomes an empty list (`app/(portal)/dashboard/page.tsx:53-61,223`). [CAND-04-A2.4A] [CAND-04-A2.1A] [CAND-04-A2.2C]

### A3: Header, countdown, info card, key contacts

- A3.1: `WelcomeHeader` shows the part of the name before the first single space, or "User" when the name is missing or empty (`components/dashboard/welcome-header.tsx:28-31,43`). [CAND-04-A3.1A] [CAND-04-A3.1B] [CAND-04-A3.1C] [CAND-04-A3.1D]
- A3.2: Without a greeting prop it greets "Good morning" before hour 12, "Good afternoon" before hour 17 and "Good evening" otherwise, on the browser's clock (`components/dashboard/welcome-header.tsx:18-23,42`). [CAND-04-A3.2A] [CAND-04-A3.2B] [CAND-04-A3.2C] [CAND-04-A3.2D] [CAND-04-A3.2E]
- A3.3: It shows a "Profile Active" badge only when the auth context has a profile, a fixed subtitle, and a wave emoji labelled "wave" (`components/dashboard/welcome-header.tsx:45,52-69,56-58`). [CAND-04-A3.3A] [CAND-04-A3.3B] [CAND-04-A3.3C] [CAND-04-A3.3D] Issue: PWHR-1543.
- A3.4: `JourneyCountdown` shows "In N Day(s)" with N the number of calendar days from today to the joining date in local time, never below 0, "Day" only for 1, and nothing for an empty date; an unparseable date shows "In NaN Days" (`components/dashboard/journey-countdown.tsx:16-27,36-59`). [CAND-04-A3.4A] [CAND-04-A3.4B] [CAND-04-A3.4C] [CAND-04-A3.4D] [CAND-04-A3.4E] [CAND-04-A3.4F] Issue: PWHR-1542.
- A3.5: `InfoCard` always shows the icon, label and value; it shows the subtitle and the tag only when they are truthy; the tag style is chosen by `tagVariant` (default "default") (`components/dashboard/info-card.tsx:27-71`). [CAND-04-A3.5A] [CAND-04-A3.5B] [CAND-04-A3.5C] [CAND-04-A3.5D]
- A3.6: `KeyContacts` renders nothing for an empty list; otherwise a heading "Your Key Contacts" and one row per contact with initials (first letter of the first and last word, "U" without a name), the name or "Unknown Contact", the role or "Role not assigned", an Email link `mailto:<email>` and a Call link `tel:<phone>` when those fields are set, built without encoding (`components/dashboard/key-contacts.tsx:22-28,38-109`). [CAND-04-A3.6A] [CAND-04-A3.6B] [CAND-04-A3.6C] [CAND-04-A3.6D] [CAND-04-A3.6E] [CAND-04-A3.6F]

### A4: Onboarding snapshot

- A4.1: The ring percentage is `form_completion.percentage` rounded when present (including 0), else `completedSteps / totalSteps` rounded, else 0 when `totalSteps` is 0 (`components/dashboard/onboarding-snapshot.tsx:126-131`). [CAND-04-A4.1A] [CAND-04-A4.1B] [CAND-04-A4.1C]
- A4.2: The snapshot counts as complete when `onboarding_stage`, lower-cased, is "onboarding complete", "complete" or "completed", or `onboarding_status` is true, or the percentage is 100 or more (`components/dashboard/onboarding-snapshot.tsx:133-138`). A complete snapshot shows a "Ready" label and a check badge (`components/dashboard/onboarding-snapshot.tsx:341-352`). [CAND-04-A4.2B] [CAND-04-A4.2D]
- A4.3: The badge text is `onboarding_stage` when present, else "ONBOARDING COMPLETE" or "ONBOARDING IN PROGRESS" (`components/dashboard/onboarding-snapshot.tsx:183-184`). [CAND-04-A4.2A] [CAND-04-A4.2C]
- A4.4: When complete and a joining date exists (the payload's, else the prop) the heading is "You are ready to join us on <Month> <day><suffix>!" with the suffixes st, nd, rd for 1, 2, 3, 21, 22, 23 and 31 (st for 1, 21, 31), and th otherwise; else the heading is "<completedSteps> of <totalSteps> steps completed" (`components/dashboard/onboarding-snapshot.tsx:68-81,140,189-191`). [CAND-04-A4.3A] Issue: PWHR-1542.
- A4.5: The snapshot reads the user's e-mail from `useCurrentUser`, not from the page, and calls the job-offer hooks with it: the summary, the letters (always enabled) and the PDF URL (enabled only when the candidate has no separate letters) (`components/dashboard/onboarding-snapshot.tsx:101-116`). [CAND-04-A4.4A]
- A4.6: The offer buttons and the culture-book button show only when the auth context has a profile; "Complete your onboarding" always links to `/onboarding` (`components/dashboard/onboarding-snapshot.tsx:203-215`). [CAND-04-A4.4E]
- A4.7: With two or more letters the offer entry is a menu whose trigger shows the count; otherwise two buttons (one for narrow and one for wide screens) that use the first letter's data URL when the candidate has separate letters, else the PDF URL, and are disabled while the letters load or when no source exists (`components/dashboard/onboarding-snapshot.tsx:217-309`). [CAND-04-A4.4B] [CAND-04-A4.4E]
- A4.8: The download button fetches the URL with `credentials: "include"` and saves a blob as "Offer_Letter.pdf"; a `data:` URL is saved without a fetch; a failure (a rejected or not-OK fetch) shows the toast "Could not download the offer letter. Please try again." (`components/dashboard/onboarding-snapshot.tsx:14-36`). [CAND-04-A4.4C] [CAND-04-A4.4D] [CAND-04-A4.4F]
- A4.9: The preview button opens a URL that does not start with `data:` in a new tab with `noopener,noreferrer`; for a `data:` URL it opens an empty window (no `noopener`) and writes an `<iframe src="...">` string with that URL into it (`components/dashboard/onboarding-snapshot.tsx:38-50`). [CAND-04-A4.4C] Issue: PWHR-1540.
- A4.10: The Culture Book button shows only when availability is true and a URL exists. Clicking it fetches the URL; a JSON reply with `message.available === false` shows the toast "Culture book is not available." and opens nothing; any other reply, and a failed fetch, open the URL in a new tab (`components/dashboard/onboarding-snapshot.tsx:142-158,312-325`). [CAND-04-A4.5A] [CAND-04-A4.5B] [CAND-04-A4.5C] [CAND-04-A4.5D] [CAND-04-A4.5E]

### A5: Consent card and helpers

- A5.1: `DpdpConsentCard` shows "Consent Pending" and one button. When `consentUrl` is an absolute http or https URL the button is an anchor to it with `rel="noopener noreferrer"`, worded "Continue to Consent Portal" for mode "External Portal" (any case, trimmed) and "Go to Consent Form" otherwise; in every other case it is an in-app link to `consentUrl` when that starts with "/", else to `/job_offer/consent` with `appl=<encoded e-mail>` (`components/dashboard/dpdp-consent-card.tsx:27-50,104-120`, `types/consent.ts:56-60`). [CAND-04-A5.1A] [CAND-04-A5.1B] [CAND-04-A5.1C] [CAND-04-A5.1D] [CAND-04-A5.1E] [CAND-04-A5.1F] [CAND-04-A5.2B]
- A5.2: A `consentUrl` that starts with two slashes starts with "/" and so becomes the in-app link as given (`components/dashboard/dpdp-consent-card.tsx:45-48`). [CAND-04-A5.2A] Issue: PWHR-1541.
- A5.3: The card states the Digital Personal Data Protection Act as the reason for asking consent (`components/dashboard/dpdp-consent-card.tsx:94-101`). Statutory source: REQUIRED (supplier: Legal or the data-protection officer).
- A5.4: `buildConsentQuery` adds `appl` and `token` only when set, URL-encoded; `buildConsentPath` appends `?<query>` only when the query is not empty (`lib/utils/dpdp-consent.ts:23-37`). [CAND-04-A5.3A] [CAND-04-A5.3B] [CAND-04-A5.3C] [CAND-04-A5.3D]
- A5.5: `isSafeExternalConsentUrl` is true for a non-empty string that parses, after trimming, as an `http:` or `https:` URL, and false otherwise; `resolveConsentOnwardUrl` returns the redirect URL as given with `isExternal` true when it passes, else `/onboarding` with the query and `isExternal` false (`lib/utils/dpdp-consent.ts:48-56,79-91`). [CAND-04-A5.3E] [CAND-04-A5.3F] [CAND-04-A5.3G] [CAND-04-A5.3H] [CAND-04-A5.3I] [CAND-04-A5.3J] [CAND-04-A5.3L]
- A5.6: `navigateToExternalConsent` assigns `window.location` for a safe URL and returns true, else returns false; the dashboard card does not call it (only `lib/hooks/useExternalConsentHandoff.ts:35,54` does) (`lib/utils/dpdp-consent.ts:66-71`). [CAND-04-A5.3K]

### A6: Data layer

- A6.1: `getDashboardData` throws "Email is required" for an empty e-mail, calls `get_dashboard` with `{ email }`, throws the reply's `message` or "Failed to fetch dashboard" when `success` is falsy, and returns `data` untouched otherwise (`lib/services/dashboard.ts:7-25`). [CAND-04-A6.1A] [CAND-04-A6.1B] [CAND-04-A6.1C] [CAND-04-A6.1D]
- A6.2: `useDashboard` keys the query `["dashboard", { email }]`, is enabled only for a truthy e-mail and keeps data fresh for five minutes; the query function itself runs `getDashboardData(email!)` even when `refetch` is called on the disabled query (`lib/hooks/useDashboard.ts:4-10`). [CAND-04-A6.2A] [CAND-04-A6.2B] [CAND-04-A6.2C] [CAND-04-A6.2E]
- A6.3: The portal top bar invalidates the `["dashboard", { email }]` query when the brand link or a Home link is clicked, where the e-mail is `user.email`, else `user.user_metadata.email`, else "" (`components/portal/portal-navigation.tsx:126,212-216,265-269,289-293`). [CAND-04-A6.2D]
- A6.4: `getApplicantStatusResponse` is a GET of `recruitment.api.channels.careers.get_applied_jobs` with `{ email }` and `getJobApplicant` a GET of `recruitment.api.draft_application.get_job_applicant` with `{ job_applicant }`; both return the reply as given (`lib/services/applicantStatusService.ts:25-42`). [CAND-04-A6.3A] [CAND-04-A6.3B] [CAND-04-A6.3C]
- A6.5: `useApplicantStatus` is keyed `["application-status", email]` and `useJobApplicantDetails` `["job-applicant-details", name]`; each is enabled only for a truthy argument and neither retries (`lib/hooks/useApplicantStatus.ts:4-19`). [CAND-04-A6.4A] [CAND-04-A6.4B] [CAND-04-A6.4C] [CAND-04-A6.4D] [CAND-04-A6.4E]

### A7: Company promotion block

- A7.1: `HomePromo` shows a skeleton while its query loads; the `fallback` when the query failed, returned nothing or has all three sections disabled; otherwise each enabled section (hero, carousel, values) in that order (`components/home/home-promo.tsx:60-77`). [CAND-04-A7.1A] [CAND-04-A7.1B] [CAND-04-A7.1C] [CAND-04-A7.1D] [CAND-04-A7.1E] [CAND-04-A7.1F]
- A7.2: Its content query is `["home-content"]`, fresh for one hour, without retry (`lib/hooks/useHomeContent.ts:4-11`, SPEC-CAND-07).
- A7.3: The carousel module is loaded on demand with server rendering off (`components/home/home-promo.tsx:13-19`).
- A7.4: `PromoCarousel` renders nothing for an empty slide list; with two or more slides it shows previous and next buttons and one dot per slide, the active dot marked `aria-current`; next and previous wrap around (`components/home/promo-carousel.tsx:60-65,93-128`). [CAND-04-A7.2A] [CAND-04-A7.2B] [CAND-04-A7.2E] [CAND-04-A7.2F]
- A7.5: It advances every `interval` milliseconds unless there are fewer than two slides, the interval is 0 or less, the pointer is over it, focus is inside it or the user prefers reduced motion; a manual move restarts the timer (`components/home/promo-carousel.tsx:52-63,72-77`). [CAND-04-A7.2C] [CAND-04-A7.2D]
- A7.6: `ValueGrid` maps each card's `icon` to a Lucide icon and uses the sparkles icon when the icon is missing or unknown (`components/home/value-grid.tsx:5-12,28`). [CAND-04-A7.1E]
- A7.7: `PromoArtwork` shows the configured image unoptimized and, if loading it fails, the preset illustration named by `artworkKey` (default "learners") (`components/home/promo-artwork.tsx:98-126`). Not covered by a case (section 10).

### A8: Portal top bar (dashboard-related parts)

- A8.1: The bar lists Home (`/dashboard`), Open Jobs, My Jobs and Action Center, filtered by the feature flags of the items that have a flag key (Home has none), and hides the list and the mobile menu when `hideNavLinks` is true (`components/portal/portal-navigation.tsx:64-84,132-137,184,278-282`). [CAND-04-A8.1A] [CAND-04-A8.1B] [CAND-04-A8.1C]
- A8.2: The My Jobs item shows a count from `applicantStatus.data.applications.length` when the reply has `success` true, and no count for 0 (`components/portal/portal-navigation.tsx:126-130,159-162,304-315`). [CAND-04-A8.2A] [CAND-04-A8.2B]
- A8.3: Home is active only on exactly `/dashboard`; other items are active by path prefix (`components/portal/portal-navigation.tsx:152-157`).
- A8.4: The brand block is not a link on `/survey`, any `/job_offer` path and `/campus-apply` paths (`components/portal/portal-navigation.tsx:249-260`). [CAND-04-A8.3A]
- A8.5: The display name is `profile.full_name`, else the user metadata name, else the text before the "@", else "User"; initials are the first letters of the first two words (`components/portal/portal-navigation.tsx:90-97,139-145`). [CAND-04-A8.4A] [CAND-04-A8.4B]
- A8.6: The user menu has Profile, a theme toggle and Sign Out (the last two follow `disableUserDropdown`); Sign Out calls `auth.signOut` then assigns `/login` (`components/portal/portal-navigation.tsx:164-171,331-419`). [CAND-04-A8.4C] [CAND-04-A8.4D] [CAND-04-A8.4E]
- A8.7: `SurveyOfferNavigation` is `PortalNavigation` with `hideNavLinks` true (`components/portal/survey-offer-navigation.tsx:5-7`). [CAND-04-A8.5A]


## 4. Data and permissions

- The payload `DashboardData` has `name`, `date_of_joining`, `designation`, `department`, `work_location`, `work_location_details` (location code, address parts, a map link and office contact fields), `key_contacts` (name, employee, role, e-mail, phone number, index, employee name) and optional `onboarding_stage`, `form_completion` (total, filled, percentage), `onboarding_status`, `dpdp_consent_required`, `dpdp_consent_submitted`, `dpdp_consent_url` and `dpdp_consent_mode` (`types/dashboard.ts:3-57`). The page reads every one except the office contact fields, the location code, the index and the employee id.
- The request carries the e-mail as the `email` query parameter; the page takes it from the auth context, so a candidate asks for their own e-mail. Whether the backend checks that the session's user owns that e-mail is a backend fact not read here (`lib/services/dashboard.ts:15-18`). `[INFERENCE]`: the page does not enforce it.
- The consent flags decide whether the dashboard body is hidden behind the consent card; the front end only reads them (`app/(portal)/dashboard/page.tsx:168-174`).
- The snapshot's offer data comes from the job-offer hooks with the e-mail from `useCurrentUser` (`components/dashboard/onboarding-snapshot.tsx:9,101-119`). That hook falls back to a fixed address when there is no session (`lib/hooks/useUser.ts:13,16`); the address is a personal-looking value in source and is not repeated here. Issue: PWHR-1512.
- No page or component in this clause reads or writes `localStorage`, `sessionStorage` or cookies (a search of the in-scope files found none).
- Statutory source: REQUIRED (supplier: Legal or the data-protection officer) for the consent card text that names the Digital Personal Data Protection Act (`components/dashboard/dpdp-consent-card.tsx:94-101`); no other statutory content is in scope.

## 5. Errors and edge behaviour

- A failed dashboard request shows the error card with the error's message when it is an `Error`, else a fixed text; the card offers a retry that refetches (`app/(portal)/dashboard/page.tsx:159-167`).
- An HTTP error from `FrappeAPI.get` is raised by `handleResponseError` before the service looks at `success` (`lib/frappe-api.ts:57-71`); what text it raises is SPEC-CAND-02.
- A reply with `success` false raises `message` or "Failed to fetch dashboard" (`lib/services/dashboard.ts:20-22`).
- A reply where `success` is true but `data` is missing returns `undefined`; the page then shows the generic error card because `!dashboardData` is true (`lib/services/dashboard.ts:24`, `app/(portal)/dashboard/page.tsx:159`). `[INFERENCE]`: TanStack Query treats an `undefined` result as an error for the query; the page's own check covers it either way.
- A failed offer download shows a toast and nothing else (`components/dashboard/onboarding-snapshot.tsx:33-35`). A failed culture-book check opens the URL anyway (`components/dashboard/onboarding-snapshot.tsx:155-157`).
- An unparseable joining date is shown as is on the card, gives "In NaN Days" in the countdown, and gives "Invalid Date"-derived text in the snapshot heading (the month is "Invalid Date" and the day is NaN; not run) (`app/(portal)/dashboard/page.tsx:24-26`, `components/dashboard/journey-countdown.tsx:25-26`, `components/dashboard/onboarding-snapshot.tsx:68-80`). `[INFERENCE]`: the snapshot text is read from the code, not run.

## 6. Configuration

- `TOTAL_STEPS` is 8 in the page and the default `totalSteps` is 8 in the snapshot (`app/(portal)/dashboard/page.tsx:18`, `components/dashboard/onboarding-snapshot.tsx:95`).
- The dashboard query is fresh for five minutes; the applicant queries do not retry; the promo query is fresh for one hour (`lib/hooks/useDashboard.ts:9`, `lib/hooks/useApplicantStatus.ts:9,18`, `lib/hooks/useHomeContent.ts:8`).
- The consent paths are `/job_offer/consent`, `/job_offer/consent/return` and `/onboarding` (`lib/utils/dpdp-consent.ts:11,14,17`).
- Feature flags (`open_jobs`, `my_jobs`, `action_center`) filter the top bar (`components/portal/portal-navigation.tsx:66-83`). The dashboard page itself has no flag on `develop`; on the deploy branch a build constant switches the page off (header).
- The backend base URL and the proxy are SPEC-CAND-02.

## 7. Scheduled jobs, hooks and patches

None. The page runs no timers except the countdown's one-shot effect (`components/dashboard/journey-countdown.tsx:39-45`), the carousel's autoplay interval (`components/home/promo-carousel.tsx:52-58`) and the progress ring's 50 ms start delay (`components/shared/circular-progress.tsx:39-45`).

## 8. Static security and performance observations

- Security: `openPdfPreview` writes an HTML string that contains a `data:` URL built from backend base64 into a new window without checking the characters and opens that window without `noopener` (`components/dashboard/onboarding-snapshot.tsx:38-46,238,250,268,291`). Issue: PWHR-1540.
- Security: a consent URL that starts with two slashes is used as an in-app link (`components/dashboard/dpdp-consent-card.tsx:45-48`). Issue: PWHR-1541.
- Security: the map link from the payload is used as an `href` with no scheme check (`app/(portal)/dashboard/page.tsx:202-209`); the consent card checks the scheme, the map link does not. Not filed: the payload is backend-controlled; the question is whether `javascript:` can occur there.
- Security: `mailto:` and `tel:` links are built from payload values without encoding (`components/dashboard/key-contacts.tsx:81,97`). Not filed: same backend-control question.
- Security: the offer download and culture-book requests use `credentials: "include"` against a URL built by `jobOfferService` from `frappeApiBase()` (`components/dashboard/onboarding-snapshot.tsx:24,145`, `lib/services/jobOffer.ts:99-114`); that base is the same-origin proxy in the browser (SPEC-CAND-02).
- Security: `useCurrentUser` substitutes a fixed e-mail when there is no session and the snapshot then asks for that address's offer letters (`lib/hooks/useUser.ts:13`, `components/dashboard/onboarding-snapshot.tsx:101-119`). Issue: PWHR-1512.
- Performance: `PromoCarousel` is code-split with `next/dynamic` so the motion library stays out of the first bundle (`components/home/home-promo.tsx:10-19`).
- Performance: with a profile the snapshot makes the letters call at once, always enabled, and each letter's whole PDF arrives as base64 in that reply (`components/dashboard/onboarding-snapshot.tsx:105-108`, `lib/services/jobOffer.ts:224-230`); the culture-book availability check issues a request on every mount of the snapshot until it is cached for five minutes (`lib/hooks/useJobOffer.ts:34-41`).
- Performance: the page's own query is fresh for five minutes, and the top bar invalidates it on each Home click, so a click refetches when the page is mounted (`lib/hooks/useDashboard.ts:9`, `components/portal/portal-navigation.tsx:265-269`).
- Performance: both the narrow-screen and wide-screen offer buttons render at once and one is hidden by CSS (`components/dashboard/onboarding-snapshot.tsx:262-308`).

## 9. Known gaps / open questions

- G1: Branch drift. There is no `pw-uat` branch. On `deploy/hybrowbase-candidate-20261025` the dashboard page is switched off by a build constant and redirects to `/open-jobs`, the promo query is disabled, the applied-jobs service calls a different method, and the top bar differs (header). Only `develop` is described. Issue: PWHR-1518.
- G2: The offer-letter preview writes backend data into HTML in a new window (A4.9). Issue: PWHR-1540.
- G3: A protocol-relative consent URL is treated as an in-app path (A5.2). Issue: PWHR-1541.
- G4: Date-only joining dates are read as UTC midnight and shown in local time; four existing tests fail under `TZ=America/Los_Angeles` (A2.6, A3.4, A4.4); the countdown shows "In NaN Days" for an unparseable date. Issue: PWHR-1542.
- G5: "Steps completed" is 8 of 8 whenever a joining date exists, while the ring uses the form completion (A2.1); the header subtitle always says "You are all set for your first day." (A3.3). Issue: PWHR-1543.
- G6: `useCurrentUser` falls back to a hard-coded e-mail, and the snapshot uses it (section 4). Issue: PWHR-1512.
- G7: Clicking Try again in the missing-e-mail state calls `refetch` on a disabled query, which runs the query function with an undefined e-mail and ends in the error "Email is required" (A6.2). Not filed: the error is shown only inside the already-shown error card state; no defect asserted.
- G8: The promo fallback test is `dashboardRegion ? null : <EmptyState />`; it is the `null` region of A1.5 that makes the fallback show, and an element region never does (`app/(portal)/dashboard/page.tsx:175,234`). Not filed: this is the coded rule, noted so a reviewer does not read it as a bug.
- G9: `components/dashboard/onboarding-snapshot.tsx` imports `DashboardData` after code, in the middle of the file (`components/dashboard/onboarding-snapshot.tsx:52`); the culture-book and offer logic lives in the component rather than in a hook. Not filed: structure only.
- G10: The mobile menu copy of the Home link (`components/portal/portal-navigation.tsx:212-216`) and the settings link in the user menu are not asserted; the only test of a settings link is skipped (`tests/components/portal-navigation.test.tsx:274`). Not filed: the link is commented out in source (`components/portal/portal-navigation.tsx:386-392`).
- G11: Every case stubs `fetch`, the router, the auth context or the services; none talks to a real Frappe site. Hosted CI is UNVERIFIED.
- G12: Test files that exist at `Described at` and are not mapped in whole or in part are listed in section 10.

## 10. Uncovered behaviour

Rules and files with no case. Each row has its reason. Counts come from a script that read each file at the working tree (equal to `Described at` for these files).

- A1.7, no redirect and no query string read: absence of behaviour, no assertion possible. Not filed.
- A4.9 `data:` branch of `openPdfPreview`: the multi-letter menu items that call it are not opened by any test (the menu content renders in a portal). Issue: PWHR-1540.
- A4.7 second button class names (`flex sm:hidden`, `hidden sm:flex`): CSS visibility is not computed in jsdom. Not filed.
- A5.6 `navigateToExternalConsent` is covered (CAND-04-A5.3K); its caller `lib/hooks/useExternalConsentHandoff.ts` is SPEC-CAND-07.
- A7.2 and A7.3 (promo query settings, dynamic import): the hook file belongs to SPEC-CAND-07; the dynamic import is exercised only through the mapped `HomePromo` tests, which wait for the carousel. Not filed.
- A7.4 `PromoHero` fields other than eyebrow, heading, body and stats, and `A7.7` `PromoArtwork` (image load failure, preset keys): no test renders them with an image. Not filed: decorative.
- A8.3 active-link rule (`/dashboard` exact, others by prefix): no test sets a path and reads the active class. Not filed.
- A8.4 brand block disabled on `/survey` and `/job_offer*`: only `/campus-apply` is tested (CAND-04-A8.3A). Not filed.
- A8.6 `disableUserDropdown`: not tested. Not filed.
- The mobile menu copy of the Home link: see G10.
- `tests/components/dashboard/welcome-header.test.tsx`: 3 of 13 tests are not mapped because a mapped test covers the same behaviour more tightly: `shows first name in greeting`, `shows time-of-day greeting when no custom greeting` (covered by CAND-04-A3.2E) and `accepts className prop`. Not filed.
- `tests/components/portal-navigation.test.tsx`: 29 `it(` calls, 11 mapped; 18 not mapped, 17 active and 1 skipped (`renders settings link in dropdown`, `it.skip`, not coverage). The unmapped active ones check header, brand lockup text, avatar initials, name and e-mail text, dropdown trigger, role badge, theme text, profile link, sign-out button text, a missing-profile name, mobile menu button, `className`, dark-mode text, avatar fallback and mobile icons. They concern the top bar in general and are owned by SPEC-CAND-01 (the bar is part of the portal layout); this clause maps only the rows about the dashboard, the nav items and the user menu actions. Not filed.
- Files outside this clause that the snapshot depends on, with their own tests: `lib/hooks/useJobOffer.ts` (`tests/lib/hooks/useJobOffer.test.tsx`, 11) and `lib/services/jobOffer.ts` (`tests/lib/services/jobOffer.test.ts`, 15): SPEC-CAND-07.
- `tests/components/shared/circular-progress.test.tsx` (the ring): SPEC-CAND-06.


## 11. Acceptance cases

Every case is `Evidence: UNVERIFIED`. Cases of kind `mapped` use a test that existed at the `Described at` commit and only gained a `// Spec:` comment line above the `it(`; cases of kind `characterization` use a test added by this change in `tests/spec/cand-04-*.test.tsx`, each with the two comment lines `// Spec:` and `// Characterization:`.

<a id="cand-04-a1"></a>
### CAND-04-A1: Dashboard page: which state shows

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-04-A1.1A](04-dashboard.md#cand-04-a1-1a) | Loading state shows skeletons. | [`renders skeleton loading state initially`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A1.1B](04-dashboard.md#cand-04-a1-1b) | Loading wins over the missing-e-mail error. | [`shows the skeleton, not the missing-email error, while the query is loading without an email`](../../../tests/spec/cand-04-dashboard-page.test.tsx) |
| [CAND-04-A1.2A](04-dashboard.md#cand-04-a1-2a) | Missing e-mail error and retry. | [`renders the missing-email error state and allows retry`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A1.3A](04-dashboard.md#cand-04-a1-3a) | Query error shows its message and retries. | [`renders an error state and retries the query`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A1.3B](04-dashboard.md#cand-04-a1-3b) | Non-Error rejection shows the generic message. | [`renders the generic error message when the query error is not an Error instance`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A1.3C](04-dashboard.md#cand-04-a1-3c) | No data and no error also shows the error state. | [`shows the generic error message when the query reports no error and returns no data`](../../../tests/spec/cand-04-dashboard-page.test.tsx) |
| [CAND-04-A1.4A](04-dashboard.md#cand-04-a1-4a) | Consent card replaces the dashboard body. | [`shows the consent card instead of the snapshot, cards and contacts when consent is required and explicitly not submitted`](../../../tests/spec/cand-04-dashboard-page.test.tsx) |
| [CAND-04-A1.4B](04-dashboard.md#cand-04-a1-4b) | Consent card needs required true and submitted exactly false. | [`does not show the consent card when submitted is true or missing, or when consent is not required`](../../../tests/spec/cand-04-dashboard-page.test.tsx) |
| [CAND-04-A1.5A](04-dashboard.md#cand-04-a1-5a) | Onboarding status false leaves the body empty. | [`hands the empty state to the promo as a fallback when onboarding has not started`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A1.5B](04-dashboard.md#cand-04-a1-5b) | Onboarding data keeps the empty state out of the promo. | [`keeps the empty state out of the promo fallback once onboarding data exists`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A1.6A](04-dashboard.md#cand-04-a1-6a) | Welcome header name order. | [`names the welcome header from the profile, then the backend name, then User`](../../../tests/spec/cand-04-dashboard-page.test.tsx) |

<a id="cand-04-a1-1a"></a>
#### CAND-04-A1.1A: Loading state shows skeletons

- Precondition: `useDashboard` reports `isLoading`; the user has an e-mail.
- Action: Render the page.
- Expected result: Skeleton blocks show and the text Loading dashboard... does not `app/(portal)/dashboard/page.tsx:152-153`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::renders skeleton loading state initially`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend. The skeleton layout is not compared, only that skeleton elements exist.
- Evidence: UNVERIFIED

<a id="cand-04-a1-1b"></a>
#### CAND-04-A1.1B: Loading wins over the missing-e-mail error

- Precondition: `useDashboard` reports `isLoading`; the user has no e-mail.
- Action: Render the page.
- Expected result: Skeleton blocks show; neither the missing-e-mail text nor Unable to load dashboard shows `app/(portal)/dashboard/page.tsx:152-158`
- Test: characterization: `tests/spec/cand-04-dashboard-page.test.tsx::shows the skeleton, not the missing-email error, while the query is loading without an email`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a1-2a"></a>
#### CAND-04-A1.2A: Missing e-mail error and retry

- Precondition: The user has no e-mail; the query is not loading and has no data.
- Action: Render the page and click Try again.
- Expected result: The text We couldn't identify your account email for  dashboard yet. (two spaces) shows and `refetch` is called once `app/(portal)/dashboard/page.tsx:154-158`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::renders the missing-email error state and allows retry`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend. The retry calls the mocked `refetch`; what a real refetch does with no e-mail is CAND-04-A6.2E.
- Evidence: UNVERIFIED

<a id="cand-04-a1-3a"></a>
#### CAND-04-A1.3A: Query error shows its message and retries

- Precondition: The query reports `isError` with an `Error` whose message is Dashboard request failed.
- Action: Render the page and click Try again.
- Expected result: Unable to load dashboard and the error message show; `refetch` is called once `app/(portal)/dashboard/page.tsx:159-167,117-140`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::renders an error state and retries the query`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a1-3b"></a>
#### CAND-04-A1.3B: Non-Error rejection shows the generic message

- Precondition: The query reports `isError` with a plain string as the error.
- Action: Render the page.
- Expected result: The text Something went wrong while fetching your dashboard data. shows `app/(portal)/dashboard/page.tsx:161-165`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::renders the generic error message when the query error is not an Error instance`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a1-3c"></a>
#### CAND-04-A1.3C: No data and no error also shows the error state

- Precondition: The query is not loading, `isError` is false, `error` is null and `data` is undefined.
- Action: Render the page.
- Expected result: Unable to load dashboard and the generic message show; no snapshot renders `app/(portal)/dashboard/page.tsx:159-167`
- Test: characterization: `tests/spec/cand-04-dashboard-page.test.tsx::shows the generic error message when the query reports no error and returns no data`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a1-4a"></a>
#### CAND-04-A1.4A: Consent card replaces the dashboard body

- Precondition: The payload has `dpdp_consent_required` true and `dpdp_consent_submitted` false and a consent URL that is an in-app path.
- Action: Render the page.
- Expected result: Consent Pending shows with a link Go to Consent Form to that path; the snapshot, info cards and contacts do not render; the promo gets no fallback `app/(portal)/dashboard/page.tsx:168-174,234`
- Test: characterization: `tests/spec/cand-04-dashboard-page.test.tsx::shows the consent card instead of the snapshot, cards and contacts when consent is required and explicitly not submitted`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend. The consent card is the real component; the other children are mocked.
- Evidence: UNVERIFIED

<a id="cand-04-a1-4b"></a>
#### CAND-04-A1.4B: Consent card needs required true and submitted exactly false

- Precondition: Payloads: required with submitted true; required with submitted missing; not required with submitted false.
- Action: Render the page for each.
- Expected result: Consent Pending does not show and the snapshot renders each time `app/(portal)/dashboard/page.tsx:168-169`
- Test: characterization: `tests/spec/cand-04-dashboard-page.test.tsx::does not show the consent card when submitted is true or missing, or when consent is not required`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a1-5a"></a>
#### CAND-04-A1.5A: Onboarding status false leaves the body empty

- Precondition: The payload has `onboarding_status` false.
- Action: Render the page.
- Expected result: The snapshot and key contacts do not render and the promo receives the empty state (No Data Available) as its fallback `app/(portal)/dashboard/page.tsx:175,234`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::hands the empty state to the promo as a fallback when onboarding has not started`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend. The promo and the empty state are mocked or shallow; only the fallback text is read.
- Evidence: UNVERIFIED

<a id="cand-04-a1-5b"></a>
#### CAND-04-A1.5B: Onboarding data keeps the empty state out of the promo

- Precondition: The payload has `onboarding_status` true.
- Action: Render the page.
- Expected result: The snapshot renders and the promo fallback does not contain No Data Available `app/(portal)/dashboard/page.tsx:176-182,234`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::keeps the empty state out of the promo fallback once onboarding data exists`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a1-6a"></a>
#### CAND-04-A1.6A: Welcome header name order

- Precondition: Profiles and payloads: profile name set; profile null with a backend name; empty backend name; query in error.
- Action: Render the page for each.
- Expected result: The header gets the greeting Welcome back and the name from the profile, then the payload name, then User `app/(portal)/dashboard/page.tsx:229-232`
- Test: characterization: `tests/spec/cand-04-dashboard-page.test.tsx::names the welcome header from the profile, then the backend name, then User`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend. The header is a stub that prints its props.
- Evidence: UNVERIFIED

<a id="cand-04-a2"></a>
### CAND-04-A2: Dashboard page: cards, date and contacts

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-04-A2.1A](04-dashboard.md#cand-04-a2-1a) | Dashboard data feeds the header, snapshot, cards and contacts. | [`renders dashboard data from useDashboard`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A2.2A](04-dashboard.md#cand-04-a2-2a) | View on Map link. | [`renders the view on map link when custom_google_map_link is present`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A2.2B](04-dashboard.md#cand-04-a2-2b) | Fallback texts for empty fields. | [`falls back to derived address, backend name, and default role labels when fields are missing`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A2.2C](04-dashboard.md#cand-04-a2-2c) | Custom address wins; empty contact fields become undefined. | [`maps missing contact details to undefined and prefers a custom office address`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A2.2D](04-dashboard.md#cand-04-a2-2d) | No location details at all. | [`shows Address not available when the payload carries no location details at all`](../../../tests/spec/cand-04-dashboard-page.test.tsx) |
| [CAND-04-A2.2E](04-dashboard.md#cand-04-a2-2e) | Empty address and empty parts. | [`falls back to 'Address not available' when no office address details exist`](../../../tests/app/%28portal%29/dashboard/page.test.tsx) |
| [CAND-04-A2.3A](04-dashboard.md#cand-04-a2-3a) | Joining date display. | [`formats a parseable joining date as weekday, day, month and year, returns an unparseable value unchanged and shows a leading-space Not available when empty`](../../../tests/spec/cand-04-dashboard-page.test.tsx) |
| [CAND-04-A2.4A](04-dashboard.md#cand-04-a2-4a) | Contact mapping. | [`names each key contact by employee name, then name, then role, then e-mail, and passes an empty list when the payload has none`](../../../tests/spec/cand-04-dashboard-page.test.tsx) |

<a id="cand-04-a2-1a"></a>
#### CAND-04-A2.1A: Dashboard data feeds the header, snapshot, cards and contacts

- Precondition: The payload is complete; the profile has a name.
- Action: Render the page.
- Expected result: The header shows Welcome back and the profile name, the snapshot gets 8 of 8 steps, the three cards show the formatted joining date, the location with its address and the role with its department, and the contact line carries the contact's name, role, e-mail and phone `app/(portal)/dashboard/page.tsx:177-223`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::renders dashboard data from useDashboard`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend. The cards and contacts are stubs that print props. The joining-date assertion (Mon, 8 Sep 2025) depends on the machine time zone and fails under `TZ=America/Los_Angeles` (observed on `develop`). Issue: PWHR-1542. The 8 of 8 comes from a fixed rule (section 9). Issue: PWHR-1543.
- Evidence: UNVERIFIED

<a id="cand-04-a2-2a"></a>
#### CAND-04-A2.2A: View on Map link

- Precondition: `custom_google_map_link` is set.
- Action: Render the page.
- Expected result: A link named View on Map has that href `app/(portal)/dashboard/page.tsx:201-210`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::renders the view on map link when custom_google_map_link is present`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend. `target` and `rel` are not asserted. The href is not checked for a scheme (section 8).
- Evidence: UNVERIFIED

<a id="cand-04-a2-2b"></a>
#### CAND-04-A2.2B: Fallback texts for empty fields

- Precondition: Payload name, date, designation, department and location are empty; no custom address; city, state and country set; the contact has no employee name.
- Action: Render the page.
- Expected result: The header shows User, the snapshot gets 0 steps, the location value is Not available with the address Noida, Uttar Pradesh, India (the parts joined by commas), the role card shows Not assigned and Department not available, and the contact uses its `name` field `app/(portal)/dashboard/page.tsx:35-37,39-51,53-61,199,218-219`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::falls back to derived address, backend name, and default role labels when fields are missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a2-2c"></a>
#### CAND-04-A2.2C: Custom address wins; empty contact fields become undefined

- Precondition: `custom_address` is set and the city parts are empty; the contact has empty e-mail and phone.
- Action: Render the page.
- Expected result: The address line is the custom address and the contact line shows no e-mail and no phone (undefined) `app/(portal)/dashboard/page.tsx:45,58-59`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::maps missing contact details to undefined and prefers a custom office address`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a2-2d"></a>
#### CAND-04-A2.2D: No location details at all

- Precondition: `work_location` is empty and `work_location_details` is undefined.
- Action: Render the page.
- Expected result: The location value is Not available, the address line is Address not available and no map link shows `app/(portal)/dashboard/page.tsx:40-42,199-201`
- Test: characterization: `tests/spec/cand-04-dashboard-page.test.tsx::shows Address not available when the payload carries no location details at all`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a2-2e"></a>
#### CAND-04-A2.2E: Empty address and empty parts

- Precondition: `custom_address` and the city, state and country are empty strings.
- Action: Render the page.
- Expected result: The address line is Address not available `app/(portal)/dashboard/page.tsx:44-50`
- Test: mapped: `tests/app/(portal)/dashboard/page.test.tsx::falls back to 'Address not available' when no office address details exist`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a2-3a"></a>
#### CAND-04-A2.3A: Joining date display

- Precondition: Joining dates: a parseable date-time, an unparseable string, an empty string.
- Action: Render the page for each.
- Expected result: The first shows as weekday, day, month, year (Tue, 8 Sep 2026); the second is shown unchanged; the third shows a leading space then Not available `app/(portal)/dashboard/page.tsx:20-33,189-191`
- Test: characterization: `tests/spec/cand-04-dashboard-page.test.tsx::formats a parseable joining date as weekday, day, month and year, returns an unparseable value unchanged and shows a leading-space Not available when empty`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend. The weekday and day come from the local time zone of the machine (issue PWHR-1542). The test date has a noon time to stay in the same day for zones within twelve hours of UTC.
- Evidence: UNVERIFIED

<a id="cand-04-a2-4a"></a>
#### CAND-04-A2.4A: Contact mapping

- Precondition: Four contacts that lack, in turn, the employee name, the name and the role, and the e-mail; then a payload with no contacts key.
- Action: Render the page.
- Expected result: Each contact name is the employee name, else the name, else the role, else the e-mail; e-mail and phone become undefined when empty; the role is passed as given; a missing list gives an empty list `app/(portal)/dashboard/page.tsx:53-61,223`
- Test: characterization: `tests/spec/cand-04-dashboard-page.test.tsx::names each key contact by employee name, then name, then role, then e-mail, and passes an empty list when the payload has none`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, `useDashboard` and the child components are mocked; no real HTTP or Frappe backend. `KeyContacts` is a stub that records its props.
- Evidence: UNVERIFIED

<a id="cand-04-a3"></a>
### CAND-04-A3: Dashboard components: header, countdown, info card, contacts

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-04-A3.1A](04-dashboard.md#cand-04-a3-1a) | First name from a multi-word name. | [`extracts first name from multi-word name`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.1B](04-dashboard.md#cand-04-a3-1b) | Single-word name. | [`handles single-word name gracefully`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.1C](04-dashboard.md#cand-04-a3-1c) | No name gives User. | [`shows User when name is omitted`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.1D](04-dashboard.md#cand-04-a3-1d) | First name splits on a single space. | [`takes the first name before the first single space, so a leading space gives the whole name back`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |
| [CAND-04-A3.2A](04-dashboard.md#cand-04-a3-2a) | Custom greeting. | [`uses custom greeting when provided`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.2B](04-dashboard.md#cand-04-a3-2b) | Good morning. | [`shows Good morning before 12 PM`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.2C](04-dashboard.md#cand-04-a3-2c) | Good afternoon. | [`shows Good afternoon between 12 PM and 5 PM`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.2D](04-dashboard.md#cand-04-a3-2d) | Good evening. | [`shows Good evening after 5 PM`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.2E](04-dashboard.md#cand-04-a3-2e) | Greeting changes at hour 12 and hour 17. | [`switches the time-of-day greeting exactly at hour 12 and hour 17 of the local clock`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |
| [CAND-04-A3.3A](04-dashboard.md#cand-04-a3-3a) | Profile Active badge. | [`shows Profile Active badge when profile exists`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.3B](04-dashboard.md#cand-04-a3-3b) | No profile, no badge. | [`hides the Profile Active badge when the auth context has no profile`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |
| [CAND-04-A3.3C](04-dashboard.md#cand-04-a3-3c) | Subtitle. | [`shows subtitle text about onboarding`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.3D](04-dashboard.md#cand-04-a3-3d) | Wave emoji label. | [`renders a wave emoji with accessible label`](../../../tests/components/dashboard/welcome-header.test.tsx) |
| [CAND-04-A3.4A](04-dashboard.md#cand-04-a3-4a) | Countdown for a future date. | [`renders correctly for a future date`](../../../tests/components/dashboard/journey-countdown.test.tsx) |
| [CAND-04-A3.4B](04-dashboard.md#cand-04-a3-4b) | Countdown for tomorrow. | [`renders '1 Day' for tomorrow`](../../../tests/components/dashboard/journey-countdown.test.tsx) |
| [CAND-04-A3.4C](04-dashboard.md#cand-04-a3-4c) | Countdown for today or a past date. | [`renders '0 Days' for today or past date`](../../../tests/components/dashboard/journey-countdown.test.tsx) |
| [CAND-04-A3.4D](04-dashboard.md#cand-04-a3-4d) | Countdown with an empty date. | [`returns null and renders nothing if joiningDate is falsy`](../../../tests/components/dashboard/journey-countdown.test.tsx) |
| [CAND-04-A3.4E](04-dashboard.md#cand-04-a3-4e) | Countdown counts calendar days. | [`counts calendar days on the local clock, ignores the time of day and clamps past dates to 0`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |
| [CAND-04-A3.4F](04-dashboard.md#cand-04-a3-4f) | Unparseable date. | [`renders In NaN Days for an unparseable joining date`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |
| [CAND-04-A3.5A](04-dashboard.md#cand-04-a3-5a) | Info card basics. | [`renders with basic props correctly`](../../../tests/components/dashboard/info-card.test.tsx) |
| [CAND-04-A3.5B](04-dashboard.md#cand-04-a3-5b) | Info card subtitle. | [`renders with subtitle when provided`](../../../tests/components/dashboard/info-card.test.tsx) |
| [CAND-04-A3.5C](04-dashboard.md#cand-04-a3-5c) | Info card tag styles. | [`renders with tag and correct variant classes`](../../../tests/components/dashboard/info-card.test.tsx) |
| [CAND-04-A3.5D](04-dashboard.md#cand-04-a3-5d) | Empty tag and subtitle render nothing. | [`renders the tag and subtitle only when they are truthy and defaults the tag style to default`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |
| [CAND-04-A3.6A](04-dashboard.md#cand-04-a3-6a) | Contact list. | [`renders the list of contacts correctly`](../../../tests/components/dashboard/key-contacts.test.tsx) |
| [CAND-04-A3.6B](04-dashboard.md#cand-04-a3-6b) | Contact action links. | [`renders action buttons when email or phone is provided`](../../../tests/components/dashboard/key-contacts.test.tsx) |
| [CAND-04-A3.6C](04-dashboard.md#cand-04-a3-6c) | Initials from the name. | [`calculates initials correctly for avatar fallback`](../../../tests/components/dashboard/key-contacts.test.tsx) |
| [CAND-04-A3.6D](04-dashboard.md#cand-04-a3-6d) | Empty list. | [`returns null when contacts list is empty`](../../../tests/components/dashboard/key-contacts.test.tsx) |
| [CAND-04-A3.6E](04-dashboard.md#cand-04-a3-6e) | Fallback texts. | [`renders fallbacks for missing name, role, and calculates initials for single word names`](../../../tests/components/dashboard/key-contacts.test.tsx) |
| [CAND-04-A3.6F](04-dashboard.md#cand-04-a3-6f) | Initials and unencoded links. | [`builds initials from the first and last word of the name and puts the e-mail and phone into unencoded mailto and tel links`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |

<a id="cand-04-a3-1a"></a>
#### CAND-04-A3.1A: First name from a multi-word name

- Precondition: `WelcomeHeader` gets the name John Michael Doe.
- Action: Render it.
- Expected result: The text matches John `components/dashboard/welcome-header.tsx:28-31`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::extracts first name from multi-word name`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. The regex /John/ would also match the full name, so the test does not show that the later words are dropped (that is CAND-04-A3.1D).
- Evidence: UNVERIFIED

<a id="cand-04-a3-1b"></a>
#### CAND-04-A3.1B: Single-word name

- Precondition: `WelcomeHeader` gets the name Prince.
- Action: Render it.
- Expected result: The text matches Prince `components/dashboard/welcome-header.tsx:28-31`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::handles single-word name gracefully`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-1c"></a>
#### CAND-04-A3.1C: No name gives User

- Precondition: `WelcomeHeader` gets no name.
- Action: Render it.
- Expected result: The text matches User `components/dashboard/welcome-header.tsx:28-29`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::shows User when name is omitted`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. The regex /User/ is loose.
- Evidence: UNVERIFIED

<a id="cand-04-a3-1d"></a>
#### CAND-04-A3.1D: First name splits on a single space

- Precondition: Names: Ada Lovelace Byron; undefined; empty; a name with a leading space.
- Action: Render each with the greeting Hi.
- Expected result: The headings read Hi, Ada!; Hi, User!; Hi, User!; and Hi,  Ada Lovelace! (the whole name, because the part before the first space is empty) `components/dashboard/welcome-header.tsx:28-31,51`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::takes the first name before the first single space, so a leading space gives the whole name back`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-2a"></a>
#### CAND-04-A3.2A: Custom greeting

- Precondition: The greeting prop is Hello.
- Action: Render it.
- Expected result: The text matches Hello `components/dashboard/welcome-header.tsx:42`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::uses custom greeting when provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-2b"></a>
#### CAND-04-A3.2B: Good morning

- Precondition: Fake clock at 10:00 local.
- Action: Render it.
- Expected result: The text matches Good morning `components/dashboard/welcome-header.tsx:19-20`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::shows Good morning before 12 PM`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-2c"></a>
#### CAND-04-A3.2C: Good afternoon

- Precondition: Fake clock at 14:00 local.
- Action: Render it.
- Expected result: The text matches Good afternoon `components/dashboard/welcome-header.tsx:21`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::shows Good afternoon between 12 PM and 5 PM`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-2d"></a>
#### CAND-04-A3.2D: Good evening

- Precondition: Fake clock at 19:00 local.
- Action: Render it.
- Expected result: The text matches Good evening `components/dashboard/welcome-header.tsx:22`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::shows Good evening after 5 PM`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-2e"></a>
#### CAND-04-A3.2E: Greeting changes at hour 12 and hour 17

- Precondition: Fake clock at 00:00, 11:59, 12:00, 16:59, 17:00 and 23:59 local.
- Action: Render the header at each time.
- Expected result: The headings contain Good morning, Good morning, Good afternoon, Good afternoon, Good evening, Good evening `components/dashboard/welcome-header.tsx:18-23`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::switches the time-of-day greeting exactly at hour 12 and hour 17 of the local clock`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-3a"></a>
#### CAND-04-A3.3A: Profile Active badge

- Precondition: The auth context has a profile.
- Action: Render it.
- Expected result: The text Profile Active shows `components/dashboard/welcome-header.tsx:45,61-69`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::shows Profile Active badge when profile exists`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-3b"></a>
#### CAND-04-A3.3B: No profile, no badge

- Precondition: The auth context profile is null.
- Action: Render it with the greeting Hello.
- Expected result: The heading reads Hello, Test! and Profile Active does not show `components/dashboard/welcome-header.tsx:45,61`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::hides the Profile Active badge when the auth context has no profile`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-3c"></a>
#### CAND-04-A3.3C: Subtitle

- Precondition: Any profile.
- Action: Render it.
- Expected result: A text matching onboarding snapshot shows `components/dashboard/welcome-header.tsx:56-58`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::shows subtitle text about onboarding`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. The full sentence (You are all set for your first day.) is fixed text and is not asserted. Issue: PWHR-1543.
- Evidence: UNVERIFIED

<a id="cand-04-a3-3d"></a>
#### CAND-04-A3.3D: Wave emoji label

- Precondition: Any profile.
- Action: Render it.
- Expected result: An image role named wave shows `components/dashboard/welcome-header.tsx:52-54`
- Test: mapped: `tests/components/dashboard/welcome-header.test.tsx::renders a wave emoji with accessible label`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-4a"></a>
#### CAND-04-A3.4A: Countdown for a future date

- Precondition: Fake clock 2026-04-12; joining date 2026-04-15.
- Action: Render it.
- Expected result: The text In 3 Days shows `components/dashboard/journey-countdown.tsx:36-59`
- Test: mapped: `tests/components/dashboard/journey-countdown.test.tsx::renders correctly for a future date`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. The date-only string is parsed as UTC midnight and read in local time; this test fails under `TZ=America/Los_Angeles` (observed). Issue: PWHR-1542.
- Evidence: UNVERIFIED

<a id="cand-04-a3-4b"></a>
#### CAND-04-A3.4B: Countdown for tomorrow

- Precondition: Fake clock 2026-04-12; joining date 2026-04-13.
- Action: Render it.
- Expected result: The text In 1 Day shows (singular) `components/dashboard/journey-countdown.tsx:56`
- Test: mapped: `tests/components/dashboard/journey-countdown.test.tsx::renders '1 Day' for tomorrow`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. Same time-zone gap as CAND-04-A3.4A. Issue: PWHR-1542.
- Evidence: UNVERIFIED

<a id="cand-04-a3-4c"></a>
#### CAND-04-A3.4C: Countdown for today or a past date

- Precondition: Fake clock 2026-04-12; joining dates 2026-04-12 and 2026-04-10.
- Action: Render both.
- Expected result: Both show In 0 Days `components/dashboard/journey-countdown.tsx:26`
- Test: mapped: `tests/components/dashboard/journey-countdown.test.tsx::renders '0 Days' for today or past date`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-4d"></a>
#### CAND-04-A3.4D: Countdown with an empty date

- Precondition: The joining date is an empty string.
- Action: Render it.
- Expected result: Nothing renders `components/dashboard/journey-countdown.tsx:40-47`
- Test: mapped: `tests/components/dashboard/journey-countdown.test.tsx::returns null and renders nothing if joiningDate is falsy`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-4e"></a>
#### CAND-04-A3.4E: Countdown counts calendar days

- Precondition: Fake clock 2026-04-12 23:59 local; joining date-times on the next day at 00:01, the same day at 23:00, ten days on and a year before.
- Action: Render each.
- Expected result: The texts are In 1 Day, In 0 Days, In 10 Days and In 0 Days `components/dashboard/journey-countdown.tsx:16-27,56`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::counts calendar days on the local clock, ignores the time of day and clamps past dates to 0`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-4f"></a>
#### CAND-04-A3.4F: Unparseable date

- Precondition: The joining date is the string not-a-date.
- Action: Render it.
- Expected result: The text is In NaN Days `components/dashboard/journey-countdown.tsx:25-26,47,56`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::renders In NaN Days for an unparseable joining date`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. Pins a suspected defect, not endorsed. The page also hides the countdown only when the date is empty. Issue: PWHR-1542.
- Evidence: UNVERIFIED

<a id="cand-04-a3-5a"></a>
#### CAND-04-A3.5A: Info card basics

- Precondition: Icon, label and value.
- Action: Render it.
- Expected result: The label, value and icon show `components/dashboard/info-card.tsx:41-42,61-64`
- Test: mapped: `tests/components/dashboard/info-card.test.tsx::renders with basic props correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-5b"></a>
#### CAND-04-A3.5B: Info card subtitle

- Precondition: A subtitle is given.
- Action: Render it.
- Expected result: The subtitle shows `components/dashboard/info-card.tsx:67-69`
- Test: mapped: `tests/components/dashboard/info-card.test.tsx::renders with subtitle when provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-5c"></a>
#### CAND-04-A3.5C: Info card tag styles

- Precondition: Tags with the variants default, brand and link.
- Action: Render each.
- Expected result: The tag classes contain bg-muted, text-accent-foreground and cursor-pointer respectively `components/dashboard/info-card.tsx:44-57`
- Test: mapped: `tests/components/dashboard/info-card.test.tsx::renders with tag and correct variant classes`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. Class names are asserted, not the look.
- Evidence: UNVERIFIED

<a id="cand-04-a3-5d"></a>
#### CAND-04-A3.5D: Empty tag and subtitle render nothing

- Precondition: Tag and subtitle are empty strings; then a tag with no variant.
- Action: Render both.
- Expected result: No tag span and no subtitle paragraph render for empty strings; a tag without a variant gets the default style `components/dashboard/info-card.tsx:33,44,67`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::renders the tag and subtitle only when they are truthy and defaults the tag style to default`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-6a"></a>
#### CAND-04-A3.6A: Contact list

- Precondition: Two contacts.
- Action: Render the list.
- Expected result: The heading Your Key Contacts and each name and role show `components/dashboard/key-contacts.tsx:43,63-68`
- Test: mapped: `tests/components/dashboard/key-contacts.test.tsx::renders the list of contacts correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-6b"></a>
#### CAND-04-A3.6B: Contact action links

- Precondition: One contact with e-mail and phone, one with e-mail only.
- Action: Render the list.
- Expected result: Two Email links with mailto hrefs and one Call link with a tel href show `components/dashboard/key-contacts.tsx:73-104`
- Test: mapped: `tests/components/dashboard/key-contacts.test.tsx::renders action buttons when email or phone is provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-6c"></a>
#### CAND-04-A3.6C: Initials from the name

- Precondition: Names John Doe and Jane Smith.
- Action: Render the list.
- Expected result: The fallbacks JD and JS show `components/dashboard/key-contacts.tsx:22-28,56-58`
- Test: mapped: `tests/components/dashboard/key-contacts.test.tsx::calculates initials correctly for avatar fallback`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-6d"></a>
#### CAND-04-A3.6D: Empty list

- Precondition: An empty contact list.
- Action: Render it.
- Expected result: Nothing renders `components/dashboard/key-contacts.tsx:39`
- Test: mapped: `tests/components/dashboard/key-contacts.test.tsx::returns null when contacts list is empty`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a3-6e"></a>
#### CAND-04-A3.6E: Fallback texts

- Precondition: A contact with an empty name and an avatar URL; a contact with a single-word name and empty role.
- Action: Render the list.
- Expected result: The initials U and P, the text Unknown Contact, Role not assigned twice, and the link names Email Contact and Call Contact show `components/dashboard/key-contacts.tsx:22-28,63-68,82,98`
- Test: mapped: `tests/components/dashboard/key-contacts.test.tsx::renders fallbacks for missing name, role, and calculates initials for single word names`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. The avatar image is not asserted (the Radix avatar needs an image load event).
- Evidence: UNVERIFIED

<a id="cand-04-a3-6f"></a>
#### CAND-04-A3.6F: Initials and unencoded links

- Precondition: A name with extra spaces and three words; a one-letter name; an e-mail with a plus sign and a phone number with spaces.
- Action: Render the list.
- Expected result: The initials are the first and last word's first letters in capitals (AL, X); the hrefs are mailto: and tel: followed by the raw values `components/dashboard/key-contacts.tsx:22-28,81,97`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::builds initials from the first and last word of the name and puts the e-mail and phone into unencoded mailto and tel links`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. The raw values are not encoded; whether that matters is not asserted.
- Evidence: UNVERIFIED

<a id="cand-04-a4"></a>
### CAND-04-A4: Onboarding snapshot card

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-04-A4.1A](04-dashboard.md#cand-04-a4-1a) | Percentage from form completion. | [`renders explicit percentage from payload correctly`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.1B](04-dashboard.md#cand-04-a4-1b) | Default total steps. | [`renders correctly with default totalSteps`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.1C](04-dashboard.md#cand-04-a4-1c) | Percentage rules. | [`takes the percentage from form_completion rounded, else from steps, and treats zero total steps as 0 percent`](../../../tests/spec/cand-04-dashboard-snapshot.test.tsx) |
| [CAND-04-A4.2A](04-dashboard.md#cand-04-a4-2a) | In-progress status text. | [`renders correctly with in-progress status`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.2B](04-dashboard.md#cand-04-a4-2b) | What counts as complete. | [`marks completion from the stage text in any case, from onboarding_status true, or from a percentage of 100 or more`](../../../tests/spec/cand-04-dashboard-snapshot.test.tsx) |
| [CAND-04-A4.2C](04-dashboard.md#cand-04-a4-2c) | Badge text. | [`shows the stage text as the badge even when complete, and the default badge words only without a stage`](../../../tests/spec/cand-04-dashboard-snapshot.test.tsx) |
| [CAND-04-A4.2D](04-dashboard.md#cand-04-a4-2d) | Completed status. | [`renders correctly with completed status`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.3A](04-dashboard.md#cand-04-a4-3a) | Ready heading ordinals. | [`words the ready heading with an ordinal day suffix and falls back to the steps heading when complete without a joining date`](../../../tests/spec/cand-04-dashboard-snapshot.test.tsx) |
| [CAND-04-A4.4A](04-dashboard.md#cand-04-a4-4a) | Hook arguments. | [`asks the letters hook with the current e-mail always enabled and the PDF hook enabled only for the single-letter case`](../../../tests/spec/cand-04-dashboard-snapshot.test.tsx) |
| [CAND-04-A4.4B](04-dashboard.md#cand-04-a4-4b) | Menu or buttons. | [`shows a dropdown with the letter count when there are two or more letters, and two plain offer buttons otherwise`](../../../tests/spec/cand-04-dashboard-snapshot.test.tsx) |
| [CAND-04-A4.4C](04-dashboard.md#cand-04-a4-4c) | Download and open the offer PDF. | [`allows downloading and opening PDF offer letter`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.4D](04-dashboard.md#cand-04-a4-4d) | Download network failure. | [`handles fetch error during pdf download`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.4E](04-dashboard.md#cand-04-a4-4e) | Buttons need a profile and a source. | [`hides every offer and culture button when there is no profile, and disables the offer buttons when no URL or letter is available`](../../../tests/spec/cand-04-dashboard-snapshot.test.tsx) |
| [CAND-04-A4.4F](04-dashboard.md#cand-04-a4-4f) | Not-OK download and data URLs. | [`shows an error toast when the offer download answers not OK and keeps a data: URL out of fetch`](../../../tests/spec/cand-04-dashboard-snapshot.test.tsx) |
| [CAND-04-A4.5A](04-dashboard.md#cand-04-a4-5a) | Culture book hidden when unavailable. | [`is hidden when the backend reports no culture book`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.5B](04-dashboard.md#cand-04-a4-5b) | Culture book hidden while unknown. | [`is hidden while availability is still unknown`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.5C](04-dashboard.md#cand-04-a4-5c) | Culture book shown. | [`is shown once the backend confirms a culture book`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.5D](04-dashboard.md#cand-04-a4-5d) | Culture book is absent, not disabled. | [`is not rendered disabled - it is absent entirely`](../../../tests/components/dashboard/onboarding-snapshot.test.tsx) |
| [CAND-04-A4.5E](04-dashboard.md#cand-04-a4-5e) | Culture book click. | [`opens a culture book URL in a new tab when the check answers JSON available, warns when it answers available false, and opens it anyway when the check fails`](../../../tests/spec/cand-04-dashboard-snapshot.test.tsx) |

<a id="cand-04-a4-1a"></a>
#### CAND-04-A4.1A: Percentage from form completion

- Precondition: `form_completion.percentage` is 25.
- Action: Render the snapshot.
- Expected result: The ring label reads 25% `components/dashboard/onboarding-snapshot.tsx:126-131`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::renders explicit percentage from payload correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-1b"></a>
#### CAND-04-A4.1B: Default total steps

- Precondition: No `totalSteps`; 4 steps done; form completion 50%.
- Action: Render the snapshot.
- Expected result: The heading reads 4 of 8 steps completed and the ring reads 50% `components/dashboard/onboarding-snapshot.tsx:95,126-131,191`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::renders correctly with default totalSteps`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-1c"></a>
#### CAND-04-A4.1C: Percentage rules

- Precondition: Payloads with form completion 33.6 and 0, none with 3 of 8 steps, none with total steps 0, and no payload.
- Action: Render each.
- Expected result: The ring labels read 34%, 0%, 38%, 0% and 38% `components/dashboard/onboarding-snapshot.tsx:126-131`
- Test: characterization: `tests/spec/cand-04-dashboard-snapshot.test.tsx::takes the percentage from form_completion rounded, else from steps, and treats zero total steps as 0 percent`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend. The ring label is read through the ring component's markup.
- Evidence: UNVERIFIED

<a id="cand-04-a4-2a"></a>
#### CAND-04-A4.2A: In-progress status text

- Precondition: Stage text ONBOARDING IN PROGRESS; 3 of 8 steps.
- Action: Render the snapshot.
- Expected result: The stage text and 3 of 8 steps completed show `components/dashboard/onboarding-snapshot.tsx:183-191`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::renders correctly with in-progress status`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-2b"></a>
#### CAND-04-A4.2B: What counts as complete

- Precondition: Stages Onboarding Complete, COMPLETE, completed; status true; percentage 100.4; stage Documents pending with status false; an empty payload.
- Action: Render each.
- Expected result: The Ready label shows for the first five and not for the last two `components/dashboard/onboarding-snapshot.tsx:133-138,341-345`
- Test: characterization: `tests/spec/cand-04-dashboard-snapshot.test.tsx::marks completion from the stage text in any case, from onboarding_status true, or from a percentage of 100 or more`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-2c"></a>
#### CAND-04-A4.2C: Badge text

- Precondition: Payloads: stage Documents pending with status true; status true without a stage; neither.
- Action: Render each.
- Expected result: The badge shows the stage text, ONBOARDING COMPLETE, and ONBOARDING IN PROGRESS respectively `components/dashboard/onboarding-snapshot.tsx:183-184`
- Test: characterization: `tests/spec/cand-04-dashboard-snapshot.test.tsx::shows the stage text as the badge even when complete, and the default badge words only without a stage`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-2d"></a>
#### CAND-04-A4.2D: Completed status

- Precondition: Stage ONBOARDING COMPLETE, a joining date, percentage 100.
- Action: Render the snapshot.
- Expected result: The badge, the heading You are ready to join us on September 8th! and the Ready label show `components/dashboard/onboarding-snapshot.tsx:133-138,189-190,341-345`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::renders correctly with completed status`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend. The date has a Z suffix and the test fails under `TZ=America/Los_Angeles` (observed). Issue: PWHR-1542.
- Evidence: UNVERIFIED

<a id="cand-04-a4-3a"></a>
#### CAND-04-A4.3A: Ready heading ordinals

- Precondition: Joining dates on the 1st, 2nd, 3rd, 11th, 21st, 22nd, 23rd and 31st; none; and a payload date different from the prop.
- Action: Render each with status true.
- Expected result: The headings end in 1st, 2nd, 3rd, 11th, 21st, 22nd, 23rd and 31st; with no date the heading reads 2 of 8 steps completed; the payload date wins over the prop `components/dashboard/onboarding-snapshot.tsx:68-81,140,189-191`
- Test: characterization: `tests/spec/cand-04-dashboard-snapshot.test.tsx::words the ready heading with an ordinal day suffix and falls back to the steps heading when complete without a joining date`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-4a"></a>
#### CAND-04-A4.4A: Hook arguments

- Precondition: Default job-offer summary; then employment type Trainee; then compensation type both.
- Action: Render three times.
- Expected result: The letters hook gets the e-mail and true each time; the PDF hook gets true, false, false `components/dashboard/onboarding-snapshot.tsx:103,105-116`
- Test: characterization: `tests/spec/cand-04-dashboard-snapshot.test.tsx::asks the letters hook with the current e-mail always enabled and the PDF hook enabled only for the single-letter case`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend. The hooks are mocks that record arguments.
- Evidence: UNVERIFIED

<a id="cand-04-a4-4b"></a>
#### CAND-04-A4.4B: Menu or buttons

- Precondition: Two letters; then one letter.
- Action: Render each.
- Expected result: Two letters give one menu trigger whose text includes the count 2; one letter gives two Preview / Download Offer buttons `components/dashboard/onboarding-snapshot.tsx:110-111,217-309`
- Test: characterization: `tests/spec/cand-04-dashboard-snapshot.test.tsx::shows a dropdown with the letter count when there are two or more letters, and two plain offer buttons otherwise`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend. The menu items themselves are not opened.
- Evidence: UNVERIFIED

<a id="cand-04-a4-4c"></a>
#### CAND-04-A4.4C: Download and open the offer PDF

- Precondition: A profile; a PDF URL; `fetch`, `URL.createObjectURL` and `window.open` stubbed.
- Action: Click the first button, then the second.
- Expected result: `fetch` is called with the URL and credentials include and an object URL is made; the second click calls `window.open` with the URL, _blank and noopener,noreferrer `components/dashboard/onboarding-snapshot.tsx:14-36,48-49,264-307`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::allows downloading and opening PDF offer letter`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend. The saved file name and the click on the created link are not asserted.
- Evidence: UNVERIFIED

<a id="cand-04-a4-4d"></a>
#### CAND-04-A4.4D: Download network failure

- Precondition: `fetch` rejects.
- Action: Click the first button.
- Expected result: `fetch` was called `components/dashboard/onboarding-snapshot.tsx:24,33-35`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::handles fetch error during pdf download`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend. The error toast is not asserted here (it is in CAND-04-A4.4F for a not-OK reply).
- Evidence: UNVERIFIED

<a id="cand-04-a4-4e"></a>
#### CAND-04-A4.4E: Buttons need a profile and a source

- Precondition: No profile; then a profile with no PDF URL and no letters.
- Action: Render each.
- Expected result: With no profile no offer button and no culture button show and the Complete your onboarding link goes to /onboarding; with no source both offer buttons are disabled `components/dashboard/onboarding-snapshot.tsx:208-213,215,273,296`
- Test: characterization: `tests/spec/cand-04-dashboard-snapshot.test.tsx::hides every offer and culture button when there is no profile, and disables the offer buttons when no URL or letter is available`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-4f"></a>
#### CAND-04-A4.4F: Not-OK download and data URLs

- Precondition: `fetch` answers not OK; then a Trainee with one letter and no PDF URL.
- Action: Click the first offer button each time.
- Expected result: The first shows the toast Could not download the offer letter. Please try again.; the second does not call `fetch` and shows no toast `components/dashboard/onboarding-snapshot.tsx:15-36,264-272`
- Test: characterization: `tests/spec/cand-04-dashboard-snapshot.test.tsx::shows an error toast when the offer download answers not OK and keeps a data: URL out of fetch`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend. The data URL download click on the created link is not asserted.
- Evidence: UNVERIFIED

<a id="cand-04-a4-5a"></a>
#### CAND-04-A4.5A: Culture book hidden when unavailable

- Precondition: Availability is false.
- Action: Render the snapshot.
- Expected result: No Culture Book button shows `components/dashboard/onboarding-snapshot.tsx:312`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::is hidden when the backend reports no culture book`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-5b"></a>
#### CAND-04-A4.5B: Culture book hidden while unknown

- Precondition: Availability is undefined.
- Action: Render the snapshot.
- Expected result: No Culture Book button shows `components/dashboard/onboarding-snapshot.tsx:312`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::is hidden while availability is still unknown`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-5c"></a>
#### CAND-04-A4.5C: Culture book shown

- Precondition: Availability is true and a URL exists.
- Action: Render the snapshot.
- Expected result: A Culture Book button shows `components/dashboard/onboarding-snapshot.tsx:312-325`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::is shown once the backend confirms a culture book`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-5d"></a>
#### CAND-04-A4.5D: Culture book is absent, not disabled

- Precondition: Availability is false.
- Action: Render the snapshot.
- Expected result: No disabled button has the text Culture Book `components/dashboard/onboarding-snapshot.tsx:312`
- Test: mapped: `tests/components/dashboard/onboarding-snapshot.test.tsx::is not rendered disabled - it is absent entirely`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a4-5e"></a>
#### CAND-04-A4.5E: Culture book click

- Precondition: `fetch` answers JSON available false; then a PDF content type; then rejects.
- Action: Click Culture Book three times.
- Expected result: The first shows the toast Culture book is not available. and opens nothing; the second and third call `window.open` with the URL, _blank and noopener,noreferrer; `fetch` got the URL with credentials include `components/dashboard/onboarding-snapshot.tsx:142-158`
- Test: characterization: `tests/spec/cand-04-dashboard-snapshot.test.tsx::opens a culture book URL in a new tab when the check answers JSON available, warns when it answers available false, and opens it anyway when the check fails`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context, the user hook and the job-offer hooks are mocked; `fetch` and `window.open` are stubbed where a test clicks; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5"></a>
### CAND-04-A5: Consent card and consent helpers

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-04-A5.1A](04-dashboard.md#cand-04-a5-1a) | No mode: in-app form with the applicant. | [`links to the in-app consent form when no mode is given`](../../../tests/components/dashboard/dpdp-consent-card.test.tsx) |
| [CAND-04-A5.1B](04-dashboard.md#cand-04-a5-1b) | In-app consent URL is honoured. | [`still honours a consent URL in the absence of a mode`](../../../tests/components/dashboard/dpdp-consent-card.test.tsx) |
| [CAND-04-A5.1C](04-dashboard.md#cand-04-a5-1c) | External Portal mode. | [`sends the candidate off-site in External Portal mode`](../../../tests/components/dashboard/dpdp-consent-card.test.tsx) |
| [CAND-04-A5.1D](04-dashboard.md#cand-04-a5-1d) | Absolute URL without a mode. | [`keeps following an absolute URL even when the backend reports no mode`](../../../tests/components/dashboard/dpdp-consent-card.test.tsx) |
| [CAND-04-A5.1E](04-dashboard.md#cand-04-a5-1e) | External mode without a URL. | [`falls back to the in-app route when the external link is unusable`](../../../tests/components/dashboard/dpdp-consent-card.test.tsx) |
| [CAND-04-A5.1F](04-dashboard.md#cand-04-a5-1f) | Script URL is not used. | [`does not navigate to a script-bearing consent URL`](../../../tests/components/dashboard/dpdp-consent-card.test.tsx) |
| [CAND-04-A5.2A](04-dashboard.md#cand-04-a5-2a) | Protocol-relative URL is taken as an in-app path. | [`uses a protocol-relative consent URL as the in-app link because it starts with a slash`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |
| [CAND-04-A5.2B](04-dashboard.md#cand-04-a5-2b) | Mode matching and button words. | [`reads External Portal mode ignoring case and surrounding spaces, and words the button by mode only for a safe absolute URL`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |
| [CAND-04-A5.3A](04-dashboard.md#cand-04-a5-3a) | Consent query. | [`carries appl and token through the journey`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3B](04-dashboard.md#cand-04-a5-3b) | Missing values are omitted. | [`omits missing values rather than sending empty params`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3C](04-dashboard.md#cand-04-a5-3c) | Path with query. | [`appends the query when there is one`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3D](04-dashboard.md#cand-04-a5-3d) | Bare path. | [`leaves a bare path alone when there is nothing to append`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3E](04-dashboard.md#cand-04-a5-3e) | Safe external URLs. | [`accepts absolute http(s) links`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3F](04-dashboard.md#cand-04-a5-3f) | Unusable URLs. | [`rejects anything that isn't a usable absolute link`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3G](04-dashboard.md#cand-04-a5-3g) | Script schemes. | [`rejects script-bearing schemes`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3H](04-dashboard.md#cand-04-a5-3h) | Usable redirect wins. | [`prefers the backend's redirect URL when it is usable`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3I](04-dashboard.md#cand-04-a5-3i) | No redirect: onboarding route. | [`keeps the candidate in the portal when there is no usable redirect`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3J](04-dashboard.md#cand-04-a5-3j) | Unsafe redirect. | [`does not follow an unsafe redirect value`](../../../tests/lib/utils/dpdp-consent.test.ts) |
| [CAND-04-A5.3K](04-dashboard.md#cand-04-a5-3k) | Navigating away. | [`navigateToExternalConsent assigns the location for a safe URL and returns false without assigning for an unsafe one`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |
| [CAND-04-A5.3L](04-dashboard.md#cand-04-a5-3l) | Padded URL. | [`accepts a URL with surrounding spaces as safe but hands the untrimmed string on`](../../../tests/spec/cand-04-dashboard-components.test.tsx) |

<a id="cand-04-a5-1a"></a>
#### CAND-04-A5.1A: No mode: in-app form with the applicant

- Precondition: No mode and no URL; `appl` is an e-mail.
- Action: Render the card.
- Expected result: The link Go to Consent Form goes to /job_offer/consent?appl= and the encoded e-mail `components/dashboard/dpdp-consent-card.tsx:45-48,115`
- Test: mapped: `tests/components/dashboard/dpdp-consent-card.test.tsx::links to the in-app consent form when no mode is given`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-1b"></a>
#### CAND-04-A5.1B: In-app consent URL is honoured

- Precondition: No mode; the consent URL is an in-app path.
- Action: Render the card.
- Expected result: The link goes to that path `components/dashboard/dpdp-consent-card.tsx:45-47`
- Test: mapped: `tests/components/dashboard/dpdp-consent-card.test.tsx::still honours a consent URL in the absence of a mode`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-1c"></a>
#### CAND-04-A5.1C: External Portal mode

- Precondition: Mode External Portal; an https consent URL.
- Action: Render the card.
- Expected result: The link Continue to Consent Portal has that href and rel noopener noreferrer `components/dashboard/dpdp-consent-card.tsx:38-39,109-113`
- Test: mapped: `tests/components/dashboard/dpdp-consent-card.test.tsx::sends the candidate off-site in External Portal mode`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-1d"></a>
#### CAND-04-A5.1D: Absolute URL without a mode

- Precondition: No mode; an https consent URL.
- Action: Render the card.
- Expected result: The link Go to Consent Form has that href `components/dashboard/dpdp-consent-card.tsx:38,109-113`
- Test: mapped: `tests/components/dashboard/dpdp-consent-card.test.tsx::keeps following an absolute URL even when the backend reports no mode`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-1e"></a>
#### CAND-04-A5.1E: External mode without a URL

- Precondition: Mode External Portal; URL undefined; `appl` set.
- Action: Render the card.
- Expected result: The link falls back to the in-app form with the encoded applicant `components/dashboard/dpdp-consent-card.tsx:45-48`
- Test: mapped: `tests/components/dashboard/dpdp-consent-card.test.tsx::falls back to the in-app route when the external link is unusable`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-1f"></a>
#### CAND-04-A5.1F: Script URL is not used

- Precondition: Mode External Portal; the URL is a javascript: value.
- Action: Render the card.
- Expected result: The link href does not contain javascript: `components/dashboard/dpdp-consent-card.tsx:38,45-48`
- Test: mapped: `tests/components/dashboard/dpdp-consent-card.test.tsx::does not navigate to a script-bearing consent URL`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. The test checks only what the href does not contain.
- Evidence: UNVERIFIED

<a id="cand-04-a5-2a"></a>
#### CAND-04-A5.2A: Protocol-relative URL is taken as an in-app path

- Precondition: The consent URL starts with two slashes and names another host.
- Action: Render the card.
- Expected result: The link Go to Consent Form has that string as href `components/dashboard/dpdp-consent-card.tsx:45-48,115`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::uses a protocol-relative consent URL as the in-app link because it starts with a slash`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. Pins a suspected defect, not endorsed. Issue: PWHR-1541.
- Evidence: UNVERIFIED

<a id="cand-04-a5-2b"></a>
#### CAND-04-A5.2B: Mode matching and button words

- Precondition: Modes written with other case and spaces, Internal Form, and an ftp URL.
- Action: Render the card for each.
- Expected result: Mode text ignoring case and spaces gives Continue to Consent Portal for a safe URL; Internal Form gives Go to Consent Form; an ftp URL gives the in-app link `components/dashboard/dpdp-consent-card.tsx:38-39,109-119`, `types/consent.ts:56-60`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::reads External Portal mode ignoring case and surrounding spaces, and words the button by mode only for a safe absolute URL`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3a"></a>
#### CAND-04-A5.3A: Consent query

- Precondition: Applicant and token given.
- Action: Call `buildConsentQuery`.
- Expected result: The result is appl=a%40b.com&token=tok `lib/utils/dpdp-consent.ts:23-28`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::carries appl and token through the journey`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3b"></a>
#### CAND-04-A5.3B: Missing values are omitted

- Precondition: Only the applicant; then none.
- Action: Call `buildConsentQuery`.
- Expected result: The results are appl=a%40b.com and an empty string `lib/utils/dpdp-consent.ts:25-27`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::omits missing values rather than sending empty params`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3c"></a>
#### CAND-04-A5.3C: Path with query

- Precondition: Applicant and token.
- Action: Call `buildConsentPath` with the form path.
- Expected result: The result is /job_offer/consent?appl=a%40b.com&token=tok `lib/utils/dpdp-consent.ts:30-37`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::appends the query when there is one`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3d"></a>
#### CAND-04-A5.3D: Bare path

- Precondition: No applicant and no token.
- Action: Call `buildConsentPath`.
- Expected result: The result is /job_offer/consent `lib/utils/dpdp-consent.ts:36`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::leaves a bare path alone when there is nothing to append`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3e"></a>
#### CAND-04-A5.3E: Safe external URLs

- Precondition: An https and an http URL.
- Action: Call `isSafeExternalConsentUrl`.
- Expected result: Both give true `lib/utils/dpdp-consent.ts:48-56`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::accepts absolute http(s) links`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3f"></a>
#### CAND-04-A5.3F: Unusable URLs

- Precondition: null, undefined, an empty string and a relative path.
- Action: Call `isSafeExternalConsentUrl`.
- Expected result: All give false `lib/utils/dpdp-consent.ts:49,50-55`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::rejects anything that isn't a usable absolute link`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3g"></a>
#### CAND-04-A5.3G: Script schemes

- Precondition: A javascript: and a data: URL.
- Action: Call `isSafeExternalConsentUrl`.
- Expected result: Both give false `lib/utils/dpdp-consent.ts:52`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::rejects script-bearing schemes`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3h"></a>
#### CAND-04-A5.3H: Usable redirect wins

- Precondition: An https redirect URL.
- Action: Call `resolveConsentOnwardUrl`.
- Expected result: The result is that URL with `isExternal` true `lib/utils/dpdp-consent.ts:84-86`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::prefers the backend's redirect URL when it is usable`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3i"></a>
#### CAND-04-A5.3I: No redirect: onboarding route

- Precondition: A null redirect, an applicant and a token.
- Action: Call `resolveConsentOnwardUrl`.
- Expected result: The result is /onboarding with the encoded query and `isExternal` false `lib/utils/dpdp-consent.ts:87-90`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::keeps the candidate in the portal when there is no usable redirect`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3j"></a>
#### CAND-04-A5.3J: Unsafe redirect

- Precondition: A javascript: redirect.
- Action: Call `resolveConsentOnwardUrl`.
- Expected result: `isExternal` is false `lib/utils/dpdp-consent.ts:84-90`
- Test: mapped: `tests/lib/utils/dpdp-consent.test.ts::does not follow an unsafe redirect value`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. Only `isExternal` is asserted, not the returned path.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3k"></a>
#### CAND-04-A5.3K: Navigating away

- Precondition: `location.assign` replaced by a stub.
- Action: Call `navigateToExternalConsent` with a safe URL, a javascript: URL and undefined.
- Expected result: The first returns true and calls `assign` once with the URL; the others return false and add no call `lib/utils/dpdp-consent.ts:66-71`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::navigateToExternalConsent assigns the location for a safe URL and returns false without assigning for an unsafe one`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a5-3l"></a>
#### CAND-04-A5.3L: Padded URL

- Precondition: A URL with spaces around it.
- Action: Call `isSafeExternalConsentUrl`, `resolveConsentOnwardUrl` and `navigateToExternalConsent`.
- Expected result: The check passes (it trims), but the original untrimmed string is returned and assigned `lib/utils/dpdp-consent.ts:48-56,79-91,66-71`
- Test: characterization: `tests/spec/cand-04-dashboard-components.test.tsx::accepts a URL with surrounding spaces as safe but hands the untrimmed string on`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth context is mocked where the component reads it; no real HTTP or Frappe backend. Pins a detail, not endorsed: the check trims and the use does not. Not filed: no consumer is known to pass padded values.
- Evidence: UNVERIFIED

<a id="cand-04-a6"></a>
### CAND-04-A6: Dashboard and applicant data layer

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-04-A6.1A](04-dashboard.md#cand-04-a6-1a) | Dashboard service success. | [`fetches dashboard data correctly`](../../../tests/lib/services/dashboard.test.ts) |
| [CAND-04-A6.1B](04-dashboard.md#cand-04-a6-1b) | Dashboard service needs an e-mail. | [`throws error if email is missing`](../../../tests/lib/services/dashboard.test.ts) |
| [CAND-04-A6.1C](04-dashboard.md#cand-04-a6-1c) | Dashboard service failure message. | [`throws error if API returns failure`](../../../tests/lib/services/dashboard.test.ts) |
| [CAND-04-A6.1D](04-dashboard.md#cand-04-a6-1d) | Default failure text and method name. | [`uses the default failure text when the backend says unsuccessful without a message, and returns data untouched on success`](../../../tests/spec/cand-04-dashboard-data.test.tsx) |
| [CAND-04-A6.2A](04-dashboard.md#cand-04-a6-2a) | Dashboard hook fetches. | [`fetches dashboard data for the provided email`](../../../tests/lib/hooks/useDashboard.test.tsx) |
| [CAND-04-A6.2B](04-dashboard.md#cand-04-a6-2b) | Dashboard hook is off without an e-mail. | [`does not fetch dashboard data when email is missing`](../../../tests/lib/hooks/useDashboard.test.tsx) |
| [CAND-04-A6.2C](04-dashboard.md#cand-04-a6-2c) | Query key and freshness. | [`keys the dashboard query by e-mail, holds it for five minutes and sends no request without an e-mail`](../../../tests/spec/cand-04-dashboard-data.test.tsx) |
| [CAND-04-A6.2D](04-dashboard.md#cand-04-a6-2d) | Home links invalidate the dashboard query. | [`invalidates the dashboard query of the signed-in e-mail when the brand link or the Home link is clicked, and no query when another link is clicked`](../../../tests/spec/cand-04-nav-invalidation.test.tsx) |
| [CAND-04-A6.2E](04-dashboard.md#cand-04-a6-2e) | Refetch on the disabled query. | [`runs the service with an undefined e-mail when refetch is called on the disabled query, which ends in the Email is required error`](../../../tests/spec/cand-04-dashboard-data.test.tsx) |
| [CAND-04-A6.3A](04-dashboard.md#cand-04-a6-3a) | Applied-jobs request. | [`getApplicantStatusResponse calls FrappeAPI.get with correct arguments`](../../../tests/lib/services/applicantStatusService.test.ts) |
| [CAND-04-A6.3B](04-dashboard.md#cand-04-a6-3b) | Job applicant request. | [`getJobApplicant calls FrappeAPI.get with correct arguments`](../../../tests/lib/services/applicantStatusService.test.ts) |
| [CAND-04-A6.3C](04-dashboard.md#cand-04-a6-3c) | Replies and errors pass through. | [`returns the backend reply unchanged from both applicant-status service methods and lets a rejection through`](../../../tests/spec/cand-04-dashboard-data.test.tsx) |
| [CAND-04-A6.4A](04-dashboard.md#cand-04-a6-4a) | Applicant status hook. | [`useApplicantStatus fetches data correctly`](../../../tests/lib/hooks/useApplicantStatus.test.tsx) |
| [CAND-04-A6.4B](04-dashboard.md#cand-04-a6-4b) | Job applicant hook. | [`useJobApplicantDetails fetches data correctly`](../../../tests/lib/hooks/useApplicantStatus.test.tsx) |
| [CAND-04-A6.4C](04-dashboard.md#cand-04-a6-4c) | Applicant status hook is off without an e-mail. | [`useApplicantStatus is disabled when email is empty`](../../../tests/lib/hooks/useApplicantStatus.test.tsx) |
| [CAND-04-A6.4D](04-dashboard.md#cand-04-a6-4d) | Job applicant hook is off without a name. | [`useJobApplicantDetails is disabled when jobApplicantName is null`](../../../tests/lib/hooks/useApplicantStatus.test.tsx) |
| [CAND-04-A6.4E](04-dashboard.md#cand-04-a6-4e) | Query keys and no retry. | [`keys the applicant queries by e-mail and applicant name and does not retry a failed request`](../../../tests/spec/cand-04-dashboard-data.test.tsx) |

<a id="cand-04-a6-1a"></a>
#### CAND-04-A6.1A: Dashboard service success

- Precondition: `FrappeAPI.get` answers success with data.
- Action: Call `getDashboardData` with an e-mail.
- Expected result: The data is returned and `get` was called with a string method and the e-mail `lib/services/dashboard.ts:12-24`
- Test: mapped: `tests/lib/services/dashboard.test.ts::fetches dashboard data correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend. The method name is not asserted (any string).
- Evidence: UNVERIFIED

<a id="cand-04-a6-1b"></a>
#### CAND-04-A6.1B: Dashboard service needs an e-mail

- Precondition: An empty e-mail.
- Action: Call `getDashboardData`.
- Expected result: It rejects with Email is required `lib/services/dashboard.ts:13`
- Test: mapped: `tests/lib/services/dashboard.test.ts::throws error if email is missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-1c"></a>
#### CAND-04-A6.1C: Dashboard service failure message

- Precondition: `get` answers success false with a message.
- Action: Call `getDashboardData`.
- Expected result: It rejects with that message `lib/services/dashboard.ts:20-22`
- Test: mapped: `tests/lib/services/dashboard.test.ts::throws error if API returns failure`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-1d"></a>
#### CAND-04-A6.1D: Default failure text and method name

- Precondition: `get` answers success false with no message, then an empty message, then success with a message and data.
- Action: Call `getDashboardData` three times.
- Expected result: The first two reject with Failed to fetch dashboard; the third returns the data object itself; the call used recruitment.api.onboarding_dashboard.get_dashboard with the e-mail `lib/services/dashboard.ts:7-9,15-24`
- Test: characterization: `tests/spec/cand-04-dashboard-data.test.tsx::uses the default failure text when the backend says unsuccessful without a message, and returns data untouched on success`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-2a"></a>
#### CAND-04-A6.2A: Dashboard hook fetches

- Precondition: The service is mocked with data.
- Action: Render `useDashboard` with an e-mail.
- Expected result: The query succeeds with that data and the service got the e-mail `lib/hooks/useDashboard.ts:4-10`
- Test: mapped: `tests/lib/hooks/useDashboard.test.tsx::fetches dashboard data for the provided email`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-2b"></a>
#### CAND-04-A6.2B: Dashboard hook is off without an e-mail

- Precondition: An undefined e-mail.
- Action: Render `useDashboard`.
- Expected result: There is no data and the service is not called `lib/hooks/useDashboard.ts:8`
- Test: mapped: `tests/lib/hooks/useDashboard.test.tsx::does not fetch dashboard data when email is missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-2c"></a>
#### CAND-04-A6.2C: Query key and freshness

- Precondition: `FrappeAPI.get` answers; an e-mail; then an empty e-mail.
- Action: Render `useDashboard` twice.
- Expected result: The query key is [dashboard, {email}], its stale time is five minutes and an empty e-mail stays idle with no request `lib/hooks/useDashboard.ts:6,8,9`
- Test: characterization: `tests/spec/cand-04-dashboard-data.test.tsx::keys the dashboard query by e-mail, holds it for five minutes and sends no request without an e-mail`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend. The stale time is read from the observer options.
- Evidence: UNVERIFIED

<a id="cand-04-a6-2d"></a>
#### CAND-04-A6.2D: Home links invalidate the dashboard query

- Precondition: A signed-in user; the navigation renders; the path is /open-jobs.
- Action: Click the brand link and the Home link, then the Open Jobs link.
- Expected result: Each of the first two calls `invalidateQueries` once with the key [dashboard, {email}]; the third calls nothing `components/portal/portal-navigation.tsx:126,265-269,289-293`
- Test: characterization: `tests/spec/cand-04-nav-invalidation.test.tsx::invalidates the dashboard query of the signed-in e-mail when the brand link or the Home link is clicked, and no query when another link is clicked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend. The mobile menu copy of the Home link (`components/portal/portal-navigation.tsx:212-216`) is not rendered or clicked.
- Evidence: UNVERIFIED

<a id="cand-04-a6-2e"></a>
#### CAND-04-A6.2E: Refetch on the disabled query

- Precondition: An undefined e-mail.
- Action: Call `refetch` on `useDashboard`.
- Expected result: The query function runs and fails with Email is required; no request is made `lib/hooks/useDashboard.ts:7-8`, `lib/services/dashboard.ts:13`
- Test: characterization: `tests/spec/cand-04-dashboard-data.test.tsx::runs the service with an undefined e-mail when refetch is called on the disabled query, which ends in the Email is required error`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend. The page's Try again button in the missing-e-mail state calls this refetch (CAND-04-A1.2A).
- Evidence: UNVERIFIED

<a id="cand-04-a6-3a"></a>
#### CAND-04-A6.3A: Applied-jobs request

- Precondition: `get` answers.
- Action: Call `getApplicantStatusResponse` with an e-mail.
- Expected result: It returns the reply unchanged and called recruitment.api.channels.careers.get_applied_jobs with the e-mail `lib/services/applicantStatusService.ts:25-33`
- Test: mapped: `tests/lib/services/applicantStatusService.test.ts::getApplicantStatusResponse calls FrappeAPI.get with correct arguments`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-3b"></a>
#### CAND-04-A6.3B: Job applicant request

- Precondition: `get` answers.
- Action: Call `getJobApplicant`.
- Expected result: It returns the reply unchanged and called recruitment.api.draft_application.get_job_applicant with the applicant `lib/services/applicantStatusService.ts:36-42`
- Test: mapped: `tests/lib/services/applicantStatusService.test.ts::getJobApplicant calls FrappeAPI.get with correct arguments`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-3c"></a>
#### CAND-04-A6.3C: Replies and errors pass through

- Precondition: `get` answers with objects; then rejects.
- Action: Call both service methods.
- Expected result: The same objects come back and the rejection reaches the caller `lib/services/applicantStatusService.ts:28-32,37-41`
- Test: characterization: `tests/spec/cand-04-dashboard-data.test.tsx::returns the backend reply unchanged from both applicant-status service methods and lets a rejection through`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-4a"></a>
#### CAND-04-A6.4A: Applicant status hook

- Precondition: The service is mocked.
- Action: Render `useApplicantStatus` with an e-mail.
- Expected result: The query succeeds with the reply and the service got the e-mail `lib/hooks/useApplicantStatus.ts:4-11`
- Test: mapped: `tests/lib/hooks/useApplicantStatus.test.tsx::useApplicantStatus fetches data correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-4b"></a>
#### CAND-04-A6.4B: Job applicant hook

- Precondition: The service is mocked.
- Action: Render `useJobApplicantDetails` with a name.
- Expected result: The query succeeds and the service got the name `lib/hooks/useApplicantStatus.ts:13-19`
- Test: mapped: `tests/lib/hooks/useApplicantStatus.test.tsx::useJobApplicantDetails fetches data correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-4c"></a>
#### CAND-04-A6.4C: Applicant status hook is off without an e-mail

- Precondition: An empty e-mail.
- Action: Render `useApplicantStatus`.
- Expected result: The fetch status is idle `lib/hooks/useApplicantStatus.ts:8`
- Test: mapped: `tests/lib/hooks/useApplicantStatus.test.tsx::useApplicantStatus is disabled when email is empty`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-4d"></a>
#### CAND-04-A6.4D: Job applicant hook is off without a name

- Precondition: A null name.
- Action: Render `useJobApplicantDetails`.
- Expected result: The fetch status is idle `lib/hooks/useApplicantStatus.ts:17`
- Test: mapped: `tests/lib/hooks/useApplicantStatus.test.tsx::useJobApplicantDetails is disabled when jobApplicantName is null`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a6-4e"></a>
#### CAND-04-A6.4E: Query keys and no retry

- Precondition: `get` rejects.
- Action: Render both hooks.
- Expected result: Each is an error after one call (no retry) and is cached under [application-status, e-mail] and [job-applicant-details, name] `lib/hooks/useApplicantStatus.ts:6,9,15,18`
- Test: characterization: `tests/spec/cand-04-dashboard-data.test.tsx::keys the applicant queries by e-mail and applicant name and does not retry a failed request`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` or the service is mocked; no real HTTP or Frappe backend. The mocked service rejects at once; the retry count is not varied.
- Evidence: UNVERIFIED

<a id="cand-04-a7"></a>
### CAND-04-A7: Company promotion block

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-04-A7.1A](04-dashboard.md#cand-04-a7-1a) | Everything off shows nothing. | [`renders nothing when every section is disabled`](../../../tests/components/home-promo.test.tsx) |
| [CAND-04-A7.1B](04-dashboard.md#cand-04-a7-1b) | Request failure shows nothing. | [`renders nothing when the content request fails`](../../../tests/components/home-promo.test.tsx) |
| [CAND-04-A7.1C](04-dashboard.md#cand-04-a7-1c) | Only the enabled section renders. | [`renders only the sections that are enabled`](../../../tests/components/home-promo.test.tsx) |
| [CAND-04-A7.1D](04-dashboard.md#cand-04-a7-1d) | Skeleton, fallback and empty. | [`shows the loading skeleton while content loads, the fallback when every section is off or the request fails, and nothing when there is no fallback`](../../../tests/spec/cand-04-home-promo.test.tsx) |
| [CAND-04-A7.1E](04-dashboard.md#cand-04-a7-1e) | Values only, with the default icon. | [`renders only the values section, with the sparkles icon fallback for a card without an icon, when only values are enabled`](../../../tests/spec/cand-04-home-promo.test.tsx) |
| [CAND-04-A7.1F](04-dashboard.md#cand-04-a7-1f) | Carousel and values. | [`renders the carousel and value cards when those sections are enabled`](../../../tests/components/home-promo.test.tsx) |
| [CAND-04-A7.2A](04-dashboard.md#cand-04-a7-2a) | Next slide wraps. | [`advances with next and wraps back to the first slide`](../../../tests/components/home-promo.test.tsx) |
| [CAND-04-A7.2B](04-dashboard.md#cand-04-a7-2b) | Previous from the first. | [`steps backwards from the first slide to the last`](../../../tests/components/home-promo.test.tsx) |
| [CAND-04-A7.2C](04-dashboard.md#cand-04-a7-2c) | Autoplay and pause on hover. | [`advances on its interval, wraps to the first slide, and pauses while the pointer is over it`](../../../tests/spec/cand-04-home-promo.test.tsx) |
| [CAND-04-A7.2D](04-dashboard.md#cand-04-a7-2d) | No autoplay cases. | [`does not autoplay for a zero interval, a single slide or a reduced-motion preference`](../../../tests/spec/cand-04-home-promo.test.tsx) |
| [CAND-04-A7.2E](04-dashboard.md#cand-04-a7-2e) | Dots and empty list. | [`jumps to a slide from its dot, marks only that dot current, and renders nothing for an empty slide list`](../../../tests/spec/cand-04-home-promo.test.tsx) |
| [CAND-04-A7.2F](04-dashboard.md#cand-04-a7-2f) | Single slide has no controls. | [`omits navigation for a single slide`](../../../tests/components/home-promo.test.tsx) |

<a id="cand-04-a7-1a"></a>
#### CAND-04-A7.1A: Everything off shows nothing

- Precondition: All three sections are disabled.
- Action: Render `HomePromo` with no fallback.
- Expected result: The container is empty `components/home/home-promo.tsx:64-69`
- Test: mapped: `tests/components/home-promo.test.tsx::renders nothing when every section is disabled`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-1b"></a>
#### CAND-04-A7.1B: Request failure shows nothing

- Precondition: The content request rejects.
- Action: Render `HomePromo`.
- Expected result: The container is empty `components/home/home-promo.tsx:64-69`, `lib/hooks/useHomeContent.ts:9`
- Test: mapped: `tests/components/home-promo.test.tsx::renders nothing when the content request fails`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-1c"></a>
#### CAND-04-A7.1C: Only the enabled section renders

- Precondition: Only the hero is enabled.
- Action: Render `HomePromo`.
- Expected result: The heading, eyebrow, stat value and stat label show and the carousel region does not `components/home/home-promo.tsx:72-76`
- Test: mapped: `tests/components/home-promo.test.tsx::renders only the sections that are enabled`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-1d"></a>
#### CAND-04-A7.1D: Skeleton, fallback and empty

- Precondition: The request pending; then all sections off; then rejecting; then off with no fallback.
- Action: Render `HomePromo` with a fallback text.
- Expected result: The pending state shows the skeleton Loading company highlights; the off and failed states show the fallback; with no fallback nothing shows `components/home/home-promo.tsx:21-23,63-69`
- Test: characterization: `tests/spec/cand-04-home-promo.test.tsx::shows the loading skeleton while content loads, the fallback when every section is off or the request fails, and nothing when there is no fallback`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-1e"></a>
#### CAND-04-A7.1E: Values only, with the default icon

- Precondition: Only the values section is enabled; a card has no icon.
- Action: Render `HomePromo` with a fallback.
- Expected result: The values heading and card show, the fallback does not, no carousel region shows and the card icon is the sparkles icon `components/home/home-promo.tsx:64-69,75`, `components/home/value-grid.tsx:28`
- Test: characterization: `tests/spec/cand-04-home-promo.test.tsx::renders only the values section, with the sparkles icon fallback for a card without an icon, when only values are enabled`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-1f"></a>
#### CAND-04-A7.1F: Carousel and values

- Precondition: Carousel and values enabled.
- Action: Render `HomePromo`.
- Expected result: The first slide, the region Company highlights, the values heading and a card title show `components/home/home-promo.tsx:73-75`
- Test: mapped: `tests/components/home-promo.test.tsx::renders the carousel and value cards when those sections are enabled`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend. The carousel is loaded with `next/dynamic`; the test waits for it.
- Evidence: UNVERIFIED

<a id="cand-04-a7-2a"></a>
#### CAND-04-A7.2A: Next slide wraps

- Precondition: Two slides, no autoplay.
- Action: Click Next slide twice.
- Expected result: The second slide, then the first, show `components/home/promo-carousel.tsx:60-63,109-110`
- Test: mapped: `tests/components/home-promo.test.tsx::advances with next and wraps back to the first slide`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-2b"></a>
#### CAND-04-A7.2B: Previous from the first

- Precondition: Two slides.
- Action: Click Previous slide.
- Expected result: The last slide shows `components/home/promo-carousel.tsx:60-63,99-100`
- Test: mapped: `tests/components/home-promo.test.tsx::steps backwards from the first slide to the last`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-2c"></a>
#### CAND-04-A7.2C: Autoplay and pause on hover

- Precondition: Three slides, interval 1000 ms, fake timers.
- Action: Advance time, hover and leave.
- Expected result: The slide advances each interval and wraps; hover stops it; leaving lets it advance again `components/home/promo-carousel.tsx:52-58,72-73`
- Test: characterization: `tests/spec/cand-04-home-promo.test.tsx::advances on its interval, wraps to the first slide, and pauses while the pointer is over it`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-2d"></a>
#### CAND-04-A7.2D: No autoplay cases

- Precondition: Interval 0; one slide; a reduced-motion preference.
- Action: Advance time by ten seconds.
- Expected result: The first slide stays `components/home/promo-carousel.tsx:53`
- Test: characterization: `tests/spec/cand-04-home-promo.test.tsx::does not autoplay for a zero interval, a single slide or a reduced-motion preference`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-2e"></a>
#### CAND-04-A7.2E: Dots and empty list

- Precondition: Three slides; then an empty list.
- Action: Click a dot, then Next slide.
- Expected result: The third slide shows with that dot marked current; Next gives the first; an empty list renders nothing `components/home/promo-carousel.tsx:60-65,119-122`
- Test: characterization: `tests/spec/cand-04-home-promo.test.tsx::jumps to a slide from its dot, marks only that dot current, and renders nothing for an empty slide list`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a7-2f"></a>
#### CAND-04-A7.2F: Single slide has no controls

- Precondition: One slide.
- Action: Render it.
- Expected result: No Next slide button and no dot show `components/home/promo-carousel.tsx:93`
- Test: mapped: `tests/components/home-promo.test.tsx::omits navigation for a single slide`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The home service, motion library and carousel timers are mocked or faked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8"></a>
### CAND-04-A8: Portal navigation (dashboard-related parts)

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-04-A8.1A](04-dashboard.md#cand-04-a8-1a) | Navigation items. | [`renders navigation items on desktop`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.1B](04-dashboard.md#cand-04-a8-1b) | Items follow the flags. | [`filters nav items by feature flags`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.1C](04-dashboard.md#cand-04-a8-1c) | Links hidden on request. | [`hides navigation links and mobile menu when hideNavLinks is true`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.2A](04-dashboard.md#cand-04-a8-2a) | My Jobs count. | [`displays live badge count for My Jobs`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.2B](04-dashboard.md#cand-04-a8-2b) | No count for none. | [`hides My Jobs badge when there are no applications`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.3A](04-dashboard.md#cand-04-a8-3a) | Brand is not a link on the campus page. | [`disables brand logo redirect on /campus-apply`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.4A](04-dashboard.md#cand-04-a8-4a) | Display name falls back to the e-mail prefix. | [`displays email as fallback for display name`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.4B](04-dashboard.md#cand-04-a8-4b) | Initials of a single name. | [`handles user with single name`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.4C](04-dashboard.md#cand-04-a8-4c) | User menu. | [`opens user dropdown menu when clicked`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.4D](04-dashboard.md#cand-04-a8-4d) | Sign out. | [`calls signOut when Sign Out clicked`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.4E](04-dashboard.md#cand-04-a8-4e) | Theme toggle. | [`calls toggleTheme when theme button clicked`](../../../tests/components/portal-navigation.test.tsx) |
| [CAND-04-A8.5A](04-dashboard.md#cand-04-a8-5a) | Survey and offer navigation hides links. | [`renders PortalNavigation with hideNavLinks=true`](../../../tests/components/survey-offer-navigation.test.tsx) |

<a id="cand-04-a8-1a"></a>
#### CAND-04-A8.1A: Navigation items

- Precondition: All flags are on.
- Action: Render the navigation.
- Expected result: Home, Open Jobs and My Jobs show `components/portal/portal-navigation.tsx:64-84,280-318`
- Test: mapped: `tests/components/portal-navigation.test.tsx::renders navigation items on desktop`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-1b"></a>
#### CAND-04-A8.1B: Items follow the flags

- Precondition: The flag for action_center is off.
- Action: Render the navigation.
- Expected result: Open Jobs shows and Action Center does not `components/portal/portal-navigation.tsx:132-137`
- Test: mapped: `tests/components/portal-navigation.test.tsx::filters nav items by feature flags`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-1c"></a>
#### CAND-04-A8.1C: Links hidden on request

- Precondition: `hideNavLinks` is true.
- Action: Render the navigation.
- Expected result: Home, Open Jobs, My Jobs and the Toggle menu button do not show `components/portal/portal-navigation.tsx:184,278`
- Test: mapped: `tests/components/portal-navigation.test.tsx::hides navigation links and mobile menu when hideNavLinks is true`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-2a"></a>
#### CAND-04-A8.2A: My Jobs count

- Precondition: The applicant status holds two applications.
- Action: Render the navigation.
- Expected result: The count 2 shows `components/portal/portal-navigation.tsx:128-130,304-315`
- Test: mapped: `tests/components/portal-navigation.test.tsx::displays live badge count for My Jobs`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-2b"></a>
#### CAND-04-A8.2B: No count for none

- Precondition: The applicant status holds no applications.
- Action: Render the navigation.
- Expected result: The count 2 does not show `components/portal/portal-navigation.tsx:128-130,304`
- Test: mapped: `tests/components/portal-navigation.test.tsx::hides My Jobs badge when there are no applications`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-3a"></a>
#### CAND-04-A8.3A: Brand is not a link on the campus page

- Precondition: The path is /campus-apply.
- Action: Render the navigation.
- Expected result: The company name is not inside a link `components/portal/portal-navigation.tsx:249-260`
- Test: mapped: `tests/components/portal-navigation.test.tsx::disables brand logo redirect on /campus-apply`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-4a"></a>
#### CAND-04-A8.4A: Display name falls back to the e-mail prefix

- Precondition: No profile and no user metadata name.
- Action: Render the navigation.
- Expected result: The text before the @ of the e-mail shows `components/portal/portal-navigation.tsx:139-143`
- Test: mapped: `tests/components/portal-navigation.test.tsx::displays email as fallback for display name`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-4b"></a>
#### CAND-04-A8.4B: Initials of a single name

- Precondition: The profile name is one word.
- Action: Render the navigation.
- Expected result: The initial is that letter `components/portal/portal-navigation.tsx:90-97,145`
- Test: mapped: `tests/components/portal-navigation.test.tsx::handles user with single name`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-4c"></a>
#### CAND-04-A8.4C: User menu

- Precondition: A signed-in user.
- Action: Click the user button.
- Expected result: Profile and Sign Out show `components/portal/portal-navigation.tsx:331-419`
- Test: mapped: `tests/components/portal-navigation.test.tsx::opens user dropdown menu when clicked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-4d"></a>
#### CAND-04-A8.4D: Sign out

- Precondition: The menu is open.
- Action: Click Sign Out.
- Expected result: `auth.signOut` is called `components/portal/portal-navigation.tsx:164-171,411-417`
- Test: mapped: `tests/components/portal-navigation.test.tsx::calls signOut when Sign Out clicked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend. The redirect to /login is not asserted.
- Evidence: UNVERIFIED

<a id="cand-04-a8-4e"></a>
#### CAND-04-A8.4E: Theme toggle

- Precondition: The menu is open.
- Action: Click Dark mode.
- Expected result: `toggleTheme` is called `components/portal/portal-navigation.tsx:394-404`
- Test: mapped: `tests/components/portal-navigation.test.tsx::calls toggleTheme when theme button clicked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-04-a8-5a"></a>
#### CAND-04-A8.5A: Survey and offer navigation hides links

- Precondition: None.
- Action: Render `SurveyOfferNavigation`.
- Expected result: It renders `PortalNavigation` with `hideNavLinks` true `components/portal/survey-offer-navigation.tsx:5-7`
- Test: mapped: `tests/components/survey-offer-navigation.test.tsx::renders PortalNavigation with hideNavLinks=true`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The auth, flag, theme and branding hooks are mocked; no real HTTP or Frappe backend. `PortalNavigation` is mocked; only the prop is read.
- Evidence: UNVERIFIED
