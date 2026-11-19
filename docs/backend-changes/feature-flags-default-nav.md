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

## Required change — install patch; the method stays untouched

The Candidate Portal Feature Flag doctype is the single source of truth.
`get_candidate_feature_flags` reports exactly what is stored and never
injects a default; a missing or deleted row therefore hides the page at the
frontend. Defaults for Open Jobs and My Jobs are materialised as real
doctype rows by an install patch, so admins see them in Desk and so the
admin's choice (off, or explicitly deleted) survives every future migrate
without being undone by a fallback in the method.

Patch module: `recruitment.patches.add_default_candidate_portal_nav_flags`,
registered in `recruitment/patches.txt`.

```python
# recruitment/patches/add_default_candidate_portal_nav_flags.py (shape only)
import frappe

DOCTYPE_NAME = "Candidate Portal Feature Flag"
DEFAULT_ROWS = (("Open Jobs", 1), ("My Jobs", 1))

def execute():
    if not frappe.db.exists("DocType", DOCTYPE_NAME):
        return
    doc = frappe.get_single(DOCTYPE_NAME)
    existing = {(r.page_name or "").strip().lower() for r in doc.feature_flags}
    changed = False
    for page_name, is_enabled in DEFAULT_ROWS:
        if page_name.strip().lower() in existing:
            continue
        doc.append("feature_flags", {"page_name": page_name, "is_enabled": is_enabled})
        changed = True
    if changed:
        doc.save(ignore_permissions=True)
```

The patch is idempotent and admin-respecting:
  * each row is appended only when no row with that `page_name` is present
    (case-insensitive match), so running the patch again adds nothing;
  * an existing row (whatever its `is_enabled` value) is kept exactly as
    is, so an admin's "off" choice is preserved across every future
    `bench migrate`;
  * `get_candidate_feature_flags` has no fallback that could re-enable a
    row the admin disabled or deleted. **Off stays off until the admin
    ticks it back on.**

## Backend acceptance cases (added in cn-recruitment)

### `recruitment/api/test_candidate_feature_flags.py` (method)

1. **Doctype rows are the only source of truth.** No rows → empty map;
   nothing is injected.
2. **Returns the doctype values as is.** Three rows reported verbatim as
   `{open_jobs, my_jobs, action_center}`.
3. **Admin off choice is reported as off.** A row with `is_enabled = 0`
   returns `0` (the migration-persistence case).
4. **Deleted row is absent from the response.** No safety net undoes an
   admin's deletion.
5. **Page name is snake-cased for the response key.** `"Candidate Dashboard"`
   → `candidate_dashboard`.
6. **Blank page name is skipped**, not emitted as an empty key.

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
