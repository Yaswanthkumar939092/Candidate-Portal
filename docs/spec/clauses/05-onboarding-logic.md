# SPEC-CAND-05: Onboarding page, context, validation and service

<a id="spec-cand-05"></a>

- Stable ID: `SPEC-CAND-05`
- Described at: repo `hybrowlabs/Candidate-Portal`, branch `develop`, commit `0d7fd6f6002cd2dff3c6b6716195cf051f5fad1c` (committer date `2026-10-31 17:27:47 +0000`)
- Also read at: branch `deploy/hybrowbase-candidate-20261025`, commit `786b53e406869986d5d5d0c81b7ae6b1605f8315`; differs: `app/(portal)/onboarding/page.tsx:205` writes the Back-to-Dashboard button's class list as `h-12 px-8 flex items-center gap-2` instead of `inline-flex h-12 items-center gap-2 px-8` (same classes, different order, no behaviour cited here changes), and `lib/types/onboarding.ts` has no `role` field on `OnboardingKeyContact` (the comment and the field at `lib/types/onboarding.ts:85-86` are absent there); `lib/contexts/onboarding-context.tsx`, `lib/onboarding-utils.ts`, `lib/validation/onboarding-validation.ts`, `lib/validation/onboarding-schemas.ts`, `lib/services/candidate-onboarding.ts`, `lib/services/link-field.ts`, `lib/services/uploadProofFile.ts` and the four hooks are identical there; no `pw-uat` branch exists in this repo (`git ls-remote --heads origin pw-uat` printed nothing on 2026-10-31); only `develop` is described
- Author: Frontend Developer (Yashwanth). Reviewer: Code Reviewer (Yashwanth), to be recorded in the PR.
- Status: DRAFT

## 1. Purpose

This clause describes the logic behind the onboarding wizard: the page at `/onboarding`, the context that holds the wizard's state, the helper that decides whether a field is shown or filled, the step validator, the Zod declaration schema, and the services and React Query hooks that read the form from the backend, save it and upload a proof file. Issue: PWHR-1366 (parent PWHR-1362). The wizard's own components (`components/onboarding/**`) are SPEC-CAND-06.

The flow, as coded:

1. `/onboarding` renders `OnboardingProvider` inside a `Suspense` boundary and then `OnboardingContent` (`app/(portal)/onboarding/page.tsx:376-388`).
2. The provider reads the signed-in e-mail from the auth context and asks `useOnboardingForm` for the whole form (`lib/contexts/onboarding-context.tsx:108-113`). That hook calls `recruitment.api.candidate_portal.get_candidate_portal_form` through `FrappeAPI.get` (`lib/services/candidate-onboarding.ts:15-17`).
3. The reply is a list of tabs, each with sections and fields. The provider turns it into `stepData` keyed by the lower-cased tab name, decides which tabs already count as complete, and sets the status (`lib/contexts/onboarding-context.tsx:139-201`).
4. The visible step comes from the `step` query value, from `goToStep`, `nextStep` or `prevStep`; every move pushes `/onboarding?step=N` (`lib/contexts/onboarding-context.tsx:214-223,248-275`).
5. Saving is `submitAll("save", stepKey, data)` and submitting is `submitAll("submit")`; both go through `useOnboardingSubmit` to `recruitment.api.employee_onboarding.update_onboarding_details` (`lib/contexts/onboarding-context.tsx:277-361`, `lib/services/candidate-onboarding.ts:26-45`).
6. The form step registers a submit trigger with the provider so the page's mobile "Save & Next" button can drive the form it does not own (`lib/contexts/onboarding-context.tsx:363-379`, `app/(portal)/onboarding/page.tsx:357-367`).

What the backend does with the submitted document (which DocType it writes, which approvals it runs, what `boarding_status` means) is in the `recruitment` app and is not described here.

## 2. Boundaries

- In: `app/(portal)/onboarding/page.tsx`, `lib/contexts/onboarding-context.tsx`, `lib/onboarding-utils.ts`, `lib/validation/onboarding-validation.ts`, `lib/validation/onboarding-schemas.ts`, `lib/types/onboarding.ts`, `lib/services/candidate-onboarding.ts`, `lib/services/link-field.ts`, `lib/services/uploadProofFile.ts`, `lib/hooks/useOnboardingForm.ts`, `lib/hooks/useOnboardingMutation.ts`, `lib/hooks/useLinkFieldOptions.ts`, `lib/hooks/useFileUpload.ts`.
- Out: every component under `components/onboarding/` and `components/shared/submitted-form-review.tsx` are SPEC-CAND-06; the page renders them and this clause only states which one it renders. The Frappe client (`FrappeAPI`, the proxy, the upload form fields) is SPEC-CAND-02; `fileUploadService`'s argument order is already SPEC-CAND-02 A1.9. The session and the `useAuth` hook the provider reads are SPEC-CAND-01. The dashboard query this clause invalidates is the lead's clause. The backend methods themselves are not read.
- Extension points: a new tab is data, not code: the backend adds a tab to the reply and the wizard renders it. A new per-field rule is a new branch in `validateOnboardingStep`. A component can take over the page's save button by calling `registerSubmitTrigger` (`lib/contexts/onboarding-context.tsx:365-372`).

## 3. Behaviour rules

### A1: Loading the form into wizard state

- A1.1: The provider keys `stepData` by the tab name, lower-cased with each run of whitespace replaced by one underscore (`lib/contexts/onboarding-context.tsx:143`). [CAND-05-A1.1A]
- A1.2: Each field is loaded as `value` when it is not `undefined`, else `default`; when both are `undefined` or `null` a `Table` field becomes `[]` and any other field becomes the empty string (`lib/contexts/onboarding-context.tsx:147-156`). [CAND-05-A1.1B]
- A1.3: `isLoading` stays true while the form query is loading and is cleared once, the first time the query settles, whether it returned a form or an error (`lib/contexts/onboarding-context.tsx:122-135,204-207`). [CAND-05-A1.1C] [CAND-05-A1.1D] [CAND-05-A1.1E]
- A1.4: The whole load runs once per provider: `initialLoadDone` is a ref, so a later change of `formConfig` does not reload `stepData` (`lib/contexts/onboarding-context.tsx:117,135,206`).
- A1.5: The status is `submitted` when the backend's `status` is exactly `Completed`, and `draft` for every other value including `Draft` and `Pending` (`lib/contexts/onboarding-context.tsx:163-164`). [CAND-05-A1.1F] [CAND-05-A1.1G] [CAND-05-A1.1H]
- A1.6: When the form is `Completed`, every tab key is put into `completedSteps` at once (`lib/contexts/onboarding-context.tsx:166-171`). [CAND-05-A1.1I]
- A1.7: Otherwise a tab counts as complete when it has at least one visible mandatory field and every one of them is filled, or when it has no visible mandatory field and at least one of its values is not `undefined`, `null` or the empty string (`lib/contexts/onboarding-context.tsx:178-199`). [CAND-05-A1.2A] [CAND-05-A1.2B]
- A1.8: "Mandatory" for that decision is `is_mandatory`, `reqd`, or a `mandatory_depends_on` that evaluates true; "visible" is not `hidden` and either no `depends_on` or a `depends_on` that evaluates true; both are evaluated against one document built by merging every tab's loaded values (`lib/contexts/onboarding-context.tsx:175-185`). [CAND-05-A1.2A]
- A1.9: `formConfig` is the query's data as it is, so it is `undefined` until the query resolves (`lib/contexts/onboarding-context.tsx:110,409`). [CAND-05-A1.1J] [CAND-05-A1.1K]
- A1.10: A throw inside the load is caught, logged as `Error initializing onboarding data:` and swallowed; `isLoading` is still cleared (`lib/contexts/onboarding-context.tsx:202-207`).
- A1.11: `isError` is the form query's `isError` (`lib/contexts/onboarding-context.tsx:399`). [CAND-05-A1.1D]

### A2: Which step is shown

- A2.1: The `step` query value is read with `parseInt(value, 10)` and applied only when it is not `NaN`, is at least 0 and is below `tabs.length + 1`; nothing happens before the form has arrived, because `totalSteps` is 0 until then (`lib/contexts/onboarding-context.tsx:119,214-223`). [CAND-05-A2.1A]
- A2.2: `goToStep(n)` moves and pushes `/onboarding?step=n` with `scroll: false` only when `n` is at least 0 and below `tabs.length + 1` (`lib/contexts/onboarding-context.tsx:249-257`). [CAND-05-A2.1B] [CAND-05-A2.2A]
- A2.3: `nextStep` moves on only while the current step is below `tabs.length`; `prevStep` moves back only while the current step is above 0; both push the new URL (`lib/contexts/onboarding-context.tsx:260-275`). [CAND-05-A2.2B] [CAND-05-A2.2C] [CAND-05-A2.2D]
- A2.4: The step starts at 0 (`lib/contexts/onboarding-context.tsx:97`). [CAND-05-A2.2E]

### A3: Editing, saving and submitting

- A3.1: `setStepData(key, data)` replaces that step's values wholesale and sets `isDirty`; `isDirty` is never cleared afterwards (`lib/contexts/onboarding-context.tsx:228-237`). [CAND-05-A3.1A] [CAND-05-A3.1B]
- A3.2: `submitAll("save", stepKey, data)` sends only that one step, with `data` replacing whatever was in state for it; any other call sends every step that holds at least one field (`lib/contexts/onboarding-context.tsx:287-328`). [CAND-05-A3.1C] [CAND-05-A3.1D]
- A3.3: The e-mail sent is `user.email`, else `user.user_metadata.email`, else the literal `unknown@example.com` (`lib/contexts/onboarding-context.tsx:284-285`). [CAND-05-A3.2B]
- A3.4: The payload is not filtered: the loop over `rejectedFields` collects the fieldnames whose `approval_status` is `Rejected` and nothing reads that set, and the copy loops copy every entry (`lib/contexts/onboarding-context.tsx:294-328`). [CAND-05-A3.2C] Issue: PWHR-1557.
- A3.5: After the mutation resolves, a `submit` sets the status to `submitted`, a toast says `Onboarding submitted successfully!` or `Progress saved successfully!`, and the `onboarding-form` and `dashboard` queries are invalidated for that e-mail (`lib/contexts/onboarding-context.tsx:336-354`). [CAND-05-A3.1E] [CAND-05-A3.1F] [CAND-05-A3.1G] [CAND-05-A3.1H]
- A3.6: When the mutation rejects, the error is logged, its message is shown in an error toast (or `Failed to <action> onboarding. Please try again.` when there is no message), the status is left alone, no query is invalidated, and the error is rethrown (`lib/contexts/onboarding-context.tsx:355-360`). [CAND-05-A3.2A]
- A3.7: `getFieldValue(name)` walks the steps in insertion order and returns the first value that is not `undefined`, so a field present in two steps is read from the earlier one (`lib/contexts/onboarding-context.tsx:381-391`). [CAND-05-A3.3A] [CAND-05-A3.3B] [CAND-05-A3.3C]
- A3.8: `markStepComplete(key)` adds a key to `completedSteps`; nothing removes one (`lib/contexts/onboarding-context.tsx:240-246`). [CAND-05-A3.4A]
- A3.9: `isSaving` is the mutation's `isPending` (`lib/contexts/onboarding-context.tsx:400`).

### A4: The submit trigger and the hooks

- A4.1: `registerSubmitTrigger(fn)` stores `fn` in a ref and returns an unregister function that clears the ref only when it is still `fn`; `triggerSubmit(action)` awaits the stored function or returns `false` when none is registered (`lib/contexts/onboarding-context.tsx:363-379`). [CAND-05-A4.1A]
- A4.2: `useOnboarding` throws `useOnboarding must be used within an OnboardingProvider` outside the provider; `useOptionalOnboarding` returns `undefined` there (`lib/contexts/onboarding-context.tsx:425-440`). [CAND-05-A4.2A]
- A4.3: The provider renders its children unconditionally, including while the form is still loading (`lib/contexts/onboarding-context.tsx:415-419`). [CAND-05-A4.2B]
- A4.4: `DEBOUNCE_MS` and `debounceTimerRef` are declared and never read; the comment at `lib/contexts/onboarding-context.tsx:225` says auto-save to `localStorage` is disabled (`lib/contexts/onboarding-context.tsx:19,116,225`).

### A5: depends_on and "is this field filled"

- A5.1: `evaluateDependsOn` returns true for an `undefined`, empty or whitespace-only expression, strips a leading `eval:`, reads a bare fieldname as `Boolean(doc[name])` and a `!fieldname` as its negation (`lib/onboarding-utils.ts:8-26`). [CAND-05-A5.1A] [CAND-05-A5.1D] [CAND-05-A5.1E]
- A5.2: Anything else is compiled with `new Function("doc", ...)` and run with the document; the generated body catches a throw and returns false, and a compile error is logged as `Error creating/evaluating depends_on function:` and returns false (`lib/onboarding-utils.ts:28-41`). [CAND-05-A5.1B] [CAND-05-A5.1C] [CAND-05-A5.1F] [CAND-05-A5.3A]
- A5.3: The result is always passed through `Boolean` (`lib/onboarding-utils.ts:32`). [CAND-05-A5.3A]
- A5.4: `isFieldFilled` on a `Table` field returns false unless the value is a non-empty array with at least one row that has a value in a visible child field, and every such row fills each of its visible mandatory child fields (`lib/onboarding-utils.ts:47-85`). [CAND-05-A5.2A] [CAND-05-A5.2B]
- A5.5: A row's visible and mandatory child fields are decided against that row, not against the whole document (`lib/onboarding-utils.ts:51-74`). [CAND-05-A5.2A]
- A5.6: A `Check` field is filled when its value is truthy; every other field is filled when its value is not `undefined` or `null` and its text form is not blank after trimming (`lib/onboarding-utils.ts:87-91`). [CAND-05-A5.2B]

### A6: Step validation

- A6.1: `validateOnboardingStep(tab, values, stepData)` builds one document from every step in `stepData` and then overlays `values`, and returns a map from fieldname to an error, a row map or an array of row maps (`lib/validation/onboarding-validation.ts:11,192-206,655`).
- A6.2: A field that is `hidden`, or whose `depends_on` evaluates false, is skipped entirely (`lib/validation/onboarding-validation.ts:219-222`). [CAND-05-A6.1B]
- A6.3: A missing mandatory non-`Table` field gives `<label> is required`; for a `Check` field the test is `Boolean(value)`, for every other field it is `undefined`, `null` or the empty string after trimming (`lib/validation/onboarding-validation.ts:476-498`). [CAND-05-A6.1B]
- A6.4: For a `Table` field, a row counts as empty when no visible child field holds a value; rows that are not empty, plus empty rows that still have a mandatory child field, are validated, and each missing mandatory child gives `<child label> is required` at that row's original index (`lib/validation/onboarding-validation.ts:278-299`). [CAND-05-A6.1A]
- A6.5: A mandatory table with no non-empty row gives `<label> is required` at the table; otherwise, when a validated row produced an error, the table carries `Please complete all required fields in <label>` (`lib/validation/onboarding-validation.ts:333-343`). [CAND-05-A6.1A]
- A6.6: `custom_family_details` must carry a row whose `relation` is `Spouse` when `custom_marital_status` is `married` in any case; the required option is taken from the `relation` child field's own option list, and the rule is skipped when that list has no spouse option (`lib/validation/onboarding-validation.ts:403-432`). [CAND-05-A6.2A] [CAND-05-A6.2B] [CAND-05-A6.2C] [CAND-05-A6.2D]
- A6.7: Inside `custom_family_details`, a `dob` on a row whose `relation` is not `child` must be at least 18 years before today, with the message `Family members other than children must be at least 18 years old` (`lib/validation/onboarding-validation.ts:313-330`). [CAND-05-A6.2E]
- A6.8: `custom_education_details` must hold a row for `10th`, `12th` and `Graduation`, plus `Post Graduation` when `custom_has_post_graduation_degree` is `yes` in any case; the message lists the missing levels (`lib/validation/onboarding-validation.ts:345-372`). [CAND-05-A6.3A] [CAND-05-A6.3B] [CAND-05-A6.3C] [CAND-05-A6.3D]
- A6.9: The education rows are then sorted by level and the first pair whose later level does not pass strictly after the earlier one gives `Year of passing for <level> must be after <level> (<year>)` (`lib/validation/onboarding-validation.ts:374-397`). [CAND-05-A6.3E]
- A6.10: `custom_nomination_details` must hold a row for every option of its `nomination_type` child field, and each type's percentages must total 100 within 0.001; the first failing type gives the message and the loop stops (`lib/validation/onboarding-validation.ts:437-474`). [CAND-05-A6.9E]
- A6.11: `custom_ifsc_code` must match four upper-case letters, the digit zero and six upper-case alphanumerics (`lib/validation/onboarding-validation.ts:598-611`). [CAND-05-A6.4A] [CAND-05-A6.4B] [CAND-05-A6.4C] [CAND-05-A6.4D] [CAND-05-A6.4E] [CAND-05-A6.4F]
- A6.12: A field counts as a phone field when its label or fieldname mentions mobile, phone, contact number, contact no, contactnumber or contact_number; its value must be exactly ten digits (`lib/validation/onboarding-validation.ts:244-253,513-523`). [CAND-05-A6.5A] [CAND-05-A6.5B] [CAND-05-A6.5C] [CAND-05-A6.5D]
- A6.13: A field counts as an e-mail field when its fieldtype is `email` or its label or fieldname contains `email`; its value must match `^[^\s@]+@[^\s@]+\.[^\s@]+$` (`lib/validation/onboarding-validation.ts:240-243,501-511`). [CAND-05-A6.6A] [CAND-05-A6.6B]
- A6.14: The same e-mail, phone, Aadhaar, PAN, postal-code, IFSC, account-holder, negative-number and percentage rules are applied to each filled visible child field of a table through `validateFieldPattern` (`lib/validation/onboarding-validation.ts:301-312,13-131`). [CAND-05-A6.6A] [CAND-05-A6.6B]
- A6.15: `custom_date_of_birth` and `dob` at the top level must be at least 18 years before today, with the message `You must be at least 18 years old` (`lib/validation/onboarding-validation.ts:626-641`). [CAND-05-A6.7A] [CAND-05-A6.7B] [CAND-05-A6.7C]
- A6.16: An `Int`, `Float`, `Currency` or `Percent` value below zero gives `<label> cannot be negative` (`lib/validation/onboarding-validation.ts:99-113`). [CAND-05-A6.8A] [CAND-05-A6.8B]
- A6.17: A field whose fieldname or label mentions percentage, or whose fieldtype is `Percent`, may not exceed 100: `<label> cannot be greater than 100` (`lib/validation/onboarding-validation.ts:115-128`). [CAND-05-A6.8C] [CAND-05-A6.8D]
- A6.18: `custom_aadhaar_number` is twelve digits, `custom_pan_number` is five letters, four digits and one letter in either case, `custom_permanent_postal_code` is six digits not starting with zero, and `custom_account_holder_name` is letters and spaces only (`lib/validation/onboarding-validation.ts:556-624`). [CAND-05-A6.9A]
- A6.19: `custom_emergency_contact_number` and `custom_mobile_number` may not be equal; each one reports its own message (`lib/validation/onboarding-validation.ts:525-554`). [CAND-05-A6.9B]
- A6.20: `custom_jf_employment` is skipped when `is_fresher` is truthy in the document, and otherwise the field and all its child fields are treated as mandatory whatever the backend sent (`lib/validation/onboarding-validation.ts:213-232`). [CAND-05-A6.9C]
- A6.21: `custom_communication_address_proof` is treated as mandatory unless `custom_same_as_permanent` is truthy in the document (`lib/validation/onboarding-validation.ts:233-235`). [CAND-05-A6.9D]
- A6.22: `reviewDeclarationSchema` accepts only `declaration_accepted: true`; `false` and a missing key both fail, with the message `You must accept the declaration to submit` (`lib/validation/onboarding-schemas.ts:15-19`). [CAND-05-A6.10A] [CAND-05-A6.10B] [CAND-05-A6.10C]
- A6.23: `ONBOARDING_STEPS` lists eight step keys and labels and is exported; no file outside `lib/validation/onboarding-schemas.ts` reads it (`lib/validation/onboarding-schemas.ts:3-12`; `git grep -l ONBOARDING_STEPS 0d7fd6f -- app lib components types` lists only that file).

### A7: The page

- A7.1: The page shows the spinner and `Loading your onboarding data...` while the context is loading and also whenever no form has arrived and no error was reported (`app/(portal)/onboarding/page.tsx:162-173`). [CAND-05-A7.1A] [CAND-05-A7.1D]
- A7.2: With `isError`, the page shows `Onboarding not yet started` and a button that invalidates the `dashboard` query and pushes `/dashboard` (`app/(portal)/onboarding/page.tsx:175-218`). [CAND-05-A7.1B] [CAND-05-A7.1D]
- A7.3: With the status `submitted` and at least one tab, the page renders the read-only `SubmittedFormReview` and nothing else; with the status `submitted` and no tab, it falls through to the wizard body and renders the review step (`app/(portal)/onboarding/page.tsx:224-235,250-252`). [CAND-05-A7.1C] [CAND-05-A7.1E]
- A7.4: The progress percentage is the backend's `filled + approved` over `total` when `total` is above zero, and otherwise the share of `tabs.length + 1` steps that are in `completedSteps` (`app/(portal)/onboarding/page.tsx:238-245`). [CAND-05-A7.2A]
- A7.5: While the current step is below the tab count the page renders `OnboardingFormStep` with the step key built from the tab name the same way the context builds it; at or past the tab count it renders `ReviewStep` (`app/(portal)/onboarding/page.tsx:253-266`). [CAND-05-A7.2B]
- A7.6: The autosave bar names the first section of the current tab, with a leading `section-` removed, underscores turned into spaces and each word capitalised, unless the scroll spy has set a section that belongs to the current tab (`app/(portal)/onboarding/page.tsx:22-35,85-88,268-276,314-319`). [CAND-05-A7.2C]
- A7.7: The mobile bar's `Previous` button is disabled on step 0 and while saving; its `Save & Next` button calls `triggerSubmit("save_continue")` and is disabled while saving (`app/(portal)/onboarding/page.tsx:344-367`). [CAND-05-A7.3A] [CAND-05-A7.3B]
- A7.8: The autosave bar says `Saving changes...` while `isSaving` and `All changes saved` otherwise (`app/(portal)/onboarding/page.tsx:55`). [CAND-05-A7.3B]
- A7.9: Two document-level listeners track the focused field: `focusin` stores the nearest `data-fieldname`, `focusout` clears it 50 ms later when the active element is no longer inside one (`app/(portal)/onboarding/page.tsx:91-113`).
- A7.10: A scroll listener on the window and on `#onboarding-form-container` picks the `[id^="section-"]` element nearest to 180 pixels from the top and names it in the autosave bar; it is re-registered whenever the active section or the step changes (`app/(portal)/onboarding/page.tsx:116-160`).
- A7.11: The sidebar, the right rail and the mobile bars are rendered only while the status is not `submitted` (`app/(portal)/onboarding/page.tsx:281,305,314,336,344`). [CAND-05-A7.1E]

### A8: The onboarding service

- A8.1: `getOnboardingForm` throws `User email is required` for an empty e-mail before any request, sends the e-mail as `job_applicant_id` to `recruitment.api.candidate_portal.get_candidate_portal_form`, and throws `Failed to fetch onboarding form` for a missing reply or any status other than `success` (`lib/services/candidate-onboarding.ts:12-23`). [CAND-05-A8.1A] [CAND-05-A8.1B] [CAND-05-A8.1D] [CAND-05-A8.1E] [CAND-05-A8.1F]
- A8.2: `transformOnboardingForm` renames `job_applicant` to `applicantId` and `boarding_status` to `status` and copies `tabs`, `field_status_counts`, `branding`, `joining`, `key_contacts`, `onboarding_journey` and `form_source`; `onboarding_name`, `pre_release_name` and the reply's own `status` are dropped (`lib/services/candidate-onboarding.ts:49-63`). [CAND-05-A8.1A] [CAND-05-A8.1C] [CAND-05-A8.1G]
- A8.3: `submitOnboarding` throws `User email is required` for an empty e-mail, posts to `recruitment.api.employee_onboarding.update_onboarding_details` and throws the reply's `message`, else `Submission failed`, when the reply is missing or its status is not `success` (`lib/services/candidate-onboarding.ts:26-45`). [CAND-05-A8.2C] [CAND-05-A8.2D] [CAND-05-A8.2E]
- A8.4: The posted document is flat: it starts with `boarding_status: "Pending"`, the e-mail as `custom_email`, today's date as `boarding_begins_on` and `notify_users_by_email: 1`, then every field of every step is copied in, so a later step overwrites an earlier step's field of the same name; an `undefined` value is skipped (`lib/services/candidate-onboarding.ts:75-89`). [CAND-05-A8.2A] [CAND-05-A8.2B]
- A8.5: When the document has no `date_of_joining`, it is set from `custom_date_of_joining`, else today (`lib/services/candidate-onboarding.ts:92-95`). [CAND-05-A8.2A] [CAND-05-A8.2B]
- A8.6: Today is `new Date().toISOString().split("T")[0]`, so it is the UTC date, not the browser's local date (`lib/services/candidate-onboarding.ts:65`). [CAND-05-A8.2A] Issue: PWHR-1558.
- A8.7: The request body is `{ email, data, action }` (`lib/services/candidate-onboarding.ts:97-101`). [CAND-05-A8.2A]
- A8.8: `boarding_status` is always sent as `Pending`, including for a `submit` (`lib/services/candidate-onboarding.ts:76`). [CAND-05-A8.2A]

### A9: Link field and file upload services

- A9.1: `getLinkFieldOptions` throws `Doctype is required` for an empty doctype, sends `doctype`, adds `search_text` only for a non-empty search text and `filters` as JSON only when filters are given, and returns the reply as it is; a missing reply or any status other than `success` throws `Failed to fetch link field options` (`lib/services/link-field.ts:17-41`). [CAND-05-A9.1A] [CAND-05-A9.1B] [CAND-05-A9.1C] [CAND-05-A9.1D] [CAND-05-A9.1E]
- A9.2: `fileUploadService.uploadFile` logs the whole `File` object to the console, calls `FrappeAPI.uploadFile(file, "", docName, doctype)`, and logs and rethrows a failure (`lib/services/uploadProofFile.ts:9-16`). [CAND-05-A9.2A] The argument-order defect is SPEC-CAND-02 A1.9 (PWHR-1513); the logging is PWHR-1559.
- A9.3: Neither service checks a file's type, its size or its name before the upload (`lib/services/uploadProofFile.ts:4-17`). Issue: PWHR-1560.

### A10: The React Query hooks

- A10.1: `useOnboardingForm(email)` caches under `["onboarding-form", { userEmail }]`, runs only for a non-empty e-mail and keeps the answer fresh for 60000 ms (`lib/hooks/useOnboardingForm.ts:5-10`). [CAND-05-A10.1A] [CAND-05-A10.1B] [CAND-05-A10.1C]
- A10.2: `useLinkFieldOptions(doctype, searchText, filters)` caches under `["link-field-options", { doctype, searchText, filters }]`, runs only for a non-empty doctype and keeps each answer fresh for 300000 ms; every distinct search text is its own request (`lib/hooks/useLinkFieldOptions.ts:5-10`). [CAND-05-A10.2A] [CAND-05-A10.2B] [CAND-05-A10.2C]
- A10.3: `useOnboardingSubmit` is a plain mutation over `submitOnboarding` with no `onSuccess`, no `onError` and no invalidation of its own (`lib/hooks/useOnboardingMutation.ts:8-18`). [CAND-05-A10.3A] [CAND-05-A10.3C]
- A10.4: `useFileUpload` is a mutation keyed `["uploadFile"]` that passes only the file to the service and logs `Error uploading file:` on failure, so the doctype and document name arguments of the service are never used from this hook (`lib/hooks/useFileUpload.ts:5-11`). [CAND-05-A10.3B] [CAND-05-A10.4A] [CAND-05-A10.4B]

## 4. Data and permissions

- The wizard holds whatever the backend's tabs define. The fieldnames this repo names in code are `custom_aadhaar_number`, `custom_pan_number`, `custom_permanent_postal_code`, `custom_ifsc_code`, `custom_account_holder_name`, `custom_mobile_number`, `custom_emergency_contact_number`, `custom_date_of_birth`, `dob`, `custom_marital_status`, `custom_family_details` with its `relation` and `dob` children, `custom_education_details` with `education_level` and `year_of_passing`, `custom_nomination_details` with `nomination_type` and `percentage`, `custom_has_post_graduation_degree`, `custom_jf_employment`, `is_fresher`, `custom_communication_address_proof`, `custom_same_as_permanent` and `custom_date_of_joining` (`lib/validation/onboarding-validation.ts:63-96,181-186,208-235,345-474,525-641`).
- Identity numbers (Aadhaar, PAN), a bank account holder name and IFSC code, dates of birth and family members' dates of birth are held in React state in the browser and posted to the backend in a JSON body (`lib/contexts/onboarding-context.tsx:98-100,330-334`, `lib/services/candidate-onboarding.ts:35`). Nothing in this clause writes any of them to `localStorage` or `sessionStorage` (`lib/contexts/onboarding-context.tsx:225`; `git grep -n "localStorage\|sessionStorage" 0d7fd6f -- lib/contexts/onboarding-context.tsx lib/onboarding-utils.ts lib/validation/onboarding-validation.ts lib/services/candidate-onboarding.ts lib/services/link-field.ts lib/services/uploadProofFile.ts "app/(portal)/onboarding/page.tsx"` prints nothing).
- The only identity the client sends is the signed-in e-mail; it is sent both as the lookup key and inside the document as `custom_email` (`lib/services/candidate-onboarding.ts:16,77`). Who may read or write that applicant's onboarding record is decided by the backend method and is not in this repo.
- The 18-year age rule and the Aadhaar, PAN and IFSC formats are rules the code applies to candidate data; the clause states the code's constants only. Statutory source: REQUIRED (supplier: HR Compliance). The spouse-declaration rule and the nomination totals are likewise code constants. Statutory source: REQUIRED (supplier: HR Compliance).
- No role or permission is evaluated in the files of this clause.

## 5. Errors and edge behaviour

- A failed form load leaves `isError` true and the page shows `Onboarding not yet started`, which is the same screen a candidate sees when the backend has no onboarding record for them (`lib/contexts/onboarding-context.tsx:399`, `app/(portal)/onboarding/page.tsx:175-190`).
- A failed save or submit shows a toast with the backend's message and rethrows, so the caller in `components/onboarding/` can keep the candidate on the step (`lib/contexts/onboarding-context.tsx:355-360`).
- A `depends_on` expression that does not compile is logged and treated as false, which hides the field; an expression that throws at run time is also false (`lib/onboarding-utils.ts:28-41`).
- `parseInt` makes `?step=1abc` mean step 1, because it stops at the first character that is not a digit (`lib/contexts/onboarding-context.tsx:218`).
- A `Table` value that is not an array is read as no rows, both in the validator and in `isFieldFilled` (`lib/validation/onboarding-validation.ts:262`, `lib/onboarding-utils.ts:48`).
- `setTableRootError` writes `root`, `type` and `message` onto the error array itself when one already exists, so a table can carry both row errors and a table-level message (`lib/validation/onboarding-validation.ts:163-179`).
- An education row whose level is not one of the four known levels, or whose year is not a number, is dropped before the ordering check (`lib/validation/onboarding-validation.ts:376-386`).
- `getFieldValue` returns `undefined` for a name no step holds (`lib/contexts/onboarding-context.tsx:388`).
- `triggerSubmit` resolves `false`, not an error, when no form has registered a trigger (`lib/contexts/onboarding-context.tsx:378`).

## 6. Configuration

- No environment variable is read in the files of this clause; the backend base URL comes from the Frappe client (SPEC-CAND-02). (`git grep -n "process.env" 0d7fd6f -- lib/contexts/onboarding-context.tsx lib/onboarding-utils.ts lib/validation/onboarding-validation.ts lib/validation/onboarding-schemas.ts lib/services/candidate-onboarding.ts lib/services/link-field.ts lib/services/uploadProofFile.ts lib/hooks/useOnboardingForm.ts lib/hooks/useOnboardingMutation.ts lib/hooks/useLinkFieldOptions.ts lib/hooks/useFileUpload.ts "app/(portal)/onboarding/page.tsx"` prints nothing.)
- The two backend method names are constants in the service (`lib/services/candidate-onboarding.ts:4-9`); the link-field method name is inline (`lib/services/link-field.ts:34`).
- Cache lifetimes: one minute for the form, five minutes for a link-field option list (`lib/hooks/useOnboardingForm.ts:9`, `lib/hooks/useLinkFieldOptions.ts:9`).
- `DEBOUNCE_MS` is 500 and is not read (`lib/contexts/onboarding-context.tsx:19`).
- The scroll-spy threshold is 180 pixels and the re-check delay is 100 ms; the blur delay is 50 ms (`app/(portal)/onboarding/page.tsx:102,121,151`).
- The required education levels, the post-graduation level, the family-details fieldname, the relation child fieldname and the spouse option are constants in the validator (`lib/validation/onboarding-validation.ts:181-186`).

## 7. Scheduled jobs, hooks and patches

None. There is no scheduler, no cron and no server-side hook in this clause. The only recurring work is browser-side: the two document focus listeners and the scroll listener on the onboarding page, both removed on unmount (`app/(portal)/onboarding/page.tsx:107-112,145-158`), and React Query's own refetching for the two queries, which is left at the library default (`lib/hooks/useOnboardingForm.ts:5-10`, `lib/hooks/useLinkFieldOptions.ts:5-10`).

## 8. Static security and performance observations

- Security: `evaluateDependsOn` compiles backend-supplied text with `new Function` and runs it in the page, so a `depends_on` or `mandatory_depends_on` string from the backend executes as JavaScript with access to everything the page can reach (`lib/onboarding-utils.ts:30-37`). Issue: PWHR-1561.
- Security: no field this clause handles is written to `localStorage` or `sessionStorage` (section 4).
- Security: the upload path performs no file-type, size or name check before sending the file (`lib/services/uploadProofFile.ts:4-17`, `lib/hooks/useFileUpload.ts:7`). Issue: PWHR-1560.
- Security: `fileUploadService.uploadFile` logs the whole `File` object with `console.log` on every upload (`lib/services/uploadProofFile.ts:9`). Issue: PWHR-1559.
- Security: `submitOnboarding` sends every field the wizard holds, including identity and bank fields and including fields the backend marked `Rejected`, in one JSON body (`lib/services/candidate-onboarding.ts:35,82-89`, `lib/contexts/onboarding-context.tsx:294-328`).
- Security: the filters a caller passes to `getLinkFieldOptions` are serialised with `JSON.stringify` and sent as a query parameter; the service does not restrict which doctype may be queried (`lib/services/link-field.ts:22-34`).
- Performance: the initial-completion pass walks every tab, section and field once and calls `evaluateDependsOn` up to twice per field, each call potentially compiling a new function (`lib/contexts/onboarding-context.tsx:178-194`, `lib/onboarding-utils.ts:30`). Nothing caches the compiled functions.
- Performance: `validateOnboardingStep` rebuilds the merged document and recompiles each `depends_on` on every call, and inside a table it recomputes the visible and mandatory child lists per row (`lib/validation/onboarding-validation.ts:201-206,263-277`).
- Performance: `submitAll` depends on `stepData`, `user`, `submitMutation`, `formConfig` and `queryClient`, so it is rebuilt on each change of any of them; the context value object itself is rebuilt on every render and is not memoised, so every consumer re-renders with the provider (`lib/contexts/onboarding-context.tsx:361,393-413`). Issue: PWHR-1562.
- Performance: the scroll handler reads `getBoundingClientRect` for every `[id^="section-"]` element on each scroll event, and its effect re-registers whenever the active section changes (`app/(portal)/onboarding/page.tsx:117-160`).
- Performance: each distinct link-field search text starts its own request; the hook itself does not debounce (`lib/hooks/useLinkFieldOptions.ts:6-7`).
- Performance: the form query is refetched by invalidation after every save, so a save of one step reloads the whole form (`lib/contexts/onboarding-context.tsx:347-349`).

## 9. Known gaps / open questions

- G1: `submitAll` collects the fieldnames whose `approval_status` is `Rejected` into `rejectedFields` and nothing ever reads that set; both copy loops copy every field, so the filtering the variable names suggest does not happen (`lib/contexts/onboarding-context.tsx:294-328`). Is a rejected field meant to be resent, or was the filter dropped? Issue: PWHR-1557.
- G2: `getToday` uses the UTC date, so a candidate saving late in the evening in a timezone ahead of UTC sends the next day's date as `boarding_begins_on` and, when no joining date is set, as `date_of_joining` (`lib/services/candidate-onboarding.ts:65,78,92-95`). Issue: PWHR-1558.
- G3: `fileUploadService.uploadFile` logs the whole `File` object on every upload (`lib/services/uploadProofFile.ts:9`). Issue: PWHR-1559.
- G4: No file-type or size check runs before an onboarding proof is uploaded (`lib/services/uploadProofFile.ts:4-17`). Issue: PWHR-1560.
- G5: `depends_on` text from the backend is compiled and executed with `new Function` (`lib/onboarding-utils.ts:30-37`). Whether the backend guarantees the content of that field is a backend question not read here. Issue: PWHR-1561.
- G6: The context value is a fresh object on every render, so every consumer of `useOnboarding` re-renders whenever the provider does (`lib/contexts/onboarding-context.tsx:393-413`). Issue: PWHR-1562.
- G7: `isDirty` is set by `setStepData` and never cleared, not even after a successful save (`lib/contexts/onboarding-context.tsx:234`). Nothing in the files of this clause reads it. Not filed: no observable effect here; SPEC-CAND-06 covers the components that might.
- G8: `DEBOUNCE_MS`, `debounceTimerRef` and the `approved`/`pushed_to_frappe` values of the status union are declared and never used (`lib/contexts/onboarding-context.tsx:19,104-106,116`). Not filed: dead code.
- G9: `ONBOARDING_STEPS` has no reader (A6.23). Not filed: dead code.
- G10: The onboarding page builds the step key with the same expression as the context (`app/(portal)/onboarding/page.tsx:260`, `lib/contexts/onboarding-context.tsx:143`); the two would have to be changed together. Not filed: duplication, no defect asserted.
- G11: `setTableRootError` mutates an array with named properties, so a table error can be both an array of row errors and an object with `message` (`lib/validation/onboarding-validation.ts:163-179`). Every consumer in `components/onboarding/` must handle both shapes. Not filed: SPEC-CAND-06 reads the consumers.
- G12: The 18-year rule, the Aadhaar, PAN and IFSC formats, the spouse declaration and the nomination totals are asserted by the code without a cited source. Statutory source: REQUIRED (supplier: HR Compliance).
- G13: Branch drift: `deploy/hybrowbase-candidate-20261025` differs in one class list on the onboarding page and in one optional type field (header). Not filed: no behaviour difference found in the cited lines.
- G14: Every case stubs `fetch`, the router, the services or the hooks; none talks to a real Frappe site. Hosted CI is UNVERIFIED.

## 10. Uncovered behaviour

- A1.4 (the load runs once per provider) and A1.10 (the caught-and-logged load error): no test drives a second `formConfig` or a throwing load. Not filed: no test written in this pass.
- A3.9 (`isSaving` mirrors the mutation's `isPending`): the existing context tests always mock `isPending: false`, so no test shows it true. Not filed.
- A4.4, A6.23 and the unused status values (G8, G9): dead code has no test. Not filed.
- A7.9 (the focus listeners) and A7.10 (the scroll spy): jsdom reports zero-sized rectangles for every element and fires no real scroll, so neither was characterized. Not filed: needs a browser.
- A7.11 for the right rail: the mapped and characterization page cases assert the sidebar and the mobile bars are absent when submitted; the rail is asserted absent only in CAND-05-A7.1E. Not filed.
- A6.14 for the Aadhaar, PAN, IFSC, postal-code and account-holder rules inside a table row: `validateFieldPattern` applies them there (`lib/validation/onboarding-validation.ts:301-312`), and only the phone and e-mail cases are tested (CAND-05-A6.6A, CAND-05-A6.6B). Not filed: same behaviour class.
- A6.1's third shape (a plain row map rather than an array) is produced only through `setNestedTableError` on an index of an array, so no case produces it alone. Not filed.
- The five tests in `tests/app/(portal)/onboarding/onboarding.test.tsx` are not mapped. The path itself is accepted: the selector check at `tools/check_spec_ts_links.mjs:175` matches `^(src|tests?)/[A-Za-z0-9_./()-]+\.test\.tsx?$`, whose character class holds the route-group parentheses, and SPEC-CAND-04 maps eleven cases to `tests/app/(portal)/dashboard/page.test.tsx` through it. The reason is that each behaviour those five assert is already pinned by a characterization case in `tests/spec/cand-05-onboarding-page.test.tsx`: the loading screen and the error screen by CAND-05-A7.1D, the not-started button by CAND-05-A7.1B, the form step and its step key by CAND-05-A7.2B, the review step by CAND-05-A7.1C and the read-only copy of a submitted form by CAND-05-A7.1E. A second link would need a second case ID, and this pass opens none. Not filed: no behaviour is uncovered.
- `tests/lib/services/uploadProofFile.test.ts::uploadFile calls FrappeAPI.uploadFile correctly` is already mapped by SPEC-CAND-02 A1.4B and is not mapped again here; only its sibling error test is mapped (CAND-05-A9.2A). Not filed: no duplicate mapping.

## 11. Acceptance cases

Every case is `Evidence: UNVERIFIED`. Cases that map an existing test only gained a `// Spec:` comment line above the `it(`; all other cases are characterization tests added by this change in `tests/spec/`.

<a id="cand-05-a1"></a>
### CAND-05-A1: Loading the form into wizard state

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A1.1A](05-onboarding-logic.md#cand-05-a1-1a) | Step keys and the loaded shape. | [`initializes step data from formConfig`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1B](05-onboarding-logic.md#cand-05-a1-1b) | Field value, default and placeholder. | [`populates field values from formConfig`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1C](05-onboarding-logic.md#cand-05-a1-1c) | Loading while the query loads. | [`stays loading while formConfig is loading`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1D](05-onboarding-logic.md#cand-05-a1-1d) | Loading stops on an error. | [`stops loading when formConfig errors`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1E](05-onboarding-logic.md#cand-05-a1-1e) | Loading stops on success. | [`is not loading after formConfig loads`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1F](05-onboarding-logic.md#cand-05-a1-1f) | Draft status. | [`status is draft when formConfig status is Draft`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1G](05-onboarding-logic.md#cand-05-a1-1g) | Pending is also draft. | [`status is draft when formConfig status is Pending`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1H](05-onboarding-logic.md#cand-05-a1-1h) | Completed is submitted. | [`status is submitted when formConfig status is Completed`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1I](05-onboarding-logic.md#cand-05-a1-1i) | Completed marks every tab. | [`marks all steps complete when status is Completed`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1J](05-onboarding-logic.md#cand-05-a1-1j) | formConfig is exposed. | [`exposes formConfig`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.1K](05-onboarding-logic.md#cand-05-a1-1k) | formConfig before the query resolves. | [`formConfig is undefined when not loaded`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A1.2A](05-onboarding-logic.md#cand-05-a1-2a) | A tab with filled mandatory fields starts complete. | [`marks a tab complete when every visible mandatory field already carries a value`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |
| [CAND-05-A1.2B](05-onboarding-logic.md#cand-05-a1-2b) | A tab with no mandatory field. | [`marks a tab without any mandatory field complete as soon as one of its fields is not empty`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |

<a id="cand-05-a1-1a"></a>
#### CAND-05-A1.1A: Step keys and the loaded shape

- Precondition: The form query returns two tabs, `Personal Info` and `Work Experience`.
- Action: Render the provider and read `stepData`.
- Expected result: `stepData` has the keys `personal_info` and `work_experience` `lib/contexts/onboarding-context.tsx:143`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::initializes step data from formConfig`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check the loaded values, the empty-string placeholder for a missing value or the `[]` placeholder for a table; CAND-05-A3.1C does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1b"></a>
#### CAND-05-A1.1B: Field value, default and placeholder

- Precondition: The first tab has a field with `value: 'Alice'` and one with `value: null` and `default: 'Doe'`.
- Action: Render the provider and read the first field.
- Expected result: `stepData.personal_info.first_name` is `Alice` `lib/contexts/onboarding-context.tsx:147-156`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::populates field values from formConfig`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check the `default` fallback, the `[]` placeholder for a `Table` field or the empty-string placeholder. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1c"></a>
#### CAND-05-A1.1C: Loading while the query loads

- Precondition: The form query reports `isLoading: true` with no data.
- Action: Render the provider.
- Expected result: `isLoading` is true `lib/contexts/onboarding-context.tsx:122-124`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::stays loading while formConfig is loading`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check that the load effect runs only once, nor what happens when the query later resolves. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1d"></a>
#### CAND-05-A1.1D: Loading stops on an error

- Precondition: The form query reports `isError: true` with no data.
- Action: Render the provider.
- Expected result: `isLoading` becomes false `lib/contexts/onboarding-context.tsx:127-133`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::stops loading when formConfig errors`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not read `isError` from the context value, and it does not check that `stepData` stays empty. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1e"></a>
#### CAND-05-A1.1E: Loading stops on success

- Precondition: The form query returns the two-tab form.
- Action: Render the provider.
- Expected result: `isLoading` becomes false `lib/contexts/onboarding-context.tsx:204-207`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::is not loading after formConfig loads`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check that a second settle of the query leaves the loaded data alone. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1f"></a>
#### CAND-05-A1.1F: Draft status

- Precondition: The form's `status` is `Draft`.
- Action: Render the provider.
- Expected result: The context status is `draft` `lib/contexts/onboarding-context.tsx:163-164`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::status is draft when formConfig status is Draft`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check the other status values of the union, which no load path sets. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1g"></a>
#### CAND-05-A1.1G: Pending is also draft

- Precondition: The form's `status` is `Pending`.
- Action: Render the provider.
- Expected result: The context status is `draft` `lib/contexts/onboarding-context.tsx:163`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::status is draft when formConfig status is Pending`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try an unknown status string, which the same comparison also maps to `draft`. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1h"></a>
#### CAND-05-A1.1H: Completed is submitted

- Precondition: The form's `status` is `Completed`.
- Action: Render the provider.
- Expected result: The context status is `submitted` `lib/contexts/onboarding-context.tsx:163-164`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::status is submitted when formConfig status is Completed`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check that the comparison is case-sensitive. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1i"></a>
#### CAND-05-A1.1I: Completed marks every tab

- Precondition: The form's `status` is `Completed` and it has two tabs.
- Action: Render the provider and read `completedSteps.size`.
- Expected result: The size is above zero `lib/contexts/onboarding-context.tsx:166-171`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::marks all steps complete when status is Completed`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It asserts only that the set is not empty, not that it holds exactly the two tab keys. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1j"></a>
#### CAND-05-A1.1J: formConfig is exposed

- Precondition: The form query returns the two-tab form.
- Action: Render the provider and read `formConfig.tabs.length`.
- Expected result: It is 2 `lib/contexts/onboarding-context.tsx:409`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::exposes formConfig`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check that `formConfig` is the query's object itself rather than a copy. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-1k"></a>
#### CAND-05-A1.1K: formConfig before the query resolves

- Precondition: The form query reports `isLoading: true` with `data: null`.
- Action: Render the provider and read `formConfig?.tabs.length ?? 0`.
- Expected result: It is 0 `lib/contexts/onboarding-context.tsx:110`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::formConfig is undefined when not loaded`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It cannot tell `undefined` from `null`, because the consumer coalesces both to 0. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a1-2a"></a>
#### CAND-05-A1.2A: A tab with filled mandatory fields starts complete

- Precondition: The form has two tabs, each with one mandatory field; the first field has a value and the second is empty.
- Action: Render the provider and read the sorted keys of `completedSteps`.
- Expected result: Only `personal_info` is in the set `lib/contexts/onboarding-context.tsx:178-199`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::marks a tab complete when every visible mandatory field already carries a value`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a `mandatory_depends_on` or a `depends_on` at this point; A1.8's evaluation is covered through CAND-05-A5.1B.
- Evidence: UNVERIFIED

<a id="cand-05-a1-2b"></a>
#### CAND-05-A1.2B: A tab with no mandatory field

- Precondition: The form has two tabs with no mandatory field; the first holds a non-empty value, the second an empty string.
- Action: Render the provider and read the sorted keys of `completedSteps`.
- Expected result: Only `optional_one` is in the set `lib/contexts/onboarding-context.tsx:195-198`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::marks a tab without any mandatory field complete as soon as one of its fields is not empty`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try a tab whose only value is the number zero, which the same test would treat as filled.
- Evidence: UNVERIFIED

<a id="cand-05-a2"></a>
### CAND-05-A2: Which step is shown

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A2.1A](05-onboarding-logic.md#cand-05-a2-1a) | The step query value. | [`takes the step query value when it is a whole number inside the range and ignores it otherwise`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |
| [CAND-05-A2.1B](05-onboarding-logic.md#cand-05-a2-1b) | goToStep stays inside the range. | [`refuses a goToStep outside zero and the tab count plus one, and pushes no URL for it`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |
| [CAND-05-A2.2A](05-onboarding-logic.md#cand-05-a2-2a) | goToStep pushes the URL. | [`goToStep navigates to specified step`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A2.2B](05-onboarding-logic.md#cand-05-a2-2b) | nextStep. | [`nextStep advances to next step`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A2.2C](05-onboarding-logic.md#cand-05-a2-2c) | prevStep. | [`prevStep goes back a step`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A2.2D](05-onboarding-logic.md#cand-05-a2-2d) | prevStep stops at zero. | [`prevStep does not go below 0`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A2.2E](05-onboarding-logic.md#cand-05-a2-2e) | The first step. | [`starts at step 0`](../../../tests/lib/contexts/onboarding-context.test.tsx) |

<a id="cand-05-a2-1a"></a>
#### CAND-05-A2.1A: The step query value

- Precondition: The form has two tabs, so three steps exist; the `step` query value is `2`, then `3`, then `abc`, then `1abc`.
- Action: Render the provider once per value.
- Expected result: The step is 2, 0, 0 and 1 `lib/contexts/onboarding-context.tsx:214-223`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::takes the step query value when it is a whole number inside the range and ignores it otherwise`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try a negative value or a value read before the form arrives.
- Evidence: UNVERIFIED

<a id="cand-05-a2-1b"></a>
#### CAND-05-A2.1B: goToStep stays inside the range

- Precondition: The form has two tabs, so steps 0 to 2 exist.
- Action: Call `goToStep(5)`, then `goToStep(-1)`, then `goToStep(2)`.
- Expected result: The first two change nothing and push no URL; the third moves to 2 and pushes `/onboarding?step=2` with `scroll: false` `lib/contexts/onboarding-context.tsx:249-257`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::refuses a goToStep outside zero and the tab count plus one, and pushes no URL for it`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive `goToStep` before the form has arrived, when `totalSteps` is still 0.
- Evidence: UNVERIFIED

<a id="cand-05-a2-2a"></a>
#### CAND-05-A2.2A: goToStep pushes the URL

- Precondition: The provider has loaded the two-tab form.
- Action: Click a button that calls `goToStep(1)`.
- Expected result: The step becomes 1 and the router was called with `/onboarding?step=1` and `{ scroll: false }` `lib/contexts/onboarding-context.tsx:251-253`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::goToStep navigates to specified step`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check the range guard; CAND-05-A2.1B does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a2-2b"></a>
#### CAND-05-A2.2B: nextStep

- Precondition: The provider has loaded the two-tab form and is on step 0.
- Action: Click a button that calls `nextStep`.
- Expected result: The step becomes 1 `lib/contexts/onboarding-context.tsx:260-266`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::nextStep advances to next step`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert the pushed URL, and it does not drive `nextStep` on the last step. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a2-2c"></a>
#### CAND-05-A2.2C: prevStep

- Precondition: The provider is on step 1 after one `nextStep`.
- Action: Click a button that calls `prevStep`.
- Expected result: The step becomes 0 `lib/contexts/onboarding-context.tsx:269-275`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::prevStep goes back a step`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert the pushed URL. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a2-2d"></a>
#### CAND-05-A2.2D: prevStep stops at zero

- Precondition: The provider is on step 0.
- Action: Click a button that calls `prevStep`.
- Expected result: The step stays 0 `lib/contexts/onboarding-context.tsx:270`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::prevStep does not go below 0`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert that no URL was pushed. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a2-2e"></a>
#### CAND-05-A2.2E: The first step

- Precondition: The form query returns the two-tab form and the `step` query value is absent.
- Action: Render the provider.
- Expected result: The step is 0 `lib/contexts/onboarding-context.tsx:97`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::starts at step 0`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check what happens when the query value is present; CAND-05-A2.1A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3"></a>
### CAND-05-A3: Editing, saving and submitting

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A3.1A](05-onboarding-logic.md#cand-05-a3-1a) | setStepData replaces a step. | [`updates step data`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A3.1B](05-onboarding-logic.md#cand-05-a3-1b) | setStepData marks the form dirty. | [`marks isDirty after setStepData`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A3.1C](05-onboarding-logic.md#cand-05-a3-1c) | A save without a step key sends everything. | [`sends every loaded step when no step key is given and keeps the empty string placeholders the loader wrote`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |
| [CAND-05-A3.1D](05-onboarding-logic.md#cand-05-a3-1d) | A save with a step key sends one step. | [`calls mutateAsync with only the active step data when saving progress`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A3.1E](05-onboarding-logic.md#cand-05-a3-1e) | Submit sends the e-mail and the action. | [`calls mutateAsync with step data, user email, and action`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A3.1F](05-onboarding-logic.md#cand-05-a3-1f) | Submit sets the status. | [`updates status to submitted after success`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A3.1G](05-onboarding-logic.md#cand-05-a3-1g) | Submit shows a toast. | [`shows success toast on submit`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A3.1H](05-onboarding-logic.md#cand-05-a3-1h) | Both queries are invalidated. | [`invalidates both onboarding-form and dashboard queries after success`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A3.2A](05-onboarding-logic.md#cand-05-a3-2a) | A failed save. | [`shows the mutation's message in an error toast, rethrows it and leaves the status on draft`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |
| [CAND-05-A3.2B](05-onboarding-logic.md#cand-05-a3-2b) | No e-mail on the session. | [`falls back to the literal unknown address when the signed-in user carries no e-mail`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |
| [CAND-05-A3.2C](05-onboarding-logic.md#cand-05-a3-2c) | A rejected field is still sent. | [`keeps a field whose approval_status is Rejected in the payload it sends`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |
| [CAND-05-A3.3A](05-onboarding-logic.md#cand-05-a3-3a) | An earlier step shadows a later one. | [`returns the value from the first step that holds the fieldname, so an earlier step shadows a later one`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |
| [CAND-05-A3.3B](05-onboarding-logic.md#cand-05-a3-3b) | getFieldValue reads a loaded value. | [`returns value from stepData`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A3.3C](05-onboarding-logic.md#cand-05-a3-3c) | getFieldValue for an unknown field. | [`returns undefined for unknown field`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A3.4A](05-onboarding-logic.md#cand-05-a3-4a) | markStepComplete adds a key. | [`adds step key to completedSteps`](../../../tests/lib/contexts/onboarding-context.test.tsx) |

<a id="cand-05-a3-1a"></a>
#### CAND-05-A3.1A: setStepData replaces a step

- Precondition: The provider has loaded the two-tab form.
- Action: Call `setStepData('personal_info', { first_name: 'Bob' })`.
- Expected result: That step's values are exactly `{ first_name: 'Bob' }` `lib/contexts/onboarding-context.tsx:230-233`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::updates step data`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show that the previous fields of that step are dropped, nor that other steps are untouched. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3-1b"></a>
#### CAND-05-A3.1B: setStepData marks the form dirty

- Precondition: The provider has loaded the two-tab form and `isDirty` is false.
- Action: Call `setStepData` once.
- Expected result: `isDirty` is true `lib/contexts/onboarding-context.tsx:234`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::marks isDirty after setStepData`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show that `isDirty` is never cleared again (G7). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3-1c"></a>
#### CAND-05-A3.1C: A save without a step key sends everything

- Precondition: The provider has loaded a form whose second tab's only field is empty.
- Action: Call `submitAll('save')`.
- Expected result: The mutation was called with both steps, the empty field included as the empty string, and the success toast says `Progress saved successfully!` `lib/contexts/onboarding-context.tsx:316-328,340-344`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::sends every loaded step when no step key is given and keeps the empty string placeholders the loader wrote`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a step whose value map is empty, which the `hasFields` guard would drop.
- Evidence: UNVERIFIED

<a id="cand-05-a3-1d"></a>
#### CAND-05-A3.1D: A save with a step key sends one step

- Precondition: The provider has loaded the two-tab form.
- Action: Call `submitAll('save', 'personal_info', { first_name: 'Charlie' })`.
- Expected result: The mutation was called with exactly `{ personal_info: { first_name: 'Charlie' } }`, the e-mail and the action `save` `lib/contexts/onboarding-context.tsx:309-315`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::calls mutateAsync with only the active step data when saving progress`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show that the other step's values are still held in state, nor that `updatedData` replaces rather than merges. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3-1e"></a>
#### CAND-05-A3.1E: Submit sends the e-mail and the action

- Precondition: The provider has loaded the two-tab form and the mutation resolves.
- Action: Call `submitAll('submit')`.
- Expected result: The mutation was called with `userEmail` and `action: 'submit'` `lib/contexts/onboarding-context.tsx:330-334`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::calls mutateAsync with step data, user email, and action`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It matches the call loosely, so it does not check the step payload; CAND-05-A3.1C does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3-1f"></a>
#### CAND-05-A3.1F: Submit sets the status

- Precondition: The provider has loaded the two-tab form and the mutation resolves.
- Action: Call `submitAll('submit')`.
- Expected result: The status becomes `submitted` `lib/contexts/onboarding-context.tsx:336-338`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::updates status to submitted after success`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show that a `save` leaves the status alone; CAND-05-A3.1C does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3-1g"></a>
#### CAND-05-A3.1G: Submit shows a toast

- Precondition: The provider has loaded the two-tab form and the mutation resolves.
- Action: Call `submitAll('submit')`.
- Expected result: A success toast says `Onboarding submitted successfully!` `lib/contexts/onboarding-context.tsx:340-344`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::shows success toast on submit`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check the save wording; CAND-05-A3.1C does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3-1h"></a>
#### CAND-05-A3.1H: Both queries are invalidated

- Precondition: The provider has loaded the two-tab form and the mutation resolves.
- Action: Call `submitAll('save', 'personal_info', { first_name: 'Charlie' })`.
- Expected result: The query client was asked to invalidate `['onboarding-form', { userEmail }]` and `['dashboard', { email }]` `lib/contexts/onboarding-context.tsx:346-354`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::invalidates both onboarding-form and dashboard queries after success`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check that nothing is invalidated when the mutation rejects; CAND-05-A3.2A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3-2a"></a>
#### CAND-05-A3.2A: A failed save

- Precondition: The mutation rejects with the message `Submission failed`.
- Action: Call `submitAll('submit')` and catch.
- Expected result: An error toast carries that message, no success toast is shown, no query is invalidated, the status stays `draft` and the error reached the caller `lib/contexts/onboarding-context.tsx:355-360`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::shows the mutation's message in an error toast, rethrows it and leaves the status on draft`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a rejection whose value is not an `Error`, which would show the `Failed to submit onboarding. Please try again.` wording.
- Evidence: UNVERIFIED

<a id="cand-05-a3-2b"></a>
#### CAND-05-A3.2B: No e-mail on the session

- Precondition: The auth context returns a user with no `email` and no `user_metadata.email`.
- Action: Call `submitAll('save', 'personal_info', { first_name: 'Test' })`.
- Expected result: The mutation and the invalidation both carry the literal `unknown@example.com` `lib/contexts/onboarding-context.tsx:284-285`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::falls back to the literal unknown address when the signed-in user carries no e-mail`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a `user` of `null`, nor the `user_metadata.email` branch.
- Evidence: UNVERIFIED

<a id="cand-05-a3-2c"></a>
#### CAND-05-A3.2C: A rejected field is still sent

- Precondition: The loaded form's only field carries `approval_status: 'Rejected'` and a value.
- Action: Call `submitAll('save')`.
- Expected result: The payload still holds that field with its value `lib/contexts/onboarding-context.tsx:294-328`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::keeps a field whose approval_status is Rejected in the payload it sends`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. Pins a suspected defect, not endorsed. Issue: PWHR-1557. Whether the backend ignores a resent rejected value was not read.
- Evidence: UNVERIFIED

<a id="cand-05-a3-3a"></a>
#### CAND-05-A3.3A: An earlier step shadows a later one

- Precondition: The loaded form holds `company` in the second tab only.
- Action: Read `getFieldValue('company')`, then put a `company` into the first step with `setStepData` and read it again.
- Expected result: The first read is the second tab's empty string and the second read is the first tab's value `lib/contexts/onboarding-context.tsx:381-391`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::returns the value from the first step that holds the fieldname, so an earlier step shadows a later one`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It relies on object insertion order, which is the order the loader wrote the keys in; it does not drive a step added later.
- Evidence: UNVERIFIED

<a id="cand-05-a3-3b"></a>
#### CAND-05-A3.3B: getFieldValue reads a loaded value

- Precondition: The provider has loaded a form whose first field is `Alice`.
- Action: Read `getFieldValue('first_name')`.
- Expected result: It is `Alice` `lib/contexts/onboarding-context.tsx:383-386`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::returns value from stepData`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a fieldname held in two steps; CAND-05-A3.3A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3-3c"></a>
#### CAND-05-A3.3C: getFieldValue for an unknown field

- Precondition: The provider has loaded the two-tab form.
- Action: Read `getFieldValue('nonexistent')`.
- Expected result: It is `undefined` `lib/contexts/onboarding-context.tsx:388`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::returns undefined for unknown field`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not distinguish an absent field from a field whose value is `undefined`. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a3-4a"></a>
#### CAND-05-A3.4A: markStepComplete adds a key

- Precondition: The provider has loaded a one-tab form whose mandatory field is empty, so no tab starts complete.
- Action: Call `markStepComplete('personal_info')`.
- Expected result: `completedSteps.size` is above zero `lib/contexts/onboarding-context.tsx:240-246`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::adds step key to completedSteps`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It asserts the size only, not the key, and it does not show that calling it twice adds one entry. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a4"></a>
### CAND-05-A4: The submit trigger and the context hooks

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A4.1A](05-onboarding-logic.md#cand-05-a4-1a) | Register, trigger, unregister. | [`returns false until a form registers a trigger, forwards the action to it, and returns false again after the form unregisters`](../../../tests/spec/cand-05-onboarding-context.test.tsx) |
| [CAND-05-A4.2A](05-onboarding-logic.md#cand-05-a4-2a) | useOnboarding outside the provider. | [`throws when used outside OnboardingProvider`](../../../tests/lib/contexts/onboarding-context.test.tsx) |
| [CAND-05-A4.2B](05-onboarding-logic.md#cand-05-a4-2b) | The provider renders its children. | [`renders children`](../../../tests/lib/contexts/onboarding-context.test.tsx) |

<a id="cand-05-a4-1a"></a>
#### CAND-05-A4.1A: Register, trigger, unregister

- Precondition: The provider is rendered with a consumer that can register a trigger, call it and unregister it.
- Action: Call `triggerSubmit('save_continue')` before registering, after registering and after unregistering.
- Expected result: The results are false, true and false, and the registered function received `save_continue` exactly once `lib/contexts/onboarding-context.tsx:363-379`
- Test: characterization: `tests/spec/cand-05-onboarding-context.test.tsx::returns false until a form registers a trigger, forwards the action to it, and returns false again after the form unregisters`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive two registrations, where the second replaces the first and the first unregister is a no-op.
- Evidence: UNVERIFIED

<a id="cand-05-a4-2a"></a>
#### CAND-05-A4.2A: useOnboarding outside the provider

- Precondition: A component calls `useOnboarding` with no provider above it.
- Action: Render that component.
- Expected result: It throws `useOnboarding must be used within an OnboardingProvider` `lib/contexts/onboarding-context.tsx:434-439`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::throws when used outside OnboardingProvider`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not cover `useOptionalOnboarding`, which returns `undefined` in the same place. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a4-2b"></a>
#### CAND-05-A4.2B: The provider renders its children

- Precondition: The form query is mocked to return the two-tab form.
- Action: Render the provider around a text node.
- Expected result: The text is in the document `lib/contexts/onboarding-context.tsx:415-419`
- Test: mapped: `tests/lib/contexts/onboarding-context.test.tsx::renders children`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show that the children also render while the form is still loading. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a5"></a>
### CAND-05-A5: depends_on and the filled test

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A5.1A](05-onboarding-logic.md#cand-05-a5-1a) | An empty expression. | [`should return true if expression is empty or undefined`](../../../tests/lib/utils/onboarding-utils.test.ts) |
| [CAND-05-A5.1B](05-onboarding-logic.md#cand-05-a5-1b) | An eval: expression. | [`should evaluate a simple eval expression`](../../../tests/lib/utils/onboarding-utils.test.ts) |
| [CAND-05-A5.1C](05-onboarding-logic.md#cand-05-a5-1c) | An expression without the prefix. | [`should evaluate expression without eval prefix`](../../../tests/lib/utils/onboarding-utils.test.ts) |
| [CAND-05-A5.1D](05-onboarding-logic.md#cand-05-a5-1d) | A negated fieldname. | [`should handle boolean/falsy evaluation`](../../../tests/lib/utils/onboarding-utils.test.ts) |
| [CAND-05-A5.1E](05-onboarding-logic.md#cand-05-a5-1e) | A bare fieldname. | [`should evaluate expression with simple fieldname`](../../../tests/lib/utils/onboarding-utils.test.ts) |
| [CAND-05-A5.1F](05-onboarding-logic.md#cand-05-a5-1f) | A broken expression. | [`should handle error cases gracefully by returning false`](../../../tests/lib/utils/onboarding-utils.test.ts) |
| [CAND-05-A5.2A](05-onboarding-logic.md#cand-05-a5-2a) | Hidden child fields are not required. | [`does not require table child fields that are hidden by their dependency`](../../../tests/lib/utils/onboarding-utils.test.ts) |
| [CAND-05-A5.2B](05-onboarding-logic.md#cand-05-a5-2b) | Check fields, trimming and empty tables. | [`treats a Check field as filled only when truthy, trims other values, and rejects an empty or invalid table`](../../../tests/spec/cand-05-onboarding-utils.test.ts) |
| [CAND-05-A5.3A](05-onboarding-logic.md#cand-05-a5-3a) | The expression is executed. | [`executes the depends_on text as JavaScript, so an expression with a side effect runs`](../../../tests/spec/cand-05-onboarding-utils.test.ts) |

<a id="cand-05-a5-1a"></a>
#### CAND-05-A5.1A: An empty expression

- Precondition: None.
- Action: Call `evaluateDependsOn` with `undefined` and with the empty string.
- Expected result: Both are true `lib/onboarding-utils.ts:8`
- Test: mapped: `tests/lib/utils/onboarding-utils.test.ts::should return true if expression is empty or undefined`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try a whitespace-only expression or the bare string `eval:`, which line 15 also treats as true. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a5-1b"></a>
#### CAND-05-A5.1B: An eval: expression

- Precondition: The document has `custom_has_passport: 'Yes'`.
- Action: Evaluate `eval:doc.custom_has_passport=='Yes'` and `eval:doc.custom_has_passport=='No'`.
- Expected result: They are true and false `lib/onboarding-utils.ts:11-13,28-37`
- Test: mapped: `tests/lib/utils/onboarding-utils.test.ts::should evaluate a simple eval expression`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show that the expression is compiled and run as JavaScript; CAND-05-A5.3A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a5-1c"></a>
#### CAND-05-A5.1C: An expression without the prefix

- Precondition: The document has `custom_has_passport: 'Yes'`.
- Action: Evaluate `doc.custom_has_passport=='Yes'` and `doc.custom_has_passport=='No'`.
- Expected result: They are true and false `lib/onboarding-utils.ts:28-37`
- Test: mapped: `tests/lib/utils/onboarding-utils.test.ts::should evaluate expression without eval prefix`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show that the two forms take the same path after the prefix is stripped. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a5-1d"></a>
#### CAND-05-A5.1D: A negated fieldname

- Precondition: The document has an empty `custom_passport_number`.
- Action: Evaluate `eval:!doc.custom_passport_number`.
- Expected result: It is true `lib/onboarding-utils.ts:23-26`
- Test: mapped: `tests/lib/utils/onboarding-utils.test.ts::should handle boolean/falsy evaluation`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. The expression carries a `doc.` prefix, so it takes the compiled path, not the `!fieldname` shortcut at lines 23 to 26. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a5-1e"></a>
#### CAND-05-A5.1E: A bare fieldname

- Precondition: The document has `custom_is_rehire: 1` and `custom_another_field: 0`.
- Action: Evaluate `custom_is_rehire`, `custom_another_field` and `non_existent_field`.
- Expected result: They are true, false and false `lib/onboarding-utils.ts:18-20`
- Test: mapped: `tests/lib/utils/onboarding-utils.test.ts::should evaluate expression with simple fieldname`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try the `!fieldname` form of the same shortcut. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a5-1f"></a>
#### CAND-05-A5.1F: A broken expression

- Precondition: The document is empty.
- Action: Evaluate `eval:doc.custom_has_passport===`.
- Expected result: It is false `lib/onboarding-utils.ts:38-41`
- Test: mapped: `tests/lib/utils/onboarding-utils.test.ts::should handle error cases gracefully by returning false`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert the logged message, and it does not separate a compile failure from a run-time throw; CAND-05-A5.3A pins the run-time case. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a5-2a"></a>
#### CAND-05-A5.2A: Hidden child fields are not required

- Precondition: An education table has two child fields, each shown only for certain education levels, and two rows that each fill the child field their level shows.
- Action: Call `isFieldFilled` with that field.
- Expected result: It is true `lib/onboarding-utils.ts:64-84`
- Test: mapped: `tests/lib/utils/onboarding-utils.test.ts::does not require table child fields that are hidden by their dependency`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive an empty row, a row missing a visible mandatory child, a non-array value, a `Check` field or a plain field; CAND-05-A5.2B does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a5-2b"></a>
#### CAND-05-A5.2B: Check fields, trimming and empty tables

- Precondition: A `Check` field, a `Data` field and a mandatory table with one child are built as synthetic configurations.
- Action: Call `isFieldFilled` for each with truthy, falsy, whitespace, zero, empty-array, non-array and incomplete-row documents.
- Expected result: The check is filled only when truthy, a whitespace value is not filled while the number zero is, and the table is not filled for `[]`, a non-array, an empty row or a row missing a mandatory child `lib/onboarding-utils.ts:47-91`
- Test: characterization: `tests/spec/cand-05-onboarding-utils.test.ts::treats a Check field as filled only when truthy, trims other values, and rejects an empty or invalid table`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a child field with a `mandatory_depends_on`, nor a hidden child field.
- Evidence: UNVERIFIED

<a id="cand-05-a5-3a"></a>
#### CAND-05-A5.3A: The expression is executed

- Precondition: A probe key on `globalThis` is unset.
- Action: Evaluate an expression that assigns the probe and returns true, then an expression that throws, then `eval:'text'` and `eval:0`.
- Expected result: The probe holds the assigned value, the throwing expression is false, and the results are coerced with `Boolean` `lib/onboarding-utils.ts:30-37`
- Test: characterization: `tests/spec/cand-05-onboarding-utils.test.ts::executes the depends_on text as JavaScript, so an expression with a side effect runs`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It pins a suspected risk, not endorsed. Issue: PWHR-1561. It does not show where the expression text comes from, which is a backend fact not read. The probe key is removed after the test.
- Evidence: UNVERIFIED

<a id="cand-05-a6"></a>
### CAND-05-A6: Step validation

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A6.1A](05-onboarding-logic.md#cand-05-a6-1a) | Required child fields in a table row. | [`returns nested errors for required child fields in rendered table rows`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.1B](05-onboarding-logic.md#cand-05-a6-1b) | Hidden, dependent and Check fields. | [`skips hidden fields and fields whose depends_on is false, and treats an unticked mandatory Check as missing`](../../../tests/spec/cand-05-validation.test.ts) |
| [CAND-05-A6.2A](05-onboarding-logic.md#cand-05-a6-2a) | A married candidate must list a spouse. | [`requires a Spouse row in family details when marital status is Married`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.2B](05-onboarding-logic.md#cand-05-a6-2b) | A spouse row satisfies the rule. | [`accepts family details with a Spouse row when marital status is Married`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.2C](05-onboarding-logic.md#cand-05-a6-2c) | An incomplete spouse row still fails. | [`still flags an incomplete Spouse row when marital status is Married`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.2D](05-onboarding-logic.md#cand-05-a6-2d) | An unmarried candidate needs no spouse. | [`does not require a Spouse row when marital status is Unmarried`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.2E](05-onboarding-logic.md#cand-05-a6-2e) | The family age rule spares children. | [`allows an under-18 DOB only when the family relation is Child`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.3A](05-onboarding-logic.md#cand-05-a6-3a) | The three required education levels. | [`requires 10th, 12th, and Graduation education details before continuing`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.3B](05-onboarding-logic.md#cand-05-a6-3b) | An empty education table. | [`requires education details even when the education table is empty`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.3C](05-onboarding-logic.md#cand-05-a6-3c) | Post graduation when the answer is Yes. | [`requires post graduation details when the candidate selects Yes`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.3D](05-onboarding-logic.md#cand-05-a6-3d) | Post graduation when the answer is No. | [`allows education details without post graduation when the candidate selects No`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.3E](05-onboarding-logic.md#cand-05-a6-3e) | Years of passing must rise. | [`reports the first education level whose year of passing is not later than the level below it`](../../../tests/spec/cand-05-validation.test.ts) |
| [CAND-05-A6.4A](05-onboarding-logic.md#cand-05-a6-4a) | A valid IFSC code. | [`accepts valid uppercase alphanumeric IFSC code matching BARB0ALPHAA`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.4B](05-onboarding-logic.md#cand-05-a6-4b) | A lower-case IFSC code. | [`rejects lowercase IFSC code`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.4C](05-onboarding-logic.md#cand-05-a6-4c) | A non-alphanumeric branch code. | [`rejects non-alphanumeric branch code`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.4D](05-onboarding-logic.md#cand-05-a6-4d) | A digit in the bank code. | [`rejects non-alphabetic bank code`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.4E](05-onboarding-logic.md#cand-05-a6-4e) | The fifth character must be zero. | [`rejects non-zero fifth character`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.4F](05-onboarding-logic.md#cand-05-a6-4f) | The length must be eleven. | [`rejects length different from 11 characters`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.5A](05-onboarding-logic.md#cand-05-a6-5a) | A valid phone number. | [`accepts valid 10-digit numeric phone number`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.5B](05-onboarding-logic.md#cand-05-a6-5b) | A phone number with a letter. | [`rejects non-numeric phone number`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.5C](05-onboarding-logic.md#cand-05-a6-5c) | A short phone number. | [`rejects shorter phone number`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.5D](05-onboarding-logic.md#cand-05-a6-5d) | A long phone number. | [`rejects longer phone number`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.6A](05-onboarding-logic.md#cand-05-a6-6a) | A valid phone and e-mail in a row. | [`accepts valid phone and email in table row`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.6B](05-onboarding-logic.md#cand-05-a6-6b) | A bad phone and e-mail in a row. | [`rejects invalid pattern in table row child fields`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.7A](05-onboarding-logic.md#cand-05-a6-7a) | A date of birth at or above eighteen. | [`accepts dob representing age >= 18`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.7B](05-onboarding-logic.md#cand-05-a6-7b) | A date of birth below eighteen. | [`rejects dob representing age < 18`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.7C](05-onboarding-logic.md#cand-05-a6-7c) | The age rule inside the family table. | [`does not apply the age rule to a DOB in Family Details`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.8A](05-onboarding-logic.md#cand-05-a6-8a) | Zero and positive numbers. | [`accepts zero or positive values`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.8B](05-onboarding-logic.md#cand-05-a6-8b) | Negative numbers. | [`rejects negative values`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.8C](05-onboarding-logic.md#cand-05-a6-8c) | A percentage at or below one hundred. | [`accepts values <= 100`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.8D](05-onboarding-logic.md#cand-05-a6-8d) | A percentage above one hundred. | [`rejects values > 100`](../../../tests/lib/validation/onboarding-validation.test.ts) |
| [CAND-05-A6.9A](05-onboarding-logic.md#cand-05-a6-9a) | Identity and bank formats by fieldname. | [`rejects a bad Aadhaar number, PAN, permanent postal code and account holder name by fieldname alone`](../../../tests/spec/cand-05-validation.test.ts) |
| [CAND-05-A6.9B](05-onboarding-logic.md#cand-05-a6-9b) | Mobile and emergency numbers must differ. | [`refuses an emergency contact number equal to the mobile number, on both fields`](../../../tests/spec/cand-05-validation.test.ts) |
| [CAND-05-A6.9C](05-onboarding-logic.md#cand-05-a6-9c) | The employment table and is_fresher. | [`skips the employment table when is_fresher is set and otherwise forces it and its children to be mandatory`](../../../tests/spec/cand-05-validation.test.ts) |
| [CAND-05-A6.9D](05-onboarding-logic.md#cand-05-a6-9d) | The communication address proof. | [`requires the communication address proof unless custom_same_as_permanent is set`](../../../tests/spec/cand-05-validation.test.ts) |
| [CAND-05-A6.9E](05-onboarding-logic.md#cand-05-a6-9e) | Nomination types and totals. | [`asks for every nomination type in the options list and for a per-type total of exactly 100 percent`](../../../tests/spec/cand-05-validation.test.ts) |
| [CAND-05-A6.10A](05-onboarding-logic.md#cand-05-a6-10a) | The declaration must be accepted. | [`fails without accepting declaration`](../../../tests/lib/validation/onboarding-schemas.test.ts) |
| [CAND-05-A6.10B](05-onboarding-logic.md#cand-05-a6-10b) | An accepted declaration. | [`passes when declaration accepted`](../../../tests/lib/validation/onboarding-schemas.test.ts) |
| [CAND-05-A6.10C](05-onboarding-logic.md#cand-05-a6-10c) | A missing declaration. | [`fails when declaration_accepted is missing`](../../../tests/lib/validation/onboarding-schemas.test.ts) |

<a id="cand-05-a6-1a"></a>
#### CAND-05-A6.1A: Required child fields in a table row

- Precondition: A table whose two child fields are `reqd` holds one row with both empty.
- Action: Call `validateOnboardingStep` for that tab.
- Expected result: Row 0 carries `Education Level is required` and `City is required`, and the table carries `Please complete all required fields in Education Details` `lib/validation/onboarding-validation.ts:290-299,338-343`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::returns nested errors for required child fields in rendered table rows`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a mandatory table with no row, which gives the `is required` message of the table itself instead. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-1b"></a>
#### CAND-05-A6.1B: Hidden, dependent and Check fields

- Precondition: A tab holds a hidden mandatory field, a mandatory field whose `depends_on` is false, a mandatory `Check` and a field whose `mandatory_depends_on` is true.
- Action: Call `validateOnboardingStep` with every value empty, then with the check ticked and the conditional field filled.
- Expected result: The hidden and dependent fields give no error, the unticked check and the conditionally mandatory field each give the `is required` message for their label, and both clear once filled `lib/validation/onboarding-validation.ts:219-222,476-498`
- Test: characterization: `tests/spec/cand-05-validation.test.ts::skips hidden fields and fields whose depends_on is false, and treats an unticked mandatory Check as missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a `read_only` field, which the validator does not treat specially.
- Evidence: UNVERIFIED

<a id="cand-05-a6-2a"></a>
#### CAND-05-A6.2A: A married candidate must list a spouse

- Precondition: `custom_marital_status` is `Married` in another step and the family table holds only a father row.
- Action: Call `validateOnboardingStep` for the family tab.
- Expected result: The table carries `Your marital status is Married, so Family Details must include a row with relation "Spouse"` `lib/validation/onboarding-validation.ts:403-432`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::requires a Spouse row in family details when marital status is Married`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a `relation` child field whose option list has no spouse option, where the rule is skipped. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-2b"></a>
#### CAND-05-A6.2B: A spouse row satisfies the rule

- Precondition: `custom_marital_status` is `Married` and the family table holds a father row and a spouse row.
- Action: Call `validateOnboardingStep` for the family tab.
- Expected result: The table carries no error `lib/validation/onboarding-validation.ts:419-431`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::accepts family details with a Spouse row when marital status is Married`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try a differently cased `spouse` value, which the comparison also accepts. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-2c"></a>
#### CAND-05-A6.2C: An incomplete spouse row still fails

- Precondition: `custom_marital_status` is `Married` and the only row is a spouse with an empty name.
- Action: Call `validateOnboardingStep` for the family tab.
- Expected result: Row 0 carries `Name is required` `lib/validation/onboarding-validation.ts:290-299`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::still flags an incomplete Spouse row when marital status is Married`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert the table-level message that the same call also writes. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-2d"></a>
#### CAND-05-A6.2D: An unmarried candidate needs no spouse

- Precondition: `custom_marital_status` is `Unmarried` and the family table holds only a father row.
- Action: Call `validateOnboardingStep` for the family tab.
- Expected result: The table carries no error `lib/validation/onboarding-validation.ts:404-408`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::does not require a Spouse row when marital status is Unmarried`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try a missing marital status, which the same comparison also treats as not married. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-2e"></a>
#### CAND-05-A6.2E: The family age rule spares children

- Precondition: The family table holds a father row and a child row, each with a date of birth ten years ago.
- Action: Call `validateOnboardingStep` for the family tab twice.
- Expected result: The father's `dob` carries `Family members other than children must be at least 18 years old` and the child's row carries no error `lib/validation/onboarding-validation.ts:313-330`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::allows an under-18 DOB only when the family relation is Child`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not verify statutory correctness. Statutory source: REQUIRED (supplier: HR Compliance). It does not drive a row with no relation. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-3a"></a>
#### CAND-05-A6.3A: The three required education levels

- Precondition: The education table holds only a `10th` row and the post-graduation answer is `No`.
- Action: Call `validateOnboardingStep` for the education tab.
- Expected result: The table carries `Please add education details for: 12th, Graduation` `lib/validation/onboarding-validation.ts:345-372`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::requires 10th, 12th, and Graduation education details before continuing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a row whose level is not one of the four known values. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-3b"></a>
#### CAND-05-A6.3B: An empty education table

- Precondition: The education table is `[]` and the post-graduation answer is `No`.
- Action: Call `validateOnboardingStep` for the education tab.
- Expected result: The table carries `Please add education details for: 10th, 12th, Graduation` `lib/validation/onboarding-validation.ts:353-372`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::requires education details even when the education table is empty`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. The table in the fixture is not mandatory, so it does not also show the `is required` message of a mandatory empty table. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-3c"></a>
#### CAND-05-A6.3C: Post graduation when the answer is Yes

- Precondition: The education table holds `10th`, `12th` and `Graduation` rows and the post-graduation answer is `Yes`.
- Action: Call `validateOnboardingStep` for the education tab.
- Expected result: The table carries `Please add education details for: Post Graduation` `lib/validation/onboarding-validation.ts:360-372`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::requires post graduation details when the candidate selects Yes`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try a differently cased `yes`, which `isYes` also accepts. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-3d"></a>
#### CAND-05-A6.3D: Post graduation when the answer is No

- Precondition: The education table holds `10th`, `12th` and `Graduation` rows with rising years and the post-graduation answer is `No`.
- Action: Call `validateOnboardingStep` for the education tab.
- Expected result: The table carries no error `lib/validation/onboarding-validation.ts:360-366`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::allows education details without post graduation when the candidate selects No`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not isolate the ordering rule, which the same rows also satisfy; CAND-05-A6.3E does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-3e"></a>
#### CAND-05-A6.3E: Years of passing must rise

- Precondition: The education table holds rows whose years fall, then rows whose years are equal, then rows whose years rise.
- Action: Call `validateOnboardingStep` for the education tab once per set.
- Expected result: The first two carry `Year of passing for 12th must be after 10th (2020)` and the third carries no error `lib/validation/onboarding-validation.ts:374-397`
- Test: characterization: `tests/spec/cand-05-validation.test.ts::reports the first education level whose year of passing is not later than the level below it`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a row whose year is not a number, which is dropped before the check.
- Evidence: UNVERIFIED

<a id="cand-05-a6-4a"></a>
#### CAND-05-A6.4A: A valid IFSC code

- Precondition: A tab holds the field `custom_ifsc_code`.
- Action: Validate the value `SBIN0123456`.
- Expected result: No error is reported `lib/validation/onboarding-validation.ts:598-611`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::accepts valid uppercase alphanumeric IFSC code matching BARB0ALPHAA`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not verify statutory or banking correctness. Statutory source: REQUIRED (supplier: HR Compliance). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-4b"></a>
#### CAND-05-A6.4B: A lower-case IFSC code

- Precondition: A tab holds the field `custom_ifsc_code`.
- Action: Validate the value `sbin0123456`.
- Expected result: The error message contains `valid 11-character IFSC code` `lib/validation/onboarding-validation.ts:598-611`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects lowercase IFSC code`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not verify statutory or banking correctness. Statutory source: REQUIRED (supplier: HR Compliance). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-4c"></a>
#### CAND-05-A6.4C: A non-alphanumeric branch code

- Precondition: A tab holds the field `custom_ifsc_code`.
- Action: Validate the value `SBIN012345-`.
- Expected result: An error is reported `lib/validation/onboarding-validation.ts:598-611`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects non-alphanumeric branch code`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It asserts only that an error exists, not its message. It does not verify statutory or banking correctness. Statutory source: REQUIRED (supplier: HR Compliance). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-4d"></a>
#### CAND-05-A6.4D: A digit in the bank code

- Precondition: A tab holds the field `custom_ifsc_code`.
- Action: Validate the value `SB1N0123456`.
- Expected result: An error is reported `lib/validation/onboarding-validation.ts:598-611`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects non-alphabetic bank code`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It asserts only that an error exists, not its message. It does not verify statutory or banking correctness. Statutory source: REQUIRED (supplier: HR Compliance). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-4e"></a>
#### CAND-05-A6.4E: The fifth character must be zero

- Precondition: A tab holds the field `custom_ifsc_code`.
- Action: Validate the value `SBINA123456`.
- Expected result: An error is reported `lib/validation/onboarding-validation.ts:598-611`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects non-zero fifth character`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It asserts only that an error exists, not its message. It does not verify statutory or banking correctness. Statutory source: REQUIRED (supplier: HR Compliance). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-4f"></a>
#### CAND-05-A6.4F: The length must be eleven

- Precondition: A tab holds the field `custom_ifsc_code`.
- Action: Validate the value `SBIN012345`.
- Expected result: An error is reported `lib/validation/onboarding-validation.ts:598-611`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects length different from 11 characters`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It asserts only that an error exists, not its message, and it does not try a longer value. It does not verify statutory or banking correctness. Statutory source: REQUIRED (supplier: HR Compliance). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-5a"></a>
#### CAND-05-A6.5A: A valid phone number

- Precondition: A tab holds the field `reporting_manager_contact_number`.
- Action: Validate the value `9876543210`.
- Expected result: No error is reported `lib/validation/onboarding-validation.ts:244-253,513-523`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::accepts valid 10-digit numeric phone number`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show which of the nine name and label tests made the field a phone field. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-5b"></a>
#### CAND-05-A6.5B: A phone number with a letter

- Precondition: A tab holds the field `reporting_manager_contact_number`.
- Action: Validate the value `987654321a`.
- Expected result: The error message contains `valid 10-digit mobile number` `lib/validation/onboarding-validation.ts:513-523`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects non-numeric phone number`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try a value with a country prefix or spaces. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-5c"></a>
#### CAND-05-A6.5C: A short phone number

- Precondition: A tab holds the field `reporting_manager_contact_number`.
- Action: Validate the value `987654321`.
- Expected result: An error is reported `lib/validation/onboarding-validation.ts:513-523`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects shorter phone number`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It asserts only that an error exists, not its message. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-5d"></a>
#### CAND-05-A6.5D: A long phone number

- Precondition: A tab holds the field `reporting_manager_contact_number`.
- Action: Validate the value `98765432101`.
- Expected result: An error is reported `lib/validation/onboarding-validation.ts:513-523`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects longer phone number`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It asserts only that an error exists, not its message. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-6a"></a>
#### CAND-05-A6.6A: A valid phone and e-mail in a row

- Precondition: A table of key contacts holds a row with a ten-digit number and an e-mail address.
- Action: Call `validateOnboardingStep` for that tab.
- Expected result: The table carries no error `lib/validation/onboarding-validation.ts:301-312`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::accepts valid phone and email in table row`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. The e-mail in the fixture is not a `*@example.invalid` address; the assertion does not depend on the domain. It does not drive the Aadhaar, PAN, IFSC or postal-code rules inside a row, which the same helper also applies (section 10). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-6b"></a>
#### CAND-05-A6.6B: A bad phone and e-mail in a row

- Precondition: A table of key contacts holds a row with the number `12345` and the text `invalid-email`.
- Action: Call `validateOnboardingStep` for that tab.
- Expected result: Row 0 carries a message containing `10-digit mobile number` and one containing `valid email address` `lib/validation/onboarding-validation.ts:301-312,13-61`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects invalid pattern in table row child fields`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive the other per-fieldname rules inside a row (section 10). Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-7a"></a>
#### CAND-05-A6.7A: A date of birth at or above eighteen

- Precondition: A tab holds a `dob` field.
- Action: Validate a date nineteen years before today.
- Expected result: No error is reported `lib/validation/onboarding-validation.ts:626-641`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::accepts dob representing age >= 18`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not verify statutory correctness. Statutory source: REQUIRED (supplier: HR Compliance). It does not try the exact eighteenth birthday. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-7b"></a>
#### CAND-05-A6.7B: A date of birth below eighteen

- Precondition: A tab holds a `dob` field.
- Action: Validate a date seventeen years before today.
- Expected result: The message contains `at least 18 years old` `lib/validation/onboarding-validation.ts:626-641`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects dob representing age < 18`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not verify statutory correctness. Statutory source: REQUIRED (supplier: HR Compliance). It does not cover `custom_date_of_birth`, which the same branch handles. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-7c"></a>
#### CAND-05-A6.7C: The age rule inside the family table

- Precondition: The family table holds a child row whose date of birth is ten years ago.
- Action: Call `validateOnboardingStep` for that tab.
- Expected result: The table carries no error `lib/validation/onboarding-validation.ts:313-330`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::does not apply the age rule to a DOB in Family Details`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not verify statutory correctness. Statutory source: REQUIRED (supplier: HR Compliance). The non-child case is CAND-05-A6.2E. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-8a"></a>
#### CAND-05-A6.8A: Zero and positive numbers

- Precondition: A tab holds a `Currency` and an `Int` field.
- Action: Validate the values `150000` and `3`.
- Expected result: No error is reported for either `lib/validation/onboarding-validation.ts:99-113`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::accepts zero or positive values`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. Despite its title it does not try the value zero. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-8b"></a>
#### CAND-05-A6.8B: Negative numbers

- Precondition: A tab holds a `Currency` and an `Int` field.
- Action: Validate the values `-1` and `-5`.
- Expected result: Both messages contain `cannot be negative` `lib/validation/onboarding-validation.ts:99-113`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects negative values`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try a value that is not a number, which the `isNaN` guard lets through. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-8c"></a>
#### CAND-05-A6.8C: A percentage at or below one hundred

- Precondition: A tab holds a `Float` field named `percentage`.
- Action: Validate the value `95.5`.
- Expected result: No error is reported `lib/validation/onboarding-validation.ts:115-128`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::accepts values <= 100`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try exactly 100, nor a `Percent` fieldtype with another name. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-8d"></a>
#### CAND-05-A6.8D: A percentage above one hundred

- Precondition: A tab holds a `Float` field named `percentage`.
- Action: Validate the value `100.1`.
- Expected result: The message contains `cannot be greater than 100` `lib/validation/onboarding-validation.ts:115-128`
- Test: mapped: `tests/lib/validation/onboarding-validation.test.ts::rejects values > 100`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not try a `Percent` fieldtype or a label-matched field. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-9a"></a>
#### CAND-05-A6.9A: Identity and bank formats by fieldname

- Precondition: A tab holds `custom_aadhaar_number`, `custom_pan_number`, `custom_permanent_postal_code` and `custom_account_holder_name`, none of them mandatory.
- Action: Validate a bad value for each, then a good one.
- Expected result: The four messages name a 12-digit Aadhaar number, a 10-character PAN, a 6-digit postal code that cannot start with zero and alphabets and spaces only; the good values clear, including a lower-case PAN `lib/validation/onboarding-validation.ts:556-624`
- Test: characterization: `tests/spec/cand-05-validation.test.ts::rejects a bad Aadhaar number, PAN, permanent postal code and account holder name by fieldname alone`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not verify statutory correctness. Statutory source: REQUIRED (supplier: HR Compliance). It does not drive these fieldnames inside a table row, where `validateFieldPattern` applies the same rules.
- Evidence: UNVERIFIED

<a id="cand-05-a6-9b"></a>
#### CAND-05-A6.9B: Mobile and emergency numbers must differ

- Precondition: A tab holds `custom_mobile_number` and `custom_emergency_contact_number`.
- Action: Validate the same ten-digit number for both, then two different numbers.
- Expected result: Each field reports its own message in the first case and neither reports one in the second `lib/validation/onboarding-validation.ts:525-554`
- Test: characterization: `tests/spec/cand-05-validation.test.ts::refuses an emergency contact number equal to the mobile number, on both fields`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive the comparison against a value held only in another step.
- Evidence: UNVERIFIED

<a id="cand-05-a6-9c"></a>
#### CAND-05-A6.9C: The employment table and is_fresher

- Precondition: A tab holds `custom_jf_employment`, which the backend did not mark mandatory, with one non-mandatory child field.
- Action: Validate it with `is_fresher` set, then with it clear and no rows, then with a blank row.
- Expected result: The fresher case gives no error, the empty case gives `Employment History is required` and the blank row gives `Company is required` `lib/validation/onboarding-validation.ts:213-232`
- Test: characterization: `tests/spec/cand-05-validation.test.ts::skips the employment table when is_fresher is set and otherwise forces it and its children to be mandatory`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show what happens when the backend already marked the table mandatory.
- Evidence: UNVERIFIED

<a id="cand-05-a6-9d"></a>
#### CAND-05-A6.9D: The communication address proof

- Precondition: A tab holds `custom_communication_address_proof`, which the backend did not mark mandatory.
- Action: Validate an empty value with and without `custom_same_as_permanent`.
- Expected result: Without the flag the message is `Communication Address Proof is required`; with it there is no error `lib/validation/onboarding-validation.ts:233-235`
- Test: characterization: `tests/spec/cand-05-validation.test.ts::requires the communication address proof unless custom_same_as_permanent is set`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a filled value, which the mandatory branch then ignores.
- Evidence: UNVERIFIED

<a id="cand-05-a6-9e"></a>
#### CAND-05-A6.9E: Nomination types and totals

- Precondition: A tab holds `custom_nomination_details` whose `nomination_type` child offers two options.
- Action: Validate rows that miss one type, rows whose first type totals 60, and rows that split one type across two entries to 100.
- Expected result: The messages are `Please add nomination details for: Provident Fund` and `Total percentage for Gratuity nomination must be exactly 100% (currently 60%)`, and the split rows give no error `lib/validation/onboarding-validation.ts:437-474`
- Test: characterization: `tests/spec/cand-05-validation.test.ts::asks for every nomination type in the options list and for a per-type total of exactly 100 percent`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not verify statutory correctness. Statutory source: REQUIRED (supplier: HR Compliance). It does not drive a total that misses 100 by less than 0.001.
- Evidence: UNVERIFIED

<a id="cand-05-a6-10a"></a>
#### CAND-05-A6.10A: The declaration must be accepted

- Precondition: None.
- Action: Parse `{ declaration_accepted: false }` with `reviewDeclarationSchema`.
- Expected result: The parse fails `lib/validation/onboarding-schemas.ts:15-19`
- Test: mapped: `tests/lib/validation/onboarding-schemas.test.ts::fails without accepting declaration`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert the message `You must accept the declaration to submit`. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-10b"></a>
#### CAND-05-A6.10B: An accepted declaration

- Precondition: None.
- Action: Parse `{ declaration_accepted: true }` with `reviewDeclarationSchema`.
- Expected result: The parse succeeds `lib/validation/onboarding-schemas.ts:15-19`
- Test: mapped: `tests/lib/validation/onboarding-schemas.test.ts::passes when declaration accepted`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check that an extra key is kept or stripped. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a6-10c"></a>
#### CAND-05-A6.10C: A missing declaration

- Precondition: None.
- Action: Parse `{}` with `reviewDeclarationSchema`.
- Expected result: The parse fails `lib/validation/onboarding-schemas.ts:15-19`
- Test: mapped: `tests/lib/validation/onboarding-schemas.test.ts::fails when declaration_accepted is missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert the message. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a7"></a>
### CAND-05-A7: The onboarding page

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A7.1A](05-onboarding-logic.md#cand-05-a7-1a) | No form and no error keeps the spinner. | [`keeps the loading screen when loading has stopped but no form arrived and no error was reported`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |
| [CAND-05-A7.1B](05-onboarding-logic.md#cand-05-a7-1b) | The not-started screen's button. | [`clears the dashboard query and routes to the dashboard from the not-started screen`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |
| [CAND-05-A7.1C](05-onboarding-logic.md#cand-05-a7-1c) | Submitted with no tab. | [`shows the wizard's review step, and no read-only copy, when the status is submitted but the form carries no tab`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |
| [CAND-05-A7.1D](05-onboarding-logic.md#cand-05-a7-1d) | Loading, then the not-started screen. | [`shows the spinner while the context is loading and the not-started screen once it reports an error`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |
| [CAND-05-A7.1E](05-onboarding-logic.md#cand-05-a7-1e) | Submitted with a tab shows the read-only copy. | [`replaces the whole wizard with a read-only copy of the submitted answers when the status is submitted and a tab exists`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |
| [CAND-05-A7.2A](05-onboarding-logic.md#cand-05-a7-2a) | Where the percentage comes from. | [`takes the percentage from the backend field counts when their total is above zero, and from the completed steps otherwise`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |
| [CAND-05-A7.2B](05-onboarding-logic.md#cand-05-a7-2b) | The step key the page builds. | [`builds the step key from the tab name by lower-casing it and replacing runs of spaces with underscores`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |
| [CAND-05-A7.2C](05-onboarding-logic.md#cand-05-a7-2c) | The section named in the autosave bar. | [`names the first section of the current tab in the autosave bar, with the section- prefix and underscores removed`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |
| [CAND-05-A7.3A](05-onboarding-logic.md#cand-05-a7-3a) | The mobile bar on the first step. | [`disables the mobile Previous button on the first step and asks the registered form to save and continue`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |
| [CAND-05-A7.3B](05-onboarding-logic.md#cand-05-a7-3b) | While a save is in flight. | [`reports saving in the autosave bar and on the Save button while a save is in flight`](../../../tests/spec/cand-05-onboarding-page.test.tsx) |

<a id="cand-05-a7-1a"></a>
#### CAND-05-A7.1A: No form and no error keeps the spinner

- Precondition: The context reports `isLoading: false`, `isError: false` and no `formConfig`.
- Action: Render the page.
- Expected result: `Loading your onboarding data...` is shown and the sidebar is absent `app/(portal)/onboarding/page.tsx:162-173`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::keeps the loading screen when loading has stopped but no form arrived and no error was reported`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked, and the wizard components are replaced by stubs; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-05-a7-1b"></a>
#### CAND-05-A7.1B: The not-started screen's button

- Precondition: The context reports `isError: true`.
- Action: Click `Back to Dashboard`.
- Expected result: The `dashboard` query is invalidated and the router is pushed to `/dashboard` `app/(portal)/onboarding/page.tsx:199-209`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::clears the dashboard query and routes to the dashboard from the not-started screen`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked, and the wizard components are replaced by stubs; no real HTTP or Frappe backend. It does not check the order of the two calls.
- Evidence: UNVERIFIED

<a id="cand-05-a7-1c"></a>
#### CAND-05-A7.1C: Submitted with no tab

- Precondition: The context reports the status `submitted` and a form whose `tabs` is empty.
- Action: Render the page.
- Expected result: The read-only headline is absent, the review step is rendered, and the sidebar and the progress bar are absent `app/(portal)/onboarding/page.tsx:224,250-252`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::shows the wizard's review step, and no read-only copy, when the status is submitted but the form carries no tab`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked, and the wizard components are replaced by stubs; no real HTTP or Frappe backend. The review step itself is a stub.
- Evidence: UNVERIFIED

<a id="cand-05-a7-1d"></a>
#### CAND-05-A7.1D: Loading, then the not-started screen

- Precondition: The context reports `isLoading: true`, then `isError: true`.
- Action: Render the page once per state.
- Expected result: The first shows `Loading your onboarding data...` and no `Onboarding not yet started`; the second shows `Onboarding not yet started`, no spinner text and the dashboard button `app/(portal)/onboarding/page.tsx:162-190`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::shows the spinner while the context is loading and the not-started screen once it reports an error`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked, and the wizard components are replaced by stubs; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-05-a7-1e"></a>
#### CAND-05-A7.1E: Submitted with a tab shows the read-only copy

- Precondition: The context reports the status `submitted` and one tab holding one field with a value.
- Action: Render the page.
- Expected result: `You have already submitted your onboarding details.` and the field's label and value are shown, and the sidebar, the right rail and the save button are absent `app/(portal)/onboarding/page.tsx:224-235`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::replaces the whole wizard with a read-only copy of the submitted answers when the status is submitted and a tab exists`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked; the read-only component is the real one, the wizard components are stubs; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-05-a7-2a"></a>
#### CAND-05-A7.2A: Where the percentage comes from

- Precondition: The context reports one completed step and a form whose field counts total 8 with 2 filled and 2 approved, then the same with a total of 0.
- Action: Render the page once per state and read the progress value.
- Expected result: The first is 50 and the step line reads `Step 1 of 3`; the second is one third of 100 `app/(portal)/onboarding/page.tsx:238-245`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::takes the percentage from the backend field counts when their total is above zero, and from the completed steps otherwise`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked, and the wizard components are replaced by stubs; no real HTTP or Frappe backend. The progress bar is a stub that prints its value.
- Evidence: UNVERIFIED

<a id="cand-05-a7-2b"></a>
#### CAND-05-A7.2B: The step key the page builds

- Precondition: The context is on step 1 of a form whose second tab is named `Work Experience`.
- Action: Render the page and read the stub form step's text.
- Expected result: The step key is `work_experience` `app/(portal)/onboarding/page.tsx:253-262`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::builds the step key from the tab name by lower-casing it and replacing runs of spaces with underscores`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked, and the wizard components are replaced by stubs; no real HTTP or Frappe backend. It does not drive a tab name with repeated spaces.
- Evidence: UNVERIFIED

<a id="cand-05-a7-2c"></a>
#### CAND-05-A7.2C: The section named in the autosave bar

- Precondition: The context is on step 0 of a form whose first section is `section-basic_details`.
- Action: Render the page.
- Expected result: The bar names `Basic Details` and says `All changes saved` `app/(portal)/onboarding/page.tsx:22-35,55,274-276`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::names the first section of the current tab in the autosave bar, with the section- prefix and underscores removed`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked, and the wizard components are replaced by stubs; no real HTTP or Frappe backend. The scroll spy does not run in jsdom (section 10).
- Evidence: UNVERIFIED

<a id="cand-05-a7-3a"></a>
#### CAND-05-A7.3A: The mobile bar on the first step

- Precondition: The context is on step 0 and is not saving.
- Action: Read the `Previous` button and click `Save & Next`.
- Expected result: `Previous` is disabled and `triggerSubmit` was called with `save_continue` while `prevStep` was not called `app/(portal)/onboarding/page.tsx:347-367`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::disables the mobile Previous button on the first step and asks the registered form to save and continue`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked, and the wizard components are replaced by stubs; no real HTTP or Frappe backend. The bar is hidden on wide screens by CSS, which jsdom does not apply.
- Evidence: UNVERIFIED

<a id="cand-05-a7-3b"></a>
#### CAND-05-A7.3B: While a save is in flight

- Precondition: The context reports `isSaving: true`.
- Action: Render the page.
- Expected result: The bar says `Saving changes...` and not `All changes saved`, and the save button reads `Saving...` and is disabled `app/(portal)/onboarding/page.tsx:55,363-365`
- Test: characterization: `tests/spec/cand-05-onboarding-page.test.tsx::reports saving in the autosave bar and on the Save button while a save is in flight`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The onboarding context, the query client and the router are mocked, and the wizard components are replaced by stubs; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-05-a8"></a>
### CAND-05-A8: The onboarding service

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A8.1A](05-onboarding-logic.md#cand-05-a8-1a) | The form request and the rename. | [`sends the signed-in e-mail as job_applicant_id to the candidate-portal form method and renames the backend fields`](../../../tests/spec/cand-05-services.test.ts) |
| [CAND-05-A8.1B](05-onboarding-logic.md#cand-05-a8-1b) | Failures of the form request. | [`throws the same fixed text for a null reply and for any status other than success`](../../../tests/spec/cand-05-services.test.ts) |
| [CAND-05-A8.1C](05-onboarding-logic.md#cand-05-a8-1c) | The transform drops unknown fields. | [`copies the nine fields it knows and leaves the rest undefined without reading the backend status`](../../../tests/spec/cand-05-services.test.ts) |
| [CAND-05-A8.1D](05-onboarding-logic.md#cand-05-a8-1d) | The mapped form request. | [`fetches and transforms onboarding form`](../../../tests/lib/services/candidate-onboarding.test.ts) |
| [CAND-05-A8.1E](05-onboarding-logic.md#cand-05-a8-1e) | An empty e-mail for the form request. | [`throws error if email is missing`](../../../tests/lib/services/candidate-onboarding.test.ts) |
| [CAND-05-A8.1F](05-onboarding-logic.md#cand-05-a8-1f) | A failed form request. | [`throws error if API fails`](../../../tests/lib/services/candidate-onboarding.test.ts) |
| [CAND-05-A8.1G](05-onboarding-logic.md#cand-05-a8-1g) | The mapped transform. | [`transforms backend data to frontend format`](../../../tests/lib/services/candidate-onboarding.test.ts) |
| [CAND-05-A8.2A](05-onboarding-logic.md#cand-05-a8-2a) | The flattened submit payload. | [`flattens every step into one document, fixes boarding_status to Pending and fills today's date for the begin and joining dates`](../../../tests/spec/cand-05-services.test.ts) |
| [CAND-05-A8.2B](05-onboarding-logic.md#cand-05-a8-2b) | The joining date and later steps. | [`prefers custom_date_of_joining over today and lets a later step overwrite an earlier step's field of the same name`](../../../tests/spec/cand-05-services.test.ts) |
| [CAND-05-A8.2C](05-onboarding-logic.md#cand-05-a8-2c) | Submit failures. | [`refuses an empty e-mail before any request and reports Submission failed when the reply has no message`](../../../tests/spec/cand-05-services.test.ts) |
| [CAND-05-A8.2D](05-onboarding-logic.md#cand-05-a8-2d) | The mapped submit. | [`submits onboarding data correctly`](../../../tests/lib/services/candidate-onboarding.test.ts) |
| [CAND-05-A8.2E](05-onboarding-logic.md#cand-05-a8-2e) | A failed submit. | [`throws error if submission fails`](../../../tests/lib/services/candidate-onboarding.test.ts) |

<a id="cand-05-a8-1a"></a>
#### CAND-05-A8.1A: The form request and the rename

- Precondition: `FrappeAPI.get` is mocked to answer a successful form with every optional field set.
- Action: Call `getOnboardingForm` with a synthetic e-mail.
- Expected result: The call names `recruitment.api.candidate_portal.get_candidate_portal_form` with `job_applicant_id`, and the result holds exactly the nine transformed keys `lib/services/candidate-onboarding.ts:5-6,15-23,49-63`
- Test: characterization: `tests/spec/cand-05-services.test.ts::sends the signed-in e-mail as job_applicant_id to the candidate-portal form method and renames the backend fields`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` is mocked, so the backend is stubbed; no real HTTP or Frappe backend. It does not check what the Frappe client does with the parameters.
- Evidence: UNVERIFIED

<a id="cand-05-a8-1b"></a>
#### CAND-05-A8.1B: Failures of the form request

- Precondition: `FrappeAPI.get` answers `null`, then a reply with the status `error` and a message.
- Action: Call `getOnboardingForm` twice.
- Expected result: Both reject with `Failed to fetch onboarding form`, so the backend's own message is dropped `lib/services/candidate-onboarding.ts:19-21`
- Test: characterization: `tests/spec/cand-05-services.test.ts::throws the same fixed text for a null reply and for any status other than success`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` is mocked, so the backend is stubbed; no real HTTP or Frappe backend. It does not drive a rejection from the client itself, which propagates unchanged.
- Evidence: UNVERIFIED

<a id="cand-05-a8-1c"></a>
#### CAND-05-A8.1C: The transform drops unknown fields

- Precondition: None.
- Action: Call `transformOnboardingForm` with only `job_applicant`, `boarding_status` and `tabs`.
- Expected result: The two renamed fields are set and the six optional fields are `undefined` `lib/services/candidate-onboarding.ts:52-62`
- Test: characterization: `tests/spec/cand-05-services.test.ts::copies the nine fields it knows and leaves the rest undefined without reading the backend status`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` is mocked, so the backend is stubbed; no real HTTP or Frappe backend. It does not assert that `onboarding_name` and `pre_release_name` are absent from the result object's keys; CAND-05-A8.1A does.
- Evidence: UNVERIFIED

<a id="cand-05-a8-1d"></a>
#### CAND-05-A8.1D: The mapped form request

- Precondition: `FrappeAPI.get` answers a successful minimal form.
- Action: Call `getOnboardingForm`.
- Expected result: The result is `{ applicantId, status, tabs }` and the call carried `job_applicant_id` `lib/services/candidate-onboarding.ts:15-23`
- Test: mapped: `tests/lib/services/candidate-onboarding.test.ts::fetches and transforms onboarding form`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It matches the method name with `expect.any(String)`, so it does not pin which backend method is called; CAND-05-A8.1A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a8-1e"></a>
#### CAND-05-A8.1E: An empty e-mail for the form request

- Precondition: None.
- Action: Call `getOnboardingForm('')`.
- Expected result: It rejects with `User email is required` `lib/services/candidate-onboarding.ts:13`
- Test: mapped: `tests/lib/services/candidate-onboarding.test.ts::throws error if email is missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert that no request was made. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a8-1f"></a>
#### CAND-05-A8.1F: A failed form request

- Precondition: `FrappeAPI.get` answers `{ status: 'error' }`.
- Action: Call `getOnboardingForm`.
- Expected result: It rejects with `Failed to fetch onboarding form` `lib/services/candidate-onboarding.ts:19-21`
- Test: mapped: `tests/lib/services/candidate-onboarding.test.ts::throws error if API fails`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a `null` reply; CAND-05-A8.1B does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a8-1g"></a>
#### CAND-05-A8.1G: The mapped transform

- Precondition: None.
- Action: Call `transformOnboardingForm` with `job_applicant`, `boarding_status` and one tab.
- Expected result: The result is `{ applicantId: 'ID1', status: 'Pending', tabs: [...] }` `lib/services/candidate-onboarding.ts:52-55`
- Test: mapped: `tests/lib/services/candidate-onboarding.test.ts::transforms backend data to frontend format`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. Its `toEqual` ignores keys whose value is `undefined`, so it does not show that the six optional keys are present and empty; CAND-05-A8.1C does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a8-2a"></a>
#### CAND-05-A8.2A: The flattened submit payload

- Precondition: The clock is fixed at a synthetic date and `FrappeAPI.post` answers success.
- Action: Call `submitOnboarding` with two steps, one of them holding an `undefined` value.
- Expected result: The posted body is `{ email, data, action }`, `data` carries `boarding_status: 'Pending'`, `custom_email`, `boarding_begins_on`, `notify_users_by_email: 1`, both steps' fields and a `date_of_joining` of the same fixed date, and the `undefined` value is absent `lib/services/candidate-onboarding.ts:65,75-101`
- Test: characterization: `tests/spec/cand-05-services.test.ts::flattens every step into one document, fixes boarding_status to Pending and fills today's date for the begin and joining dates`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` is mocked, so the backend is stubbed; no real HTTP or Frappe backend. The date is the UTC date, which is the behaviour in G2; the test fixes the clock and does not prove the timezone effect. Issue: PWHR-1558.
- Evidence: UNVERIFIED

<a id="cand-05-a8-2b"></a>
#### CAND-05-A8.2B: The joining date and later steps

- Precondition: The clock is fixed and one step carries `custom_date_of_joining`; two steps carry the same fieldname.
- Action: Call `submitOnboarding` with those steps.
- Expected result: `date_of_joining` is the supplied date and the shared fieldname holds the later step's value `lib/services/candidate-onboarding.ts:82-95`
- Test: characterization: `tests/spec/cand-05-services.test.ts::prefers custom_date_of_joining over today and lets a later step overwrite an earlier step's field of the same name`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` is mocked, so the backend is stubbed; no real HTTP or Frappe backend. Step order is object insertion order, which the provider controls.
- Evidence: UNVERIFIED

<a id="cand-05-a8-2c"></a>
#### CAND-05-A8.2C: Submit failures

- Precondition: `FrappeAPI.post` answers a reply with no message, then `null`.
- Action: Call `submitOnboarding` with an empty e-mail, then twice with a synthetic e-mail.
- Expected result: The empty e-mail rejects with `User email is required` and makes no request; both replies reject with `Submission failed` `lib/services/candidate-onboarding.ts:31,37-39`
- Test: characterization: `tests/spec/cand-05-services.test.ts::refuses an empty e-mail before any request and reports Submission failed when the reply has no message`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` is mocked, so the backend is stubbed; no real HTTP or Frappe backend.
- Evidence: UNVERIFIED

<a id="cand-05-a8-2d"></a>
#### CAND-05-A8.2D: The mapped submit

- Precondition: `FrappeAPI.post` answers `{ status: 'success', message: 'Success' }`.
- Action: Call `submitOnboarding` with one step and the action `submit`.
- Expected result: The result is `{ success: true, message: 'Success' }` and the body holds the e-mail, a `data` object carrying the step's field, and the action `lib/services/candidate-onboarding.ts:35-44`
- Test: mapped: `tests/lib/services/candidate-onboarding.test.ts::submits onboarding data correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It matches `data` with `objectContaining`, so it does not pin the fixed fields or the joining date; CAND-05-A8.2A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a8-2e"></a>
#### CAND-05-A8.2E: A failed submit

- Precondition: `FrappeAPI.post` answers `{ status: 'error', message: 'Error' }`.
- Action: Call `submitOnboarding`.
- Expected result: It rejects with `Error` `lib/services/candidate-onboarding.ts:37-39`
- Test: mapped: `tests/lib/services/candidate-onboarding.test.ts::throws error if submission fails`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a reply with no message or a `null` reply; CAND-05-A8.2C does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a9"></a>
### CAND-05-A9: Link field and file upload services

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A9.1A](05-onboarding-logic.md#cand-05-a9-1a) | Filters and an empty search text. | [`encodes filters as JSON, drops an empty search text and returns the whole reply unchanged`](../../../tests/spec/cand-05-services.test.ts) |
| [CAND-05-A9.1B](05-onboarding-logic.md#cand-05-a9-1b) | A plain option request. | [`fetches link field options correctly without search text`](../../../tests/lib/services/link-field.test.ts) |
| [CAND-05-A9.1C](05-onboarding-logic.md#cand-05-a9-1c) | An option request with a search text. | [`fetches link field options correctly with search text`](../../../tests/lib/services/link-field.test.ts) |
| [CAND-05-A9.1D](05-onboarding-logic.md#cand-05-a9-1d) | An empty doctype. | [`throws error if doctype is missing`](../../../tests/lib/services/link-field.test.ts) |
| [CAND-05-A9.1E](05-onboarding-logic.md#cand-05-a9-1e) | A failed option request. | [`throws error if API returns failure`](../../../tests/lib/services/link-field.test.ts) |
| [CAND-05-A9.2A](05-onboarding-logic.md#cand-05-a9-2a) | A failed upload is logged and rethrown. | [`handles upload errors`](../../../tests/lib/services/uploadProofFile.test.ts) |

<a id="cand-05-a9-1a"></a>
#### CAND-05-A9.1A: Filters and an empty search text

- Precondition: `FrappeAPI.get` answers a successful option list.
- Action: Call `getLinkFieldOptions` with an empty search text and a filter object.
- Expected result: The parameters are the doctype and the JSON-encoded filters with no `search_text`, and the returned object is the reply itself `lib/services/link-field.ts:24-40`
- Test: characterization: `tests/spec/cand-05-services.test.ts::encodes filters as JSON, drops an empty search text and returns the whole reply unchanged`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: `FrappeAPI` is mocked, so the backend is stubbed; no real HTTP or Frappe backend. It does not drive a filter value that cannot be serialised.
- Evidence: UNVERIFIED

<a id="cand-05-a9-1b"></a>
#### CAND-05-A9.1B: A plain option request

- Precondition: `FrappeAPI.get` answers a successful option list.
- Action: Call `getLinkFieldOptions('Designation')`.
- Expected result: The result is the reply and the call names `recruitment.api.candidate_portal.get_link_field_options` with only `doctype` `lib/services/link-field.ts:24-34`
- Test: mapped: `tests/lib/services/link-field.test.ts::fetches link field options correctly without search text`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It compares the result with `toEqual`, so it does not show that the same object is returned; CAND-05-A9.1A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a9-1c"></a>
#### CAND-05-A9.1C: An option request with a search text

- Precondition: `FrappeAPI.get` answers a successful option list.
- Action: Call `getLinkFieldOptions('Designation', 'searchQuery')`.
- Expected result: The call carries `search_text: 'searchQuery'` `lib/services/link-field.ts:27-29`
- Test: mapped: `tests/lib/services/link-field.test.ts::fetches link field options correctly with search text`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive the `filters` parameter; CAND-05-A9.1A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a9-1d"></a>
#### CAND-05-A9.1D: An empty doctype

- Precondition: None.
- Action: Call `getLinkFieldOptions('')`.
- Expected result: It rejects with `Doctype is required` `lib/services/link-field.ts:22`
- Test: mapped: `tests/lib/services/link-field.test.ts::throws error if doctype is missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert that no request was made. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a9-1e"></a>
#### CAND-05-A9.1E: A failed option request

- Precondition: `FrappeAPI.get` answers `{ status: 'error', message: 'Failed' }`.
- Action: Call `getLinkFieldOptions('Designation')`.
- Expected result: It rejects with `Failed to fetch link field options`, so the backend's message is dropped `lib/services/link-field.ts:36-38`
- Test: mapped: `tests/lib/services/link-field.test.ts::throws error if API returns failure`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a `null` reply, which the same guard also catches. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a9-2a"></a>
#### CAND-05-A9.2A: A failed upload is logged and rethrown

- Precondition: `FrappeAPI.uploadFile` rejects with an error and `console.error` is spied on.
- Action: Call `fileUploadService.uploadFile(file)`.
- Expected result: The call rejects with the same error and the console was written to `lib/services/uploadProofFile.ts:13-15`
- Test: mapped: `tests/lib/services/uploadProofFile.test.ts::handles upload errors`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not assert the logged text, and it does not cover the `console.log` of the whole `File` object on the success path (G3). The success path is SPEC-CAND-02 A1.4B. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a10"></a>
### CAND-05-A10: The React Query hooks

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-05-A10.1A](05-onboarding-logic.md#cand-05-a10-1a) | The form cache entry. | [`stores the form under the onboarding-form key carrying the e-mail and keeps it fresh for one minute`](../../../tests/spec/cand-05-hooks.test.tsx) |
| [CAND-05-A10.1B](05-onboarding-logic.md#cand-05-a10-1b) | The mapped form hook. | [`fetches onboarding form correctly`](../../../tests/lib/hooks/useOnboardingForm.test.tsx) |
| [CAND-05-A10.1C](05-onboarding-logic.md#cand-05-a10-1c) | No e-mail, no request. | [`does not fetch if userEmail is missing`](../../../tests/lib/hooks/useOnboardingForm.test.tsx) |
| [CAND-05-A10.2A](05-onboarding-logic.md#cand-05-a10-2a) | The link-field cache entry. | [`puts the doctype, the search text and the filters in the key and keeps each answer fresh for five minutes`](../../../tests/spec/cand-05-hooks.test.tsx) |
| [CAND-05-A10.2B](05-onboarding-logic.md#cand-05-a10-2b) | The mapped link-field hook. | [`fetches link field options correctly`](../../../tests/lib/hooks/useLinkFieldOptions.test.tsx) |
| [CAND-05-A10.2C](05-onboarding-logic.md#cand-05-a10-2c) | No doctype, no request. | [`does not fetch if doctype is missing`](../../../tests/lib/hooks/useLinkFieldOptions.test.tsx) |
| [CAND-05-A10.3A](05-onboarding-logic.md#cand-05-a10-3a) | The submit mutation on failure. | [`rejects from mutateAsync when the submit service throws and invalidates no query of its own`](../../../tests/spec/cand-05-hooks.test.tsx) |
| [CAND-05-A10.3B](05-onboarding-logic.md#cand-05-a10-3b) | The upload mutation passes only the file. | [`sends only the file to the upload service, so the doctype and the document name are never passed`](../../../tests/spec/cand-05-hooks.test.tsx) |
| [CAND-05-A10.3C](05-onboarding-logic.md#cand-05-a10-3c) | The mapped submit mutation. | [`submits onboarding step data with the user email`](../../../tests/lib/hooks/useOnboardingMutation.test.tsx) |
| [CAND-05-A10.4A](05-onboarding-logic.md#cand-05-a10-4a) | The mapped upload mutation. | [`uploads file successfully`](../../../tests/lib/hooks/useFileUpload.test.tsx) |
| [CAND-05-A10.4B](05-onboarding-logic.md#cand-05-a10-4b) | The upload mutation's error handler. | [`handles upload error`](../../../tests/lib/hooks/useFileUpload.test.tsx) |

<a id="cand-05-a10-1a"></a>
#### CAND-05-A10.1A: The form cache entry

- Precondition: The onboarding service is mocked and a fresh query client is used.
- Action: Render `useOnboardingForm` for one e-mail, then for another.
- Expected result: The entry sits under `['onboarding-form', { userEmail }]` with a `staleTime` of 60000, holds the service's object, and the second e-mail starts its own request `lib/hooks/useOnboardingForm.ts:6-9`
- Test: characterization: `tests/spec/cand-05-hooks.test.tsx::stores the form under the onboarding-form key carrying the e-mail and keeps it fresh for one minute`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The service is mocked, so the backend is stubbed; no real HTTP or Frappe backend. It does not let the stale time elapse.
- Evidence: UNVERIFIED

<a id="cand-05-a10-1b"></a>
#### CAND-05-A10.1B: The mapped form hook

- Precondition: The onboarding service is mocked to resolve a form.
- Action: Render `useOnboardingForm` with a synthetic e-mail.
- Expected result: The hook succeeds, its data is the form and the service was called with that e-mail `lib/hooks/useOnboardingForm.ts:7`
- Test: mapped: `tests/lib/hooks/useOnboardingForm.test.tsx::fetches onboarding form correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check the query key or the stale time; CAND-05-A10.1A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a10-1c"></a>
#### CAND-05-A10.1C: No e-mail, no request

- Precondition: The onboarding service is mocked.
- Action: Render `useOnboardingForm('')`.
- Expected result: The hook is not loading and the service was not called `lib/hooks/useOnboardingForm.ts:8`
- Test: mapped: `tests/lib/hooks/useOnboardingForm.test.tsx::does not fetch if userEmail is missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive an `undefined` e-mail, which the same guard also rejects. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a10-2a"></a>
#### CAND-05-A10.2A: The link-field cache entry

- Precondition: The link-field service is mocked and a fresh query client is used.
- Action: Render `useLinkFieldOptions` for one search text, then for a longer one.
- Expected result: The entry sits under `['link-field-options', { doctype, searchText, filters }]` with a `staleTime` of 300000, and the second search text starts its own request `lib/hooks/useLinkFieldOptions.ts:6-9`
- Test: characterization: `tests/spec/cand-05-hooks.test.tsx::puts the doctype, the search text and the filters in the key and keeps each answer fresh for five minutes`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The service is mocked, so the backend is stubbed; no real HTTP or Frappe backend. It does not measure how many requests a typing candidate would cause.
- Evidence: UNVERIFIED

<a id="cand-05-a10-2b"></a>
#### CAND-05-A10.2B: The mapped link-field hook

- Precondition: The link-field service is mocked to resolve an option list.
- Action: Render `useLinkFieldOptions('Designation', 'searchQuery')`.
- Expected result: The hook succeeds, its data is the list and the service was called with the doctype, the search text and `undefined` filters `lib/hooks/useLinkFieldOptions.ts:7`
- Test: mapped: `tests/lib/hooks/useLinkFieldOptions.test.tsx::fetches link field options correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not check the query key or the stale time; CAND-05-A10.2A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a10-2c"></a>
#### CAND-05-A10.2C: No doctype, no request

- Precondition: The link-field service is mocked.
- Action: Render `useLinkFieldOptions('')`.
- Expected result: The hook is not loading and the service was not called `lib/hooks/useLinkFieldOptions.ts:8`
- Test: mapped: `tests/lib/hooks/useLinkFieldOptions.test.tsx::does not fetch if doctype is missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a doctype of only whitespace, which the guard accepts. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a10-3a"></a>
#### CAND-05-A10.3A: The submit mutation on failure

- Precondition: The onboarding service's `submitOnboarding` rejects and `invalidateQueries` is spied on.
- Action: Call `mutateAsync` once.
- Expected result: The call rejects with the service's message, the hook reports an error and no query was invalidated by the hook `lib/hooks/useOnboardingMutation.ts:8-18`
- Test: characterization: `tests/spec/cand-05-hooks.test.tsx::rejects from mutateAsync when the submit service throws and invalidates no query of its own`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The service is mocked, so the backend is stubbed; no real HTTP or Frappe backend. The invalidation the context does is CAND-05-A3.1H.
- Evidence: UNVERIFIED

<a id="cand-05-a10-3b"></a>
#### CAND-05-A10.3B: The upload mutation passes only the file

- Precondition: The file-upload service is mocked to resolve a file URL.
- Action: Call `mutateAsync` with a synthetic `File`.
- Expected result: The service was called with exactly one argument, the file, and the result is the service's object `lib/hooks/useFileUpload.ts:7`
- Test: characterization: `tests/spec/cand-05-hooks.test.tsx::sends only the file to the upload service, so the doctype and the document name are never passed`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: The service is mocked, so the backend is stubbed; no real HTTP or Frappe backend. It does not check the mutation key.
- Evidence: UNVERIFIED

<a id="cand-05-a10-3c"></a>
#### CAND-05-A10.3C: The mapped submit mutation

- Precondition: The onboarding service is mocked to resolve a success.
- Action: Call `mutateAsync` with step data, an e-mail and the action `save`.
- Expected result: The service was called with the step data, the e-mail and the action in that order `lib/hooks/useOnboardingMutation.ts:17`
- Test: mapped: `tests/lib/hooks/useOnboardingMutation.test.tsx::submits onboarding step data with the user email`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not drive a rejection; CAND-05-A10.3A does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a10-4a"></a>
#### CAND-05-A10.4A: The mapped upload mutation

- Precondition: The file-upload service is mocked to resolve an object.
- Action: Call `mutate` with a synthetic `File`.
- Expected result: The hook succeeds, its data is that object and the service was called with the file `lib/hooks/useFileUpload.ts:7`
- Test: mapped: `tests/lib/hooks/useFileUpload.test.tsx::uploads file successfully`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show that no further argument is passed; CAND-05-A10.3B does. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED

<a id="cand-05-a10-4b"></a>
#### CAND-05-A10.4B: The upload mutation's error handler

- Precondition: The file-upload service rejects and `console.error` is spied on.
- Action: Call `mutate` with a synthetic `File`.
- Expected result: The hook reports the error and the console carries `Error uploading file:` with it `lib/hooks/useFileUpload.ts:8-10`
- Test: mapped: `tests/lib/hooks/useFileUpload.test.tsx::handles upload error`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend is stubbed: `fetch`, the router, the auth context, the services or the query hooks are mocked; no real HTTP or Frappe backend. It does not show that the mutation still rejects from `mutateAsync` after the handler ran. Mapped test: only the `Spec:` comment was added.
- Evidence: UNVERIFIED
