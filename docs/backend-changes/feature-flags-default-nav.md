# Backend change — default-enable Open Jobs and My Jobs in `get_candidate_feature_flags`

Target repo: cn-recruitment (Python, Frappe).
Spec: [CAND-02-A8.4](../spec/clauses/02-api-client-and-backend-contract.md#a8-portal-nav-feature-flags-driven-by-the-candidate-portal-feature-flag-doctype).
Frontend PR (companion): `feat/portal-nav-feature-flag-driven` on hybrowlabs/Candidate-Portal.

## Problem

`recruitment.api.candidate_portal.get_candidate_feature_flags` returns one
entry per row of the Candidate Portal Feature Flag doctype, snake-cased from
`page_name` (`"Action Center"` → `action_center`). A fresh deployment has no
rows for Open Jobs or My Jobs, so the method returns neither, and the
frontend — which now defaults all page nav items off so the backend decides
visibility — hides both pages. The desired behaviour is:

- Open Jobs and My Jobs are **on by default** across all deployments.
- An admin who adds a doctype row with `page_name` set to "Open Jobs" or
  "My Jobs" and `is_enabled` ticked off disables the page.
- Every other page (Action Center, Documents, Candidate Dashboard, …)
  stays off until an explicit row enables it.

## Required change (two layers)

### 1. `get_candidate_feature_flags` returns defaults even without doctype rows

In the body of `get_candidate_feature_flags` (after the doctype rows are
collected into the response map, before it is returned), fill in the two
default-on keys only when the doctype has not already supplied them:

```python
# recruitment/api/candidate_portal.py (shape, not committed here)
@frappe.whitelist()
def get_candidate_feature_flags():
    doc = frappe.get_single("Candidate Portal Feature Flag")
    result = {}
    for row in doc.feature_flags:
        if row.page_name:
            result[row.page_name.strip().lower().replace(" ", "_")] = row.is_enabled
    # Default-on nav items: present without a doctype row means "shown".
    # A row with is_enabled = 0 overrides the default and hides the page.
    result.setdefault("open_jobs", 1)
    result.setdefault("my_jobs", 1)
    return result
```

`setdefault` is load-bearing: it must not overwrite an explicit admin
setting. If `"Open Jobs"` exists in the doctype with `is_enabled = 0`, the
response must still carry `open_jobs: 0`.

### 2. Install patch materialises the defaults as actual doctype rows

`setdefault` alone keeps the UX surprising: the admin opens the doctype in
Desk and sees no row for Open Jobs / My Jobs, so there is nothing obvious
to tick off. An install patch (`recruitment.patches.add_default_candidate_portal_nav_flags`,
registered in `patches.txt`) fixes this by appending the two rows with
`is_enabled = 1` on migrate, only when a row with the same `page_name`
does not already exist.

The patch is both idempotent and admin-respecting:
  * each row is appended only when no row with that `page_name` is present
    (case-insensitive match), so running the patch twice adds nothing;
  * an existing row (whatever its `is_enabled` value) is kept exactly as
    is, so an admin's "off" choice is preserved across every future
    `bench migrate`. This is the persistence guarantee: **off stays off
    until the admin ticks it back on.**

## Backend acceptance cases (added in cn-recruitment)

### `recruitment/api/test_candidate_feature_flags.py` (method)

1. **Open Jobs and My Jobs default-on.** Doctype has no row for either;
   method returns `open_jobs: 1`, `my_jobs: 1`.
2. **Admin can disable Open Jobs.** Doctype has a row with
   `page_name = "Open Jobs"` and `is_enabled = 0`; method returns
   `open_jobs: 0` and `my_jobs: 1`.
3. **Admin can disable My Jobs.** Symmetrical case.
4. **Admin can re-enable with an explicit row.** `is_enabled = 1` is
   honoured as 1.
5. **Other pages stay off until a row enables them.** `action_center`,
   `documents`, `candidate_dashboard` keys are absent until a row exists
   (the frontend's `false` default applies).
6. **Page name is snake-cased for the response key.** Existing behaviour
   preserved: `"Candidate Dashboard"` → `candidate_dashboard`.

### `recruitment/recruitment/tests/test_add_default_candidate_portal_nav_flags.py` (patch)

1. **Empty doctype gets both defaults.** Patch adds Open Jobs and My Jobs
   with `is_enabled = 1`.
2. **Admin's off choice persists through the patch.** A row with
   `is_enabled = 0` is left alone; the patch only adds the other missing
   default.
3. **Running the patch twice is a no-op.** Idempotent.
4. **An unrelated admin row (e.g. Action Center) is preserved.**
5. **Only the missing default is added.** Partial seeding when one of
   Open Jobs / My Jobs already exists.
6. **Case-insensitive match.** An existing `"open jobs"` row is
   recognised, so no duplicate row is inserted that would hide the
   admin's setting.

## Deploy order

1. Merge this backend change in cn-recruitment.
2. Roll it to the environment the portal talks to
   (`https://preciousalloys-uat.frappe.cloud` for UAT).
3. Merge the frontend PR `feat/portal-nav-feature-flag-driven` and deploy.
4. Admin sanity check at UAT: the two nav items show by default. Add a row
   for Open Jobs with `is_enabled = 0`; nav hides it on the next page load.

Rolling the frontend before the backend leaves Open Jobs and My Jobs hidden
until the admin adds the rows manually. Rolling the backend before the
frontend is harmless: the old frontend ignores the two extra keys.
