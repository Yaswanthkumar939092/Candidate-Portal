"use client";

// Date of Joining must be a working day.
//
// The dates a joining-date field must refuse — holidays and weekly offs — read
// from the same Holiday List the backend validates against
// (recruitment.api.joining_day). The backend is the enforcement point; this
// only stops the candidate picking a date that would be rejected on submit.
//
// Fetched once and cached for the session: the holiday calendar does not change
// while a form is open, and several date fields on one form share the answer.

import * as React from "react";
import { frappeApiBase } from "@/lib/frappe-base";

/** Job Applicant / Employee Onboarding fields that hold a joining date. */
export const JOINING_DAY_FIELDS: Record<string, true> = {
  custom_expected_doj: true,
  date_of_joining: true,
  custom_date_of_joining: true,
  custom_trainee_doj: true,
  custom_doj_outcome_date: true,
  expected_doj: true,
};

let pending: Promise<string[]> | null = null;

function fetchNonWorkingDays(): Promise<string[]> {
  if (!pending) {
    pending = fetch(
      // `get_my_non_working_days`, not `get_non_working_days`: the portal has no
      // Frappe session (it authenticates with its own candidate cookie), so the
      // plain whitelisted endpoint answers 403 for Guest and every picker would
      // silently stay open while the backend went on rejecting the dates it
      // offered. The candidate's company is resolved server-side from their own
      // Job Applicant, so there is nothing to pass and nothing to key a cache on.
      `${frappeApiBase()}/api/method/recruitment.api.joining_day.get_my_non_working_days`,
      { credentials: "include", headers: { Accept: "application/json" } },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => (body?.message?.dates as string[]) ?? [])
      // A failed lookup must leave the field open rather than refuse every
      // date: the backend still rejects a non-working day on submit.
      .catch(() => []);
  }
  return pending;
}

/**
 * The YYYY-MM-DD dates a joining-date field must refuse. Empty while loading,
 * when nothing is configured, or when the lookup fails — in each case the field
 * stays open and the backend remains the authority.
 *
 * Pass `enabled = false` for a field the rule does not cover, so a form without
 * a joining date makes no request at all.
 */
export function useNonWorkingDays(enabled = true): string[] {
  const [dates, setDates] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!enabled) {
      setDates([]);
      return;
    }
    let active = true;
    fetchNonWorkingDays().then((d) => {
      if (active) setDates(d);
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  return dates;
}
