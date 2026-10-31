# SPEC-CAND-06: Onboarding form components

<a id="spec-cand-06"></a>

- Stable ID: `SPEC-CAND-06`
- Described at: repo `hybrowlabs/Candidate-Portal`, branch `develop`, commit `0d7fd6f6002cd2dff3c6b6716195cf051f5fad1c` (committer date `2026-10-31 17:27:47 +0000`)
- Also read at: branch `deploy/hybrowbase-candidate-20261025`, commit `786b53e406869986d5d5d0c81b7ae6b1605f8315`; differs: `components/onboarding/onboarding-right-rail.tsx` has no role filter on `key_contacts` there (every contact is listed as a buddy) and no fallback checklist entry for a mandatory table whose child fields are all optional, and `components/onboarding/steps/review-step.tsx` prints every reviewed value with `String(...)` instead of routing monetary fields through `AmountDisplay`; `components/onboarding/onboarding-form-step.tsx`, `onboarding-step-nav.tsx`, `dynamic-table-field.tsx`, `file-upload-field.tsx`, `section-card.tsx`, `components/onboarding-wizard.tsx`, `components/portal/portal-stepper-sidebar.tsx` and `components/shared/circular-progress.tsx` are identical there; no `pw-uat` branch exists in this repo (`git ls-remote --heads origin pw-uat` printed nothing on 2026-10-31); only `develop` is described
- Author: Frontend Developer (Yashwanth). Reviewer: Code Reviewer (Yashwanth), to be recorded in the PR.
- Status: DRAFT

## 1. Purpose

This clause describes the React components that draw the onboarding wizard: the step form that renders one tab of the backend's field configuration and saves it (`components/onboarding/onboarding-form-step.tsx`), the left step list with its progress numbers (`components/onboarding/onboarding-step-nav.tsx`), the right rail with the ID card, the countdown, the required-field checklist and the two action buttons (`components/onboarding/onboarding-right-rail.tsx`), the repeating child-table editor (`components/onboarding/dynamic-table-field.tsx`), the upload box (`components/onboarding/file-upload-field.tsx`), the section wrapper (`components/onboarding/section-card.tsx`) and the final review and declaration step (`components/onboarding/steps/review-step.tsx`). Issue: PWHR-1366 (parent PWHR-1362).

The components are driven entirely by one object, the onboarding form configuration held in the onboarding context: a list of tabs, each with sections, each with fields that carry a `fieldtype`, `depends_on`, `mandatory_depends_on`, `approval_status`, `hr_comment` and child fields (`components/onboarding/onboarding-form-step.tsx:655-800`, `components/onboarding/onboarding-step-nav.tsx:31,45-124`). None of them fetches anything itself; every read and write goes through the context hook `useOnboarding` and, for uploads, through `useFileUpload` (`components/onboarding/onboarding-form-step.tsx:143-157`, `components/onboarding/file-upload-field.tsx:65`). The context, the validation rules, the hooks and the page that mounts them are SPEC-CAND-05.

Two more components are in scope because the portal pages render them: the three-step portal sidebar used by the survey and offer pages (`components/portal/portal-stepper-sidebar.tsx:31-38`) and the shared SVG progress ring (`components/shared/circular-progress.tsx:23-28`). `components/onboarding-wizard.tsx` is a 21-line placeholder with no caller in `app/`, `lib/` or `components/` (A10.2).

## 2. Boundaries

- In: `components/onboarding/onboarding-form-step.tsx`, `onboarding-step-nav.tsx`, `onboarding-right-rail.tsx`, `dynamic-table-field.tsx`, `file-upload-field.tsx`, `section-card.tsx`, `steps/review-step.tsx`, `components/onboarding-wizard.tsx`, `components/portal/portal-stepper-sidebar.tsx`, `components/shared/circular-progress.tsx`.
- Out: the onboarding context, `lib/onboarding-utils.ts`, `lib/validation/onboarding-validation.ts`, `lib/validation/onboarding-schemas.ts`, the onboarding page and the hooks `useOnboardingForm`, `useOnboardingMutation` and `useFileUpload` are SPEC-CAND-05; a case here only states what the component does with their output. `components/ui/field-renderer.tsx` (`DynamicFieldRenderer`, `ResubmitButton`) is the shared widget layer and is mocked in every test of this clause; it is not described. `lib/hooks/useSurvey` is SPEC-CAND-07. The Frappe client and the `/backend` proxy are SPEC-CAND-02. The session is SPEC-CAND-01.
- Extension points: a new field type is a new entry in the `overrides` object that `OnboardingFormStep` passes down (`components/onboarding/onboarding-form-step.tsx:566-647`); a new fixed rule about a named field is another `fieldname ===` branch in the same file (A2.4, A2.5).

## 3. Behaviour rules

### A1: Section card

- A1.1: `SectionCard` renders a card whose `data-section-title` is `sectionTitle`, else `title`, keeps the caller's `id` and extra classes, and always puts the children in the card body (`components/onboarding/section-card.tsx:21-25,43-45`). [CAND-06-A1.1A] [CAND-06-A1.1D]
- A1.2: The header is drawn only when a `title` or a `counts` object is given; with both it is spread apart, with counts alone it is pushed right (`components/onboarding/section-card.tsx:26-35`). [CAND-06-A1.1B] [CAND-06-A1.1C]
- A1.3: The counts badge reads `filled/total` exactly as passed, with no clamping (`components/onboarding/section-card.tsx:36-38`). [CAND-06-A2.6A]

### A2: Onboarding form step

- A2.1: The form is a `react-hook-form` form whose resolver is `validateOnboardingStep` for this tab, validating on blur and re-validating on change; initial values come from the saved step data, else the field's `value`, else its `default`, else `[]` for a table and `""` for anything else (`components/onboarding/onboarding-form-step.tsx:170-222`). [CAND-06-A2.1A] [CAND-06-A2.1B] [CAND-06-A2.1C]
- A2.2: A failed submit scrolls the first field with an error into view by the DOM id `field-<fieldname>` and focuses the first `input`, `select`, `textarea` or `button` inside it (`components/onboarding/onboarding-form-step.tsx:468-481`). [CAND-06-A2.2A]
- A2.3: The resolver's messages reach the rendered fields: a mandatory empty field, an empty mandatory table, an unticked mandatory check, a field with no label, a table row missing a mandatory child value and an out-of-order year of passing all block the submit (`components/onboarding/onboarding-form-step.tsx:199-216`, `lib/validation/onboarding-validation.ts:296,336-341,483-494`). [CAND-06-A2.2C] [CAND-06-A2.2D] [CAND-06-A2.2E] [CAND-06-A2.2F]
- A2.4: A successful submit writes the step data, awaits `submitAll("save", stepKey, data)`, marks the step complete and advances; if `submitAll` rejects, the catch is empty, so no completion is marked and no step change happens (`components/onboarding/onboarding-form-step.tsx:502-509`). [CAND-06-A2.2B] [CAND-06-A2.3A]
- A2.5: While the `is_fresher` value is falsy the employment table `custom_jf_employment` is forced mandatory, itself and every child field; when it is truthy the table is not rendered and any saved rows are set to `[]` (`components/onboarding/onboarding-form-step.tsx:420-428,656,732-734,745-753`). [CAND-06-A2.4A] [CAND-06-A2.4B]
- A2.6: `custom_jf_declaration_date` is always set to today in ISO form and rendered as a disabled text box in `dd-mm-yyyy`, whatever was saved (`components/onboarding/onboarding-form-step.tsx:174-176,330-344,772-786`). [CAND-06-A2.5A]
- A2.7: The section badge counts visible fields; a field whose `approval_status` is `Approved` counts as filled even when its value is empty, a `Check` field counts as filled only when truthy, and `custom_age` with the value 0 counts as not filled (`components/onboarding/onboarding-form-step.tsx:692-710`). [CAND-06-A2.6A]
- A2.8: A section whose name equals the tab name is drawn without a title, so only the counts badge shows (`components/onboarding/onboarding-form-step.tsx:718`). [CAND-06-A2.6B]
- A2.9: Ticking `custom_same_as_permanent` copies every permanent field into the matching communication field and keeps them in step; unticking it clears those communication fields, but only on a real ticked-to-unticked change, so a form that loads unticked keeps its saved values (`components/onboarding/onboarding-form-step.tsx:241-279,364-413`). [CAND-06-A2.7A] [CAND-06-A2.7B]
- A2.10: While `custom_same_as_permanent` is set, `custom_communication_address_proof` is not rendered and is cleared; while it is clear, that field is forced mandatory (`components/onboarding/onboarding-form-step.tsx:430-438,657,737-739,756-758`).
- A2.11: A field that is hidden, or whose `depends_on` evaluates false, is not rendered, is not validated, and its value is cleared to `[]` for a table and `""` otherwise (`components/onboarding/onboarding-form-step.tsx:440-455,741-742`). [CAND-06-A2.8A] [CAND-06-A2.8B]
- A2.12: `custom_age` is recomputed from `custom_date_of_birth` on every change, counting a birthday not yet reached this year as one year less (`components/onboarding/onboarding-form-step.tsx:305-327`). [CAND-06-A2.9A] [CAND-06-A2.9B]
- A2.13: `custom_email_id` is prefilled with the signed-in user's e-mail when it is empty; if `useAuth` throws, the e-mail is treated as empty and the form still renders (`components/onboarding/onboarding-form-step.tsx:146-154,177-181,347-361`). [CAND-06-A2.9C]
- A2.14: Every form value is written back to the context 150 ms after the last change (`components/onboarding/onboarding-form-step.tsx:460-466`). [CAND-06-A2.10A]
- A2.15: Submission is blocked, with a toast listing the labels, when a visible field whose `approval_status` is `Rejected` still holds its original `value` after trimming (`components/onboarding/onboarding-form-step.tsx:484-500`). [CAND-06-A2.11A]
- A2.16: The step registers a handler with the context: `save_continue` runs the same validated save and returns whether it succeeded, `save_draft` saves the current values without validating and then navigates the whole window to `/dashboard`; both return false when the save rejects (`components/onboarding/onboarding-form-step.tsx:512-546`). [CAND-06-A2.12A] [CAND-06-A2.12B]
- A2.17: An `Attach` or `Attach Image` field is drawn by `FileUploadField`, whose callback writes the URL, or `""` for a removal, into the form; it is marked rejected only when the field is not read-only, its `approval_status` is `Rejected` and the current value still equals the original (`components/onboarding/onboarding-form-step.tsx:559-647`). [CAND-06-A2.13A] [CAND-06-A2.13B] [CAND-06-A2.13C] [CAND-06-A2.13D]
- A2.18: `custom_same_as_permanent`, any field whose label contains `address proof`, and the fieldnames containing `custom_upload_pan_card`, `custom_upload_cancelled_cheque_passbook_statement` or `address_proof` span the full grid width; `custom_upload_aadhaarfront` starts a new row (`components/onboarding/onboarding-form-step.tsx:96-109`). [CAND-06-A2.15A]
- A2.19: The Previous and Save & Next buttons sit in a container with the classes `hidden` and `aria-hidden="true"`; Previous is disabled on the first step or while saving and Save & Next reads `Saving...` while saving (`components/onboarding/onboarding-form-step.tsx:802-816`). [CAND-06-A2.14A] [CAND-06-A2.14B]

### A3: Step navigation

- A3.1: The step list is the configured tabs plus a final `Review` step; when any tab has at least one visible field, the badges and the progress bar are computed from the live step data and the server's `field_counts` and `field_status_counts` are ignored (`components/onboarding/onboarding-step-nav.tsx:31,45-158`). [CAND-06-A3.1A] [CAND-06-A3.1D]
- A3.2: A field whose `depends_on` evaluates false, a `custom_communication_address_proof` while `custom_same_as_permanent` is set, and a `custom_jf_employment` while `is_fresher` is set are left out of the counts entirely (`components/onboarding/onboarding-step-nav.tsx:51-64`). [CAND-06-A3.1B]
- A3.3: A field counts as filled when its value is non-blank after trimming, or when its `approval_status` is `Approved`; an approved field is kept in a separate tally that is added to `filled` for display; `custom_age` with the value 0 counts as not filled and a `Check` field counts only when truthy (`components/onboarding/onboarding-step-nav.tsx:72-112,144-152`). [CAND-06-A3.1A] [CAND-06-A3.3E]
- A3.4: With no visible field anywhere, a tab's badge is its server `field_counts` and the bar is the server's `field_status_counts` percentage; with neither, the bar is the share of completed steps, and with no tabs at all the bar is 0 per cent over the lone `Review` step (`components/onboarding/onboarding-step-nav.tsx:125-164`). [CAND-06-A3.3A] [CAND-06-A3.3B] [CAND-06-A3.3C] [CAND-06-A3.3D]
- A3.5: Every step button is always clickable and calls `goToStep(index)`; `isClickable` is the literal `true` (`components/onboarding/onboarding-step-nav.tsx:255,262-263`). [CAND-06-A3.2A] [CAND-06-A3.2D] [CAND-06-A3.2E] [CAND-06-A3.2F]
- A3.6: A step shows the success tick when its counts are all filled or approved, or when the status is anything other than `draft`; the current unfinished step shows a pencil instead and a past-but-unfinished step keeps the muted style (`components/onboarding/onboarding-step-nav.tsx:208-212,257,277-288`). [CAND-06-A3.2B] [CAND-06-A3.2C] [CAND-06-A3.2G]
- A3.7: The current step carries `aria-current="step"` (`components/onboarding/onboarding-step-nav.tsx:271`).
- A3.8: The header shows the fixed title and subtitle, the rounded percentage and, when at least one field is counted, the `filled/total` figure; the bar's inline width is that percentage (`components/onboarding/onboarding-step-nav.tsx:171-205`). [CAND-06-A3.1A] [CAND-06-A3.1C]
- A3.9: The footer holds a link to `/dashboard` (`components/onboarding/onboarding-step-nav.tsx:316-324`). [CAND-06-A3.4A]
- A3.10: `isCompleted`, `isPast`, `isNextStep` and `currentTabMandatoryFieldsAreFilled` are computed for every step button and never read; `currentTabMandatoryFieldsAreFilled` walks the whole current tab each time (`components/onboarding/onboarding-step-nav.tsx:212-254`). Issue: PWHR-1563.

### A4: Right rail

- A4.1: The ID card shows `branding.company_name`, else `branding.company`, else the literal `COMPANY NAME` (`components/onboarding/onboarding-right-rail.tsx:285-288,301`). [CAND-06-A4.1A] [CAND-06-A4.1B]
- A4.2: The joining block appears only when at least one of the joining date, role name, department name or trainee date is present, and each line is drawn only for the value it has; the dates are formatted with the `en-IN` locale (`components/onboarding/onboarding-right-rail.tsx:145-157,312-355`). [CAND-06-A4.1B] [CAND-06-A4.1C] [CAND-06-A4.1D]
- A4.3: The countdown is `joining.days_to_joining` when it is a number; otherwise it is the whole-day difference between the joining date in the merged step data and today, both at midnight; with no joining date the card shows a dash and an invitation to fill the date (`components/onboarding/onboarding-right-rail.tsx:140-173,362-390`). [CAND-06-A4.1E]
- A4.4: The checklist lists the mandatory visible fields of the current tab that `isFieldFilled` reports as empty, shows at most five and then a count of the rest, and jumping to one scrolls the element `field-<fieldname>` into view (`components/onboarding/onboarding-right-rail.tsx:175-247,258-277,477-507`). [CAND-06-A4.2A] [CAND-06-A4.2C]
- A4.5: A mandatory table contributes one checklist entry per mandatory child field of each row, with the row number in the label when there is more than one row; when it is mandatory and no child field is mandatory, the table itself is one entry (`components/onboarding/onboarding-right-rail.tsx:182-225`). [CAND-06-A4.2C]
- A4.6: Save & Continue is rendered only outside the review step, is disabled while any required field is missing or while saving, and reads `Fill N more to continue` in that state; it calls the context handler with `save_continue` (`components/onboarding/onboarding-right-rail.tsx:663-697`). [CAND-06-A4.2B] [CAND-06-A4.4A] [CAND-06-A4.4C]
- A4.7: Save as Draft & Exit calls the context handler with `save_draft` on a form step; on the review step it awaits `submitAll("save")` and then navigates the window to `/dashboard` (`components/onboarding/onboarding-right-rail.tsx:700-713`). [CAND-06-A4.4A] [CAND-06-A4.4B]
- A4.8: A tip card appears only for a focused field name that is one of the 14 keys of the built-in `FIELD_TIPS` table; the texts are fixed in the component (`components/onboarding/onboarding-right-rail.tsx:28-86,280-283,459-471`). [CAND-06-A4.3A]
- A4.9: Only a contact with no `role`, or the role `Onboarding Buddy`, is listed under the buddy heading; the heading is plural above one buddy and the empty state reads `No onboarding buddy assigned yet.` (`components/onboarding/onboarding-right-rail.tsx:113-129,595,652-656`). [CAND-06-A4.5A] [CAND-06-A4.5B]
- A4.10: The initials are the first letters of the first two words, else the first two characters of the single word, else `OB` for an empty name (`components/onboarding/onboarding-right-rail.tsx:88-95`). [CAND-06-A4.5C]
- A4.11: The journey card shows the configured title and subtitle, else `After you're onboarded` and a sentence built from the company name, and cycles five icons over the steps (`components/onboarding/onboarding-right-rail.tsx:528-585`). [CAND-06-A4.6A]

### A5: File upload field

- A5.1: The box shows the label, a star when required, and either the stored file's last path segment with a remove button, or the drop zone with the help text; the default accept list is `.svg,.png,.jpg,.jpeg,.pdf` and the default help text names 5 MB (`components/onboarding/file-upload-field.tsx:49-50,67-70,193-270`). [CAND-06-A5.1A] [CAND-06-A5.1C]
- A5.2: Picking a file in the hidden input, or clicking the drop zone and then picking one, uploads it and calls the caller back with the returned `file_url` (`components/onboarding/file-upload-field.tsx:79-83,101-104,111-115`). [CAND-06-A5.1B] [CAND-06-A5.1D]
- A5.3: A file over 5 MB sets the inline message `File size must be less than 5MB` and is not uploaded; the file type is never checked in code, so a dropped file of any type is uploaded (`components/onboarding/file-upload-field.tsx:96-99,140-151`). [CAND-06-A5.2A] [CAND-06-A5.2C] Issue: PWHR-1564.
- A5.4: A rejected upload logs `Upload failed` and shows `Upload failed. Please try again.`; the stored value is left alone, and the caller's `error` wins over the internal one in the message line (`components/onboarding/file-upload-field.tsx:104-107,275`). [CAND-06-A5.2B] [CAND-06-A5.5A]
- A5.5: Clicking a stored file opens it in a new tab with `noopener,noreferrer`; a value that does not start with `http` is prefixed with the same-origin backend base, an absolute one is used as is (`components/onboarding/file-upload-field.tsx:72-78,84-88,206-208`). [CAND-06-A5.3A] [CAND-06-A5.3B]
- A5.6: Removing calls the caller back with `null`; the remove button is not rendered while the field is disabled or an upload is running, and the drop zone then carries the dimmed, not-allowed classes (`components/onboarding/file-upload-field.tsx:121-126,215-226,243-245`). [CAND-06-A5.4B] [CAND-06-A5.4C]
- A5.7: While an upload is running the zone shows a spinner and the word `Uploading...` (`components/onboarding/file-upload-field.tsx:248-255`). [CAND-06-A5.4A]
- A5.8: The hidden input is cleared after each change so the same file can be picked again, a change with no file returns before any upload, and a drop is ignored while the field is disabled or an upload is running (`components/onboarding/file-upload-field.tsx:92-93,111-119,138-150`). [CAND-06-A5.5C]
- A5.9: An approved field shows a tick labelled `Approved field`; a rejected field with an HR comment shows a tooltip trigger labelled `Rejection reason` next to the resubmit button (`components/onboarding/file-upload-field.tsx:152-181`). [CAND-06-A5.6A] [CAND-06-A5.6B]

### A6: Dynamic table field

- A6.1: An empty table appends one blank row once on mount, the add button appends another, and a row can be removed only while more than one row exists and the table is not read-only (`components/onboarding/dynamic-table-field.tsx:135-145,331-345`). [CAND-06-A6.1A] [CAND-06-A6.1B] [CAND-06-A6.1C]
- A6.2: A child error shows only when that cell was touched, or a submit has happened after the row was added, or it is the date-of-birth error of a non-child family row; the table-level message shows unless it is a `required` error on a row added after the last submit (`components/onboarding/dynamic-table-field.tsx:143-180,346-363`). [CAND-06-A6.2A] [CAND-06-A6.2B]
- A6.3: In `custom_family_details` an option already chosen in another row is removed from the other rows' lists, and the add button disappears when every option is used, unless `Child` is one of the options, in which case it never disappears (`components/onboarding/dynamic-table-field.tsx:211-244,387-399`). [CAND-06-A6.3A] [CAND-06-A6.3B] [CAND-06-A6.3C]
- A6.4: A read-only table has no add and no remove button and every child field is forced read-only (`components/onboarding/dynamic-table-field.tsx:331,405-411,428`). [CAND-06-A6.4A]
- A6.5: In `custom_education_details` the levels offered are the four fixed ones, cut to the first three unless `custom_has_post_graduation_degree` is the word `yes` in any case, minus the ones already chosen elsewhere; the add button goes when every applicable level is chosen (`components/onboarding/dynamic-table-field.tsx:22-39,191-208,236-244,366-381`). [CAND-06-A6.5A] [CAND-06-A6.5B] [CAND-06-A6.5C] [CAND-06-A6.5D]
- A6.6: A year of passing that is not strictly later than the year of a lower education level in another row is cleared automatically (`components/onboarding/dynamic-table-field.tsx:266-306`). [CAND-06-A6.6A]
- A6.7: Changing the relation in a family row revalidates the whole table; changing any other cell revalidates only that cell and only while it already has an error (`components/onboarding/dynamic-table-field.tsx:84-95`). [CAND-06-A6.7A]
- A6.8: A child field whose `depends_on` is false for its own row is not rendered and its value is cleared (`components/onboarding/dynamic-table-field.tsx:247-264,347-348`).
- A6.9: The container's DOM id is `field-<fieldname>` and the label carries a star when the table is mandatory by `is_mandatory`, `reqd` or `mandatory_depends_on` (`components/onboarding/dynamic-table-field.tsx:176-181,310-315`). [CAND-06-A6.2B]

### A7: Circular progress

- A7.1: The ring draws a track circle and an arc circle sized from `size` (default 120) and `strokeWidth` (default 8), and labels the value rounded and clamped to 0-100 (`components/shared/circular-progress.tsx:25-36,48-80`). [CAND-06-A7.1A] [CAND-06-A7.1B] [CAND-06-A7.1C] [CAND-06-A7.1D]
- A7.2: The arc starts at zero and moves to the clamped value 50 ms after mount or after a change; the label never waits for that (`components/shared/circular-progress.tsx:29,39-45,79`). [CAND-06-A7.1B]

### A8: Review step

- A8.1: The declaration checkbox is validated by a Zod literal, so an unticked box blocks the submit with `You must accept the declaration to submit` (`components/onboarding/steps/review-step.tsx:88-100,336-358`, `lib/validation/onboarding-schemas.ts:15-19`). [CAND-06-A8.1A]
- A8.2: A ticked box submits with `submitAll("submit")` and, on a rejection, shows the error's message, else `Failed to submit. Please try again.` (`components/onboarding/steps/review-step.tsx:102-117,359-366`). [CAND-06-A8.1B] [CAND-06-A8.1C] [CAND-06-A8.1D]
- A8.3: A rejected field whose value still equals its original blocks the submit twice over: the Submit button is disabled and the submit handler shows the list inline and a toast (`components/onboarding/steps/review-step.tsx:73-86,103-108,374-377`). [CAND-06-A8.2A] [CAND-06-A8.2B] [CAND-06-A8.2C]
- A8.4: A tab that is not in the completed set is listed in a warning block and the Submit button is disabled; each name there jumps to that step, and Back calls the context's previous-step handler (`components/onboarding/steps/review-step.tsx:119-125,191-212,370-377`). [CAND-06-A8.4A] [CAND-06-A8.4B]
- A8.5: A tab's one-line summary is `N <label> Added` or `No <label> Added` when the tab holds a table, otherwise the first two string values of the saved data joined by a space, which drops numbers (`components/onboarding/steps/review-step.tsx:158-172`). [CAND-06-A8.3A] [CAND-06-A8.5A]
- A8.6: Expanding a section lists the visible fields that have a value, prints a table row by row as `Item #n`, writes `No <label> added` for an empty or absent table, skips a hidden or empty child field, and offers `Edit this section`; only one section is open at a time (`components/onboarding/steps/review-step.tsx:179-181,219-317`). [CAND-06-A8.5B] [CAND-06-A8.5C] [CAND-06-A8.5D]
- A8.7: With the status `submitted` the whole step is replaced by a success panel whose wording depends on whether the configuration status is `Completed`, with a button that pushes `/dashboard` (`components/onboarding/steps/review-step.tsx:127-148`). [CAND-06-A8.3B] [CAND-06-A8.6A] [CAND-06-A8.6B]

### A9: Portal stepper sidebar

- A9.1: With survey steps present, each step's icon is chosen from the key (`offer`, `onboarding`, else the clipboard), it is ongoing when it is the page's own step, when its status is `ongoing` or when its key is the survey's `current_step`, completed when its status is `completed` and not ongoing, and pending otherwise (`components/portal/portal-stepper-sidebar.tsx:46-85`). [CAND-06-A9.1A] [CAND-06-A9.1B]
- A9.2: Without survey steps a fixed three-step list is used, whose statuses follow the page the sidebar is on (`components/portal/portal-stepper-sidebar.tsx:86-113`). [CAND-06-A9.3A] [CAND-06-A9.3B]
- A9.3: A step with a `redirect_url` is a link only while `isViewOnly` is false; the prop defaults to true, so the sidebar is inert unless the caller says otherwise (`components/portal/portal-stepper-sidebar.tsx:34,212-223`). [CAND-06-A9.1A]
- A9.4: When the caller passes expanded items, they are listed under the page's own step, the step header becomes a toggle for them, and selecting one reports its index (`components/portal/portal-stepper-sidebar.tsx:143-148,183-189,205-211,225-248`). [CAND-06-A9.2A] [CAND-06-A9.2B]
- A9.5: The bottom card names the survey's `next_step` label, falling back to the raw key when nothing matches and to a fixed word per page without survey data (`components/portal/portal-stepper-sidebar.tsx:115-127,261-269`). [CAND-06-A9.1C] [CAND-06-A9.3A] [CAND-06-A9.3B]
- A9.6: The caller's extra classes are added to the outer container (`components/portal/portal-stepper-sidebar.tsx:131-134`). [CAND-06-A9.3C]

### A10: Onboarding wizard placeholder

- A10.1: `OnboardingWizard` renders the text `Onboarding Wizard Placeholder` and a `Complete` button that calls the callback; it accepts a user, a profile and the callback and reads none of the first two (`components/onboarding-wizard.tsx:14-21`). [CAND-06-A10.1A] [CAND-06-A10.1B]
- A10.2: Nothing imports it: a search for `OnboardingWizard` and `onboarding-wizard` over `app/`, `lib/` and `components/` at the Described-at commit matched only its own definition and its own prop interface (`components/onboarding-wizard.tsx:3,14`). Issue: PWHR-1565.

## 4. Data and permissions

- The components read and write only the form values held by the onboarding context; none of them talks to a backend directly (`components/onboarding/onboarding-form-step.tsx:143-157`, `components/onboarding/onboarding-step-nav.tsx:22-29`, `components/onboarding/onboarding-right-rail.tsx:100-107`, `components/onboarding/steps/review-step.tsx:46-55`).
- The field values touched by name in these components are `is_fresher`, `custom_jf_employment`, `custom_jf_declaration_date`, `custom_email_id`, `custom_date_of_birth`, `custom_age`, `custom_same_as_permanent`, `custom_communication_address_proof`, `custom_education_details`, `custom_has_post_graduation_degree`, `education_level`, `year_of_passing`, `custom_family_details`, `relation`, `dob`, `custom_upload_aadhaarfront`, `custom_upload_pan_card`, `custom_bank_statement_attachment`, `custom_date_of_joining` and `date_of_joining` (`components/onboarding/onboarding-form-step.tsx:33-35,96-105,177,305,364,430,581-585`, `components/onboarding/dynamic-table-field.tsx:14-20,353-356`, `components/onboarding/onboarding-right-rail.tsx:140-142`).
- The only identifying data shown is what the backend already put in the configuration: the buddy's name, designation, e-mail and phone, and the joining role, department and dates (`components/onboarding/onboarding-right-rail.tsx:113-129,312-355,596-650`).
- Uploaded files go through `useFileUpload` to the backend's upload endpoint; the component keeps only the returned URL string (`components/onboarding/file-upload-field.tsx:65,101-104`).
- None of these components reads a role, a permission or a session; who may open the onboarding page is decided in SPEC-CAND-01 and SPEC-CAND-05.
- Statutory source: not applicable. The declaration text in the review step is a company statement about background verification and the accuracy of the information, not a statement of law, and no tax, PF, leave or data-protection rule is asserted or computed in these components (`components/onboarding/steps/review-step.tsx:327-332`).

## 5. Errors and edge behaviour

- A rejected `submitAll` inside the form step and inside the registered `save_continue` handler is caught and discarded; the only sign is that the step does not advance (`components/onboarding/onboarding-form-step.tsx:507-509,526-528`).
- A rejected `save_draft` returns false and the window is not navigated (`components/onboarding/onboarding-form-step.tsx:539-541`).
- A rejected upload leaves the stored value untouched and shows a fixed sentence, not the backend's message (`components/onboarding/file-upload-field.tsx:104-107`).
- In the right rail, a `save_draft` on the review step that rejects is swallowed and the window is not navigated (`components/onboarding/onboarding-right-rail.tsx:703-709`).
- A joining date that `new Date` cannot parse produces `NaN` days, which is neither `null` nor `>= 0`, so the card shows `0` and the words `Start date passed` (`components/onboarding/onboarding-right-rail.tsx:164-173,365-374`).
- `formatDisplayDate` wraps `toLocaleDateString` in a try block and returns the raw string on a throw (`components/onboarding/onboarding-right-rail.tsx:145-157`). [INFERENCE] An unparsable date reaches `toLocaleDateString` and yields `Invalid Date` rather than throwing; that is standard JavaScript behaviour, not read from a specification here and not asserted by a case.
- The review step's submit handler returns before `submitAll` when any rejected field is uncorrected, so its inline error is the rejected-field list and not a backend message (`components/onboarding/steps/review-step.tsx:103-108`).
- `OnboardingFormStep` calls `useAuth` inside a `try`, so a render outside the auth provider falls back to an empty e-mail instead of throwing (`components/onboarding/onboarding-form-step.tsx:146-154`).

## 6. Configuration

- No environment variable is read in these files. `FileUploadField` reads the backend base through `frappeApiBase()`, which is built from `NEXT_PUBLIC_FRAPPE_URL` and `FRAPPE_BASE_URL` in the browser-proxy form described in SPEC-CAND-02 (`components/onboarding/file-upload-field.tsx:9,76`).
- The constants that steer behaviour are written in the components: the 5 MB upload limit and the accept list (`components/onboarding/file-upload-field.tsx:49-50,96`), the 150 ms auto-save delay (`components/onboarding/onboarding-form-step.tsx:464`), the 300 ms delay before focusing a jumped-to field and the 900 ms highlight (`components/onboarding/onboarding-right-rail.tsx:260-275`), the 50 ms animation delay of the ring (`components/shared/circular-progress.tsx:43`), the four education levels (`components/onboarding/dynamic-table-field.tsx:17`), the three field names with fixed rules (`components/onboarding/onboarding-form-step.tsx:33-35`), and the 14 tip texts (`components/onboarding/onboarding-right-rail.tsx:28-86`).
- Everything else comes from the backend's form configuration object at run time (section 1).

## 7. Scheduled jobs, hooks and patches

None. These are client components; they run React effects only. The effects are: the age recomputation, the declaration date, the e-mail prefill, the address copy, the address clear, the hidden-field clear and the 150 ms auto-save in the form step (`components/onboarding/onboarding-form-step.tsx:306,330,347,365,396,416,460`), the first-row append and the dependent-field and year clearing in the table field (`components/onboarding/dynamic-table-field.tsx:136,246`), and the 50 ms arc animation in the ring (`components/shared/circular-progress.tsx:39`).

## 8. Static security and performance observations

- Security: an uploaded file is checked for size only; its type, extension and content are never checked in this component, and the `accept` attribute is a browser hint that a drop bypasses (`components/onboarding/file-upload-field.tsx:96-104,140-150,266-273`). Issue: PWHR-1564.
- Security: a stored file value that begins with `http` is opened in a new tab exactly as given, with no check that it points at the backend; the tab is opened with `noopener,noreferrer` (`components/onboarding/file-upload-field.tsx:72-78,84-88`). Issue: PWHR-1566.
- Security: `evaluateDependsOn`, which these components call for every field on every render, builds a function from the configuration string with `new Function` (`lib/onboarding-utils.ts:28-41`, called at `components/onboarding/onboarding-form-step.tsx:659`, `components/onboarding/onboarding-step-nav.tsx:52`, `components/onboarding/dynamic-table-field.tsx:250`, `components/onboarding/steps/review-step.tsx:245`). The string comes from the backend configuration, not from a browser input. The function itself is SPEC-CAND-05.
- Security: `save_draft` and the review-step draft button navigate with `window.location.assign("/dashboard")`, a fixed path, not a value from the data (`components/onboarding/onboarding-form-step.tsx:537`, `components/onboarding/onboarding-right-rail.tsx:706`).
- Security: no component writes to `localStorage` or `sessionStorage`; a grep for both names over the ten files of this clause at the Described-at commit matched nothing.
- Security: the buddy card builds `mailto:` and `tel:` links from the configuration values and opens the mail link with `window.open` (`components/onboarding/onboarding-right-rail.tsx:620-645`).
- Performance: `OnboardingFormStep` subscribes to every form value with `useWatch` without a name, so each keystroke re-renders the whole step and re-runs the merged-document memo, the visibility pass, the section counts and the five value-fixing effects (`components/onboarding/onboarding-form-step.tsx:239,295-302,416-457,692-710`).
- Performance: `OnboardingStepNav` recomputes the counts of every field of every tab whenever the merged step data changes, and recomputes `currentTabMandatoryFieldsAreFilled` once per step button per render even though the result is unused (`components/onboarding/onboarding-step-nav.tsx:45-124,217-254`). Issue: PWHR-1563.
- Performance: `OnboardingRightRail` rebuilds the required-field list from the current tab on every change of the merged document, walking every row of every mandatory table (`components/onboarding/onboarding-right-rail.tsx:175-247`).
- Performance: the review step flattens every field of every tab for the rejected-field check on every change of the step data, and `getSummary` runs for every tab on every render (`components/onboarding/steps/review-step.tsx:73-86,158-172,220`).
- Performance: the auto-save timer is reset on every form value change, so saving is deferred until the candidate pauses for 150 ms (`components/onboarding/onboarding-form-step.tsx:460-466`).
- Performance: `DynamicTableField` watches the whole table array, so editing one cell re-renders every row of that table (`components/onboarding/dynamic-table-field.tsx:182-189`).
- No load test and no security scan was run; everything above is read from the source.

## 9. Known gaps / open questions

- G1: `OnboardingStepNav` computes `isCompleted`, `isPast`, `isNextStep` and a whole-tab mandatory-field scan per step button and reads none of them, and `isClickable` is the literal `true`, so every step is always reachable (A3.5, A3.10) (`components/onboarding/onboarding-step-nav.tsx:212-255`). Was the gating of future steps meant to stay? Its only test is skipped (section 10). Issue: PWHR-1563.
- G2: `FileUploadField` validates the size but never the type, so any file dragged in is uploaded; the `accept` attribute only filters the picker (A5.3) (`components/onboarding/file-upload-field.tsx:96-104,140-150,266-273`). Is a type check expected on the client, or is the backend the only gate? Issue: PWHR-1564.
- G3: `components/onboarding-wizard.tsx` is a placeholder with no importer in `app/`, `lib/` or `components/` (A10.2), and two tests pin its placeholder text (`components/onboarding-wizard.tsx:17`). Dead file, or a planned replacement? Issue: PWHR-1565.
- G4: A stored attachment value beginning with `http` is opened without a check that it is a backend URL (A5.5) (`components/onboarding/file-upload-field.tsx:74-77`). The value comes from the backend today. Issue: PWHR-1566.
- G5: `OnboardingFormStep` and `ReviewStep` each hold their own copy of the rejected-field comparison, and `OnboardingStepNav`, `OnboardingRightRail` and `OnboardingFormStep` each hold their own copy of the per-field count rules, which already differ: the step nav keeps approved fields in a separate tally and the form step folds them into `filled` (`components/onboarding/onboarding-form-step.tsx:484-500,692-710`, `components/onboarding/steps/review-step.tsx:73-86`, `components/onboarding/onboarding-step-nav.tsx:45-124`). Not filed: duplication, no behaviour difference proved by a case.
- G6: The right rail's countdown shows `0` and `Start date passed` for a date string that cannot be parsed, which is the same output as a date in the past (section 5) (`components/onboarding/onboarding-right-rail.tsx:164-173`). Not filed: the existing test pins it.
- G7: Branch drift: on `deploy/hybrowbase-candidate-20261025` the right rail lists every key contact as a buddy and leaves out the mandatory-table fallback entry, and the review step prints monetary values with `String(...)` (header). The cases of A4.9 and A8.6 describe `develop` only. Issue: PWHR-1567.
- G8: Six test titles are used twice in `tests/components/onboarding/file-upload-field.test.tsx` because a `describe` block is nested inside a block of the same name and repeats its six tests verbatim, so the file runs 24 `it(` calls of which 12 carry one of the six duplicated titles: the six at `tests/components/onboarding/file-upload-field.test.tsx:193-260` and their copies at `:262-331`, inside the outer block `:192-332`. A duplicate title cannot be named by a case selector. Issue: PWHR-1568.
- G9: Every case in this clause mocks the onboarding context, the survey hook, the upload hook, the field renderer or the router; none exercises a real backend. Hosted CI is UNVERIFIED.
- G10: `tests/components/onboarding/onboarding-right-rail.test.tsx:120-124` builds its joining date with `toISOString`, which is UTC, while the countdown in `components/onboarding/onboarding-right-rail.tsx:164-173` subtracts two local midnights. On a machine whose local date has already rolled past the UTC date the two disagree by one day and the test fails; it was observed failing under `Asia/Calcutta` and passing under `TZ=UTC` on 2026-10-31, at the Described-at commit and before this change touched that file. Should the component read the joining date as a local date or as UTC? Issue: PWHR-1569.
- G10.1: Two further tests in the same file fail west of UTC, for a second, separate reason. `formatDisplayDate` calls `new Date(d)` on a bare `YYYY-MM-DD` string, which JavaScript parses as UTC midnight, and then renders it with `toLocaleDateString("en-IN", ...)`, which uses the machine's local zone (`components/onboarding/onboarding-right-rail.tsx:145-157`); in a zone behind UTC that prints the previous day, so the Date of Joining and Trainee DOJ lines of the ID card show the day before the date the backend sent (`components/onboarding/onboarding-right-rail.tsx:336-355`). Run on 2026-11-01 with Node v24.22.2 at this branch: `TZ=America/Los_Angeles npx vitest run tests/components/onboarding/onboarding-right-rail.test.tsx` gives 3 failed, 9 passed - `renders company name and joining details when provided in formConfig` (asserts `30 Jun 2026`, the card shows `29 Jun 2026`), `renders Trainee DOJ when trainee_doj is provided in joining info` (asserts `15 Jul 2026`, the card shows `14 Jul 2026`), and the countdown test of G10, which reproduces under Los Angeles as well as under Kolkata. `TZ=Asia/Kolkata` gives 1 failed, 11 passed (the countdown test only); `TZ=UTC` gives 12 passed. One Los Angeles run over 34 files, a superset of the 32 files this clause and SPEC-CAND-05 map, gave 3 failed, 330 passed, 1 skipped: those three and no other timezone-dependent failure. Is the joining date meant to be read as a local date or as a UTC instant? Issue: PWHR-1569 carries the countdown and these two lines together.
- Statutory source: not applicable (section 4).

## 10. Uncovered behaviour

- A3.5 gating: the only test of a disabled future step is `it.skip("disables future steps that are not yet clickable")` (`tests/components/onboarding/onboarding-step-nav.test.tsx:197`), which is skipped and is therefore not mapped. The current behaviour is pinned instead by CAND-06-A3.2A. Issue: PWHR-1563 carries the question.
- The 11 tests in `tests/components/onboarding/onboarding-form-step.test.tsx` whose only assertion is a validation message text (contact pattern, the two same-number rules, Aadhaar, PAN, postal code, IFSC, age 18, and the three nomination rules) are not mapped: same behaviour class as CAND-06-A2.2C to CAND-06-A2.2F, and the rule under test lives in `lib/validation/onboarding-validation.ts`, which is SPEC-CAND-05. Counted by script: that file holds 39 `it(` calls, 28 of which this clause maps.
- `tests/components/onboarding/dynamic-table-field.test.tsx` holds 12 `it(` calls; 11 are mapped. `does not show validation errors immediately for a newly added row` is not mapped: same behaviour class as CAND-06-A6.2A.
- `tests/components/onboarding/file-upload-field.test.tsx` holds 24 `it(` calls. Twelve of them carry one of six duplicated titles (G8) and cannot be named by a selector at all; the behaviours behind them are pinned instead by the characterization cases CAND-06-A5.5B, CAND-06-A5.5C, CAND-06-A5.5D, CAND-06-A5.5F and CAND-06-A5.6C in `tests/spec/cand-06-file-upload.test.tsx`. Of the 12 unique titles, 11 are mapped; `processes cursor exit boundaries efficiently on active drop containers` is not mapped because its only assertion is `expect(target).toBeTruthy()` after a drag-leave, which holds whatever the handler does, so the drag-leave handler has no case.
- A4.4 jumping to a field: the mapped test asserts that `scrollIntoView` was called. The 300 ms focus and the highlight animation that follow are asserted by no test (`components/onboarding/onboarding-right-rail.tsx:260-275`). Not filed: timing-dependent, no defect asserted.
- A4.11 journey icons: the mapped test asserts the titles, timeframes and details; which of the five icons is drawn for each index is asserted nowhere. Not filed: presentation only.
- A8.6 monetary values: no test renders a field that `isMonetaryField` accepts, so the `AmountDisplay` branch of the review step is not exercised (`components/onboarding/steps/review-step.tsx:281,294`). This is also the branch that differs on the deployment branch (G7). Issue: PWHR-1567 carries it.
- A2.19 hidden navigation: the two mapped cases assert the disabled states; that the container carries `hidden` and `aria-hidden` is asserted by no test. Not filed: presentation only.
- A3.7 `aria-current`: asserted by no test. Not filed: presentation only.
- A2.10 and A6.8, the clearing of `custom_communication_address_proof` and of a dependent child cell inside a table: no test drives either path; the sibling rules A2.11 and A6.3 are covered. Not filed: no defect asserted.
- `tests/components/onboarding/onboarding-step-nav.test.tsx` holds 18 `it(` calls including the skipped one; 13 are mapped. The four under `Table and Check field validation for step completion path coverage` assert only that the next tab's label is on screen, which is true in all four configurations, so they pin nothing about the counts; they are not mapped (`tests/components/onboarding/onboarding-step-nav.test.tsx:373-534`). Not filed: weak existing tests, no defect in the component.
- `tests/components/shared/circular-progress.test.tsx` holds 10 `it(` calls; 4 are mapped and the other 6 (`renders an SVG element`, `renders 0% correctly`, `renders 100% correctly`, `clamps values below 0 to 0`, `uses default size of 120 when not specified`, `accepts className prop for styling`) are not mapped: same behaviour class as the mapped clamping and sizing cases.
- `tests/components/onboarding/onboarding-right-rail.test.tsx` holds 12 `it(` calls, all mapped. `tests/components/onboarding/steps/review-step.test.tsx` holds 10, all mapped. `tests/components/onboarding/section-card.test.tsx` holds 4, all mapped. `tests/components/onboarding-wizard.test.tsx` holds 2, both mapped. `tests/components/portal/portal-stepper-sidebar.test.tsx` holds 6, all mapped; before this change none of them passed `expandedItems`, so A9.4 was uncovered and CAND-06-A9.2A and CAND-06-A9.2B now pin it.

## 11. Acceptance cases

Every case is `Evidence: UNVERIFIED`. Cases that map an existing test only gained a `// Spec:` comment line above the `it(`; all other cases are characterization tests added by this change in `tests/spec/`.

<a id="cand-06-a1"></a>
### CAND-06-A1: Section card

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A1.1A](06-onboarding-components.md#cand-06-a1-1a) | Children are rendered inside the card body. | [`renders children correctly`](../../../tests/components/onboarding/section-card.test.tsx) |
| [CAND-06-A1.1B](06-onboarding-components.md#cand-06-a1-1b) | A given title is rendered. | [`renders the title when provided`](../../../tests/components/onboarding/section-card.test.tsx) |
| [CAND-06-A1.1C](06-onboarding-components.md#cand-06-a1-1c) | No header is drawn without a title or counts. | [`does not render CardHeader when title is not provided`](../../../tests/components/onboarding/section-card.test.tsx) |
| [CAND-06-A1.1D](06-onboarding-components.md#cand-06-a1-1d) | Caller classes land on the card element. | [`applies custom className`](../../../tests/components/onboarding/section-card.test.tsx) |

<a id="cand-06-a1-1a"></a>
#### CAND-06-A1.1A: Children go in the body

- Precondition: A section card with no title and no counts.
- Action: Render it with one child element.
- Expected result: The child element and its text are in the document `components/onboarding/section-card.tsx:43-45`
- Test: mapped: `tests/components/onboarding/section-card.test.tsx::renders children correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It does not check the `data-section-title` attribute or the card classes.
- Evidence: UNVERIFIED

<a id="cand-06-a1-1b"></a>
#### CAND-06-A1.1B: Title is shown

- Precondition: A section card with a title.
- Action: Render it.
- Expected result: The title text is in the document `components/onboarding/section-card.tsx:30-34`
- Test: mapped: `tests/components/onboarding/section-card.test.tsx::renders the title when provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It does not check the justification classes or the counts badge.
- Evidence: UNVERIFIED

<a id="cand-06-a1-1c"></a>
#### CAND-06-A1.1C: No header without title or counts

- Precondition: A section card with neither a title nor counts.
- Action: Render it and look for the header element by its padding classes.
- Expected result: No element carries the header's `pt-2 px-6` classes `components/onboarding/section-card.tsx:26-27`
- Test: mapped: `tests/components/onboarding/section-card.test.tsx::does not render CardHeader when title is not provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It does not try the counts-only case, which does draw a header.
- Evidence: UNVERIFIED

<a id="cand-06-a1-1d"></a>
#### CAND-06-A1.1D: Caller classes are kept

- Precondition: A section card with an extra class name.
- Action: Render it.
- Expected result: The outer element carries that class next to the built-in ones `components/onboarding/section-card.tsx:24`
- Test: mapped: `tests/components/onboarding/section-card.test.tsx::applies custom className`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It does not check the `id` prop.
- Evidence: UNVERIFIED

<a id="cand-06-a2"></a>
### CAND-06-A2: Onboarding form step

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A2.1A](06-onboarding-components.md#cand-06-a2-1a) | Every section and field of the tab is rendered. | [`renders all sections and fields defined in the tab`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.1B](06-onboarding-components.md#cand-06-a2-1b) | Saved step data fills the inputs. | [`initializes form with existing data if available`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.1C](06-onboarding-components.md#cand-06-a2-1c) | A field default fills an input when nothing is saved. | [`initializes form from definition defaults when existing data is blank`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.2A](06-onboarding-components.md#cand-06-a2-2a) | A missing mandatory value blocks the save and scrolls to the field. | [`validates mandatory fields and prevents submission`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.2B](06-onboarding-components.md#cand-06-a2-2b) | A valid save writes, saves, completes and advances. | [`calls setStepData and nextStep on successful form submission`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.2C](06-onboarding-components.md#cand-06-a2-2c) | An empty mandatory table and an unticked mandatory check block the save. | [`validates special collection types ensuring required states are populated`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.2D](06-onboarding-components.md#cand-06-a2-2d) | A field with no label falls back to a generic required message. | [`satisfies fallback logic for anonymous and specialized field valid modes`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.2E](06-onboarding-components.md#cand-06-a2-2e) | A table row missing a mandatory child value blocks the save. | [`evaluates table field row validation for completeness and validity`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.2F](06-onboarding-components.md#cand-06-a2-2f) | A year of passing that does not increase with the level blocks the save. | [`validates that year of passing does not decrease as education level progresses`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.3A](06-onboarding-components.md#cand-06-a2-3a) | A rejected save leaves the step unfinished and unchanged. | [`stops at submitAll and never marks the step complete when the save rejects`](../../../tests/spec/cand-06-form-step.test.tsx) |
| [CAND-06-A2.4A](06-onboarding-components.md#cand-06-a2-4a) | The employment table is forced mandatory, then hidden by the fresher box. | [`forces the employment table mandatory while the fresher box is clear and hides it once it is set`](../../../tests/spec/cand-06-form-step.test.tsx) |
| [CAND-06-A2.4B](06-onboarding-components.md#cand-06-a2-4b) | Saved employment rows are emptied for a fresher. | [`empties the saved employment rows when the step loads with the fresher box already set`](../../../tests/spec/cand-06-form-step.test.tsx) |
| [CAND-06-A2.5A](06-onboarding-components.md#cand-06-a2-5a) | The declaration date is today, disabled, shown dd-mm-yyyy and saved ISO. | [`renders today's date as a disabled dd-mm-yyyy box and saves it in ISO form, ignoring any stored value`](../../../tests/spec/cand-06-form-step.test.tsx) |
| [CAND-06-A2.6A](06-onboarding-components.md#cand-06-a2-6a) | An approved empty field still counts as filled in the badge. | [`counts an approved field as filled in the section badge even when its value is blank`](../../../tests/spec/cand-06-form-step.test.tsx) |
| [CAND-06-A2.6B](06-onboarding-components.md#cand-06-a2-6b) | A section named like its tab shows only the counts badge. | [`bypasses section header rendering when section title is identical to tab header`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.7A](06-onboarding-components.md#cand-06-a2-7a) | Ticking the box copies and keeps syncing the address, unticking clears it. | [`handles custom_same_as_permanent logic by copying and syncing permanent to communication address fields, and renders on its own row`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.7B](06-onboarding-components.md#cand-06-a2-7b) | A form that loads unticked keeps its saved communication address. | [`keeps saved communication address when custom_same_as_permanent starts unchecked`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.8A](06-onboarding-components.md#cand-06-a2-8a) | Hidden and dependent-false fields are not validated. | [`bypasses validation for hidden fields or fields whose depends_on evaluates to false`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.8B](06-onboarding-components.md#cand-06-a2-8b) | A field that becomes invisible is cleared before the save. | [`automatically clears dependent fields when their visibility condition evaluates to false`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.9A](06-onboarding-components.md#cand-06-a2-9a) | The age follows the date of birth. | [`automatically calculates and populates custom_age based on custom_date_of_birth change`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.9B](06-onboarding-components.md#cand-06-a2-9b) | A birthday still to come this year gives one year less. | [`automatically calculates and populates custom_age based on custom_date_of_birth change (birthday not yet occurred this year)`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.9C](06-onboarding-components.md#cand-06-a2-9c) | An empty e-mail field is filled from the session user. | [`prefills custom_email_id with the current user email if empty`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.10A](06-onboarding-components.md#cand-06-a2-10a) | The context is written 150 ms after a change, not before. | [`triggers background state replication on throttle loop completion`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.11A](06-onboarding-components.md#cand-06-a2-11a) | An uncorrected rejected field blocks the save with a toast. | [`blocks submission and shows error toast if a rejected field is not corrected`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.12A](06-onboarding-components.md#cand-06-a2-12a) | The registered handler saves, and the draft action leaves for the dashboard. | [`registers and handles external submit triggers for save_continue and save_draft`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.12B](06-onboarding-components.md#cand-06-a2-12b) | Both registered actions return false when the save rejects. | [`handles failures during external submit triggers`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.13A](06-onboarding-components.md#cand-06-a2-13a) | An Attach Image field is drawn by the upload override. | [`satisfies specialized container mappings when resolving image attachments`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.13B](06-onboarding-components.md#cand-06-a2-13b) | An upload URL from an Attach Image field reaches the save. | [`handles file upload and attach change for Attach Image field type`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.13C](06-onboarding-components.md#cand-06-a2-13c) | The same callback writes a URL for a field inside a table. | [`handles file upload callback via handleFileUpload on table field`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.13D](06-onboarding-components.md#cand-06-a2-13d) | Rejected Attach and Attach Image fields are marked rejected. | [`computes the isRejected property for Attach and Attach Image fields correctly based on original value`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.14A](06-onboarding-components.md#cand-06-a2-14a) | Both buttons are disabled while a save runs. | [`disables buttons when isSaving is true`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.14B](06-onboarding-components.md#cand-06-a2-14b) | Previous is disabled on the first step. | [`disables 'Previous' button on the first step`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |
| [CAND-06-A2.15A](06-onboarding-components.md#cand-06-a2-15a) | The PAN and Aadhaar-front fields get their own grid rules. | [`enforces unique grid layouts for Aadhaar and long label documentation proofs`](../../../tests/components/onboarding/onboarding-form-step.test.tsx) |

<a id="cand-06-a2-1a"></a>
#### CAND-06-A2.1A: Every configured field is drawn

- Precondition: A tab with a data section, an attach section and a table section.
- Action: Render the step.
- Expected result: Both data labels, the attach label, the table placeholder and the upload control are in the document `components/onboarding/onboarding-form-step.tsx:655-800`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::renders all sections and fields defined in the tab`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The field renderer and the table field are mocked, so the real widgets are not drawn; the grid classes are not checked here.
- Evidence: UNVERIFIED

<a id="cand-06-a2-1b"></a>
#### CAND-06-A2.1B: Saved values fill the form

- Precondition: The context holds a first and last name for this step key.
- Action: Render the step.
- Expected result: The first-name input holds the saved value `components/onboarding/onboarding-form-step.tsx:164-171`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::initializes form with existing data if available`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. Only one of the two saved values is asserted and the table default of `[]` is not.
- Evidence: UNVERIFIED

<a id="cand-06-a2-1c"></a>
#### CAND-06-A2.1C: A field default is used

- Precondition: Nothing is saved for the step key; one field carries a `default`.
- Action: Render the step.
- Expected result: That input holds the configured default `components/onboarding/onboarding-form-step.tsx:182-193`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::initializes form from definition defaults when existing data is blank`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It does not try a field that carries both a `value` and a `default`, where `value` wins.
- Evidence: UNVERIFIED

<a id="cand-06-a2-2a"></a>
#### CAND-06-A2.2A: A missing mandatory value blocks the save

- Precondition: A tab with a mandatory field and nothing filled in.
- Action: Submit the step.
- Expected result: The field shows its error, the step does not advance and `scrollIntoView` is called with smooth behaviour and centre block `components/onboarding/onboarding-form-step.tsx:468-481`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::validates mandatory fields and prevents submission`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The focus call that follows the scroll is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a2-2b"></a>
#### CAND-06-A2.2B: A valid save advances the wizard

- Precondition: A tab whose mandatory data field and mandatory attach field are both filled.
- Action: Submit the step.
- Expected result: The step data is written, `submitAll` is called with `save`, the step key and the values, the step is marked complete and the wizard advances `components/onboarding/onboarding-form-step.tsx:502-506`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::calls setStepData and nextStep on successful form submission`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The order of the four calls is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a2-2c"></a>
#### CAND-06-A2.2C: Empty mandatory table and check

- Precondition: A tab with a mandatory table and a mandatory check, neither filled.
- Action: Submit the step.
- Expected result: The table shows `Mandatory Table is required` and the check field shows its own error `components/onboarding/onboarding-form-step.tsx:199-216`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::validates special collection types ensuring required states are populated`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The check field's exact message text is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a2-2d"></a>
#### CAND-06-A2.2D: A nameless field gets a generic message

- Precondition: A tab with a mandatory field whose label is empty, plus an empty mandatory table and check.
- Action: Submit the step.
- Expected result: The messages are `This field is required`, `Blank Table is required` and `False Check is required`, and no save is attempted `components/onboarding/onboarding-form-step.tsx:199-216`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::satisfies fallback logic for anonymous and specialized field valid modes`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The message strings come from the validation module, which is SPEC-CAND-05.
- Evidence: UNVERIFIED

<a id="cand-06-a2-2e"></a>
#### CAND-06-A2.2E: A half-filled table row blocks the save

- Precondition: A table whose single saved row has the mandatory company empty and the optional role filled.
- Action: Submit the step.
- Expected result: The table shows `Please complete all required fields in Experience Table` `components/onboarding/onboarding-form-step.tsx:199-216`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::evaluates table field row validation for completeness and validity`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The table field is mocked, so only the message handed to it is checked.
- Evidence: UNVERIFIED

<a id="cand-06-a2-2f"></a>
#### CAND-06-A2.2F: Out-of-order years block the save

- Precondition: An education table whose later level carries an earlier year of passing.
- Action: Submit the step.
- Expected result: The step shows the year-sequence error and does not advance `components/onboarding/onboarding-form-step.tsx:199-216`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::validates that year of passing does not decrease as education level progresses`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The rule itself lives in the validation module, which is SPEC-CAND-05.
- Evidence: UNVERIFIED

<a id="cand-06-a2-3a"></a>
#### CAND-06-A2.3A: A rejected save stops the wizard quietly

- Precondition: The context's save function rejects; the tab has only an optional field.
- Action: Fill it and submit the step.
- Expected result: `submitAll` is called with `save`, the step key and the values, but the step is not marked complete and the wizard does not advance `components/onboarding/onboarding-form-step.tsx:502-509`
- Test: characterization: `tests/spec/cand-06-form-step.test.tsx::stops at submitAll and never marks the step complete when the save rejects`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The catch block is empty, so there is no message for the candidate to see and none is asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a2-4a"></a>
#### CAND-06-A2.4A: The fresher box rules the employment table

- Precondition: A tab with the fresher check and the employment table; nothing saved.
- Action: Render the step, then set the fresher value.
- Expected result: Before the change the table is handed `is_mandatory` 1; after it the table is not rendered `components/onboarding/onboarding-form-step.tsx:732-753`
- Test: characterization: `tests/spec/cand-06-form-step.test.tsx::forces the employment table mandatory while the fresher box is clear and hides it once it is set`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The table field is mocked, so the forcing of each child field to mandatory is read only through the parent field's props.
- Evidence: UNVERIFIED

<a id="cand-06-a2-4b"></a>
#### CAND-06-A2.4B: A fresher's saved rows are emptied

- Precondition: The saved step data holds a truthy fresher value and one employment row.
- Action: Render the step and let the auto-save run.
- Expected result: The context is written with an empty employment array `components/onboarding/onboarding-form-step.tsx:420-428`
- Test: characterization: `tests/spec/cand-06-form-step.test.tsx::empties the saved employment rows when the step loads with the fresher box already set`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It does not check whether the backend is told about the clearing; that is the context's job, SPEC-CAND-05.
- Evidence: UNVERIFIED

<a id="cand-06-a2-5a"></a>
#### CAND-06-A2.5A: The declaration date is always today

- Precondition: The saved step data holds an old declaration date.
- Action: Render the declaration tab and let the auto-save run.
- Expected result: The box is disabled and reads today as `dd-mm-yyyy`, and the context is written with today in ISO form `components/onboarding/onboarding-form-step.tsx:772-786`
- Test: characterization: `tests/spec/cand-06-form-step.test.tsx::renders today's date as a disabled dd-mm-yyyy box and saves it in ISO form, ignoring any stored value`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. Today is read from the system clock in both the test and the component, so a midnight crossing between the two reads would make it fail; the component holds no time zone handling.
- Evidence: UNVERIFIED

<a id="cand-06-a2-6a"></a>
#### CAND-06-A2.6A: An approved field counts as filled

- Precondition: A section with an approved field whose saved value is empty and a second, empty field.
- Action: Render the step.
- Expected result: The section badge reads `1/2` `components/onboarding/onboarding-form-step.tsx:692-710`
- Test: characterization: `tests/spec/cand-06-form-step.test.tsx::counts an approved field as filled in the section badge even when its value is blank`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It does not try the `custom_age` zero rule or a `Check` field here.
- Evidence: UNVERIFIED

<a id="cand-06-a2-6b"></a>
#### CAND-06-A2.6B: A section named like its tab has no title

- Precondition: A tab whose only section carries the same name as the tab.
- Action: Render the step.
- Expected result: No card title element exists, the name is nowhere on screen and the badge reads `0/1` `components/onboarding/onboarding-form-step.tsx:718`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::bypasses section header rendering when section title is identical to tab header`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It does not check the `data-section-title` attribute, which still carries the name.
- Evidence: UNVERIFIED

<a id="cand-06-a2-7a"></a>
#### CAND-06-A2.7A: Same-as-permanent copies and clears

- Precondition: An address tab with the check, two permanent fields and the two matching communication fields.
- Action: Fill the permanent fields, tick the box, change a permanent field, then untick the box.
- Expected result: Nothing is copied while unticked; ticking copies both; a later change is copied too; unticking empties both communication fields and leaves the permanent ones; the check field spans the full width `components/onboarding/onboarding-form-step.tsx:364-413`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::handles custom_same_as_permanent logic by copying and syncing permanent to communication address fields, and renders on its own row`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The misspelled `permananent` pairing is covered only through the city field; a table-typed communication field, which is cleared to `[]`, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a2-7b"></a>
#### CAND-06-A2.7B: A form that loads unticked keeps its address

- Precondition: The saved step data has the box clear, a permanent address and a different communication address.
- Action: Render the step.
- Expected result: The communication input still holds its own saved value `components/onboarding/onboarding-form-step.tsx:395-412`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::keeps saved communication address when custom_same_as_permanent starts unchecked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The ticked-to-unticked transition itself is covered by CAND-06-A2.7A.
- Evidence: UNVERIFIED

<a id="cand-06-a2-8a"></a>
#### CAND-06-A2.8A: Invisible fields are not validated

- Precondition: A tab with a visible mandatory field, a hidden mandatory field and a mandatory field whose `depends_on` is false.
- Action: Fill the visible field with a value that keeps the dependency false and submit.
- Expected result: No error is shown for any of the three fields `components/onboarding/onboarding-form-step.tsx:199-216`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::bypasses validation for hidden fields or fields whose depends_on evaluates to false`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. Whether the save ran is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a2-8b"></a>
#### CAND-06-A2.8B: A field that becomes invisible is cleared

- Precondition: A tab with a driver field and a dependent field.
- Action: Make the dependent field visible, give it a value, then make it invisible again and submit.
- Expected result: The saved values carry the new driver value and an empty string for the dependent field `components/onboarding/onboarding-form-step.tsx:440-455`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::automatically clears dependent fields when their visibility condition evaluates to false`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The table case, which is cleared to `[]`, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a2-9a"></a>
#### CAND-06-A2.9A: Age follows the date of birth

- Precondition: A tab with a date-of-birth field and an age field.
- Action: Enter a date exactly 25 years ago.
- Expected result: The age input reads 25 `components/onboarding/onboarding-form-step.tsx:305-327`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::automatically calculates and populates custom_age based on custom_date_of_birth change`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It reads the system clock; a date that cannot be parsed is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a2-9b"></a>
#### CAND-06-A2.9B: A birthday still to come counts one less

- Precondition: The same tab.
- Action: Enter a date 25 years back whose month is later in the year than today's.
- Expected result: The age input reads 24 `components/onboarding/onboarding-form-step.tsx:313-317`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::automatically calculates and populates custom_age based on custom_date_of_birth change (birthday not yet occurred this year)`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It builds the date with `today.getMonth() + 1`, so it depends on the month the test runs in; the same-month, later-day case is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a2-9c"></a>
#### CAND-06-A2.9C: The e-mail field is prefilled

- Precondition: The auth context returns a user with an e-mail; the e-mail field is empty.
- Action: Render the step.
- Expected result: The e-mail input holds that address `components/onboarding/onboarding-form-step.tsx:347-361`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::prefills custom_email_id with the current user email if empty`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. An already filled field, which is left alone, is not tried, and neither is the throwing-`useAuth` fallback.
- Evidence: UNVERIFIED

<a id="cand-06-a2-10a"></a>
#### CAND-06-A2.10A: Auto-save waits 150 ms

- Precondition: Fake timers are installed and the step is rendered.
- Action: Change a field, advance 50 ms, then advance past 150 ms.
- Expected result: Nothing is written at 50 ms; after the window the context is written with the new value under the step key `components/onboarding/onboarding-form-step.tsx:460-466`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::triggers background state replication on throttle loop completion`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. That a second change restarts the timer is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a2-11a"></a>
#### CAND-06-A2.11A: An uncorrected rejected field blocks the save

- Precondition: A tab with a rejected field whose saved value equals its original.
- Action: Submit the step without changing it.
- Expected result: A toast names the field after `Please correct all rejected fields before proceeding:` and the wizard does not advance `components/onboarding/onboarding-form-step.tsx:497-500`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::blocks submission and shows error toast if a rejected field is not corrected`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The corrected case, which lets the save run, is not tried here.
- Evidence: UNVERIFIED

<a id="cand-06-a2-12a"></a>
#### CAND-06-A2.12A: The registered handler saves and exits

- Precondition: The context supplies a registration function and a save that resolves.
- Action: Call the registered handler with `save_continue`, then with `save_draft`.
- Expected result: Both return true and call `submitAll` with `save` and the step key; the draft call also navigates the window to `/dashboard` `components/onboarding/onboarding-form-step.tsx:514-543`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::registers and handles external submit triggers for save_continue and save_draft`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. `window.location` is replaced by the test; that `save_draft` skips validation is not asserted with an invalid form.
- Evidence: UNVERIFIED

<a id="cand-06-a2-12b"></a>
#### CAND-06-A2.12B: Both registered actions report a failure

- Precondition: The context's save rejects.
- Action: Call the registered handler with each action.
- Expected result: Both calls resolve to false `components/onboarding/onboarding-form-step.tsx:526-541`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::handles failures during external submit triggers`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. That the window is not navigated on a failed draft is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a2-13a"></a>
#### CAND-06-A2.13A: Attach Image uses the upload override

- Precondition: A tab with one `Attach Image` field.
- Action: Render the step.
- Expected result: The upload component is rendered with that field's label `components/onboarding/onboarding-form-step.tsx:613-647`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::satisfies specialized container mappings when resolving image attachments`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The upload field is mocked, so the help-text and disabled props handed to it are not read.
- Evidence: UNVERIFIED

<a id="cand-06-a2-13b"></a>
#### CAND-06-A2.13B: An uploaded URL reaches the save

- Precondition: A tab with one mandatory `Attach Image` field.
- Action: Trigger the mock upload, then submit the form.
- Expected result: `submitAll` is called with `save`, the step key and values holding the returned URL for that field `components/onboarding/onboarding-form-step.tsx:504,559-564`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::handles file upload and attach change for Attach Image field type`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The real upload hook is not exercised; a removal, which writes an empty string, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a2-13c"></a>
#### CAND-06-A2.13C: The callback also serves a table cell

- Precondition: A tab with one table whose child field is an attachment.
- Action: Trigger the mocked table's attach callback, then submit.
- Expected result: `submitAll` is called with values holding the URL under the child field name `components/onboarding/onboarding-form-step.tsx:504,559-564`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::handles file upload callback via handleFileUpload on table field`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The mocked table calls the callback with a bare field name, so the real row-indexed path is not exercised.
- Evidence: UNVERIFIED

<a id="cand-06-a2-13d"></a>
#### CAND-06-A2.13D: Rejected attachments are marked

- Precondition: A tab with a rejected `Attach` field and a rejected `Attach Image` field, both still holding their original values.
- Action: Render the step.
- Expected result: Both upload components are handed a rejected flag of true `components/onboarding/onboarding-form-step.tsx:596-606`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::computes the isRejected property for Attach and Attach Image fields correctly based on original value`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The corrected case and the read-only case, which both give false, are not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a2-14a"></a>
#### CAND-06-A2.14A: Both buttons are disabled while saving

- Precondition: The context reports a save in progress.
- Action: Render the step.
- Expected result: Previous is disabled and the submit button reads `Saving...` and is disabled `components/onboarding/onboarding-form-step.tsx:807-817`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::disables buttons when isSaving is true`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. That the whole container is `hidden` and `aria-hidden` is not asserted (section 10).
- Evidence: UNVERIFIED

<a id="cand-06-a2-14b"></a>
#### CAND-06-A2.14B: Previous is dead on the first step

- Precondition: The context reports the current step as the first one.
- Action: Render the step.
- Expected result: The Previous button is disabled `components/onboarding/onboarding-form-step.tsx:805-811`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::disables 'Previous' button on the first step`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. That it is enabled on a later step is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a2-15a"></a>
#### CAND-06-A2.15A: Named fields get their own grid rules

- Precondition: A tab with a PAN upload field and the Aadhaar-front field.
- Action: Render the step.
- Expected result: Both labels are on screen, so the grid-class branch for both names runs without throwing `components/onboarding/onboarding-form-step.tsx:96-109`
- Test: mapped: `tests/components/onboarding/onboarding-form-step.test.tsx::enforces unique grid layouts for Aadhaar and long label documentation proofs`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It asserts only that the fields render; neither the full-width class nor the column-start class is checked, so the computed classes are unpinned.
- Evidence: UNVERIFIED

<a id="cand-06-a3"></a>
### CAND-06-A3: Step navigation

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A3.1A](06-onboarding-components.md#cand-06-a3-1a) | Live step data beats the server counts in badge and bar. | [`counts live step data rather than the server counts when any tab has a visible field`](../../../tests/spec/cand-06-step-nav-and-rail.test.tsx) |
| [CAND-06-A3.1B](06-onboarding-components.md#cand-06-a3-1b) | A dependent-false field is left out of the counts. | [`drops a field whose depends_on is false out of the step counts entirely`](../../../tests/spec/cand-06-step-nav-and-rail.test.tsx) |
| [CAND-06-A3.1C](06-onboarding-components.md#cand-06-a3-1c) | The fixed header title and subtitle are rendered. | [`renders onboarding header and progress bar`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.1D](06-onboarding-components.md#cand-06-a3-1d) | The live badge is computed from the saved values. | [`calculates progress percentage and step counts in real-time from stepData`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.2A](06-onboarding-components.md#cand-06-a3-2a) | A later step is reachable even with the current step unfinished. | [`jumps to a later step even though the current step's mandatory field is empty`](../../../tests/spec/cand-06-step-nav-and-rail.test.tsx) |
| [CAND-06-A3.2B](06-onboarding-components.md#cand-06-a3-2b) | A non-draft status ticks every step including Review. | [`marks every step including Review as complete as soon as the status leaves draft`](../../../tests/spec/cand-06-step-nav-and-rail.test.tsx) |
| [CAND-06-A3.2C](06-onboarding-components.md#cand-06-a3-2c) | Each step label and its indicator are drawn. | [`renders steps with correct status indicators`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.2D](06-onboarding-components.md#cand-06-a3-2d) | Clicking a step reports its index. | [`calls goToStep when a clickable step is clicked`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.2E](06-onboarding-components.md#cand-06-a3-2e) | A step with no mandatory field anywhere stays clickable. | [`allows clicking the next step if the current step has no mandatory fields`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.2F](06-onboarding-components.md#cand-06-a3-2f) | A filled mandatory field leaves the next step clickable. | [`allows clicking the next step if the current step has mandatory fields and they are filled`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.2G](06-onboarding-components.md#cand-06-a3-2g) | A past but unfinished step keeps the muted style. | [`applies specific style indicators for steps that are past but not formally completed`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.3A](06-onboarding-components.md#cand-06-a3-3a) | Without visible fields the bar is the share of completed steps. | [`calculates progress percentage correctly`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.3B](06-onboarding-components.md#cand-06-a3-3b) | The server's field status counts drive the bar. | [`calculates progress percentage correctly using field_status_counts when present`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.3C](06-onboarding-components.md#cand-06-a3-3c) | A missing form config leaves a lone Review step at zero. | [`falls back safely to empty step set when formConfig tabs are completely omitted`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.3D](06-onboarding-components.md#cand-06-a3-3d) | The server's per-tab counts fill the badge. | [`displays granular field completion metrics when step count metadata exists`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.3E](06-onboarding-components.md#cand-06-a3-3e) | Filled plus approved reaching the total ticks the step. | [`renders green check and label when total equals filled + approved`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |
| [CAND-06-A3.4A](06-onboarding-components.md#cand-06-a3-4a) | The footer link points at the dashboard. | [`renders back to dashboard link`](../../../tests/components/onboarding/onboarding-step-nav.test.tsx) |

<a id="cand-06-a3-1a"></a>
#### CAND-06-A3.1A: Live counts win over the server's

- Precondition: One tab with two visible fields, one of them filled, while the configuration also carries server counts of 100 total and 0 filled.
- Action: Render the navigation.
- Expected result: The badge reads `1/2`, the header reads `1/2 fields` and the bar's inline width is 50 per cent `components/onboarding/onboarding-step-nav.tsx:125-158`
- Test: characterization: `tests/spec/cand-06-step-nav-and-rail.test.tsx::counts live step data rather than the server counts when any tab has a visible field`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The approved tally and the `custom_age` zero rule are not driven here.
- Evidence: UNVERIFIED

<a id="cand-06-a3-1b"></a>
#### CAND-06-A3.1B: A dependent-false field is not counted

- Precondition: One tab with a filled field and a mandatory field whose `depends_on` is false for the current data.
- Action: Render the navigation.
- Expected result: The badge reads `1/1`, so the hidden field is in neither the total nor the filled count `components/onboarding/onboarding-step-nav.tsx:51-64`
- Test: characterization: `tests/spec/cand-06-step-nav-and-rail.test.tsx::drops a field whose depends_on is false out of the step counts entirely`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The two named exceptions, the address proof and the employment table, are not driven here.
- Evidence: UNVERIFIED

<a id="cand-06-a3-1c"></a>
#### CAND-06-A3.1C: The fixed header text

- Precondition: The default context with two tabs.
- Action: Render the navigation.
- Expected result: The words `Onboarding` and `Complete your profile to get started.` are on screen `components/onboarding/onboarding-step-nav.tsx:178-183`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::renders onboarding header and progress bar`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. Despite its name it does not assert anything about the bar.
- Evidence: UNVERIFIED

<a id="cand-06-a3-1d"></a>
#### CAND-06-A3.1D: The live badge

- Precondition: One tab with a filled mandatory field and an empty optional field, plus a second empty tab.
- Action: Render the navigation.
- Expected result: A badge reads `1/2` `components/onboarding/onboarding-step-nav.tsx:45-124`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::calculates progress percentage and step counts in real-time from stepData`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. Despite its name it does not assert the percentage; CAND-06-A3.1A does.
- Evidence: UNVERIFIED

<a id="cand-06-a3-2a"></a>
#### CAND-06-A3.2A: Every step is reachable

- Precondition: The first tab has one empty mandatory field and the wizard is on that step.
- Action: Click the second tab's label.
- Expected result: The navigation reports index 1 and the button is not disabled `components/onboarding/onboarding-step-nav.tsx:255,262-263`
- Test: characterization: `tests/spec/cand-06-step-nav-and-rail.test.tsx::jumps to a later step even though the current step's mandatory field is empty`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. Pins behaviour that the dead gating code suggests was not intended; see G1 and PWHR-1563.
- Evidence: UNVERIFIED

<a id="cand-06-a3-2b"></a>
#### CAND-06-A3.2B: A non-draft status ticks everything

- Precondition: Two tabs with nothing filled and a status of `submitted`.
- Action: Render the navigation.
- Expected result: All three indicators, the two tabs and Review, carry the success background and none carries the current-step background `components/onboarding/onboarding-step-nav.tsx:208-212,257,277-288`
- Test: characterization: `tests/spec/cand-06-step-nav-and-rail.test.tsx::marks every step including Review as complete as soon as the status leaves draft`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It reads the indicator classes, not the icon that is drawn inside them.
- Evidence: UNVERIFIED

<a id="cand-06-a3-2c"></a>
#### CAND-06-A3.2C: Labels and an indicator per step

- Precondition: Two tabs, the first marked complete, the wizard on the second.
- Action: Render the navigation.
- Expected result: Both tab labels and `Review` are on screen and the first step's row holds an icon `components/onboarding/onboarding-step-nav.tsx:277-296`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::renders steps with correct status indicators`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It only checks that some icon exists, not which one, so it does not distinguish tick from pencil.
- Evidence: UNVERIFIED

<a id="cand-06-a3-2d"></a>
#### CAND-06-A3.2D: Clicking reports the index

- Precondition: Two tabs with the wizard on the second.
- Action: Click the first tab's label.
- Expected result: The navigation reports index 0 `components/onboarding/onboarding-step-nav.tsx:262`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::calls goToStep when a clickable step is clicked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The Review step's index is not clicked.
- Evidence: UNVERIFIED

<a id="cand-06-a3-2e"></a>
#### CAND-06-A3.2E: No mandatory field, next step clickable

- Precondition: The first tab holds one optional field; the wizard is on it.
- Action: Click the second tab.
- Expected result: The button is not disabled and the navigation reports index 1 `components/onboarding/onboarding-step-nav.tsx:255,262-263`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::allows clicking the next step if the current step has no mandatory fields`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. Because every step is clickable, this test would also pass with the mandatory field empty, which CAND-06-A3.2A pins.
- Evidence: UNVERIFIED

<a id="cand-06-a3-2f"></a>
#### CAND-06-A3.2F: Filled mandatory field, next step clickable

- Precondition: The first tab's mandatory field is filled in the step data; the wizard is on it.
- Action: Click the second tab.
- Expected result: The button is not disabled and the navigation reports index 1 `components/onboarding/onboarding-step-nav.tsx:255,262-263`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::allows clicking the next step if the current step has mandatory fields and they are filled`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. Same limitation as CAND-06-A3.2E: the outcome does not depend on the filled state.
- Evidence: UNVERIFIED

<a id="cand-06-a3-2g"></a>
#### CAND-06-A3.2G: A past unfinished step stays muted

- Precondition: The wizard is on the second step and nothing is marked complete.
- Action: Render the navigation.
- Expected result: The first step's button carries the muted-foreground class `components/onboarding/onboarding-step-nav.tsx:264-270`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::applies specific style indicators for steps that are past but not formally completed`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It reads a class name, not a visible outcome.
- Evidence: UNVERIFIED

<a id="cand-06-a3-3a"></a>
#### CAND-06-A3.3A: Completed steps drive the bar

- Precondition: Two tabs with no fields at all and one step marked complete, so three steps in total.
- Action: Render the navigation.
- Expected result: The bar's inline width is 33 per cent `components/onboarding/onboarding-step-nav.tsx:154-164`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::calculates progress percentage correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The `filled/total` line is absent in this state and is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a3-3b"></a>
#### CAND-06-A3.3B: The server's status counts drive the bar

- Precondition: Two field-less tabs and a configuration with 10 total, 3 filled and 2 approved.
- Action: Render the navigation.
- Expected result: The bar's inline width is 50 per cent `components/onboarding/onboarding-step-nav.tsx:154-164`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::calculates progress percentage correctly using field_status_counts when present`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. A zero total, which falls through to the step share, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a3-3c"></a>
#### CAND-06-A3.3C: No configuration leaves one Review step

- Precondition: The context returns no form configuration.
- Action: Render the navigation.
- Expected result: `Review` is the only step and the bar's inline width is 0 per cent `components/onboarding/onboarding-step-nav.tsx:31,127-136,154-164`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::falls back safely to empty step set when formConfig tabs are completely omitted`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. That no `filled/total` line is drawn is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a3-3d"></a>
#### CAND-06-A3.3D: The server's per-tab counts fill the badge

- Precondition: One field-less tab whose configuration carries 4 filled of 10.
- Action: Render the navigation.
- Expected result: The badge reads `4/10` `components/onboarding/onboarding-step-nav.tsx:127-133,298-307`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::displays granular field completion metrics when step count metadata exists`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The Review step's missing badge is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a3-3e"></a>
#### CAND-06-A3.3E: Filled plus approved ticks the step

- Precondition: One field-less tab whose configuration carries 4 filled and 6 approved of 10.
- Action: Render the navigation.
- Expected result: The badge reads `10/10` and that step's row holds an icon `components/onboarding/onboarding-step-nav.tsx:209-212,298-307`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::renders green check and label when total equals filled + approved`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. It checks only that an icon exists, not that it is the tick.
- Evidence: UNVERIFIED

<a id="cand-06-a3-4a"></a>
#### CAND-06-A3.4A: The dashboard link

- Precondition: The default context.
- Action: Render the navigation.
- Expected result: The `Back to Dashboard` text sits inside an anchor whose href is `/dashboard` `components/onboarding/onboarding-step-nav.tsx:316-324`
- Test: mapped: `tests/components/onboarding/onboarding-step-nav.test.tsx::renders back to dashboard link`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. `next/link` is not mocked in that file, so the anchor is the real component's output.
- Evidence: UNVERIFIED

<a id="cand-06-a4"></a>
### CAND-06-A4: Right rail

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A4.1A](06-onboarding-components.md#cand-06-a4-1a) | With no branding the card shows the literal fallback heading. | [`falls back to the literal heading COMPANY NAME when branding carries no company`](../../../tests/spec/cand-06-step-nav-and-rail.test.tsx) |
| [CAND-06-A4.1B](06-onboarding-components.md#cand-06-a4-1b) | Company name, role, department and joining date are shown. | [`renders company name and joining details when provided in formConfig`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.1C](06-onboarding-components.md#cand-06-a4-1c) | Without joining data no joining line is drawn. | [`does not render joining details sections if joining info is missing`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.1D](06-onboarding-components.md#cand-06-a4-1d) | A trainee date is shown as its own line. | [`renders Trainee DOJ when trainee_doj is provided in joining info`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.1E](06-onboarding-components.md#cand-06-a4-1e) | The countdown uses the server number, then the date, then a dash. | [`calculates days to joining from days_to_joining field or custom date, including invalid date fallback`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.2A](06-onboarding-components.md#cand-06-a4-2a) | Only five missing fields are listed and the rest are counted. | [`lists only the first five missing required fields and counts the rest`](../../../tests/spec/cand-06-step-nav-and-rail.test.tsx) |
| [CAND-06-A4.2B](06-onboarding-components.md#cand-06-a4-2b) | The continue button is disabled until nothing is missing. | [`disables Save & Continue while a required field is missing and enables it when none is left`](../../../tests/spec/cand-06-step-nav-and-rail.test.tsx) |
| [CAND-06-A4.2C](06-onboarding-components.md#cand-06-a4-2c) | The checklist covers data, check and table fields and jumps to one. | [`renders required fields checklist and handles jumping to field when clicked`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.3A](06-onboarding-components.md#cand-06-a4-3a) | A tip appears only for a field name the table knows. | [`shows the built-in tip text for a focused field name that has one and nothing for one that does not`](../../../tests/spec/cand-06-step-nav-and-rail.test.tsx) |
| [CAND-06-A4.4A](06-onboarding-components.md#cand-06-a4-4a) | Both buttons call the context handler with their own action. | [`handles bottom action triggers (Save & Continue, Save as Draft & Exit) on form steps`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.4B](06-onboarding-components.md#cand-06-a4-4b) | On the review step the draft button saves through the context. | [`Save as Draft & Exit calls submitAll on review step`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.4C](06-onboarding-components.md#cand-06-a4-4c) | The continue button is absent on the review step. | [`hides Save & Continue on review step`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.5A](06-onboarding-components.md#cand-06-a4-5a) | Only the onboarding buddy is listed, and the mail button opens a draft. | [`renders onboarding buddy card and handles say hello click`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.5B](06-onboarding-components.md#cand-06-a4-5b) | Teammates and the manager are filtered out of the buddy block. | [`shows only the Onboarding Buddy under the buddy heading, not teammates or the manager`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.5C](06-onboarding-components.md#cand-06-a4-5c) | Initials cover an empty, a single and a two-word name. | [`handles buddy name initials generation properly`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |
| [CAND-06-A4.6A](06-onboarding-components.md#cand-06-a4-6a) | The journey title, subtitle and each step line are shown. | [`renders onboarding journey step-by-step info`](../../../tests/components/onboarding/onboarding-right-rail.test.tsx) |

<a id="cand-06-a4-1a"></a>
#### CAND-06-A4.1A: The fallback company heading

- Precondition: The configuration carries no branding block.
- Action: Render the rail.
- Expected result: The card heading reads `COMPANY NAME` `components/onboarding/onboarding-right-rail.tsx:285-288`
- Test: characterization: `tests/spec/cand-06-step-nav-and-rail.test.tsx::falls back to the literal heading COMPANY NAME when branding carries no company`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The `branding.company` middle step of the chain is not driven.
- Evidence: UNVERIFIED

<a id="cand-06-a4-1b"></a>
#### CAND-06-A4.1B: Company and joining details

- Precondition: The configuration holds a company name and a joining block with a date, a role and a department.
- Action: Render the rail.
- Expected result: The company name, the words Role, Department and Date of Joining, the role, the department and the date formatted as day, short month and year are on screen `components/onboarding/onboarding-right-rail.tsx:301,312-345`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::renders company name and joining details when provided in formConfig`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The date format depends on the `en-IN` locale data of the running Node build, and the day itself depends on the machine's timezone: the fixture `2026-06-30` is parsed as UTC midnight and printed in the local zone, so this test asserts `30 Jun 2026` and fails with `29 Jun 2026` under `TZ=America/Los_Angeles` (observed 2026-11-01, Node v24.22.2), while passing under `TZ=UTC` and `TZ=Asia/Kolkata` (G10.1, PWHR-1569).
- Evidence: UNVERIFIED

<a id="cand-06-a4-1c"></a>
#### CAND-06-A4.1C: No joining block without joining data

- Precondition: The configuration holds a company name and no joining block.
- Action: Render the rail.
- Expected result: The company name is on screen and none of Role, Department, Date of Joining or Trainee DOJ is `components/onboarding/onboarding-right-rail.tsx:312-317`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::does not render joining details sections if joining info is missing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. A joining block that exists but is empty is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a4-1d"></a>
#### CAND-06-A4.1D: The trainee date line

- Precondition: The joining block holds a trainee date, a role and a department but no joining date.
- Action: Render the rail.
- Expected result: The words Trainee DOJ and the formatted date are on screen `components/onboarding/onboarding-right-rail.tsx:346-354`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::renders Trainee DOJ when trainee_doj is provided in joining info`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. That the Date of Joining line is absent is not asserted. The printed day depends on the machine's timezone for the same reason as CAND-06-A4.1B: the fixture `2026-07-15` is parsed as UTC midnight, so this test asserts `15 Jul 2026` and fails with `14 Jul 2026` under `TZ=America/Los_Angeles` (observed 2026-11-01, Node v24.22.2), while passing under `TZ=UTC` and `TZ=Asia/Kolkata` (G10.1, PWHR-1569).
- Evidence: UNVERIFIED

<a id="cand-06-a4-1e"></a>
#### CAND-06-A4.1E: The countdown and its fallbacks

- Precondition: Four states in turn: a server day count of 15; no count but a joining date five days ahead; an unparsable date string; an empty date.
- Action: Render the rail for each.
- Expected result: The card shows 15, then 5, then the words `Start date passed`, then a dash `components/onboarding/onboarding-right-rail.tsx:160-173,362-390`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::calculates days to joining from days_to_joining field or custom date, including invalid date fallback`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The unparsable case produces the same words as a date in the past, so the two are not told apart (G6); the zero-day welcome wording is not tried. The five-day step is timezone-dependent and fails on both sides of UTC: the test builds its target with `toISOString`, which is UTC, while the component takes local midnight as today and re-parses the string as UTC midnight. East of UTC the local date is already a day ahead of the UTC string, west of UTC the parsed target falls back a day; either way the count is 4 and the assertion of `5` fails. Observed on 2026-11-01 with Node v24.22.2: failing under `TZ=Asia/Kolkata` and `TZ=America/Los_Angeles`, passing under `TZ=UTC` and `TZ=Europe/Berlin` (G10, G10.1, PWHR-1569).
- Evidence: UNVERIFIED

<a id="cand-06-a4-2a"></a>
#### CAND-06-A4.2A: Five of seven missing fields are listed

- Precondition: The current tab holds seven mandatory fields and nothing is filled.
- Action: Render the rail.
- Expected result: The first five labels are on screen, the sixth is not, the line `+ 2 more fields` is shown and the button reads `Fill 7 more to continue` `components/onboarding/onboarding-right-rail.tsx:484-506,690-694`
- Test: characterization: `tests/spec/cand-06-step-nav-and-rail.test.tsx::lists only the first five missing required fields and counts the rest`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The order of the list follows the configuration order and no other order is tried.
- Evidence: UNVERIFIED

<a id="cand-06-a4-2b"></a>
#### CAND-06-A4.2B: The continue button follows the checklist

- Precondition: The current tab holds one mandatory field, first empty and then filled.
- Action: Render the rail in each state and click the button once it is ready.
- Expected result: With the field empty the button reads `Fill 1 more to continue` and is disabled; with it filled the button reads `Save & Continue`, is enabled and calls the context handler with `save_continue` `components/onboarding/onboarding-right-rail.tsx:663-697`
- Test: characterization: `tests/spec/cand-06-step-nav-and-rail.test.tsx::disables Save & Continue while a required field is missing and enables it when none is left`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The saving state, which also disables the button, is not driven.
- Evidence: UNVERIFIED

<a id="cand-06-a4-2c"></a>
#### CAND-06-A4.2C: The checklist across field types

- Precondition: The current tab holds four mandatory fields: two data fields with one filled, an unticked check and an empty table with no mandatory child field. A matching DOM element exists for one of them.
- Action: Render the rail and click that field's checklist row.
- Expected result: The three unfilled labels are listed and the element's `scrollIntoView` is called `components/onboarding/onboarding-right-rail.tsx:182-247,258-262`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::renders required fields checklist and handles jumping to field when clicked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The 300 ms focus and the highlight animation are not asserted (section 10); the table's row-numbered labels are not exercised because the table has no mandatory child field.
- Evidence: UNVERIFIED

<a id="cand-06-a4-3a"></a>
#### CAND-06-A4.3A: Tips are table-driven

- Precondition: The rail is rendered with a focused field name that the built-in table knows, then with one it does not.
- Action: Render in each state.
- Expected result: The known name shows its fixed tip title; the unknown name shows no tip `components/onboarding/onboarding-right-rail.tsx:280-283,459-471`
- Test: characterization: `tests/spec/cand-06-step-nav-and-rail.test.tsx::shows the built-in tip text for a focused field name that has one and nothing for one that does not`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. One of the 14 keys is driven; the other 13 texts are unpinned.
- Evidence: UNVERIFIED

<a id="cand-06-a4-4a"></a>
#### CAND-06-A4.4A: Both buttons on a form step

- Precondition: The wizard is on a form step and the context supplies a handler.
- Action: Click Save & Continue, then Save as Draft & Exit.
- Expected result: The handler is called with `save_continue` and then with `save_draft` `components/onboarding/onboarding-right-rail.tsx:663-713`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::handles bottom action triggers (Save & Continue, Save as Draft & Exit) on form steps`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The tab in this case has no fields, so the continue button is enabled; the disabled path is CAND-06-A4.2B.
- Evidence: UNVERIFIED

<a id="cand-06-a4-4b"></a>
#### CAND-06-A4.4B: The draft button on the review step

- Precondition: The current step index is past the last tab and `window.location` is replaced.
- Action: Click Save as Draft & Exit.
- Expected result: The context's save is called with `save` `components/onboarding/onboarding-right-rail.tsx:702-709`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::Save as Draft & Exit calls submitAll on review step`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. That the window is then sent to `/dashboard` is not asserted, nor is the rejecting path.
- Evidence: UNVERIFIED

<a id="cand-06-a4-4c"></a>
#### CAND-06-A4.4C: No continue button on the review step

- Precondition: The current step index is past the last tab.
- Action: Render the rail.
- Expected result: `Save & Continue` is absent and `Save as Draft & Exit` is present `components/onboarding/onboarding-right-rail.tsx:663-664,699-725`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::hides Save & Continue on review step`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The `Fill N more` wording is also absent here and is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a4-5a"></a>
#### CAND-06-A4.5A: The buddy card and its mail button

- Precondition: One key contact with a name, a designation, an e-mail and a phone number; `window.open` is replaced.
- Action: Render the rail and click the greeting button.
- Expected result: The name, designation, e-mail and phone are on screen and `window.open` is called with the `mailto:` address `components/onboarding/onboarding-right-rail.tsx:596-645`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::renders onboarding buddy card and handles say hello click`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The test data uses example addresses from the existing file, not `*@example.invalid`; the `mailto:` and `tel:` anchor hrefs are not asserted. On `deploy/hybrowbase-candidate-20261025` the filter that keeps only buddies is absent (G7).
- Evidence: UNVERIFIED

<a id="cand-06-a4-5b"></a>
#### CAND-06-A4.5B: Teammates and the manager are filtered out

- Precondition: Three key contacts with the roles Onboarding Buddy, Teammate and Manager.
- Action: Render the rail.
- Expected result: Only the buddy's name is on screen, the heading is singular and the other two names are absent `components/onboarding/onboarding-right-rail.tsx:113-129,595`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::shows only the Onboarding Buddy under the buddy heading, not teammates or the manager`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. A contact without a role, which is also kept, is covered only by CAND-06-A4.5C. This filter does not exist on `deploy/hybrowbase-candidate-20261025` (G7).
- Evidence: UNVERIFIED

<a id="cand-06-a4-5c"></a>
#### CAND-06-A4.5C: Initials for three kinds of name

- Precondition: Three key contacts with no role whose names are empty, one word and two words.
- Action: Render the rail.
- Expected result: The three avatars read `OB`, the first two letters of the single word in capitals, and the two initials `components/onboarding/onboarding-right-rail.tsx:88-95`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::handles buddy name initials generation properly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The plural heading that three buddies produce is not asserted here.
- Evidence: UNVERIFIED

<a id="cand-06-a4-6a"></a>
#### CAND-06-A4.6A: The journey card

- Precondition: The configuration holds a journey with a title, a subtitle and two steps, each with a timeframe and a detail.
- Action: Render the rail.
- Expected result: The title, the subtitle and both steps' titles, timeframes and details are on screen `components/onboarding/onboarding-right-rail.tsx:528-585`
- Test: mapped: `tests/components/onboarding/onboarding-right-rail.test.tsx::renders onboarding journey step-by-step info`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the backend, `fetch`, the router and the onboarding context hooks are mocked or absent; no real HTTP or Frappe backend. The fallback title and subtitle and the five-icon cycle are not asserted (section 10).
- Evidence: UNVERIFIED

<a id="cand-06-a5"></a>
### CAND-06-A5: File upload field

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A5.1A](06-onboarding-components.md#cand-06-a5-1a) | The label, the required star and the drop-zone wording. | [`renders essential labels and requirements`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.1B](06-onboarding-components.md#cand-06-a5-1b) | Picking a file uploads it and hands back the URL. | [`calls uploadFile when a file is selected via input`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.1C](06-onboarding-components.md#cand-06-a5-1c) | A stored value shows its last path segment and a remove button. | [`renders filename and remove button when value is provided`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.1D](06-onboarding-components.md#cand-06-a5-1d) | Clicking the zone opens the hidden picker. | [`safely invokes internal file selector on wrapper interaction`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.2A](06-onboarding-components.md#cand-06-a5-2a) | A file over 5 MB is refused without an upload. | [`refuses a file larger than 5 MB with an inline message and makes no upload call`](../../../tests/spec/cand-06-file-upload.test.tsx) |
| [CAND-06-A5.2B](06-onboarding-components.md#cand-06-a5-2b) | A rejected upload shows a fixed sentence and keeps the value. | [`shows Upload failed. Please try again. in the field when the upload rejects`](../../../tests/spec/cand-06-file-upload.test.tsx) |
| [CAND-06-A5.2C](06-onboarding-components.md#cand-06-a5-2c) | A dropped file of any type is uploaded; only size is checked. | [`uploads a dropped executable because only the file size is checked, never the type`](../../../tests/spec/cand-06-file-upload.test.tsx) |
| [CAND-06-A5.3A](06-onboarding-components.md#cand-06-a5-3a) | A relative stored path is opened through the backend prefix. | [`opens a stored relative file path through the same-origin backend prefix in a new tab`](../../../tests/spec/cand-06-file-upload.test.tsx) |
| [CAND-06-A5.3B](06-onboarding-components.md#cand-06-a5-3b) | An absolute stored URL is opened unchanged. | [`keeps an absolute stored URL as it is instead of prefixing it`](../../../tests/spec/cand-06-file-upload.test.tsx) |
| [CAND-06-A5.4A](06-onboarding-components.md#cand-06-a5-4a) | A running upload shows the uploading wording. | [`shows uploading state when isPending is true`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.4B](06-onboarding-components.md#cand-06-a5-4b) | A disabled field offers no remove button. | [`hides remove button when disabled`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.4C](06-onboarding-components.md#cand-06-a5-4c) | A disabled zone carries the dimmed, not-allowed classes. | [`prevents interactions when disabled`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.5A](06-onboarding-components.md#cand-06-a5-5a) | A failing upload is logged with its error. | [`gracefully manages and registers synchronous reject faults from pipeline failure`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.5B](06-onboarding-components.md#cand-06-a5-5b) | A value with no slash is shown as it is. | [`shows a stored value that holds no slash unchanged as the file name`](../../../tests/spec/cand-06-file-upload.test.tsx) |
| [CAND-06-A5.5C](06-onboarding-components.md#cand-06-a5-5c) | A change or drop with no file uploads nothing. | [`uploads nothing for a change event with an empty file list and for a drop with an empty file list`](../../../tests/spec/cand-06-file-upload.test.tsx) |
| [CAND-06-A5.5D](06-onboarding-components.md#cand-06-a5-5d) | A drop is ignored while pending and while disabled. | [`ignores a drop while an upload is already running and while the field is disabled`](../../../tests/spec/cand-06-file-upload.test.tsx) |
| [CAND-06-A5.5F](06-onboarding-components.md#cand-06-a5-5f) | The caller error wins over the internal one. | [`prefers the caller's error text over the internal one in the message line`](../../../tests/spec/cand-06-file-upload.test.tsx) |
| [CAND-06-A5.5G](06-onboarding-components.md#cand-06-a5-5g) | A dropped file is uploaded and the URL handed back. | [`handles drag and drop correctly`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.6A](06-onboarding-components.md#cand-06-a5-6a) | An approved field shows the approval mark. | [`distinctly represents successful validation states using native decorators`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.6B](06-onboarding-components.md#cand-06-a5-6b) | A rejected field with a comment shows the reason trigger. | [`renders comprehensive informative feedback upon manual asset rejection`](../../../tests/components/onboarding/file-upload-field.test.tsx) |
| [CAND-06-A5.6C](06-onboarding-components.md#cand-06-a5-6c) | A stored value's border follows the approval state. | [`borders a stored value green when approved and red when rejected`](../../../tests/spec/cand-06-file-upload.test.tsx) |

<a id="cand-06-a5-1a"></a>
#### CAND-06-A5.1A: Label, star and drop-zone wording

- Precondition: A required upload field with a label and no value.
- Action: Render it.
- Expected result: The label, a star and the words `Click to upload or drag and drop` are on screen `components/onboarding/file-upload-field.tsx:227-235,256-264`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::renders essential labels and requirements`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. The help text and the accept list are not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a5-1b"></a>
#### CAND-06-A5.1B: Picking a file uploads it

- Precondition: The mocked upload resolves with a file URL.
- Action: Fire a change on the hidden input with one PDF file.
- Expected result: The upload is called with that file and the caller is handed the returned URL `components/onboarding/file-upload-field.tsx:101-104,111-115`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::calls uploadFile when a file is selected via input`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. That the input is cleared afterwards is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a5-1c"></a>
#### CAND-06-A5.1C: A stored value and its remove button

- Precondition: The field holds a stored path with directories.
- Action: Render it and click the remove button.
- Expected result: Only the last path segment is shown and the caller is handed `null` `components/onboarding/file-upload-field.tsx:67-70,121-126,215-226`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::renders filename and remove button when value is provided`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. That the click does not also open the file is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a5-1d"></a>
#### CAND-06-A5.1D: Clicking the zone opens the picker

- Precondition: An upload field with no value; the hidden input's click method is spied on.
- Action: Click the drop zone.
- Expected result: The hidden input's click is called `components/onboarding/file-upload-field.tsx:79-83`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::safely invokes internal file selector on wrapper interaction`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. The disabled and pending guards on that handler are not driven.
- Evidence: UNVERIFIED

<a id="cand-06-a5-2a"></a>
#### CAND-06-A5.2A: A file over 5 MB is refused

- Precondition: The mocked upload would resolve.
- Action: Pick a synthetic file of 5 MiB plus one byte.
- Expected result: The field shows `File size must be less than 5MB`, no upload is made and the caller is not called `components/onboarding/file-upload-field.tsx:96-99`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::refuses a file larger than 5 MB with an inline message and makes no upload call`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. It does not check that a file of exactly 5 MiB passes, nor whether the backend enforces the same limit.
- Evidence: UNVERIFIED

<a id="cand-06-a5-2b"></a>
#### CAND-06-A5.2B: A rejected upload shows a fixed sentence

- Precondition: The mocked upload rejects.
- Action: Pick a small PDF file.
- Expected result: The field shows `Upload failed. Please try again.` and the caller is not called `components/onboarding/file-upload-field.tsx:104-107`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::shows Upload failed. Please try again. in the field when the upload rejects`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. The backend's own message is discarded by the component, so no case can show it.
- Evidence: UNVERIFIED

<a id="cand-06-a5-2c"></a>
#### CAND-06-A5.2C: Any file type is uploaded

- Precondition: The mocked upload resolves; the field uses the default accept list.
- Action: Drop a synthetic file whose name ends in `.exe` and whose MIME type is an executable one.
- Expected result: The upload is called with that file, the caller is handed the URL, and the hidden input's accept attribute is still the image-and-PDF list `components/onboarding/file-upload-field.tsx:140-151`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::uploads a dropped executable because only the file size is checked, never the type`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. Pins a suspected defect, not endorsed; whether the backend refuses the file is not read. Issue: PWHR-1564.
- Evidence: UNVERIFIED

<a id="cand-06-a5-3a"></a>
#### CAND-06-A5.3A: A relative path goes through the proxy

- Precondition: The field holds a path that does not start with `http`; `window.open` is replaced.
- Action: Click the stored file row.
- Expected result: `window.open` is called with the `/backend` prefix before the path, the target `_blank` and `noopener,noreferrer` `components/onboarding/file-upload-field.tsx:72-78,84-88`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::opens a stored relative file path through the same-origin backend prefix in a new tab`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. The prefix is the browser branch of `frappeApiBase`, which is SPEC-CAND-02; the server branch cannot run in jsdom.
- Evidence: UNVERIFIED

<a id="cand-06-a5-3b"></a>
#### CAND-06-A5.3B: An absolute URL is left alone

- Precondition: The field holds a synthetic absolute URL; `window.open` is replaced.
- Action: Click the stored file row.
- Expected result: `window.open` is called with that URL unchanged `components/onboarding/file-upload-field.tsx:74-77,87`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::keeps an absolute stored URL as it is instead of prefixing it`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. Pins that no same-origin check is made; see G4 and PWHR-1566.
- Evidence: UNVERIFIED

<a id="cand-06-a5-4a"></a>
#### CAND-06-A5.4A: The uploading state

- Precondition: The mocked hook reports an upload in progress.
- Action: Render the field.
- Expected result: The word `Uploading...` is on screen `components/onboarding/file-upload-field.tsx:248-255`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::shows uploading state when isPending is true`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. The spinner element and the dimming classes are not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a5-4b"></a>
#### CAND-06-A5.4B: A disabled field has no remove button

- Precondition: The field is disabled and holds a stored path.
- Action: Render it.
- Expected result: The file name is shown and no remove button exists `components/onboarding/file-upload-field.tsx:215-226`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::hides remove button when disabled`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. The pending case, which hides it for the same reason, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a5-4c"></a>
#### CAND-06-A5.4C: A disabled zone is dimmed

- Precondition: The field is disabled and holds no value.
- Action: Render it and click the zone.
- Expected result: The zone carries the half-opacity and not-allowed classes `components/onboarding/file-upload-field.tsx:243-245`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::prevents interactions when disabled`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. Despite its name the click makes no assertion, so the guard in the click handler is not pinned.
- Evidence: UNVERIFIED

<a id="cand-06-a5-5a"></a>
#### CAND-06-A5.5A: A failed upload is logged

- Precondition: The mocked upload rejects; `console.error` is replaced.
- Action: Pick a file.
- Expected result: `console.error` is called with `Upload failed` and the error `components/onboarding/file-upload-field.tsx:105`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::gracefully manages and registers synchronous reject faults from pipeline failure`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. The message shown to the candidate is asserted by CAND-06-A5.2B, not here.
- Evidence: UNVERIFIED

<a id="cand-06-a5-5b"></a>
#### CAND-06-A5.5B: A value with no slash

- Precondition: The field holds a bare file name with no path separator.
- Action: Render it.
- Expected result: That name is shown and the drop zone is gone `components/onboarding/file-upload-field.tsx:67-70,193-270`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::shows a stored value that holds no slash unchanged as the file name`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. A value that is an empty string, which keeps the drop zone, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a5-5c"></a>
#### CAND-06-A5.5C: A change or drop with no file

- Precondition: An upload field with no value.
- Action: Fire a change on the hidden input with an empty file list, then drop an empty file list on the zone.
- Expected result: No upload is made and the caller is not called `components/onboarding/file-upload-field.tsx:92-93,111-113,145-148`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::uploads nothing for a change event with an empty file list and for a drop with an empty file list`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. It does not assert that the inline message stays empty.
- Evidence: UNVERIFIED

<a id="cand-06-a5-5d"></a>
#### CAND-06-A5.5D: A drop while pending or disabled

- Precondition: First the mocked hook reports an upload in progress, then the field is disabled instead.
- Action: Drop a synthetic PDF on the zone in each state.
- Expected result: Neither drop makes an upload `components/onboarding/file-upload-field.tsx:138-150`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::ignores a drop while an upload is already running and while the field is disabled`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. It does not assert that the drag-over highlight is also suppressed; that handler has no such guard.
- Evidence: UNVERIFIED

<a id="cand-06-a5-5f"></a>
#### CAND-06-A5.5F: The caller error wins

- Precondition: The field is given an error string by its caller.
- Action: Render it, then pick a file over 5 MB so the internal message is set as well.
- Expected result: The caller's text is shown both times and the size message never appears `components/onboarding/file-upload-field.tsx:275`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::prefers the caller's error text over the internal one in the message line`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. Pins that the candidate is never told the file is too large while the field already carries a validation error.
- Evidence: UNVERIFIED

<a id="cand-06-a5-5g"></a>
#### CAND-06-A5.5G: A dropped file is uploaded

- Precondition: The mocked upload resolves with a file URL.
- Action: Drag over the zone and then drop one PDF file.
- Expected result: The upload is called with that file and the caller is handed the returned URL `components/onboarding/file-upload-field.tsx:138-151`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::handles drag and drop correctly`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. The drag-over highlight class is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a5-6a"></a>
#### CAND-06-A5.6A: The approval mark

- Precondition: The field is marked approved.
- Action: Render it.
- Expected result: An element labelled `Approved field` exists `components/onboarding/file-upload-field.tsx:153-160`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::distinctly represents successful validation states using native decorators`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. That approval also outranks a rejection in the same render is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a5-6b"></a>
#### CAND-06-A5.6B: The rejection trigger

- Precondition: The field is marked rejected and carries an HR comment.
- Action: Render it and click the trigger.
- Expected result: An element labelled `Rejection reason` exists and is still there after the click `components/onboarding/file-upload-field.tsx:162-181`
- Test: mapped: `tests/components/onboarding/file-upload-field.test.tsx::renders comprehensive informative feedback upon manual asset rejection`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. The comment text inside the tooltip is not asserted, and a rejection without a comment, which draws nothing, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a5-6c"></a>
#### CAND-06-A5.6C: The stored value's border

- Precondition: The field holds a stored name and is marked approved, then rejected.
- Action: Render and re-render.
- Expected result: The row carries the success border first and the destructive border second `components/onboarding/file-upload-field.tsx:195-204`
- Test: characterization: `tests/spec/cand-06-file-upload.test.tsx::borders a stored value green when approved and red when rejected`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the upload hook is mocked, so no request leaves the test; the backend is stubbed. It reads class names, not a visible outcome; the neutral state with neither flag is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a6"></a>
### CAND-06-A6: Dynamic table field

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A6.1A](06-onboarding-components.md#cand-06-a6-1a) | An empty table starts with one blank row. | [`initializes with one empty row if none exist`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.1B](06-onboarding-components.md#cand-06-a6-1b) | The add button appends a row. | [`can add a new row by clicking 'Add Education'`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.1C](06-onboarding-components.md#cand-06-a6-1c) | A row can be removed while more than one exists. | [`can remove a row when more than one exists`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.2A](06-onboarding-components.md#cand-06-a6-2a) | A child error shows only after its cell is touched. | [`displays validation errors for specific rows and fields`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.2B](06-onboarding-components.md#cand-06-a6-2b) | The container id and the table-level message. | [`renders container id and table-level validation error message`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.3A](06-onboarding-components.md#cand-06-a6-3a) | A relation chosen elsewhere is dropped from other rows. | [`removes a relation already chosen in another row from the remaining rows' options`](../../../tests/spec/cand-06-table-and-sidebar.test.tsx) |
| [CAND-06-A6.3B](06-onboarding-components.md#cand-06-a6-3b) | The add button goes when every relation is used. | [`hides the add button once every relation option has been used, because the option list has no Child entry`](../../../tests/spec/cand-06-table-and-sidebar.test.tsx) |
| [CAND-06-A6.3C](06-onboarding-components.md#cand-06-a6-3c) | A Child option keeps the add button for ever. | [`keeps the add button when Child is among the options even if every option is already chosen`](../../../tests/spec/cand-06-table-and-sidebar.test.tsx) |
| [CAND-06-A6.4A](06-onboarding-components.md#cand-06-a6-4a) | A read-only table has no buttons and read-only children. | [`drops the add and remove buttons and marks every child read-only when the table is read-only`](../../../tests/spec/cand-06-table-and-sidebar.test.tsx) |
| [CAND-06-A6.5A](06-onboarding-components.md#cand-06-a6-5a) | A chosen education level is dropped from other rows. | [`hides already selected education levels from other rows`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.5B](06-onboarding-components.md#cand-06-a6-5b) | Three levels are enough without a post-graduation degree. | [`hides add button when required education levels are complete without post graduation`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.5C](06-onboarding-components.md#cand-06-a6-5c) | With a post-graduation degree a fourth row is still offered. | [`keeps add button visible until post graduation is complete when applicable`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.5D](06-onboarding-components.md#cand-06-a6-5d) | All four levels end the add button. | [`hides add button when post graduation is complete and applicable`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.6A](06-onboarding-components.md#cand-06-a6-6a) | A year that no longer increases with the level is cleared. | [`automatically clears years of passing on chronological violations`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |
| [CAND-06-A6.7A](06-onboarding-components.md#cand-06-a6-7a) | Changing a family relation revalidates the whole table. | [`revalidates a family row when its relation changes`](../../../tests/components/onboarding/dynamic-table-field.test.tsx) |

<a id="cand-06-a6-1a"></a>
#### CAND-06-A6.1A: An empty table starts with one row

- Precondition: A mandatory table with two child fields and no saved rows.
- Action: Render it.
- Expected result: The label is shown and exactly one cell of each child field exists `components/onboarding/dynamic-table-field.tsx:135-141`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::initializes with one empty row if none exist`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. That the append happens only once is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a6-1b"></a>
#### CAND-06-A6.1B: The add button appends a row

- Precondition: The same table after its first row exists.
- Action: Click the add button.
- Expected result: Two cells of each child field exist `components/onboarding/dynamic-table-field.tsx:143-146`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::can add a new row by clicking 'Add Education'`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. The submit-count bookkeeping that the add does is read only through CAND-06-A6.2A.
- Evidence: UNVERIFIED

<a id="cand-06-a6-1c"></a>
#### CAND-06-A6.1C: A row can be removed

- Precondition: The table holds two saved rows.
- Action: Click the first row's bin button.
- Expected result: Two bin buttons exist beforehand and one cell of the child field remains afterwards `components/onboarding/dynamic-table-field.tsx:148-160,331-345`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::can remove a row when more than one exists`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. That no bin button is drawn with a single row is not asserted here.
- Evidence: UNVERIFIED

<a id="cand-06-a6-2a"></a>
#### CAND-06-A6.2A: A child error waits for a touch

- Precondition: Two rows and an error object naming the first row's mandatory child field; no submit has happened.
- Action: Render it, then blur that cell.
- Expected result: No error is shown before the blur and the message is shown after it `components/onboarding/dynamic-table-field.tsx:349-363`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::displays validation errors for specific rows and fields`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. The submit-count branch and the family date-of-birth branch of the same condition are not driven.
- Evidence: UNVERIFIED

<a id="cand-06-a6-2b"></a>
#### CAND-06-A6.2B: Container id and table message

- Precondition: One row and a table-level error whose type is a custom validation.
- Action: Render it.
- Expected result: An element with the id `field-education` exists and the message text is on screen `components/onboarding/dynamic-table-field.tsx:310,317-321`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::renders container id and table-level validation error message`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. The required-type error on a freshly added row, which is suppressed, is not driven; nor is the mandatory star.
- Evidence: UNVERIFIED

<a id="cand-06-a6-3a"></a>
#### CAND-06-A6.3A: A used relation leaves the other lists

- Precondition: A family table with three relation options; the first row holds the first option and the second row is empty.
- Action: Render it.
- Expected result: The first row still offers its own option and the second row offers the other two but not the first `components/onboarding/dynamic-table-field.tsx:387-399`
- Test: characterization: `tests/spec/cand-06-table-and-sidebar.test.tsx::removes a relation already chosen in another row from the remaining rows' options`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. The options are read from a data attribute of the mocked renderer, not from a real select element.
- Evidence: UNVERIFIED

<a id="cand-06-a6-3b"></a>
#### CAND-06-A6.3B: Every relation used ends the add button

- Precondition: A family table whose three options are each chosen once; the option list has no `Child` entry.
- Action: Render it.
- Expected result: No add button exists `components/onboarding/dynamic-table-field.tsx:221-244,428`
- Test: characterization: `tests/spec/cand-06-table-and-sidebar.test.tsx::hides the add button once every relation option has been used, because the option list has no Child entry`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. A table with no relation child field at all, which also returns false, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a6-3c"></a>
#### CAND-06-A6.3C: A Child option keeps the add button

- Precondition: A family table whose options are `Father` and `Child`, both already chosen.
- Action: Render it.
- Expected result: The add button is still there `components/onboarding/dynamic-table-field.tsx:231`
- Test: characterization: `tests/spec/cand-06-table-and-sidebar.test.tsx::keeps the add button when Child is among the options even if every option is already chosen`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. That a second `Child` row would then be accepted by the backend is not read.
- Evidence: UNVERIFIED

<a id="cand-06-a6-4a"></a>
#### CAND-06-A6.4A: A read-only table is inert

- Precondition: A read-only family table with two saved rows.
- Action: Render it.
- Expected result: There is no add button and no button at all, and both relation cells are handed a read-only flag of 1 `components/onboarding/dynamic-table-field.tsx:331,405-411,428`
- Test: characterization: `tests/spec/cand-06-table-and-sidebar.test.tsx::drops the add and remove buttons and marks every child read-only when the table is read-only`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. The read-only flag is read from a data attribute; whether the real widget honours it belongs to the field renderer, which is out of scope.
- Evidence: UNVERIFIED

<a id="cand-06-a6-5a"></a>
#### CAND-06-A6.5A: A used education level leaves the other lists

- Precondition: An education table whose first row holds the first level and whose second row is empty.
- Action: Render it.
- Expected result: The first row keeps its level and the second row offers the later ones but not the first `components/onboarding/dynamic-table-field.tsx:366-381`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::hides already selected education levels from other rows`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. With no document passed, the post-graduation level is filtered out as well, which the test does not assert.
- Evidence: UNVERIFIED

<a id="cand-06-a6-5b"></a>
#### CAND-06-A6.5B: Three levels are enough without a degree

- Precondition: An education table with the first three levels chosen and a document that says there is no post-graduation degree.
- Action: Render it.
- Expected result: No add button exists `components/onboarding/dynamic-table-field.tsx:35-39,204-208,236-244`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::hides add button when required education levels are complete without post graduation`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. Only the word `No` is tried; any value other than `yes` takes the same branch.
- Evidence: UNVERIFIED

<a id="cand-06-a6-5c"></a>
#### CAND-06-A6.5C: A degree keeps the fourth row open

- Precondition: The same three levels and a document that says there is a post-graduation degree.
- Action: Render it.
- Expected result: The add button is there `components/onboarding/dynamic-table-field.tsx:35-39,236-240`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::keeps add button visible until post graduation is complete when applicable`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. That the word is matched case-insensitively after trimming is not driven.
- Evidence: UNVERIFIED

<a id="cand-06-a6-5d"></a>
#### CAND-06-A6.5D: All four levels end the add button

- Precondition: An education table with all four levels chosen and a document that says there is a post-graduation degree.
- Action: Render it.
- Expected result: No add button exists `components/onboarding/dynamic-table-field.tsx:204-208,236-240`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::hides add button when post graduation is complete and applicable`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. A fifth row with a repeated level is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a6-6a"></a>
#### CAND-06-A6.6A: An out-of-order year is cleared

- Precondition: An education table with a tenth-grade row in 2021 and a twelfth-grade row in 2022.
- Action: Change the tenth-grade year to 2022.
- Expected result: The twelfth-grade year becomes empty `components/onboarding/dynamic-table-field.tsx:266-306`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::automatically clears years of passing on chronological violations`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. A year that cannot be parsed, and a level the order table does not know, are not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a6-7a"></a>
#### CAND-06-A6.7A: A relation change revalidates the table

- Precondition: A family table with one row holding a child relation and a date of birth; a revalidation function is passed in.
- Action: Change the relation cell.
- Expected result: The revalidation function is called with the table's own field name, not with the cell path `components/onboarding/dynamic-table-field.tsx:86-90`
- Test: mapped: `tests/components/onboarding/dynamic-table-field.test.tsx::revalidates a family row when its relation changes`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the field renderer is mocked and the form is a bare react-hook-form harness; the backend is stubbed and no context or router is involved. The other branch, which revalidates one cell only while it already has an error, is not driven.
- Evidence: UNVERIFIED

<a id="cand-06-a7"></a>
### CAND-06-A7: Circular progress

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A7.1A](06-onboarding-components.md#cand-06-a7-1a) | Two circles are drawn, a track and an arc. | [`renders two circle elements (track + progress arc)`](../../../tests/components/shared/circular-progress.test.tsx) |
| [CAND-06-A7.1B](06-onboarding-components.md#cand-06-a7-1b) | The label shows the value at once, without waiting for the arc. | [`displays percentage text immediately`](../../../tests/components/shared/circular-progress.test.tsx) |
| [CAND-06-A7.1C](06-onboarding-components.md#cand-06-a7-1c) | A value above 100 is clamped. | [`clamps values above 100 to 100`](../../../tests/components/shared/circular-progress.test.tsx) |
| [CAND-06-A7.1D](06-onboarding-components.md#cand-06-a7-1d) | A caller size sets both SVG dimensions. | [`accepts custom size and sets SVG dimensions`](../../../tests/components/shared/circular-progress.test.tsx) |

<a id="cand-06-a7-1a"></a>
#### CAND-06-A7.1A: Track and arc

- Precondition: The ring is given a value of 50.
- Action: Render it.
- Expected result: The SVG holds exactly two circle elements `components/shared/circular-progress.tsx:56-76`
- Test: mapped: `tests/components/shared/circular-progress.test.tsx::renders two circle elements (track + progress arc)`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: no module is mocked in this case and none is needed: no backend, router or context is involved and the component is rendered alone in jsdom, so the G9 mock gap does not apply to it. The dash offset that encodes the progress is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a7-1b"></a>
#### CAND-06-A7.1B: The label does not wait

- Precondition: The ring is given a value of 75 and no timer is advanced.
- Action: Render it and read the label.
- Expected result: The label reads 75 per cent at once, although the arc still stands at zero `components/shared/circular-progress.tsx:29,39-45,79`
- Test: mapped: `tests/components/shared/circular-progress.test.tsx::displays percentage text immediately`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: no module is mocked in this case and none is needed: no backend, router or context is involved and the component is rendered alone in jsdom, so the G9 mock gap does not apply to it. The arc's value after the 50 ms timer is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a7-1c"></a>
#### CAND-06-A7.1C: Clamping above the top

- Precondition: The ring is given a value of 150.
- Action: Render it.
- Expected result: The label reads 100 per cent `components/shared/circular-progress.tsx:32,79`
- Test: mapped: `tests/components/shared/circular-progress.test.tsx::clamps values above 100 to 100`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: no module is mocked in this case and none is needed: no backend, router or context is involved and the component is rendered alone in jsdom, so the G9 mock gap does not apply to it. The lower clamp is covered by an unmapped sibling test (section 10).
- Evidence: UNVERIFIED

<a id="cand-06-a7-1d"></a>
#### CAND-06-A7.1D: A caller size

- Precondition: The ring is given a size of 200 and a stroke width of 12.
- Action: Render it.
- Expected result: The SVG's width and height attributes are both 200 `components/shared/circular-progress.tsx:50-51`
- Test: mapped: `tests/components/shared/circular-progress.test.tsx::accepts custom size and sets SVG dimensions`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: no module is mocked in this case and none is needed: no backend, router or context is involved and the component is rendered alone in jsdom, so the G9 mock gap does not apply to it. The radius and circumference derived from the stroke width are not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a8"></a>
### CAND-06-A8: Review step

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A8.1A](06-onboarding-components.md#cand-06-a8-1a) | An unticked declaration blocks the submit with the schema message. | [`blocks the submit and shows the schema message while the declaration box is unticked`](../../../tests/spec/cand-06-review-step.test.tsx) |
| [CAND-06-A8.1B](06-onboarding-components.md#cand-06-a8-1b) | A ticked declaration submits once with the submit action. | [`submits with the single argument submit once the declaration box is ticked`](../../../tests/spec/cand-06-review-step.test.tsx) |
| [CAND-06-A8.1C](06-onboarding-components.md#cand-06-a8-1c) | A ticked declaration reaches the context's submit. | [`handles standard successful submission flow after declaration acceptance`](../../../tests/components/onboarding/steps/review-step.test.tsx) |
| [CAND-06-A8.1D](06-onboarding-components.md#cand-06-a8-1d) | A rejected submit shows the error's own message. | [`displays server error message on submit failure`](../../../tests/components/onboarding/steps/review-step.test.tsx) |
| [CAND-06-A8.2A](06-onboarding-components.md#cand-06-a8-2a) | An uncorrected rejected field disables the Submit button. | [`disables the Submit button while a rejected field still carries its original value`](../../../tests/spec/cand-06-review-step.test.tsx) |
| [CAND-06-A8.2B](06-onboarding-components.md#cand-06-a8-2b) | Submitting anyway shows the field list inline and as a toast. | [`names the uncorrected rejected field in an inline error and a toast when the form is submitted around the disabled button`](../../../tests/spec/cand-06-review-step.test.tsx) |
| [CAND-06-A8.2C](06-onboarding-components.md#cand-06-a8-2c) | A changed value counts as corrected and lets the submit through. | [`treats a rejected field as corrected once its value differs from the original and submits`](../../../tests/spec/cand-06-review-step.test.tsx) |
| [CAND-06-A8.3A](06-onboarding-components.md#cand-06-a8-3a) | The flat summary takes two string values and drops numbers. | [`summarises a tab without a table as the first two string values only, dropping the numeric one`](../../../tests/spec/cand-06-review-step.test.tsx) |
| [CAND-06-A8.3B](06-onboarding-components.md#cand-06-a8-3b) | A Completed configuration changes the success wording. | [`shows the already-submitted wording when the form config status is Completed`](../../../tests/spec/cand-06-review-step.test.tsx) |
| [CAND-06-A8.4A](06-onboarding-components.md#cand-06-a8-4a) | An unfinished tab disables the submit and offers a jump. | [`renders incomplete steps warning and disables submit`](../../../tests/components/onboarding/steps/review-step.test.tsx) |
| [CAND-06-A8.4B](06-onboarding-components.md#cand-06-a8-4b) | Back goes to the previous step. | [`calls prevStep when Back button is clicked`](../../../tests/components/onboarding/steps/review-step.test.tsx) |
| [CAND-06-A8.5A](06-onboarding-components.md#cand-06-a8-5a) | A table summary counts the rows or says none were added. | [`accurately renders dynamic count summaries for tabular record sets`](../../../tests/components/onboarding/steps/review-step.test.tsx) |
| [CAND-06-A8.5B](06-onboarding-components.md#cand-06-a8-5b) | Expanding shows the values and offers the edit jump. | [`renders step tabs and allows expanding sections to see summary data`](../../../tests/components/onboarding/steps/review-step.test.tsx) |
| [CAND-06-A8.5C](06-onboarding-components.md#cand-06-a8-5c) | A table is listed row by row, skipping empty and hidden cells. | [`supports robust nested decomposition of child tabular field arrays in expansion`](../../../tests/components/onboarding/steps/review-step.test.tsx) |
| [CAND-06-A8.5D](06-onboarding-components.md#cand-06-a8-5d) | An absent table reads as nothing added. | [`displays definitive void state when expansion uncovers an empty target table`](../../../tests/components/onboarding/steps/review-step.test.tsx) |
| [CAND-06-A8.6A](06-onboarding-components.md#cand-06-a8-6a) | A submitted status replaces the step with the success panel. | [`renders success state when submitted`](../../../tests/components/onboarding/steps/review-step.test.tsx) |
| [CAND-06-A8.6B](06-onboarding-components.md#cand-06-a8-6b) | The success panel's button goes to the dashboard. | [`navigates successfully when explicit dashboard button is clicked in success view`](../../../tests/components/onboarding/steps/review-step.test.tsx) |

<a id="cand-06-a8-1a"></a>
#### CAND-06-A8.1A: An unticked declaration blocks the submit

- Precondition: One completed tab, no rejected field, the declaration box untouched.
- Action: Click Submit.
- Expected result: The message `You must accept the declaration to submit` is shown and the context's submit is not called `components/onboarding/steps/review-step.tsx:94-100,356-358`
- Test: characterization: `tests/spec/cand-06-review-step.test.tsx::blocks the submit and shows the schema message while the declaration box is unticked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. The message text comes from `lib/validation/onboarding-schemas.ts`, which is SPEC-CAND-05.
- Evidence: UNVERIFIED

<a id="cand-06-a8-1b"></a>
#### CAND-06-A8.1B: A ticked declaration submits once

- Precondition: The same state with the box ticked.
- Action: Click Submit.
- Expected result: The context's submit is called exactly once and with the single argument `submit` `components/onboarding/steps/review-step.tsx:109-111`
- Test: characterization: `tests/spec/cand-06-review-step.test.tsx::submits with the single argument submit once the declaration box is ticked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. What the context does with that word is SPEC-CAND-05.
- Evidence: UNVERIFIED

<a id="cand-06-a8-1c"></a>
#### CAND-06-A8.1C: The submit reaches the context

- Precondition: One completed tab and an enabled Submit button.
- Action: Tick the box and click Submit.
- Expected result: The button is enabled beforehand and the context's submit is called `components/onboarding/steps/review-step.tsx:109-111,374-377`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::handles standard successful submission flow after declaration acceptance`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. The argument handed to the submit is not asserted here; CAND-06-A8.1B does that.
- Evidence: UNVERIFIED

<a id="cand-06-a8-1d"></a>
#### CAND-06-A8.1D: A rejected submit shows its message

- Precondition: The context's submit rejects with an error carrying a message.
- Action: Tick the box and click Submit.
- Expected result: That message is shown in the form `components/onboarding/steps/review-step.tsx:112-116,359-365`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::displays server error message on submit failure`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. A rejection with a non-Error value, which falls back to a fixed sentence, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a8-2a"></a>
#### CAND-06-A8.2A: An uncorrected rejected field disables Submit

- Precondition: One tab holding a rejected field whose saved value equals its original.
- Action: Render the step.
- Expected result: The Submit button is disabled `components/onboarding/steps/review-step.tsx:73-86,374-377`
- Test: characterization: `tests/spec/cand-06-review-step.test.tsx::disables the Submit button while a rejected field still carries its original value`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. The comparison trims both sides; an original that differs only in whitespace is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a8-2b"></a>
#### CAND-06-A8.2B: The handler also refuses

- Precondition: The same state, with the declaration ticked.
- Action: Submit the form element directly, around the disabled button.
- Expected result: The inline error reads `Please correct all rejected fields before submitting: PAN Number`, a toast carries the short form of the same sentence and the context's submit is not called `components/onboarding/steps/review-step.tsx:103-108`
- Test: characterization: `tests/spec/cand-06-review-step.test.tsx::names the uncorrected rejected field in an inline error and a toast when the form is submitted around the disabled button`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. Submitting the form directly is the only way to reach this branch while the button is disabled, so the case does not prove a candidate can reach it.
- Evidence: UNVERIFIED

<a id="cand-06-a8-2c"></a>
#### CAND-06-A8.2C: A changed value counts as corrected

- Precondition: The same rejected field, but the saved value now differs from the original.
- Action: Tick the box and click Submit.
- Expected result: The context's submit is called with `submit` and no toast is raised `components/onboarding/steps/review-step.tsx:73-86,109-111`
- Test: characterization: `tests/spec/cand-06-review-step.test.tsx::treats a rejected field as corrected once its value differs from the original and submits`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. Whether the backend accepts the new value is not read.
- Evidence: UNVERIFIED

<a id="cand-06-a8-3a"></a>
#### CAND-06-A8.3A: The flat summary drops numbers

- Precondition: One tab with no table whose saved data holds two strings and a number.
- Action: Render the step.
- Expected result: The accordion line reads the two strings joined by a space, without the number `components/onboarding/steps/review-step.tsx:172-174`
- Test: characterization: `tests/spec/cand-06-review-step.test.tsx::summarises a tab without a table as the first two string values only, dropping the numeric one`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. A tab with more than two strings, where only the first two are taken, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a8-3b"></a>
#### CAND-06-A8.3B: The already-submitted wording

- Precondition: The status is `submitted` and the configuration status is `Completed`.
- Action: Render the step.
- Expected result: The panel reads `Onboarding already submitted` and the matching explanation `components/onboarding/steps/review-step.tsx:133-141`
- Test: characterization: `tests/spec/cand-06-review-step.test.tsx::shows the already-submitted wording when the form config status is Completed`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. Which backend states map to `Completed` is SPEC-CAND-05.
- Evidence: UNVERIFIED

<a id="cand-06-a8-4a"></a>
#### CAND-06-A8.4A: An unfinished tab blocks the submit

- Precondition: One tab that is not in the completed set.
- Action: Render the step and click the tab's name in the warning block.
- Expected result: The warning `Please complete all steps before submitting.` is shown, the Submit button is disabled and the click reports step 0 `components/onboarding/steps/review-step.tsx:191-212,374-377`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::renders incomplete steps warning and disables submit`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. More than one unfinished tab is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a8-4b"></a>
#### CAND-06-A8.4B: Back goes to the previous step

- Precondition: The step is rendered in its normal state.
- Action: Click Back.
- Expected result: The context's previous-step handler is called `components/onboarding/steps/review-step.tsx:370-373`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::calls prevStep when Back button is clicked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. That Back is never disabled is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a8-5a"></a>
#### CAND-06-A8.5A: The table summary counts rows

- Precondition: Two tabs, each holding one table; the first has two rows and the second none.
- Action: Render the step.
- Expected result: The first line reads `2 Jobs Added` and the second `No Vouches Added` `components/onboarding/steps/review-step.tsx:163-169`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::accurately renders dynamic count summaries for tabular record sets`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. A tab with both a table and flat fields, where the table wins, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a8-5b"></a>
#### CAND-06-A8.5B: Expanding a section

- Precondition: One completed tab with one saved value.
- Action: Click the accordion header, then click Edit this section.
- Expected result: Before the click there is no edit link; after it the field label, its value and the edit link are shown and the edit click reports step 0 `components/onboarding/steps/review-step.tsx:219-317`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::renders step tabs and allows expanding sections to see summary data`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. That a second click closes the section, and that only one section is open at a time, are not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a8-5c"></a>
#### CAND-06-A8.5C: A table is listed row by row

- Precondition: One tab with a table holding one row and four child fields: two with values, one empty and one hidden.
- Action: Expand that tab.
- Expected result: `Item #1` and the two valued labels with their values are shown and the empty and hidden labels are not `components/onboarding/steps/review-step.tsx:262-290`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::supports robust nested decomposition of child tabular field arrays in expansion`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. A monetary child field, which takes the other render branch, is not tried (section 10); a child field hidden by `depends_on` rather than by `hidden` is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a8-5d"></a>
#### CAND-06-A8.5D: An absent table reads as none added

- Precondition: One tab whose table value is null.
- Action: Expand that tab.
- Expected result: The line `No Sub List added` is shown `components/onboarding/steps/review-step.tsx:264-267`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::displays definitive void state when expansion uncovers an empty target table`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. The capitalised accordion summary for the same state is not asserted here; CAND-06-A8.5A covers it.
- Evidence: UNVERIFIED

<a id="cand-06-a8-6a"></a>
#### CAND-06-A8.6A: The success panel

- Precondition: The status is `submitted` and the configuration status is not `Completed`.
- Action: Render the step.
- Expected result: The panel reads `Onboarding Submitted!` with the first-submission explanation `components/onboarding/steps/review-step.tsx:127-141`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::renders success state when submitted`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. That the declaration form and the accordion are gone is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a8-6b"></a>
#### CAND-06-A8.6B: The dashboard button

- Precondition: The same submitted state.
- Action: Click Go to Dashboard.
- Expected result: The router is asked to push `/dashboard` `components/onboarding/steps/review-step.tsx:142-146`
- Test: mapped: `tests/components/onboarding/steps/review-step.test.tsx::navigates successfully when explicit dashboard button is clicked in success view`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the onboarding context, the router and the toast library are mocked; the backend is stubbed. Whether the dashboard then shows the submitted state is SPEC-CAND-04.
- Evidence: UNVERIFIED

<a id="cand-06-a9"></a>
### CAND-06-A9: Portal stepper sidebar

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A9.1A](06-onboarding-components.md#cand-06-a9-1a) | Survey steps drive labels, statuses, links and the next-step card. | [`renders dynamic steps with mapped icons, statuses, links, and next step label`](../../../tests/components/portal/portal-stepper-sidebar.test.tsx) |
| [CAND-06-A9.1B](06-onboarding-components.md#cand-06-a9-1b) | A step named by current_step is ongoing whatever its status. | [`marks a step ongoing when its key equals current_step even if status is not ongoing`](../../../tests/components/portal/portal-stepper-sidebar.test.tsx) |
| [CAND-06-A9.1C](06-onboarding-components.md#cand-06-a9-1c) | An unmatched next_step is shown as its raw key. | [`falls back to next_step key when it does not match any step`](../../../tests/components/portal/portal-stepper-sidebar.test.tsx) |
| [CAND-06-A9.2A](06-onboarding-components.md#cand-06-a9-2a) | Expanded items are listed and report the clicked index. | [`lists the expanded items under the current step and reports the clicked index`](../../../tests/spec/cand-06-table-and-sidebar.test.tsx) |
| [CAND-06-A9.2B](06-onboarding-components.md#cand-06-a9-2b) | The step header toggles the item list. | [`collapses and re-expands the item list when the step header is clicked`](../../../tests/spec/cand-06-table-and-sidebar.test.tsx) |
| [CAND-06-A9.3A](06-onboarding-components.md#cand-06-a9-3a) | Without survey data the fixed three steps are drawn. | [`renders the three static steps and next-step text for the survey page`](../../../tests/components/portal/portal-stepper-sidebar.test.tsx) |
| [CAND-06-A9.3B](06-onboarding-components.md#cand-06-a9-3b) | The fixed next-step word follows the page. | [`computes next-step text for the offer and onboarding pages`](../../../tests/components/portal/portal-stepper-sidebar.test.tsx) |
| [CAND-06-A9.3C](06-onboarding-components.md#cand-06-a9-3c) | Caller classes land on the container. | [`applies a custom className`](../../../tests/components/portal/portal-stepper-sidebar.test.tsx) |

<a id="cand-06-a9-1a"></a>
#### CAND-06-A9.1A: Survey steps drive the sidebar

- Precondition: The survey hook returns four steps with mixed statuses and redirect URLs, a current step and a next step; the sidebar is on the offer page and not view-only.
- Action: Render it.
- Expected result: The labels are shown; the current step reads ONGOING, the completed one COMPLETED and at least two read PENDING; a step with a redirect URL is an anchor with that href while one without is not an anchor; the next-step label appears twice `components/portal/portal-stepper-sidebar.tsx:46-85,116-119,212-223,261-269`
- Test: mapped: `tests/components/portal/portal-stepper-sidebar.test.tsx::renders dynamic steps with mapped icons, statuses, links, and next step label`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the survey hook and `next/link` are mocked; the backend is stubbed and no router is used. Which icon each key picks is not asserted; the view-only default, which drops every link, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a9-1b"></a>
#### CAND-06-A9.1B: current_step wins over the status

- Precondition: One survey step whose status is pending but whose key equals the survey's current step; the sidebar is on another page.
- Action: Render it.
- Expected result: The step reads ONGOING and, having no redirect URL, is not an anchor `components/portal/portal-stepper-sidebar.tsx:64-85,219-223`
- Test: mapped: `tests/components/portal/portal-stepper-sidebar.test.tsx::marks a step ongoing when its key equals current_step even if status is not ongoing`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the survey hook and `next/link` are mocked; the backend is stubbed and no router is used. The third ongoing trigger, a status of `ongoing`, is covered by CAND-06-A9.1A.
- Evidence: UNVERIFIED

<a id="cand-06-a9-1c"></a>
#### CAND-06-A9.1C: An unmatched next step

- Precondition: The survey's next step names a key that no step carries.
- Action: Render the sidebar.
- Expected result: That raw string is shown in the bottom card `components/portal/portal-stepper-sidebar.tsx:116-119`
- Test: mapped: `tests/components/portal/portal-stepper-sidebar.test.tsx::falls back to next_step key when it does not match any step`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the survey hook and `next/link` are mocked; the backend is stubbed and no router is used. A null next step with survey data present, which falls through to the per-page word, is not tried.
- Evidence: UNVERIFIED

<a id="cand-06-a9-2a"></a>
#### CAND-06-A9.2A: Expanded items report their index

- Precondition: The sidebar is on the offer page with two expanded items and the first one active.
- Action: Click the second item.
- Expected result: The callback is called with 1 `components/portal/portal-stepper-sidebar.tsx:230-244`
- Test: characterization: `tests/spec/cand-06-table-and-sidebar.test.tsx::lists the expanded items under the current step and reports the clicked index`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the survey hook and `next/link` are mocked; the backend is stubbed and no router is used. The active item's highlight classes are not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a9-2b"></a>
#### CAND-06-A9.2B: The header toggles the items

- Precondition: The sidebar is on the offer page with one expanded item.
- Action: Click the step header twice.
- Expected result: The item is shown at first, gone after the first click and back after the second `components/portal/portal-stepper-sidebar.tsx:148,205-211,225-245`
- Test: characterization: `tests/spec/cand-06-table-and-sidebar.test.tsx::collapses and re-expands the item list when the step header is clicked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the survey hook and `next/link` are mocked; the backend is stubbed and no router is used. The chevron that changes with the state is not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a9-3a"></a>
#### CAND-06-A9.3A: The fixed three steps

- Precondition: The survey hook returns no data; the sidebar is on the survey page.
- Action: Render it.
- Expected result: The survey and onboarding labels are shown, one step reads ONGOING and the offer label appears both as a step and in the bottom card `components/portal/portal-stepper-sidebar.tsx:88-112,121-126`
- Test: mapped: `tests/components/portal/portal-stepper-sidebar.test.tsx::renders the three static steps and next-step text for the survey page`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the survey hook and `next/link` are mocked; the backend is stubbed and no router is used. The COMPLETED and PENDING pills of the fixed list are not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a9-3b"></a>
#### CAND-06-A9.3B: The fixed next-step word

- Precondition: No survey data; the sidebar is rendered for the offer page and then the onboarding page.
- Action: Render and re-render.
- Expected result: The offer page shows the onboarding label twice and the onboarding page shows `Portal Completion` `components/portal/portal-stepper-sidebar.tsx:121-126`
- Test: mapped: `tests/components/portal/portal-stepper-sidebar.test.tsx::computes next-step text for the offer and onboarding pages`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the survey hook and `next/link` are mocked; the backend is stubbed and no router is used. The statuses of the fixed steps on those pages are not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a9-3c"></a>
#### CAND-06-A9.3C: Caller classes

- Precondition: No survey data and an extra class name.
- Action: Render the sidebar.
- Expected result: An element inside the output carries that class `components/portal/portal-stepper-sidebar.tsx:131-134`
- Test: mapped: `tests/components/portal/portal-stepper-sidebar.test.tsx::applies a custom className`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: the survey hook and `next/link` are mocked; the backend is stubbed and no router is used. That it is the outer container, and that the built-in classes survive, are not asserted.
- Evidence: UNVERIFIED

<a id="cand-06-a10"></a>
### CAND-06-A10: Onboarding wizard placeholder

| Case | What the assertions check | Test |
|---|---|---|
| [CAND-06-A10.1A](06-onboarding-components.md#cand-06-a10-1a) | The placeholder sentence is all the component draws. | [`renders placeholder text`](../../../tests/components/onboarding-wizard.test.tsx) |
| [CAND-06-A10.1B](06-onboarding-components.md#cand-06-a10-1b) | The one button calls the completion callback once. | [`calls onComplete when button is clicked`](../../../tests/components/onboarding-wizard.test.tsx) |

<a id="cand-06-a10-1a"></a>
#### CAND-06-A10.1A: The placeholder sentence

- Precondition: The component is given a user, a profile and a callback.
- Action: Render it.
- Expected result: The text `Onboarding Wizard Placeholder` is on screen `components/onboarding-wizard.tsx:16-19`
- Test: mapped: `tests/components/onboarding-wizard.test.tsx::renders placeholder text`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: no module is mocked in this case apart from the callback stub the test passes in as a prop; no backend, router or context is involved and the component is rendered alone in jsdom, so the G9 mock gap does not apply to it. That the user and profile are never read is not asserted. The file has no importer in the app (G3, PWHR-1565).
- Evidence: UNVERIFIED

<a id="cand-06-a10-1b"></a>
#### CAND-06-A10.1B: The completion button

- Precondition: The same props.
- Action: Click the `Complete` button.
- Expected result: The callback is called exactly once `components/onboarding-wizard.tsx:18`
- Test: mapped: `tests/components/onboarding-wizard.test.tsx::calls onComplete when button is clicked`
- Environment: no-site: vitest, jsdom; backend stubbed; no database
- Known gaps: no module is mocked in this case apart from the callback stub the test passes in as a prop; no backend, router or context is involved and the component is rendered alone in jsdom, so the G9 mock gap does not apply to it. The callback receives no argument and that is not asserted. The file has no importer in the app (G3, PWHR-1565).
- Evidence: UNVERIFIED
