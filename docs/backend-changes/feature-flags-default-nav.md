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

## Required change

In the body of `get_candidate_feature_flags` (after the doctype rows are
collected into the response map, before it is returned), fill in the two
default-on keys only when the doctype has not already supplied them:

```python
# recruitment/api/candidate_portal.py (shape, not committed here)
@frappe.whitelist()
def get_candidate_feature_flags():
    _require_candidate_session()  # existing guard
    doc = frappe.get_cached_doc("Candidate Portal Feature Flag")
    flags = {
        _snake_case(row.page_name): 1 if row.is_enabled else 0
        for row in doc.feature_flags
    }
    # Default-on nav items: present without a doctype row means "shown".
    # A row with is_enabled = 0 overrides the default and hides the page.
    flags.setdefault("open_jobs", 1)
    flags.setdefault("my_jobs", 1)
    return flags
```

`setdefault` is load-bearing: it must not overwrite an explicit admin
setting. If `"Open Jobs"` exists in the doctype with `is_enabled = 0`, the
response must still carry `open_jobs: 0`.

## Backend acceptance cases (to add in cn-recruitment's spec)

1. **Open Jobs default-on.** Doctype has no row for Open Jobs; method
   returns `open_jobs: 1`.
2. **My Jobs default-on.** Same shape.
3. **Admin can disable.** Doctype has a row with `page_name = "Open Jobs"`
   and `is_enabled = 0`; method returns `open_jobs: 0`.
4. **Other pages stay off by default.** Doctype has no row for Action
   Center; method's return has no `action_center` key (frontend's default
   `false` applies).
5. **Session guard unchanged.** A guest caller still gets the existing
   `PermissionError` / 403, not a flags object.

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
