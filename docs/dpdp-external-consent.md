# DPDP External Consent — Frontend Integration

How the candidate portal handles DPDP consent now that it can be collected on an
external partner portal (HPCP) instead of the in-app form.

---

## 1. What changed, in one paragraph

Consent used to have exactly one shape: accept the offer, get sent to
`/job_offer/consent`, tick the boxes, submit. The backend can now run that
journey on a partner portal instead. The portal therefore has to deal with three
things it never had to before — **a link to somewhere else**, **an outcome that
arrives out of band** (the partner calls our backend, not our frontend), and
**a link that can fail to be issued**. Everything below exists to handle those
three things without disturbing the original flow.

**The compatibility rule, which every decision here follows:** the external
journey is entered *only* on an explicit `dpdp_consent_mode` of
`"External Portal"`. `"Internal Form"`, an unrecognised value, and a backend that
sends no mode at all are all treated identically — the original in-app form.

---

## 2. The five endpoints and where each is consumed

| # | Endpoint | Consumed in |
|---|---|---|
| 1 | `recruitment.job_offer_utils.job_offer_update` | [job_offer/page.tsx](../app/(portal)/job_offer/page.tsx) — offer acceptance |
| 2 | `recruitment.dpdp_external_consent.start_consent_session` | [useExternalConsentHandoff.ts](../lib/hooks/useExternalConsentHandoff.ts) — every re-issue path |
| 3 | `recruitment.dpdp_external_consent.get_consent_session_status` | [consent/return/page.tsx](../app/(portal)/job_offer/consent/return/page.tsx) — the return page poll |
| 4 | `…dpdp_act_settings.get_consent_form` | [job_offer/consent/page.tsx](../app/(portal)/job_offer/consent/page.tsx) — now mode-aware |
| 5 | `recruitment.api.onboarding_dashboard.get_dashboard` | [dpdp-consent-card.tsx](../components/dashboard/dpdp-consent-card.tsx) — dashboard card |

All five go through the existing `FrappeAPI` client, so they inherit the
same-origin `/backend` proxy and first-party cookie handling unchanged.

---

## 3. The happy path

```
Candidate accepts the offer
   │
   ▼
POST job_offer_update ?status=Accepted            [endpoint 1]
   │  returns dpdp_consent_required / _mode / _url / _session
   │
   ├── required = false ──────────────► "Go to Dashboard"      (unchanged)
   │
   ├── mode = Internal Form / absent ─► /job_offer/consent      (unchanged)
   │
   └── mode = External Portal
          │
          ▼  5s countdown, then window.location.assign(dpdp_consent_url)
       HPCP consent journey  ── notices, checkboxes, OTP ──┐
          │                                               │
          │  browser redirect                             │  server callback
          ▼                                               ▼
   /job_offer/consent/return                       consent_callback → our backend
          │
          ▼  polls get_consent_session_status every 3s   [endpoint 3]
       consent_given: true  ──► redirect_url, else /onboarding
```

The two arrows out of HPCP are **independent and unordered**. The browser
redirect regularly wins. That is the single most important fact in this
integration and section 5 is about it.

---

## 4. Files added and changed

### Added

| File | Role |
|---|---|
| [lib/utils/dpdp-consent.ts](../lib/utils/dpdp-consent.ts) | Route constants, query building, URL safety, onward-destination resolution. No React. |
| [lib/hooks/useExternalConsentHandoff.ts](../lib/hooks/useExternalConsentHandoff.ts) | The one implementation of "send this candidate to the consent portal". |
| [app/(portal)/job_offer/consent/return/page.tsx](../app/(portal)/job_offer/consent/return/page.tsx) | The return page. Polls for the callback and gates on `consent_given`. |

### Changed

| File | Change |
|---|---|
| [types/consent.ts](../types/consent.ts) | Added `ConsentMode`, `isExternalConsentMode()`, session start/status response types. **Form-shaped fields on `ConsentFormResponse` are now optional** — external mode returns no form. |
| [types/dashboard.ts](../types/dashboard.ts) | Added `dpdp_consent_mode`. |
| [lib/services/jobOffer.ts](../lib/services/jobOffer.ts) | Added `startConsentSession`, `getConsentSessionStatus`; extended `UpdateJobOfferStatusResponse` with the three new fields. |
| [lib/hooks/useJobOffer.ts](../lib/hooks/useJobOffer.ts) | Added `useStartConsentSession`, `useConsentSessionStatus`. |
| [app/(portal)/job_offer/page.tsx](../app/(portal)/job_offer/page.tsx) | Acceptance stores the whole consent hand-over, not just a boolean; the post-accept redirect branches on mode. |
| [app/(portal)/job_offer/consent/page.tsx](../app/(portal)/job_offer/consent/page.tsx) | Hands off in external mode instead of rendering an empty form. Also removed two `console.log`s that were printing the full consent payload to the browser console. |
| [components/dashboard/dpdp-consent-card.tsx](../components/dashboard/dpdp-consent-card.tsx) | Off-site links now render as a real `<a rel="noopener noreferrer">` rather than a client-routed `<Link>`; label reflects the mode. |
| [app/(portal)/dashboard/page.tsx](../app/(portal)/dashboard/page.tsx) | Passes `consentMode` and `appl` to the card. |

---

## 5. The four things that can go wrong, and what happens

### The redirect beats the callback

Arriving on the return page is **not** evidence of consent. The page polls
`get_consent_session_status` every 3 seconds and gates only on `consent_given`.
Polling stops by itself the moment it flips true (`refetchInterval` returns
`false`), and the `["dashboard"]` query cache is invalidated so the consent card
disappears without a manual reload.

After 45 seconds of waiting the copy changes from "this usually takes a few
seconds" to an explanation plus two buttons — *Check again* and *Go to
Dashboard* — so nobody is left staring at a spinner forever.

### The backend could not issue a link (`dpdp_consent_url: null`)

Endpoint 1 returning a null URL means the backend's own call to HPCP failed.
`useExternalConsentHandoff` falls back to endpoint 2 to re-issue one. Three
outcomes:

- **A link comes back** → navigate to it. A `reused: true` reply is the in-flight
  link and is used exactly as it arrives; it is deliberately never retried to
  force a fresh session.
- **`already_consented: true`** → skip the portal entirely and send the candidate
  onward to `redirect_url` (or `/onboarding`).
- **Nothing usable** → `failed` flips and the UI swaps the countdown for a
  *Try again* button. The offer stays accepted; only consent is outstanding.

The same fallback chain runs from three entry points — post-acceptance, the
consent page opened directly, and the return page's resume buttons — because all
three call the same hook.

### The session expired or was declined

The return page reads `session_status`. `Expired`/`Timed out` offers *Get a new
consent link*; `Declined`/`Rejected` explains that onboarding stays blocked and
offers *Start consent again*. Both go through endpoint 2.

### The consent URL is not a URL

Every backend-supplied destination passes `isSafeExternalConsentUrl()` before the
browser sees it: absolute `http:`/`https:` only. That rejects `javascript:` and
`data:`, and rejects relative values that would silently resolve against our own
origin and look like a working link. This applies to `dpdp_consent_url`,
`consent_url`, and `redirect_url` alike. A rejected value falls back to an
in-portal route rather than being handed to the browser.

---

## 6. Backwards compatibility

Every one of these still behaves exactly as it did before this change:

- `dpdp_consent_required: false` (or absent) — offer flow ends at "Go to
  Dashboard".
- `dpdp_consent_required: true` with **no** `dpdp_consent_mode` — 5-second
  countdown, then `/job_offer/consent`, then the in-app declaration form.
- `dpdp_consent_mode: "Internal Form"` — identical to the above.
- `get_consent_form` returning a form — rendered as before.
- A dashboard `dpdp_consent_url` that is an absolute URL but carries no mode —
  still navigates off-site. Only the link semantics improved (real anchor,
  `rel="noopener noreferrer"`); the destination is unchanged.

The existing test that asserts `dpdp_consent_required: true` redirects to
`/job_offer/consent` was left untouched and still passes.

---

## 7. Backend configuration this depends on

**One item is not in the frontend's control.** The consent callback's
`redirectUrl` — the value HPCP sends the candidate's browser to — must point at
the return page for the polling in section 5 to run:

```
https://<CANDIDATE_PORTAL_HOST>/job_offer/consent/return?appl=<job_applicant_id>&token=<offer_token>
```

If it instead points at `/dashboard` or `/action-center`, nothing breaks — the
candidate simply sees the "Consent Pending" card until the callback lands and
they reload, which is the pre-existing behaviour and the exact race the return
page was built to remove.

`appl` and `token` must be preserved on that URL; they are how every consent
endpoint identifies the candidate, and the return page shows a "we couldn't
identify your application" card without them.

---

## 8. Tests

| Suite | Covers |
|---|---|
| `tests/lib/utils/dpdp-consent.test.ts` | Query/path building, URL safety (including `javascript:` and relative rejection), onward resolution. |
| `tests/lib/services/jobOffer.test.ts` | The two new endpoints, with and without a token. |
| `tests/app/job_offer/job-offer.test.tsx` | External hand-off, re-issue on a null URL, `already_consented` short-circuit, failure navigating nowhere, and Internal Form still using the in-app route. |
| `tests/app/job_offer/consent-page.test.tsx` | External mode hands off instead of rendering an empty form; re-issue; retry after failure; Internal Form unchanged. |
| `tests/app/job_offer/consent-return.test.tsx` | Pending vs. confirmed, the 45s slow path, forwarding to `redirect_url`, declined, expired, consent disabled, missing `appl`, status-check failure. |
| `tests/components/dashboard/dpdp-consent-card.test.tsx` | Mode-driven labelling, off-site anchor attributes, unsafe-URL fallback, and the no-mode legacy path. |

All suites touching consent, the offer flow and the dashboard pass. Three
unrelated suites (`onboarding-form-step`, `onboarding-right-rail`,
`portal-navigation`) fail identically before and after this change.
