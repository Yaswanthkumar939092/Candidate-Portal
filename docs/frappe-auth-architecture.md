# Candidate Portal Frappe Auth Architecture

## Source Of Truth

Candidate authentication is configured from the linked Frappe site, not from hardcoded portal constants.

- `Candidate Portal Auth Settings` is a Single DocType in the Recruitment module.
- `Candidate Portal OTP Log` is the transaction/audit DocType for OTP requests, delivery, verification, expiry, and revocation.
- `Candidate Portal User` is the restricted role assigned to candidate accounts. It is created with Desk access disabled.

The API bootstrap sets safe defaults only when the Single DocType has empty values. Runtime behavior reads the settings document on every auth call.

## Settings-Driven Policy

The settings DocType controls:

- Whether candidate auth is enabled.
- Password login, email OTP login, signup, and signup OTP requirements.
- Candidate user creation and the role assigned to candidate users.
- OTP length, expiry, max attempts, resend cooldown, hourly request limits, and revocation behavior.
- Email OTP subject/template and SMS template.
- Email OTP and mobile OTP channel enablement.
- Debug OTP preview storage for local/testing use.

Mobile OTP is feature flagged through `enable_mobile_otp`. When enabled, delivery uses Frappe's SMS Settings instead of adding provider credentials to portal code.

## API Layer

The Next.js portal calls these Frappe methods:

- `recruitment.api.candidate_auth.get_auth_settings`
- `recruitment.api.candidate_auth.signup`
- `recruitment.api.candidate_auth.login`
- `recruitment.api.candidate_auth.request_otp`
- `recruitment.api.candidate_auth.verify_otp`
- `recruitment.api.candidate_auth.logout`
- `recruitment.api.candidate_auth.me`

The API creates Frappe Website Users only. It does not create Employees. A verified/logged-in candidate must have the configured candidate role before a session is returned.

## Portal Site Linking

The candidate portal links to one Frappe site through:

```env
NEXT_PUBLIC_FRAPPE_URL=http://127.0.0.1:8005
FRAPPE_BASE_URL=http://127.0.0.1:8005
```

For deployment, point those variables to the target Frappe site URL. The Frappe site should also set `allowed_origin` in `Candidate Portal Auth Settings` when origin enforcement is enabled around these APIs.

## Local Verification Notes

On `site1.local`, `bench --site site1.local migrate` now completes successfully. During local verification the bench had two unrelated schema/fixture issues that had to be cleaned up before migration could finish:

- Deleted/stale `Employee Onboarding` columns were present in the local table even though the table had no rows and the fields no longer existed in DocType metadata.
- Installed HR/payroll apps defined several large `Employee` custom fields as `Data`, forcing them back to `varchar(140)` and exceeding the InnoDB row-size limit. Those overlapping customizations are kept as `Small Text`.
- `cn_indian_payroll` state fixtures were updated from the old `state_name` field shape to the current mandatory `country` and `state` fields.

Backend auth smoke was verified over HTTP:

- Signup returns `otp_required`.
- OTP verification sets a Frappe session cookie.
- `me` returns the candidate user after verification.
- The user has `Candidate Portal User`.
- `Candidate Portal User` has `desk_access = 0`.
- No Employee is created for candidate signup.

Browser smoke was verified through the Candidate Portal:

- Signup creates a candidate Website User and requires email OTP.
- Signup OTP verification succeeds and enables the candidate user.
- Email OTP login succeeds and renders `/dashboard`.
- Password login succeeds and renders `/dashboard`.

For local manual/browser testing, `store_plain_otp_for_debug` may be enabled in `Candidate Portal Auth Settings` and the latest OTP can be read from `Candidate Portal OTP Log`. Keep this disabled in production.
