# SPEC-CAND-03: Authentication client and sign-in pages

<a id="spec-cand-03"></a>

- Stable ID: `SPEC-CAND-03`
- Described at: repo `hybrowlabs/Candidate-Portal`, branch `develop`, commit `97dbcd5d3ce79fbc49dc0ba254c7a52375fbd8e5` (committer date `2026-10-30 22:32:12 +0530`)
- Also read at: branch `deploy/hybrowbase-candidate-20261025`, commit `786b53e406869986d5d5d0c81b7ae6b1605f8315`; differs: `app/(auth)/login/page.tsx` loses the post-login route call (it pushes `redirectParam` or `/open-jobs`) and `app/(auth)/register/page.tsx` pushes `/open-jobs` instead of `/dashboard`; `lib/auth.ts`, `app/(auth)/verify-email/page.tsx`, `lib/hooks/useAuthSettings.ts` are identical there; no `pw-uat` branch exists in this repo; only `develop` is described
- Author: Frontend Developer (Yashwanth). Reviewer: Code Reviewer (Yashwanth), to be recorded in the PR.
- Status: DRAFT

## 1. Purpose

This clause describes how a candidate signs up, signs in, verifies a one-time code, sets or resets a password and signs out, as the front end does it: the sign-in client `lib/auth.ts`, the auth-settings hook, and the three pages `/login`, `/register` and `/verify-email`. Issue: PWHR-1364 (parent PWHR-1362).

The client talks to one backend module, `recruitment.api.candidate_auth` (`lib/auth.ts:4`), through its own request function `frappeMethod` (`lib/auth.ts:115-140`). Which login steps are offered is read from the backend method `get_auth_settings` (`lib/auth.ts:277-279`, `lib/hooks/useAuthSettings.ts:4-9`). The session itself is a cookie that the backend sets and the browser returns; the client keeps no token (`lib/auth.ts:125-130`).

Page flows, as coded:

1. `/login`: e-mail and password → `signIn` → if the settings turn on e-mail OTP login, request an OTP and ask for the code → `verifyOtp` → refresh the profile, ask the server for the post-login route, push to `/survey`, the `redirect` query value or the server's URL (`app/(auth)/login/page.tsx:82-134,136-164,52-73`).
2. `/register`: name, e-mail, password → `signUp` → when the reply status is `otp_required` show a code form → `verifyOtp` → push the redirect value or `/dashboard` (`app/(auth)/register/page.tsx:63-123`).
3. `/verify-email`: e-mail → request a signup OTP or, with `?purpose=Password Reset`, a reset OTP → `verifyOtp` → set a new password → sign out → push `/login` (`app/(auth)/verify-email/page.tsx:49-131`).

Backend behaviour behind these methods (password rules, OTP expiry, attempt limits, rate limits, what `me` returns) is in the `recruitment` app and is not described here.

## 2. Boundaries

- In: `lib/auth.ts`, `lib/hooks/useAuthSettings.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/(auth)/verify-email/page.tsx`.
- Out: `components/auth-form.tsx` (777 lines) is the form all three pages render; it is mocked or real depending on the case and is not described here except where a case reads its output. The session state held after sign-in is SPEC-CAND-01. The Frappe client and proxy are SPEC-CAND-02. The post-login survey route belongs to PWHR-1366. `components/oauth-buttons.tsx` is read only for G3.
- Extension points: a new step is a new `frappeMethod` call in the `auth` object and a page that calls it.

## 3. Behaviour rules

### A1: The request function

- A1.1: `frappeMethod` sends a `GET` with no body and no headers when no body is passed, and a `POST` with `Content-Type: application/json` and the body as JSON otherwise; every call has `credentials: "include"` and goes to `<base>/api/method/recruitment.api.candidate_auth.<name>` (`lib/auth.ts:121-130`). [CAND-03-A1.1A]
- A1.2: It throws when the response is not OK or the body has `exc` or `exception`; the message is the joined `message` of `_server_messages`, the raw `_server_messages` text if that is not JSON, then `exception`, then `exc`, then the HTTP status text, then `Frappe request failed` (`lib/auth.ts:133-153`). [CAND-03-A1.1B]
- A1.3: A response body that is not JSON makes `JSON.parse` throw a `SyntaxError`; an empty body gives `undefined` (`lib/auth.ts:133-134`). [CAND-03-A1.1C]
- A1.4: If the base URL is empty (no `FRAPPE_BASE_URL` or `NEXT_PUBLIC_FRAPPE_URL` on the server) it throws `NEXT_PUBLIC_FRAPPE_URL is required` without a request (`lib/auth.ts:116-119`). [CAND-03-A1.1D]
- A1.5: `signUp` posts `email`, `password`, `full_name`, `mobile_no` and `candidate_source`; `undefined` fields are dropped by JSON encoding (`lib/auth.ts:202-206`). [CAND-03-A1.2A]

### A2: Session and profile mapping

- A2.1: `mapUser` returns null when the server user has neither `email` nor `name`; otherwise it sets `id` and `name` from `name` or the e-mail, `email` from `email` or `name`, and `full_name` from `full_name`, else first and last name joined, else the e-mail (`lib/auth.ts:155-171`). [CAND-03-A2.1A]
- A2.2: `user_metadata` carries `full_name`, `avatar_url` (from `user_image`, else null) and `email`, then anything the server put in its own `user_metadata` (`lib/auth.ts:165-170`). [CAND-03-A2.1A]
- A2.3: `getSession` is a `GET` to `me` and returns `{ user, session_id }` or null (`lib/auth.ts:266-270`). [CAND-03-A2.1A]
- A2.4: `isAuthenticated` is true when a session exists and false when there is none or the lookup throws (`lib/auth.ts:300-306`). [CAND-03-A2.1B]
- A2.5: `profileFromFrappeUser` fixes `role: "candidate"`, `provider: "frappe"`, `lifecycle_stage: "candidate"`, `is_internal_employee: false`, `frappe_employee_id: null`, and takes `email_domain` from the text after `@` (`lib/auth.ts:174-199`). [CAND-03-A2.2A]
- A2.6: `getUserRole` always resolves `candidate` without a request, and `requireAuth` throws `Authentication required` when there is no session (`lib/auth.ts:308,314-318`). [CAND-03-A2.2B]

### A3: Sign-in methods

- A3.1: `signIn` returns a session only when the reply status is exactly `success` and a user is present; `signUp` returns a session when the status is `success` or any user is present; `verifyOtp` returns a session whenever a user is present, whatever the status (`lib/auth.ts:208-209,218-219,242`). [CAND-03-A3.1A] [CAND-03-A3.1B]
- A3.2: `verifyOtp` defaults `purpose` to `Login` and `identifierType` to `Email` and sends `identifier`, `otp`, `purpose`, `identifier_type` and `otp_log` (`lib/auth.ts:236-240`). [CAND-03-A3.1B]
- A3.3: `requestOtp` defaults `purpose` to `Login` and `identifierType` to `Email`; `requestEmailSignupOtp` defaults `mode` to `verify_email`; `resetPassword(email)` is `requestOtp` with purpose `Password Reset` and mode `password_reset` (`lib/auth.ts:222-234,249-251`). [CAND-03-A3.2A] [CAND-03-A3.5A]
- A3.4: `updatePassword`, `signInWithGoogle`, `signInWithLinkedIn` and `signInWithOAuth` always throw a "not enabled" error and make no request; `getEnabledOAuthProviders` returns `[]` and `isOAuthProviderEnabled` returns false (`lib/auth.ts:253-255,281-292,310-312`). [CAND-03-A3.2A] [CAND-03-A3.2B]
- A3.5: `onAuthStateChange` returns an object whose `unsubscribe` does nothing; it never calls the callback (`lib/auth.ts:294-298`). [CAND-03-A3.2C]
- A3.6: `getAuthSettings` is a `GET` to `get_auth_settings` and returns the message unchanged; `useAuthSettings` caches it for one hour under the key `auth-settings` (`lib/auth.ts:277-279`, `lib/hooks/useAuthSettings.ts:6-8`). [CAND-03-A3.3A] [CAND-03-A3.3B]
- A3.7: `setPassword(password)` posts `{ password }` to `set_password` and returns `{ status, user }`; `signOut` posts `{}` to `logout` (`lib/auth.ts:245-247,257-264`). [CAND-03-A3.4A]
- A3.8: `requestEmailSignupOtp` posts `{ email, mode }` to `request_email_signup_otp` and returns the reply (`lib/auth.ts:229-234`). [CAND-03-A3.5A]

### A4: Login page

- A4.1: The page shows a notice instead of the form while settings load ("Loading login"), when they are missing, when `enabled` is 0, and when `allow_password_login` is 0; the form shows only when `allow_password_login` is 1 (`app/(auth)/login/page.tsx:202-232`). [CAND-03-A4.3A]
- A4.2: After `signIn` succeeds, the page asks for an e-mail OTP when `allow_email_otp_login` and `enable_email_otp` are both 1, otherwise it routes at once; it calls `requestOtp` with purpose `Login` and shows the code step without routing (`app/(auth)/login/page.tsx:100-120`). [CAND-03-A4.2A]
- A4.3: Routing after sign-in calls `refreshProfile`, then `getPostLoginRoute`, then sets `sessionStorage.showLoginToast = "true"` and pushes `/survey` when `survey_required` is true, else the `redirect` query value if there is one, else the server's `redirect_url`, else `/dashboard` (`app/(auth)/login/page.tsx:52-65`). [CAND-03-A4.1A] [CAND-03-A4.1B] [CAND-03-A4.1C]
- A4.4: If that routing throws, the page logs `Post-login routing error:`, still sets the toast flag and pushes the redirect value or `/dashboard` (`app/(auth)/login/page.tsx:66-72`). [CAND-03-A4.1C]
- A4.5: The `redirect` value is pushed as given; no check that it is a path on this site (`app/(auth)/login/page.tsx:61-63`). [CAND-03-A4.1B] Issue: PWHR-1519.
- A4.6: A sign-in error whose text includes "Please verify your email OTP before signing in." shows the text and pushes `/verify-email?email=<encoded>` plus `&redirect=<encoded>` when a redirect exists; any other error shows its message or "Failed to sign in" (`app/(auth)/login/page.tsx:121-130`). [CAND-03-A4.3B]
- A4.7: The campus e-mail is the decoded `email=` value of a `redirect` that contains `/campus-apply`; a malformed percent escape makes `decodeURIComponent` throw during render (`app/(auth)/login/page.tsx:42-50`). [CAND-03-A4.4A] Issue: PWHR-1520.
- A4.8: The login page also has a passwordless branch: with `isPasswordless` set it requests a signup OTP, verifies it and then shows a set-password step that calls `setPassword` and `signOut` (`app/(auth)/login/page.tsx:86-98,150-155,166-190`). The only existing test of this branch is `describe.skip` (`tests/app/(auth)/login/page.test.tsx:482`), so it is uncovered (section 10).
- A4.9: `redirectToDashboard` is defined and never called (`app/(auth)/login/page.tsx:237-251`).

### A5: Register page

- A5.1: The page shows a notice instead of the form while settings load, when they are missing, when `enabled` is 0, and when `allow_signup` is 0 (`app/(auth)/register/page.tsx:140-148`). [CAND-03-A5.1C]
- A5.2: Different password and confirmation show "Passwords do not match" and make no call (`app/(auth)/register/page.tsx:63-67`). [CAND-03-A5.3A]
- A5.3: When the `redirect` path is `/campus-apply` or starts with `/campus-apply/`, `candidateSource` is `Campus`; otherwise it is undefined (`app/(auth)/register/page.tsx:74-76`). [CAND-03-A5.2A]
- A5.4: For a campus redirect with an `email=` value, a different typed e-mail shows "The registered email mismatched" and makes no call (`app/(auth)/register/page.tsx:78-83`). [CAND-03-A5.1A]
- A5.5: When `signUp` replies `otp_required` the page shows a "Verify your email" form; submitting it calls `verifyOtp` with purpose `Signup` and then pushes the redirect value, else `/dashboard` (`app/(auth)/register/page.tsx:85-96,106-123,55-61`). [CAND-03-A5.1B]
- A5.6: Any other reply pushes the redirect value, else `/dashboard`, at once (`app/(auth)/register/page.tsx:97`). [CAND-03-A5.4A]
- A5.7: The full name is the typed name, else first and last name joined (`app/(auth)/register/page.tsx:73`).

### A6: Verify-email page

- A6.1: The page shows "Access unavailable" unless `enable_email_signup` is exactly 1 (`app/(auth)/verify-email/page.tsx:155,172-177`). [CAND-03-A6.1A]
- A6.2: With `purpose=Password Reset` in the query it calls `resetPassword`; otherwise `requestEmailSignupOtp` with mode `verify_email`; the e-mail field starts from the `email` query value (`app/(auth)/verify-email/page.tsx:30-32,49-61,170`). [CAND-03-A6.2A] [CAND-03-A6.2B]
- A6.3: `verifyOtp` is called with the returned `otp_log` and the returned `purpose`, else `Password Reset` or `Signup`; on success the set-password step shows (`app/(auth)/verify-email/page.tsx:81-95`). [CAND-03-A6.2A] [CAND-03-A6.2B]
- A6.4: Setting the password calls `setPassword`, then `signOut`, shows "Password resetted successfully please login!" and pushes `/login`, with `?redirect=<encoded>` when a redirect exists (`app/(auth)/verify-email/page.tsx:105-124`). [CAND-03-A6.2A]

## 4. Data and permissions

- The client sends the e-mail, password, one-time code and the code log id to the backend and receives a mapped user; no password or code is stored by the client (`lib/auth.ts:202-243`).
- The user object fields the client reads are `name`, `email`, `first_name`, `last_name`, `full_name`, `user_image`, `mobile_no`, `last_login_at`, `password_setup_required` and `roles` (type only) (`lib/auth.ts:58-79`). The client does not read `roles`; the stage and role are constants (A2.5).
- Who may sign in, password strength, code expiry and attempt limits are enforced by the backend and are not in this repo.
- `sessionStorage.showLoginToast` is the only value the pages write to storage (`app/(auth)/login/page.tsx:57,69,248`).
- Statutory source: not applicable. (Data-protection consent for candidates is handled in the offer flow, not here.)

## 5. Errors and edge behaviour

- Sign-in errors are shown with the backend's text as given, through a toast on login and verify-email and through an alert on register (`app/(auth)/login/page.tsx:121-130`, `app/(auth)/register/page.tsx:99-101,130-137`).
- A failed settings load shows a toast with the error text, or "Failed to load auth settings" (`app/(auth)/login/page.tsx:75-80`, `app/(auth)/verify-email/page.tsx:42-47`); register shows it in the alert (`app/(auth)/register/page.tsx:51-53`).
- A password mismatch on the set-password step shows the toast "Passwords do not match" on login and verify-email (`app/(auth)/login/page.tsx:166-170`, `app/(auth)/verify-email/page.tsx:105-109`).
- `signIn` with status `password_verified` returns no session; the login page ignores the returned status and does not read the session (`lib/auth.ts:218-219`, `app/(auth)/login/page.tsx:100-103`). A reply with any other status still continues to routing unless the OTP step is on.
- `purpose` is cast with `as any` before `verifyOtp` (`app/(auth)/login/page.tsx:145`, `app/(auth)/verify-email/page.tsx:90`).

## 6. Configuration

- `get_auth_settings` returns these keys, all read by the pages or the type: `enabled`, `allow_password_login`, `allow_email_otp_login`, `allow_signup`, `signup_requires_otp_verification`, `enable_email_otp`, `enable_mobile_otp`, `mobile_delivery_mode`, `enable_email_signup`, `require_otp_on_password_login`, `redirect_to`, `primary_color`, `enable_theme_mode` (`lib/auth.ts:86-104`). The login page reads `enabled`, `allow_password_login`, `allow_email_otp_login`, `enable_email_otp`, `allow_signup`, `enable_email_signup`; register reads `enabled` and `allow_signup`; verify-email reads `enable_email_signup` and `allow_signup`. Others have no reader in these three pages.
- The auth-settings query is cached for one hour (`lib/hooks/useAuthSettings.ts:8`).
- `NEXT_PUBLIC_FRAPPE_URL` and `FRAPPE_BASE_URL` decide the base URL (SPEC-CAND-02).

## 7. Scheduled jobs, hooks and patches

None. The pages run effects only: toast on settings error (`app/(auth)/login/page.tsx:75-80`, `app/(auth)/verify-email/page.tsx:42-47`).

## 8. Static security and performance observations

- Security: the `redirect` query value is pushed without a same-origin check on login and register (`app/(auth)/login/page.tsx:62,71`, `app/(auth)/register/page.tsx:56-58`). Issue: PWHR-1519.
- Security: a malformed percent escape in a campus `redirect` throws during render on login and register (`app/(auth)/login/page.tsx:46`, `app/(auth)/register/page.tsx:45`). Issue: PWHR-1520.
- Security: password and code are sent in a JSON POST body, not in the URL (`lib/auth.ts:128-129`).
- Security: the OTP log id is kept in component state and sent back with the code (`app/(auth)/login/page.tsx:39,147`).
- Security: password and code inputs live in component state; none is written to storage (`app/(auth)/register/page.tsx:36-40`).
- Security: because `signIn` returns no session unless the status is exactly `success`, but the login page does not read that session, the page's own decision to continue rests on `signIn` not throwing (`lib/auth.ts:218-219`, `app/(auth)/login/page.tsx:100-120`).
- Security: Google and LinkedIn client IDs are passed to the image build with no reader in source (SPEC-CAND-02 section 6); OAuth is hard-disabled in code (`lib/auth.ts:281-292`).
- Performance: each page waits for `get_auth_settings` before it renders a form; the result is cached for one hour (`lib/hooks/useAuthSettings.ts:8`).
- Performance: login chains `refreshProfile` and `getPostLoginRoute` one after the other before it navigates (`app/(auth)/login/page.tsx:54-55`).

## 9. Known gaps / open questions

- G1: The `redirect` value is not validated (A4.5, A5.5). Issue: PWHR-1519.
- G2: A malformed escape in the campus `redirect` crashes the pages (A4.7). Issue: PWHR-1520.
- G3: `components/oauth-buttons.tsx:33-34` calls `isOAuthProviderEnabled("google")` with an argument; the function takes none (TS2554). OAuth is off in code. Issue: PWHR-1514.
- G4: `signUp` treats any reply with a user as a session, `verifyOtp` does the same whatever the status, and `signIn` needs `success` (A3.1). The pages ignore `session` and decide from `status` or from not throwing. Whether the backend can return a user with a non-success status is a backend fact not read. Not filed: backend question.
- G5: The passwordless branch of the login page is covered only by a skipped test (`tests/app/(auth)/login/page.test.tsx:482`). Not filed: noted in section 10.
- G6: `redirectToDashboard` is unused (A4.9). Not filed: dead code.
- G7: After a successful password reset the verify-email page signs out then pushes `/login`; login after set-password on the login page's passwordless branch stays on `/login` without a push (`app/(auth)/login/page.tsx:175-182`). Not filed: UX difference, no defect asserted.
- G8: The message "Password resetted successfully please login!" is shown for both signup-set and reset flows (`app/(auth)/verify-email/page.tsx:120`). Not filed: copy text.
- G9: The text test for "Please verify your email OTP before signing in." depends on a backend string (`app/(auth)/login/page.tsx:124`); a changed backend message would stop the redirect to `/verify-email`. Not filed: backend contract.
- G10: Branch drift: `deploy/hybrowbase-candidate-20261025` changes login and register (header). Issue: PWHR-1518.
- G11: Every case stubs `fetch`, the router, `auth` or the services; none talks to a real Frappe site. Hosted CI is UNVERIFIED.
- Statutory source: not applicable.

## 10. Uncovered behaviour

- A4.8, the passwordless branch of login: its only test is skipped. Not filed: no test written in this pass.
- A4.4 and the `survey_required` branch with a redirect value: A4.3 cases cover them; the toast-flag write on the success path is asserted only for `true`. Not filed.
- A4.2, the OTP verify step on the login page after the code is typed: existing tests in `tests/app/(auth)/login/page.test.tsx` (about 30 tests, not mapped) assert it; they are not linked to a case in this pass. Not filed: no defect.
- A5.5 and A5.2 error alerts: existing register tests assert them; not mapped except A5.2 and A5.3. Not filed.
- A6.4 in the password-reset path with a redirect value: the mapped signup test covers `/login`; the reset path is covered by an unmapped existing test. Not filed.
- A1.2, an `exc` field in an OK reply: covered by CAND-03-A1.1B; a reply with both `message` and `exc` is not tried. Not filed.
- `components/auth-form.tsx` (777 lines): `tests/components/auth-form.test.tsx` exists and is not mapped. Not filed: out of scope; PWHR-1366 or the review issue PWHR-1368 can map it.
- `components/oauth-buttons.tsx`: `tests/components/oauth-buttons.test.tsx` exists; the buttons are unreachable while OAuth is off. Not filed.
- The 28 login tests and 24 register tests that exist but are not mapped were not read line by line. Not filed: PWHR-1368 can sample them.

## 11. Acceptance cases

Every case is `Evidence: UNVERIFIED`. Cases that map an existing test only gained a `// Spec:` comment line above the `it(`; all other cases are characterization tests added by this change in `tests/spec/`.

<a id="cand-03-a1"></a>
### CAND-03-A1: The request function

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-03-A1.1A](03-authentication.md#cand-03-a1-1a) | Request method, URL, headers and body for GET and POST calls. | [`sends a GET with no body for getSession and a POST with a JSON body for every other method`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A1.1B](03-authentication.md#cand-03-a1-1b) | Order of error text sources in the sign-in client. | [`throws the _server_messages text, else exception, else exc, else statusText, and treats exc on an ok response as failure`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A1.1C](03-authentication.md#cand-03-a1-1c) | A non-JSON body throws SyntaxError and an empty body returns undefined. | [`rejects a non-JSON body with a SyntaxError and returns undefined for an empty ok body`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A1.1D](03-authentication.md#cand-03-a1-1d) | The client refuses to call with an empty base URL. | [`throws NEXT_PUBLIC_FRAPPE_URL is required, without a request, when it runs on the server with neither backend URL set`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A1.2A](03-authentication.md#cand-03-a1-2a) | signUp posts the campus source and returns the OTP-required status. | [`signs up through the recruitment Frappe API with candidateSource`](../../../tests/lib/auth.test.ts) |

<a id="cand-03-a1-1a"></a>
#### CAND-03-A1.1A: GET versus POST

- Precondition: `fetch` is stubbed to answer OK with a null user.
- Action: Call `getSession` and `signOut`.
- Expected result: The first is a `GET` to `/backend/api/method/recruitment.api.candidate_auth.me` with credentials include, no headers and no body; the second is a `POST` to `.logout` with the JSON header and the body `{}` `lib/auth.ts:121-130`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::sends a GET with no body for getSession and a POST with a JSON body for every other method`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a1-1b"></a>
#### CAND-03-A1.1B: Error text sources

- Precondition: `fetch` answers six different failure shapes in turn.
- Action: Call `getSession` for each.
- Expected result: The messages are the two joined `_server_messages` entries, the raw bad `_server_messages` text, the exception text, the `exc` text on an OK reply, the status text `Forbidden`, and `Frappe request failed` `lib/auth.ts:133-153`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::throws the _server_messages text, else exception, else exc, else statusText, and treats exc on an ok response as failure`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a1-1c"></a>
#### CAND-03-A1.1C: Non-JSON and empty bodies

- Precondition: `fetch` answers an HTML page with OK, then an empty OK body.
- Action: Call `requestOtp` twice.
- Expected result: The first rejects with a `SyntaxError`; the second resolves `undefined` `lib/auth.ts:133-134`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::rejects a non-JSON body with a SyntaxError and returns undefined for an empty ok body`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a1-1d"></a>
#### CAND-03-A1.1D: No backend URL

- Precondition: `window` is undefined and both URL variables are empty.
- Action: Call `getSession`.
- Expected result: It rejects with `NEXT_PUBLIC_FRAPPE_URL is required` and `fetch` is not called `lib/auth.ts:116-119`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::throws NEXT_PUBLIC_FRAPPE_URL is required, without a request, when it runs on the server with neither backend URL set`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a1-2a"></a>
#### CAND-03-A1.2A: Sign-up with a campus source

- Precondition: `fetch` answers `otp_required` with a user.
- Action: Call `signUp` with a name and `candidateSource: Campus`.
- Expected result: The result status is `otp_required`; the POST body holds `email`, `password`, `full_name` and `candidate_source` and no `mobile_no` `lib/auth.ts:202-206`
- Test: mapped: `tests/lib/auth.test.ts::signs up through the recruitment Frappe API with candidateSource`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The password is the synthetic placeholder in the existing test. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-03-a2"></a>
### CAND-03-A2: Session and profile mapping

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-03-A2.1A](03-authentication.md#cand-03-a2-1a) | How a server user becomes the client user, or null. | [`builds id, name, e-mail and full name from whichever fields the server sent, and returns null when it sent neither e-mail nor name`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A2.1B](03-authentication.md#cand-03-a2-1b) | isAuthenticated is false for no session or an error. | [`reports false from isAuthenticated for a null session and a failed lookup, and true for a session`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A2.2A](03-authentication.md#cand-03-a2-2a) | The profile built from a Frappe user has fixed role, provider and stage. | [`builds a candidate profile with fixed role, provider and stage, and takes the domain from the e-mail`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A2.2B](03-authentication.md#cand-03-a2-2b) | getUserRole is a constant and requireAuth throws without a session. | [`returns the fixed 'candidate' role without any request and throws from requireAuth when there is no session`](../../../tests/spec/cand-03-auth-client.test.ts) |

<a id="cand-03-a2-1a"></a>
#### CAND-03-A2.1A: User mapping

- Precondition: `fetch` answers three user shapes: first and last name with a `name` and an image; only first and last name; only an e-mail.
- Action: Call `getSession` three times.
- Expected result: The first gives `id`, `email` and `full_name` from the pieces and `avatar_url` from the image; the second gives null; the third uses the e-mail as full name with a null avatar `lib/auth.ts:155-171,266-270`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::builds id, name, e-mail and full name from whichever fields the server sent, and returns null when it sent neither e-mail nor name`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a2-1b"></a>
#### CAND-03-A2.1B: isAuthenticated

- Precondition: `fetch` answers a null user, a 403, then a user.
- Action: Call `isAuthenticated` three times.
- Expected result: It returns false, false, true `lib/auth.ts:300-306`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::reports false from isAuthenticated for a null session and a failed lookup, and true for a session`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a2-2a"></a>
#### CAND-03-A2.2A: Profile constants

- Precondition: None.
- Action: Call `profileFromFrappeUser` with a user with a mixed-case domain, a mobile number and an image.
- Expected result: `role` is candidate, `provider` frappe, `lifecycle_stage` candidate, `is_internal_employee` false, `frappe_employee_id` null; `email_domain` keeps the domain's case; the name falls back to `user_metadata` `lib/auth.ts:174-199`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::builds a candidate profile with fixed role, provider and stage, and takes the domain from the e-mail`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a2-2b"></a>
#### CAND-03-A2.2B: Fixed role and requireAuth

- Precondition: `fetch` answers a null user.
- Action: Call `getUserRole` then `requireAuth`.
- Expected result: `getUserRole` resolves `candidate` with no request; `requireAuth` rejects with `Authentication required` `lib/auth.ts:308,314-318`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::returns the fixed 'candidate' role without any request and throws from requireAuth when there is no session`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a3"></a>
### CAND-03-A3: Sign-in methods

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-03-A3.1A](03-authentication.md#cand-03-a3-1a) | Session rules differ between signIn and signUp. | [`gives signIn a session only when the server status is exactly 'success', while signUp accepts any reply that carries a user`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A3.1B](03-authentication.md#cand-03-a3-1b) | verifyOtp returns a session for any status and sends default purpose and type. | [`gives verifyOtp a session whenever a user comes back, whatever the status`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A3.2A](03-authentication.md#cand-03-a3-2a) | resetPassword maps to a reset OTP and the disabled methods reject without a request. | [`maps resetPassword to a Password Reset OTP request and rejects updatePassword and every OAuth sign-in without a network call`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A3.2B](03-authentication.md#cand-03-a3-2b) | OAuth providers are disabled in code. | [`keeps OAuth disabled until configured in Frappe auth`](../../../tests/lib/auth.test.ts) |
| [CAND-03-A3.2C](03-authentication.md#cand-03-a3-2c) | onAuthStateChange returns an inert subscription. | [`returns a noop auth-state subscription for compatibility`](../../../tests/lib/auth.test.ts) |
| [CAND-03-A3.3A](03-authentication.md#cand-03-a3-3a) | getAuthSettings is a plain GET returning the message. | [`requests the auth settings with a GET to get_auth_settings and returns the message unchanged`](../../../tests/spec/cand-03-auth-client.test.ts) |
| [CAND-03-A3.3B](03-authentication.md#cand-03-a3-3b) | The hook returns the settings from the client. | [`fetches auth settings data`](../../../tests/lib/hooks/useAuthSettings.test.tsx) |
| [CAND-03-A3.4A](03-authentication.md#cand-03-a3-4a) | setPassword posts the password and returns status and user. | [`sets the password through the recruitment Frappe API`](../../../tests/lib/auth.test.ts) |
| [CAND-03-A3.5A](03-authentication.md#cand-03-a3-5a) | The signup OTP request defaults its mode to verify_email. | [`requests an email signup OTP through the recruitment Frappe API`](../../../tests/lib/auth.test.ts) |

<a id="cand-03-a3-1a"></a>
#### CAND-03-A3.1A: Which results carry a session

- Precondition: `fetch` answers statuses `success`, `password_verified` (sign-in) and `otp_required` with and without a user (sign-up).
- Action: Call `signIn` twice and `signUp` twice.
- Expected result: `signIn` gives a session only for `success`; `signUp` gives one for any user and none without a user `lib/auth.ts:208-209,218-219`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::gives signIn a session only when the server status is exactly 'success', while signUp accepts any reply that carries a user`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a3-1b"></a>
#### CAND-03-A3.1B: verifyOtp session and body

- Precondition: `fetch` answers status `anything` with a user and a session id.
- Action: Call `verifyOtp` with identifier and code.
- Expected result: A session with that id is returned and the body carries the defaults `purpose` Login and `identifier_type` Email `lib/auth.ts:236-243`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::gives verifyOtp a session whenever a user comes back, whatever the status`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a3-2a"></a>
#### CAND-03-A3.2A: Reset mapping and disabled methods

- Precondition: `fetch` answers OK.
- Action: Call `resetPassword`, then `updatePassword`, `signInWithGoogle`, `signInWithLinkedIn` and `signInWithOAuth('linkedin')`.
- Expected result: `resetPassword` posts to `request_otp` with purpose Password Reset and mode password_reset; the four others reject with their fixed texts and no further request is made `lib/auth.ts:249-255,281-292`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::maps resetPassword to a Password Reset OTP request and rejects updatePassword and every OAuth sign-in without a network call`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a3-2b"></a>
#### CAND-03-A3.2B: OAuth is off

- Precondition: None.
- Action: Read `getEnabledOAuthProviders`, `isOAuthProviderEnabled` and call `signInWithOAuth('google')`.
- Expected result: The list is empty, the check is false and the call rejects with a message containing `not enabled` `lib/auth.ts:289-292,310-312`
- Test: mapped: `tests/lib/auth.test.ts::keeps OAuth disabled until configured in Frappe auth`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-03-a3-2c"></a>
#### CAND-03-A3.2C: Auth-state subscription is a no-op

- Precondition: None.
- Action: Call `onAuthStateChange` and its `unsubscribe`.
- Expected result: `unsubscribe` returns undefined `lib/auth.ts:294-298`
- Test: mapped: `tests/lib/auth.test.ts::returns a noop auth-state subscription for compatibility`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The callback is never called and the test does not check that. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-03-a3-3a"></a>
#### CAND-03-A3.3A: Auth settings request

- Precondition: `fetch` answers OK with a settings object.
- Action: Call `getAuthSettings`.
- Expected result: The object is returned unchanged from a `GET` to `.get_auth_settings` `lib/auth.ts:277-279`
- Test: characterization: `tests/spec/cand-03-auth-client.test.ts::requests the auth settings with a GET to get_auth_settings and returns the message unchanged`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a3-3b"></a>
#### CAND-03-A3.3B: Auth settings hook

- Precondition: `auth.getAuthSettings` is mocked with a settings object.
- Action: Render `useAuthSettings` in a query client.
- Expected result: The query succeeds with that object and the mock was called once `lib/hooks/useAuthSettings.ts:4-9`
- Test: mapped: `tests/lib/hooks/useAuthSettings.test.tsx::fetches auth settings data`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The one-hour cache time is not asserted. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-03-a3-4a"></a>
#### CAND-03-A3.4A: Set password

- Precondition: `fetch` answers `success` with a user whose `password_setup_required` is false.
- Action: Call `setPassword('newpassword')`.
- Expected result: The status and user are returned and the POST body is `{ password }` `lib/auth.ts:257-264`
- Test: mapped: `tests/lib/auth.test.ts::sets the password through the recruitment Frappe API`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The password is a synthetic placeholder. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-03-a3-5a"></a>
#### CAND-03-A3.5A: E-mail sign-up OTP request

- Precondition: `fetch` answers `otp_required` with an `otp_log`.
- Action: Call `requestEmailSignupOtp` with an e-mail only.
- Expected result: The reply is returned and the body holds the e-mail and mode `verify_email` `lib/auth.ts:229-234`
- Test: mapped: `tests/lib/auth.test.ts::requests an email signup OTP through the recruitment Frappe API`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-03-a4"></a>
### CAND-03-A4: Login page

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-03-A4.1A](03-authentication.md#cand-03-a4-1a) | A required survey beats the redirect value and the server URL. | [`refreshes the profile, asks the server for the post-login route and goes to /survey when a survey is required`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A4.1B](03-authentication.md#cand-03-a4-1b) | The redirect value is pushed without a same-origin check. | [`pushes the redirect query value exactly as given, even an absolute URL, ahead of the server's redirect_url`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A4.1C](03-authentication.md#cand-03-a4-1c) | Server URL, default and error fallbacks after sign-in. | [`uses the server's redirect_url, falls back to /dashboard when it is empty, and still routes when the route call fails`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A4.2A](03-authentication.md#cand-03-a4-2a) | The OTP step needs both settings to be 1. | [`asks for a login OTP after the password step only when both allow_email_otp_login and enable_email_otp are 1, and does not route yet`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A4.3A](03-authentication.md#cand-03-a4-3a) | Four notices replace the login form. | [`shows a notice instead of the form while settings load, when they are missing, when disabled and when password login is off`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A4.3B](03-authentication.md#cand-03-a4-3b) | The not-verified error redirects to verify-email with e-mail and redirect. | [`sends the visitor to /verify-email with the e-mail and the redirect when sign-in says the e-mail OTP is not verified`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A4.4A](03-authentication.md#cand-03-a4-4a) | A malformed percent escape crashes the render. | [`throws a URIError while rendering the login and register pages when the campus-apply redirect carries a malformed percent escape in email`](../../../tests/spec/cand-03-auth-pages.test.tsx) |

<a id="cand-03-a4-1a"></a>
#### CAND-03-A4.1A: Login routes to the survey

- Precondition: Settings turn e-mail OTP off; `getPostLoginRoute` says a survey is required; a `redirect` value exists.
- Action: Type the credentials and submit.
- Expected result: `refreshProfile` ran once, the toast flag is `true` and the page pushed `/survey` only `app/(auth)/login/page.tsx:52-60`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::refreshes the profile, asks the server for the post-login route and goes to /survey when a survey is required`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The survey service and router are mocked.
- Evidence: UNVERIFIED

<a id="cand-03-a4-1b"></a>
#### CAND-03-A4.1B: Login pushes the redirect value as given

- Precondition: The redirect query value is an absolute URL on a synthetic host.
- Action: Submit the credentials.
- Expected result: The router received exactly that URL, once `app/(auth)/login/page.tsx:61-63`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::pushes the redirect query value exactly as given, even an absolute URL, ahead of the server's redirect_url`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. Pins a suspected defect, not endorsed. Issue: PWHR-1519. Whether a real router leaves the site was not run.
- Evidence: UNVERIFIED

<a id="cand-03-a4-1c"></a>
#### CAND-03-A4.1C: Login fallbacks

- Precondition: `getPostLoginRoute` answers `/open-jobs`, then no URL, then rejects with a redirect value.
- Action: Submit the credentials three times.
- Expected result: The pushes are `/open-jobs`, `/dashboard` and the redirect value; the toast flag is set in the rejecting case `app/(auth)/login/page.tsx:64,66-72`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::uses the server's redirect_url, falls back to /dashboard when it is empty, and still routes when the route call fails`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a4-2a"></a>
#### CAND-03-A4.2A: Login OTP step

- Precondition: Settings turn e-mail OTP login and e-mail OTP on, then only the first on.
- Action: Submit the credentials in each case.
- Expected result: With both on, `requestOtp` is called with the login purpose, the code field shows, and the post-login route is not asked or pushed; with one on, the page routes and `requestOtp` is not called `app/(auth)/login/page.tsx:105-120`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::asks for a login OTP after the password step only when both allow_email_otp_login and enable_email_otp are 1, and does not route yet`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The OTP verify step is not driven (section 10).
- Evidence: UNVERIFIED

<a id="cand-03-a4-3a"></a>
#### CAND-03-A4.3A: Login gating notices

- Precondition: The settings hook returns loading, missing, `enabled: 0`, and `allow_password_login: 0` in turn.
- Action: Render the page in each state.
- Expected result: The notices are Loading login, Unable to load candidate authentication settings., Candidate portal authentication is disabled. and Password login is not enabled for candidate accounts.; the password field is absent in the last `app/(auth)/login/page.tsx:202-232`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::shows a notice instead of the form while settings load, when they are missing, when disabled and when password login is off`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a4-3b"></a>
#### CAND-03-A4.3B: Unverified e-mail goes to verify-email

- Precondition: `signIn` rejects with the not-verified message; a redirect value exists.
- Action: Submit the credentials.
- Expected result: The error toast shows the message and the router pushes `/verify-email?email=cand%40example.invalid&redirect=%2Fopen-jobs` `app/(auth)/login/page.tsx:124-128`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::sends the visitor to /verify-email with the e-mail and the redirect when sign-in says the e-mail OTP is not verified`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The check is on message text from the backend (G9).
- Evidence: UNVERIFIED

<a id="cand-03-a4-4a"></a>
#### CAND-03-A4.4A: Malformed campus e-mail escape

- Precondition: The redirect value is a campus-apply URL whose `email=` ends in a broken percent escape, then a valid one.
- Action: Render the login and register pages.
- Expected result: The broken value makes both renders throw `URIError`; the valid value fills the e-mail field `app/(auth)/login/page.tsx:42-50`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::throws a URIError while rendering the login and register pages when the campus-apply redirect carries a malformed percent escape in email`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. Pins a suspected defect, not endorsed. Issue: PWHR-1520. No error boundary is rendered, so the throw is seen at `render`.
- Evidence: UNVERIFIED

<a id="cand-03-a5"></a>
### CAND-03-A5: Register page

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-03-A5.1A](03-authentication.md#cand-03-a5-1a) | A different e-mail from the campus invite blocks sign-up. | [`blocks sign-up with a message when the campus invite e-mail in the redirect differs from the typed e-mail`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A5.1B](03-authentication.md#cand-03-a5-1b) | OTP-required sign-up shows the code form and ends at the redirect value. | [`when the server needs an OTP it shows the verify form, and a verified OTP pushes the redirect value as given`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A5.1C](03-authentication.md#cand-03-a5-1c) | Disabled sign-up shows a notice. | [`shows a notice instead of the form when sign-up is disabled in the auth settings`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A5.2A](03-authentication.md#cand-03-a5-2a) | candidateSource is Campus only for the campus-apply path or below. | [`sends candidateSource Campus when the redirect path is /campus-apply or below it, and nothing otherwise`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A5.3A](03-authentication.md#cand-03-a5-3a) | A mismatched confirmation blocks sign-up. | [`shows Passwords do not match and makes no sign-up call when the two password fields differ`](../../../tests/spec/cand-03-auth-pages.test.tsx) |
| [CAND-03-A5.4A](03-authentication.md#cand-03-a5-4a) | Without an OTP step the register page pushes the redirect value or the dashboard. | [`sends a signed-up visitor straight to the redirect value, or /dashboard, when the server does not ask for an OTP`](../../../tests/spec/cand-03-auth-pages.test.tsx) |

<a id="cand-03-a5-1a"></a>
#### CAND-03-A5.1A: Campus e-mail mismatch

- Precondition: The redirect is a campus-apply URL with an invited e-mail; a different e-mail is typed.
- Action: Fill and submit the register form.
- Expected result: The message The registered email mismatched shows, the toast fires and `signUp` is not called `app/(auth)/register/page.tsx:78-83`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::blocks sign-up with a message when the campus invite e-mail in the redirect differs from the typed e-mail`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a5-1b"></a>
#### CAND-03-A5.1B: Register OTP step

- Precondition: `signUp` replies `otp_required`; the redirect is `/open-jobs`.
- Action: Submit the form, type a code and verify.
- Expected result: The Verify your email form shows; `signUp` got name, e-mail, password and an undefined source; `verifyOtp` got purpose Signup; the router pushed `/open-jobs` `app/(auth)/register/page.tsx:85-96,106-123`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::when the server needs an OTP it shows the verify form, and a verified OTP pushes the redirect value as given`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a5-1c"></a>
#### CAND-03-A5.1C: Sign-up disabled notice

- Precondition: The settings say `allow_signup: 0`.
- Action: Render the page.
- Expected result: The notice Candidate signup is disabled. shows and the password field does not `app/(auth)/register/page.tsx:146-147`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::shows a notice instead of the form when sign-up is disabled in the auth settings`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a5-2a"></a>
#### CAND-03-A5.2A: Campus source from the redirect path

- Precondition: The redirect is each of `/campus-apply`, with a query, `/campus-apply/extra`, `/campus-applyx` and `/open-jobs`.
- Action: Fill and submit the form for each.
- Expected result: `candidateSource` is `Campus` for the first three and undefined for the last two `app/(auth)/register/page.tsx:74-76`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::sends candidateSource Campus when the redirect path is /campus-apply or below it, and nothing otherwise`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The `.includes` test in the e-mail decoder is looser than this one; only the source rule is pinned. Mapped tests nearby (`attaches candidateSource...`) are not linked.
- Evidence: UNVERIFIED

<a id="cand-03-a5-3a"></a>
#### CAND-03-A5.3A: Password mismatch

- Precondition: Two different passwords are typed.
- Action: Submit the register form.
- Expected result: The text Passwords do not match shows and `signUp` is not called `app/(auth)/register/page.tsx:63-67`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::shows Passwords do not match and makes no sign-up call when the two password fields differ`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a5-4a"></a>
#### CAND-03-A5.4A: Register without OTP

- Precondition: `signUp` replies `success`; no redirect, then redirect `/open-jobs`.
- Action: Submit the form twice.
- Expected result: The pushes are `/dashboard` and `/open-jobs` `app/(auth)/register/page.tsx:55-61,97`
- Test: characterization: `tests/spec/cand-03-auth-pages.test.tsx::sends a signed-up visitor straight to the redirect value, or /dashboard, when the server does not ask for an OTP`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a6"></a>
### CAND-03-A6: Verify-email page

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-03-A6.1A](03-authentication.md#cand-03-a6-1a) | The page needs enable_email_signup to be 1. | [`shows an Access unavailable notice unless enable_email_signup is exactly 1`](../../../tests/spec/cand-03-verify-email.test.tsx) |
| [CAND-03-A6.2A](03-authentication.md#cand-03-a6-2a) | Signup path from code request to the login redirect. | [`signup path: requests a signup OTP, verifies it with the returned otp_log and purpose, sets the password, signs out and goes to /login with the redirect`](../../../tests/spec/cand-03-verify-email.test.tsx) |
| [CAND-03-A6.2B](03-authentication.md#cand-03-a6-2b) | Reset path uses resetPassword and the Password Reset purpose. | [`password-reset path: purpose=Password Reset calls resetPassword instead of requestEmailSignupOtp and verifies with the Password Reset purpose`](../../../tests/spec/cand-03-verify-email.test.tsx) |

<a id="cand-03-a6-1a"></a>
#### CAND-03-A6.1A: Verify-email unavailable

- Precondition: `enable_email_signup` is 0, then settings are missing.
- Action: Render the page twice.
- Expected result: Access unavailable shows both times `app/(auth)/verify-email/page.tsx:155,172-177`
- Test: characterization: `tests/spec/cand-03-verify-email.test.tsx::shows an Access unavailable notice unless enable_email_signup is exactly 1`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-03-a6-2a"></a>
#### CAND-03-A6.2A: Signup verification path

- Precondition: Settings enable e-mail signup; the query has an e-mail and a redirect.
- Action: Send the code, verify it, set a password.
- Expected result: `requestEmailSignupOtp` got e-mail and mode; `verifyOtp` got purpose Signup and the returned `otp_log`; `setPassword` and `signOut` ran once; the router pushed `/login?redirect=%2Fopen-jobs` `app/(auth)/verify-email/page.tsx:49-131`
- Test: characterization: `tests/spec/cand-03-verify-email.test.tsx::signup path: requests a signup OTP, verifies it with the returned otp_log and purpose, sets the password, signs out and goes to /login with the redirect`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The returned `purpose` field is not varied.
- Evidence: UNVERIFIED

<a id="cand-03-a6-2b"></a>
#### CAND-03-A6.2B: Password-reset path

- Precondition: The query says `purpose=Password Reset`.
- Action: Send the code and verify it.
- Expected result: `resetPassword` is called with the e-mail, `requestEmailSignupOtp` is not, and `verifyOtp` gets purpose Password Reset and the returned `otp_log` `app/(auth)/verify-email/page.tsx:49-61,81-95`
- Test: characterization: `tests/spec/cand-03-verify-email.test.tsx::password-reset path: purpose=Password Reset calls resetPassword instead of requestEmailSignupOtp and verifies with the Password Reset purpose`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `fetch`, the router, the auth module or the settings hook are mocked; no real HTTP or Frappe backend. The final set-password step is not repeated here.
- Evidence: UNVERIFIED
