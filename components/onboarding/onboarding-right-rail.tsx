"use client";

import React, { useMemo } from "react";
import { useOnboarding } from "@/lib/contexts/onboarding-context";
import { evaluateDependsOn, isFieldFilled } from "@/lib/onboarding-utils";
import { OnboardingField } from "@/lib/types/onboarding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Info,
  Loader2,
  ArrowRight,
  UserRound,
  Save,
} from "lucide-react";

// Types
interface OnboardingRightRailProps {
  focusedFieldname: string | null;
}

const FIELD_TIPS: Record<string, { title: string; body: string }> = {
  first_name: {
    title: "Use your legal name",
    body: "Match this with your Aadhaar or passport — we use it for the offer letter and tax filings.",
  },
  middle_name: {
    title: "Optional — only if on ID",
    body: "Skip if you don't have one. Include only if it appears on your government ID.",
  },
  last_name: {
    title: "Family / surname",
    body: "If you have a single legal name, leave Last Name blank and we'll handle it.",
  },
  custom_personal_email: {
    title: "Where we write to you",
    body: "Offer letter, payslips, and account credentials all land here. Use a personal address — not your current work email.",
  },
  personal_email: {
    title: "Where we write to you",
    body: "Offer letter, payslips, and account credentials all land here. Use a personal address — not your current work email.",
  },

  custom_date_of_joining: {
    title: "Tentative start date",
    body: "Your hiring manager has ±5 days of flexibility. Confirm before final submission.",
  },
  custom_date_of_birth: {
    title: "Used for HR records",
    body: "Must be at least 18 years old. We'll send a birthday card 🎂",
  },
  gender: {
    title: "For diversity reporting",
    body: "Anonymized in aggregate — never shown to your team or manager.",
  },
  marital_status: {
    title: "Drives benefit eligibility",
    body: "Spouse health insurance activates if Married. You'll add spouse details in the next step.",
  },
  custom_blood_group: {
    title: "Emergency use only",
    body: "Visible to medical responders on PW campuses; not shared elsewhere.",
  },
  custom_father_name: {
    title: "As on Aadhaar",
    body: "Father's name exactly as it appears on your Aadhaar. Mismatches block PF/tax processing.",
  },
  custom_mother_name: {
    title: "As on Aadhaar",
    body: "Required for KYC. Spelling must match your government records.",
  },
  custom_emergency_contact_name: {
    title: "Single point of contact",
    body: "Someone we can reach in an emergency — usually a parent, sibling, or partner.",
  },
  custom_emergency_contact_number: {
    title: "Available 24×7",
    body: "Best to use a number different from your primary contact.",
  },
};

const getInitials = (name: string) => {
  if (!name) return "OB";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

export function OnboardingRightRail({
  focusedFieldname,
}: OnboardingRightRailProps) {
  const {
    formConfig,
    currentStep,
    stepData,
    triggerSubmit,
    isSaving,
    submitAll,
  } = useOnboarding();

  const tabs = formConfig?.tabs || [];
  const currentTab = tabs[currentStep];
  const isReviewStep = currentStep >= tabs.length;

  const buddies = useMemo(() => {
    if (formConfig?.key_contacts && formConfig.key_contacts.length > 0) {
      return formConfig.key_contacts.map((c) => ({
        name: c.name || "",
        designation: c.designation || "",
        email: c.email || "",
        phone: c.phone || c.mobile_no || "",
      }));
    }
    return [];
  }, [formConfig?.key_contacts]);

  // Flattened doc of all current onboarding fields
  const doc = useMemo(() => {
    const merged: Record<string, any> = {};
    Object.keys(stepData).forEach((key) => {
      Object.assign(merged, stepData[key]);
    });
    return merged;
  }, [stepData]);

  // Extract variables for ID card
  const joiningDate = (doc.custom_date_of_joining ||
    doc.date_of_joining ||
    "") as string;

  // Format Date Helper
  const formatDisplayDate = (d: string) => {
    if (!d) return null;
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  // Days to joining calculation
  const daysToJoining = useMemo(() => {
    if (typeof formConfig?.joining?.days_to_joining === "number") {
      return formConfig.joining.days_to_joining;
    }
    if (!joiningDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(joiningDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [formConfig?.joining?.days_to_joining, joiningDate]);

  // Calculate required fields and completion in active tab
  const requiredFields = useMemo(() => {
    if (!currentTab) return [];
    const list: Array<{ fieldname: string; label: string; field: OnboardingField; parentDoc: any }> = [];

    currentTab.sections.forEach((section) => {
      section.fields.forEach((field) => {
        const isVisible =
          !field.hidden &&
          (!field.depends_on || evaluateDependsOn(field.depends_on, doc));
        if (!isVisible) return;

        const isMandatory =
          field.is_mandatory ||
          field.reqd ||
          (field.mandatory_depends_on &&
            evaluateDependsOn(field.mandatory_depends_on, doc));

        if (field.fieldtype === "Table") {
          let rows = Array.isArray(doc[field.fieldname]) ? doc[field.fieldname] : [];
          if (rows.length === 0 && isMandatory) {
             rows = [{}]; // Force at least one row to evaluate required child fields
          }
          
          rows.forEach((row: any, rowIndex: number) => {
            field.child_fields?.forEach((childField) => {
              const childVisible = !childField.hidden && (!childField.depends_on || evaluateDependsOn(childField.depends_on, row));
              if (!childVisible) return;
              
              const childMandatory = childField.is_mandatory || childField.reqd || (childField.mandatory_depends_on && evaluateDependsOn(childField.mandatory_depends_on, row));
              
              if (childMandatory) {
                list.push({
                  fieldname: `${field.fieldname}_${rowIndex}_${childField.fieldname}`,
                  label: rows.length > 1 ? `${field.label} (${rowIndex + 1}) - ${childField.label}` : `${field.label} - ${childField.label}`,
                  field: childField,
                  parentDoc: row
                });
              }
            });
          });
        } else {
          if (isMandatory) {
            list.push({
              fieldname: field.fieldname,
              label: field.label,
              field,
              parentDoc: doc
            });
          }
        }
      });
    });

    return list;
  }, [currentTab, doc]);

  const requiredFilled = useMemo(() => {
    return requiredFields.filter((f) => isFieldFilled(f.field, f.parentDoc));
  }, [requiredFields]);

  const requiredFieldsLeft = useMemo(() => {
    return requiredFields.filter((f) => !isFieldFilled(f.field, f.parentDoc));
  }, [requiredFields]);

  const completionPct =
    requiredFields.length > 0
      ? requiredFilled.length / requiredFields.length
      : 0;

  // SVG Circular Progress Calculations
  const radius = 34;
  const strokeCircumference = 2 * Math.PI * radius;

  // Jump to field helper
  const handleJumpToField = (fieldname: string) => {
    const el = document.getElementById(`field-${fieldname}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const input = el.querySelector("input, select, textarea, button");
        if (input instanceof HTMLElement) {
          input.focus();
        }
        // brief highlight pulse
        el.animate(
          [
            { boxShadow: "0 0 0 0 rgba(91,46,229,0)" },
            { boxShadow: "0 0 0 8px rgba(91,46,229,0.18)" },
            { boxShadow: "0 0 0 0 rgba(91,46,229,0)" },
          ],
          { duration: 900, easing: "ease-out" },
        );
      }, 300);
    }
  };

  const tip =
    focusedFieldname && FIELD_TIPS[focusedFieldname]
      ? FIELD_TIPS[focusedFieldname]
      : null;

  const companyName =
    formConfig?.branding?.company_name ||
    formConfig?.branding?.company ||
    "COMPANY NAME";

  return (
    <aside className="w-full flex flex-col gap-6 h-full select-none">
      {/* 1. ID Card Preview */}
      <div className="bg-primary rounded-2xl p-4.5 flex flex-col gap-4 shadow-md text-primary-foreground">
        {/* Header Row */}
        <div className="flex gap-2 items-center w-full">
          <div className="w-5.5 h-5.5 rounded-md bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 text-primary-foreground" />
          </div>

          <span className="text-primary-foreground font-bold text-xs tracking-wider uppercase truncate max-w-42.5">
            {companyName}
          </span>
          <div className="w-8 h-5.5 ml-auto rounded bg-linear-to-br from-[#F5D571] to-[#C99A2C] relative opacity-90 shadow-sm shrink-0">
            <div className="absolute inset-x-1 top-2.5 h-px bg-black/15" />
            <div className="absolute inset-x-1 bottom-1.5 h-px bg-black/15" />
          </div>
        </div>

        {/* Card Body - Candidate Info / Joining Info */}
        {formConfig?.joining &&
          (formConfig.joining.date_of_joining ||
            formConfig.joining.role_name ||
            formConfig.joining.department_name ||
            formConfig.joining.trainee_doj) && (
            <div className="border-t border-primary-foreground/15 pt-3 flex flex-col gap-2.5 w-full">
              {formConfig.joining.role_name && (
                <div className="flex justify-between items-center gap-4 text-xs md:text-sm">
                  <span className="text-primary-foreground/70 font-semibold shrink-0">
                    Role
                  </span>
                  <span className="font-bold text-right truncate max-w-[65%]">
                    {formConfig.joining.role_name}
                  </span>
                </div>
              )}
              {formConfig.joining.department_name && (
                <div className="flex justify-between items-center gap-4 text-xs md:text-sm">
                  <span className="text-primary-foreground/70 font-semibold shrink-0">
                    Department
                  </span>
                  <span className="font-bold text-right truncate max-w-[65%]">
                    {formConfig.joining.department_name}
                  </span>
                </div>
              )}
              {formConfig.joining.date_of_joining && (
                <div className="flex justify-between items-center gap-4 text-xs md:text-sm">
                  <span className="text-primary-foreground/70 font-semibold shrink-0">
                    Date of Joining
                  </span>
                  <span className="font-bold text-right shrink-0">
                    {formatDisplayDate(formConfig.joining.date_of_joining)}
                  </span>
                </div>
              )}
              {formConfig.joining.trainee_doj && (
                <div className="flex justify-between items-center gap-4 text-xs md:text-sm">
                  <span className="text-primary-foreground/70 font-semibold shrink-0">
                    Trainee DOJ
                  </span>
                  <span className="font-bold text-right shrink-0">
                    {formatDisplayDate(formConfig.joining.trainee_doj)}
                  </span>
                </div>
              )}
            </div>
          )}
      </div>
      {/* 2. Countdown Widget */}
      {daysToJoining !== null ? (
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5 shadow-sm">
          <div className="text-4xl font-bold text-primary font-mono select-none tracking-tight shrink-0">
            {daysToJoining !== null && daysToJoining >= 0 ? daysToJoining : 0}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Days to joining
            </div>
            <div className="text-sm font-bold mt-0.5 text-foreground">
              {daysToJoining !== null && daysToJoining > 0
                ? "Until your first day!"
                : daysToJoining === 0
                  ? "Welcome Day! 🎉"
                  : "Start date passed"}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5 shadow-sm opacity-80">
          <div className="text-3xl font-bold text-muted-foreground font-mono shrink-0">
            —
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Days to joining
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-0.5">
              Fill your Date of Joining to see the countdown
            </div>
          </div>
        </div>
      )}

      {/* 3. Circular Progress Ring Widget */}
      {requiredFields.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5.5 shadow-sm">
          <div className="relative w-21 h-21 shrink-0">
            <svg width="84" height="84" className="-rotate-90">
              <circle
                cx="42"
                cy="42"
                r={radius}
                stroke="var(--border)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="42"
                cy="42"
                r={radius}
                stroke="var(--primary)"
                strokeWidth="5"
                fill="none"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={strokeCircumference * (1 - completionPct)}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-accent-foreground font-mono">
              {Math.round(completionPct * 100)}%
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">
              {currentTab?.tab || "Step Progress"}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-0.5">
              Required fields status
            </div>
            <div className="flex gap-4 mt-3">
              <div>
                <span className="block text-base font-extrabold text-foreground leading-none font-mono">
                  {requiredFilled.length}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">
                  Filled
                </span>
              </div>
              <div className="border-r border-border h-7 my-auto" />
              <div>
                <span className="block text-base font-extrabold text-foreground leading-none font-mono">
                  {requiredFieldsLeft.length}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">
                  Left
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tips Card */}
      {tip && (
        <div
          key={focusedFieldname || "default"}
          className="bg-linear-to-br from-[#FFF8E6] to-[#FFEFC2] border border-[#FAE0A8] rounded-2xl p-4.5 flex gap-3.5 shadow-sm transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F5C247] text-[#5A3D04] flex items-center justify-center shrink-0">
            <Info className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#5A3D04]">
              {tip.title}
            </div>
            <div className="text-xs text-[#6E5008] leading-relaxed mt-1 font-medium">
              {tip.body}
            </div>
          </div>
        </div>
      )}

      {/* 5. Checklist Widget */}
      {requiredFieldsLeft.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-black text-foreground flex items-center justify-between mb-3.5">
            Required Fields Left
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono">
              {requiredFieldsLeft.length}
            </span>
          </h4>
          <div className="flex flex-col gap-1.5">
            {requiredFieldsLeft.slice(0, 5).map((field) => (
              <button
                key={field.fieldname}
                type="button"
                onClick={() => handleJumpToField(field.fieldname)}
                className="group flex items-center justify-between text-left text-xs font-semibold py-2 px-2.5 rounded-lg border border-transparent hover:border-border hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-4 h-4 rounded border border-border group-hover:border-primary/40 flex items-center justify-center shrink-0 bg-background transition-colors">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <span className="truncate text-foreground group-hover:text-primary">
                    {field.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-primary/60 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 shrink-0" />
              </button>
            ))}
            {requiredFieldsLeft.length > 5 && (
              <div className="text-[10px] text-muted-foreground font-bold text-center mt-2.5">
                + {requiredFieldsLeft.length - 5} more fields
              </div>
            )}
          </div>
        </div>
      ) : requiredFields.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3.5 text-green-700">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
              <Check className="w-4.5 h-4.5 stroke-3" />
            </div>
            <div>
              <div className="text-xs font-bold">All required fields done</div>
              <div className="text-[11px] text-green-600 font-medium mt-0.5">
                Ready to save and continue!
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 6. Onboarding Journey & Buddy Info */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col">
        {/* Onboarding Journey */}
        {formConfig?.onboarding_journey && (
          <div className="mb-5">
            <h4 className="text-xs font-black text-foreground mb-1">
              {formConfig.onboarding_journey.title || "After you're onboarded"}
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium mb-4 leading-relaxed">
              {formConfig.onboarding_journey.subtitle ||
                `Your first two weeks at ${companyName} — at a glance.`}
            </p>
            <div className="flex flex-col gap-4">
              {formConfig.onboarding_journey.steps?.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F2FF] text-[#5B2EE5] flex items-center justify-center shrink-0 select-none">
                    {(() => {
                      const IconComponent = (() => {
                        switch (idx % 5) {
                          case 0:
                            return UserRound;
                          case 1:
                            return Save;
                          case 2:
                            return Sparkles;
                          case 3:
                            return Mail;
                          case 4:
                          default:
                            return Calendar;
                        }
                      })();
                      return <IconComponent className="w-4 h-4" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground leading-tight">
                      {step.title}
                    </div>
                    {(step.detail || step.timeframe) && (
                      <div className="text-[10px] text-muted-foreground font-medium mt-1 leading-normal flex items-baseline gap-1.5 flex-wrap">
                        {step.timeframe && (
                          <span className="text-[#5B2EE5] font-bold font-mono shrink-0">
                            {step.timeframe}
                          </span>
                        )}
                        {step.timeframe && step.detail && (
                          <span className="text-muted-foreground/60 select-none font-bold">
                            ·
                          </span>
                        )}
                        {step.detail && <span>{step.detail}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {formConfig?.onboarding_journey && (
          <div className="border-t border-border my-4" />
        )}

        {/* Onboarding Buddy */}
        <div>
          <h4 className="text-xs font-black text-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {buddies.length > 1 ? "Onboarding Buddies" : "Onboarding Buddy"}
          </h4>
          {buddies.length > 0 ? (
            <div className="flex flex-col gap-5 mt-4">
              {buddies.map((buddy, index) => {
                const initials = getInitials(buddy.name);
                return (
                  <div key={index} className="flex flex-col gap-3.5">
                    <div className="flex gap-3 items-start">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#FFB347] to-[#FF7A45] text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-orange-500/10 shrink-0 select-none">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-foreground leading-tight">
                          {buddy.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-tight">
                          {buddy.designation}
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3">
                          {buddy.email && (
                            <a
                              href={`mailto:${buddy.email}`}
                              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[#5B2EE5] font-semibold transition-colors truncate"
                            >
                              <Mail className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                              <span className="truncate">{buddy.email}</span>
                            </a>
                          )}
                          {buddy.phone && (
                            <a
                              href={`tel:${buddy.phone}`}
                              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[#5B2EE5] font-semibold transition-colors truncate"
                            >
                              <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                              <span>{buddy.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    {buddy.email && (
                      <button
                        type="button"
                        onClick={() => window.open(`mailto:${buddy.email}`)}
                        className="w-full border border-border hover:border-primary/30 bg-accent hover:bg-primary/15 text-accent-foreground py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Say hello to {buddy.name.split(" ")[0]}
                      </button>
                    )}
                    {index < buddies.length - 1 && (
                      <div className="border-t border-dashed border-border/80 my-2" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground font-medium mt-3 text-center py-4 bg-[#F9F9FB] rounded-xl border border-dashed border-border/60">
              No onboarding buddy assigned yet.
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions Card */}
      <div className="sticky bottom-0 bg-[#F4F5F7] dark:bg-zinc-950 pt-0 pb-2 z-10">
        <div className="bg-card border border-border rounded-xl p-5 shadow-md flex flex-col gap-3">
          {!isReviewStep && (
            <Button
              type="button"
              onClick={async () => {
                if (triggerSubmit) {
                  await triggerSubmit("save_continue");
                }
              }}
              disabled={requiredFieldsLeft.length > 0 || isSaving}
              className={cn(
                "w-full h-11 font-bold transition-all flex items-center justify-center gap-2 text-sm",
                requiredFieldsLeft.length === 0
                  ? "bg-primary text-primary-foreground hover:bg-primary/80 shadow-md shadow-primary/10 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : requiredFieldsLeft.length === 0 ? (
                <>
                  Save & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Fill {requiredFieldsLeft.length} more to continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              if (isReviewStep) {
                try {
                  await submitAll("save");
                  window.location.assign("/dashboard");
                } catch {
                  // error handled in submitAll
                }
              } else if (triggerSubmit) {
                await triggerSubmit("save_draft");
              }
            }}
            disabled={isSaving}
            className="w-full h-11 font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as Draft & Exit"
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
