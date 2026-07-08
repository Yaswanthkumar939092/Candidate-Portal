"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import {
  JobAppProvider,
  useJobApp,
} from "@/lib/contexts/job-application-context";
import { JobApplicationStep } from "@/components/jobs/job-applicant/DynamicField";
import { JobApplicationReviewStep } from "@/components/jobs/job-applicant/job-application-review-step";
import { JobApplicationStepNav } from "@/components/jobs/job-applicant/job-applicationstep-nav";
import { validateJobAppField } from "@/lib/validation/job-application-validation";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useJobOpening } from "@/lib/hooks/useJobOpening";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PortalNavigation } from "@/components/portal/portal-navigation";
import { FeatureFlagProvider } from "@/lib/contexts/feature-flags";
import { Combobox } from "@/components/ui/combobox";
import { auth } from "@/lib/auth";

function CampusApplyContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campusInvite = searchParams.get("campus_invite");

  useEffect(() => {
    if (!isAuthLoading && !user) {
      const queryString = searchParams.toString();
      const redirectUrl = `/login?redirect=${encodeURIComponent(`/campus-apply${queryString ? `?${queryString}` : ""}`)}`;
      router.push(redirectUrl);
    }
  }, [isAuthLoading, user, router, searchParams]);

  const [step, setStep] = useState(1);
  const [selectedJobName, setSelectedJobName] = useState<string | null>(null);

  // Fetch job openings from recruitment APIs
  const { data: jobData, isLoading: isLoadingJobs } = useJobOpening({
    page: 1,
    limit: 100,
    campusInvite,
    email: user?.email || undefined,
  });

  // Get openings from fetched api data
  const allOpenings = useMemo(() => {
    return jobData?.openings || [];
  }, [jobData]);

  const comboboxOptions = useMemo(() => {
    return allOpenings.map((job) => ({
      value: job.name,
      label: job.job_title,
    }));
  }, [allOpenings]);

  const handleContinue = () => {
    if (!selectedJobName) {
      toast.error("Please select a job opening to proceed.");
      return;
    }
    setStep(2);
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            Verifying authorization status...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <FeatureFlagProvider>
      <div
        className={cn(
          "bg-background text-foreground flex flex-col font-sans",
          step === 2 ? "h-screen overflow-hidden" : "min-h-screen",
        )}
      >
        {/* Header / Navigation */}
        <PortalNavigation hideNavLinks={true} disableUserDropdown={true} />

        {/* Spacer to push content below fixed header */}
        <div className="h-16 w-full shrink-0" />

        {step === 1 ? (
          <>
            {/* Main content body */}
            <main className="flex-1 flex flex-col items-center p-6 md:p-12 pt-8 relative overflow-hidden">
              {/* Background decorative ambient lights */}
              <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-primary/10 blur-[6rem] rounded-full -z-10 animate-pulse pointer-events-none" />
              <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-accent/20 blur-[8rem] rounded-full -z-10 animate-pulse pointer-events-none" />

              <div className="w-full max-w-310 flex flex-col gap-8 z-10">
                {/* Header titles */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold tracking-wide uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    Campus Hiring 2026
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary leading-none py-1">
                    Kickstart your career
                  </h1>
                  <p className="text-muted-foreground text-md max-w-2xl mx-auto font-medium">
                    Join our talent community. Select your target field to begin
                    your streamlined application process of campus roles.
                  </p>
                </div>

                <div className="max-w-250 mx-auto w-full items-start">
                  <Card className="border border-border bg-card shadow-sm rounded-3xl overflow-hidden transition-all duration-500">
                    <CardContent className="p-6 md:p-10">
                      <div className="space-y-6">
                        <div className="text-center mb-4">
                          <h2 className="text-xl font-bold tracking-tight">
                            Select your job opening
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Choose a target job opening from the list to view
                            its requirements and responsibilities.
                          </p>
                        </div>

                        {/* Dropdown Select Field & Continue Button */}
                        <div className="max-w-2xl mx-auto space-y-2">
                          <Label
                            htmlFor="jobOpeningSelect"
                            className="text-xs font-bold text-muted-foreground uppercase"
                          >
                            Select Available Openings
                          </Label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              {isLoadingJobs ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border bg-background rounded-lg h-10 px-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                  <span>Loading job openings...</span>
                                </div>
                              ) : (
                                <Combobox
                                  options={comboboxOptions}
                                  value={selectedJobName || ""}
                                  onValueChange={(val) =>
                                    setSelectedJobName(val || null)
                                  }
                                  placeholder="Select an opening..."
                                  searchPlaceholder="Search openings..."
                                  className="h-10 w-full rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&>span]:truncate"
                                />
                              )}
                            </div>
                            <Button
                              onClick={handleContinue}
                              disabled={!selectedJobName}
                              className="rounded-lg h-10 px-8 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 text-sm font-semibold transition-all shrink-0 flex items-center justify-center gap-2"
                            >
                              Continue to Application
                              <ArrowRight className="w-4.5 h-4.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Details section commented out
                        {selectedJob ? (
                          <div className="mt-8 border border-border rounded-2xl bg-background/40 p-5 md:p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
                              <div>
                                <span className="inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-primary/10 text-primary mb-1">
                                  {selectedJob.opening_code || "Campus Role"}
                                </span>
                                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                  {selectedJob.job_title}
                                </h3>
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium mt-1">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {selectedJob.department}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {selectedJob.location}
                                  </span>
                                  {selectedJob.employment_type && (
                                    <span className="flex items-center gap-1">
                                      <BriefcaseBusiness className="w-3.5 h-3.5" />
                                      {selectedJob.employment_type}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {selectedJob.posted_on && (
                                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5 self-start md:self-center">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Posted{" "}
                                  {new Date(selectedJob.posted_on).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Experience Required
                                </span>
                                <p className="font-bold text-sm text-foreground">
                                  {selectedJob.custom_work_experience || "Freshers (0-1 years)"}
                                </p>
                              </div>
                              <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Compensation Package
                                </span>
                                <p className="font-bold text-sm text-primary">
                                  {selectedJob.custom_salary || "Competitive LPA"}
                                </p>
                              </div>
                              <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1 sm:col-span-2 md:col-span-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Core Designation
                                </span>
                                <p className="font-bold text-sm text-foreground">
                                  {selectedJob.designation}
                                </p>
                              </div>
                            </div>

                            {selectedJob.skills_required && (
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase">
                                  Key Skills & Technologies
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedJob.skills_required.split(",").map((skill) => (
                                    <span
                                      key={skill}
                                      className="text-xs font-semibold px-3 py-1 rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                    >
                                      {skill.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2 border-t border-border/60 pt-4">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase">
                                Job Description & Responsibilities
                              </h4>
                              <div
                                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-2"
                                dangerouslySetInnerHTML={{
                                  __html: selectedJob.description,
                                }}
                              />
                            </div>

                            <div className="pt-6 border-t border-border/60 flex justify-end">
                              <Button
                                onClick={handleContinue}
                                className="rounded-lg h-10 px-8 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 text-sm font-semibold transition-all hover:scale-[1.02]"
                              >
                                Continue to Application
                                <ArrowRight className="ml-2 h-4.5 w-4.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-xl mx-auto mt-6 border border-border border-dashed rounded-2xl p-8 text-center bg-background/10 space-y-3">
                            <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto" />
                            <h3 className="font-bold text-sm">No job selected</h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                              Please choose one of the available campus roles from the dropdown list above to view the requirements, compensation, and duties.
                            </p>
                          </div>
                        )}
                        */}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-background py-6 text-center text-xs text-muted-foreground select-none">
              <div className="max-w-350 mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span>
                  © {new Date().getFullYear()} Candidate Portal. All rights
                  reserved.
                </span>
                <div className="flex gap-4">
                  <Link href="/terms" className="hover:text-foreground">
                    Terms
                  </Link>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy
                  </Link>
                  <Link href="/support" className="hover:text-foreground">
                    Support
                  </Link>
                </div>
              </div>
            </footer>
          </>
        ) : (
          selectedJobName && (
            <div className="flex-1 overflow-hidden">
              <JobAppProvider
                job_opening={selectedJobName}
                form_name=""
                isCampus={true}
              >
                <CampusApplyWizardInner
                  selectedJobName={selectedJobName}
                  onBackToSelect={() => {
                    setStep(1);
                  }}
                />
              </JobAppProvider>
            </div>
          )
        )}
      </div>
    </FeatureFlagProvider>
  );
}

interface CampusApplyWizardInnerProps {
  selectedJobName: string;
  onBackToSelect: () => void;
}

function CampusApplyWizardInner({
  selectedJobName,
  onBackToSelect,
}: CampusApplyWizardInnerProps) {
  const {
    tabs = [],
    allFields = [],
    isLoading,
    initializeAllStepsFromDraft,
    setStepData,
  } = useJobApp();
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Derive default values
  const defaultValues = useMemo(() => {
    const formData: Record<string, any> = {};
    if (!allFields || allFields.length === 0) return formData;
    allFields.forEach((field: any) => {
      const val =
        field.value !== undefined && field.value !== null
          ? field.value
          : field.default;
      if (val !== undefined && val !== null && val !== "") {
        formData[field.fieldname] = val;
      }
    });
    return formData;
  }, [allFields]);

  const methods = useForm({
    mode: "onChange",
    values: Object.keys(defaultValues).length > 0 ? defaultValues : undefined,
  });

  // Pre-fill fields from draft
  useEffect(() => {
    if (Object.keys(defaultValues).length > 0) {
      initializeAllStepsFromDraft(defaultValues);
    }
  }, [defaultValues, initializeAllStepsFromDraft]);

  // Pre-fill fields from user details
  useEffect(() => {
    if (!user || !allFields.length) return;
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const email = user.email || user.user_metadata?.email || "";
    const fullName =
      user.full_name ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      email;

    allFields.forEach((field: any) => {
      const label = (field.label || "").toLowerCase();
      const fname = field.fieldname || "";
      let val: string | undefined;

      if (label.includes("first name") || fname === "first_name")
        val = firstName;
      else if (label.includes("last name") || fname === "last_name")
        val = lastName;
      else if (label.includes("full name") || fname === "full_name")
        val = fullName;
      else if (label.includes("email") || fname === "email") val = email;

      if (val) methods.setValue(fname, val, { shouldValidate: false });
    });
  }, [user, methods, allFields]);

  // Auto-complete check
  const LAYOUT_FIELD_TYPES = useMemo(
    () => new Set(["Section Break", "Column Break", "Tab Break", "HTML"]),
    [],
  );

  const checkStepCompletion = useCallback(
    (formValues: Record<string, any>) => {
      if (!tabs.length) return;
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        tabs.forEach((tab: any) => {
          const key = tab.tab.toLowerCase().replace(/\s+/g, "_");
          const fields = tab.sections.flatMap((s: any) => s.fields || []);
          let stepValid = true;
          for (const field of fields) {
            if (field.hidden) continue;
            if (LAYOUT_FIELD_TYPES.has(field.fieldtype)) continue;

            const val = formValues[field.fieldname];
            const isEmpty =
              val === undefined ||
              val === null ||
              val === "" ||
              (Array.isArray(val) && val.length === 0);
            if (isEmpty) {
              stepValid = false;
              break;
            }
            const patternError = validateJobAppField(field, val);
            if (patternError) {
              stepValid = false;
              break;
            }
          }
          if (stepValid) next.add(key);
          else next.delete(key);
        });
        if (next.size !== prev.size || ![...next].every((k) => prev.has(k))) {
          return next;
        }
        return prev;
      });
    },
    [tabs, LAYOUT_FIELD_TYPES],
  );

  const computeFieldProgress = useCallback(
    (formValues: Record<string, any>): number => {
      if (!tabs.length) return 0;
      let totalFields = 0;
      let filledFields = 0;
      tabs.forEach((tab: any) => {
        const fields = tab.sections.flatMap((s: any) => s.fields || []);
        for (const field of fields) {
          if (field.hidden) continue;
          if (LAYOUT_FIELD_TYPES.has(field.fieldtype)) continue;
          totalFields++;
          const val = formValues[field.fieldname];
          const isEmpty =
            val === undefined ||
            val === null ||
            val === "" ||
            (Array.isArray(val) && val.length === 0);
          if (!isEmpty) filledFields++;
        }
      });
      return totalFields > 0
        ? Math.round((filledFields / totalFields) * 100)
        : 0;
    },
    [tabs, LAYOUT_FIELD_TYPES],
  );

  const [fieldProgress, setFieldProgress] = useState(0);

  useEffect(() => {
    if (!tabs.length) return;
    const subscription = methods.watch((formValues: Record<string, any>) => {
      setFieldProgress(computeFieldProgress(formValues));
    });
    setFieldProgress(computeFieldProgress(methods.getValues()));
    return () => subscription.unsubscribe();
  }, [tabs, methods, computeFieldProgress]);

  useEffect(() => {
    if (!tabs.length) return;
    const subscription = methods.watch((formValues) => {
      checkStepCompletion(formValues as Record<string, any>);
    });
    checkStepCompletion(methods.getValues());
    return () => subscription.unsubscribe();
  }, [tabs, methods, checkStepCompletion]);

  useEffect(() => {
    if (!tabs.length) return;
    const subscription = methods.watch((formValues) => {
      const currentTab = tabs[currentStep];
      if (currentTab) {
        const stepKey = currentTab.tab.toLowerCase().replace(/\s+/g, "_");
        const stepFields = currentTab.sections.flatMap(
          (s: any) => s.fields || [],
        );
        const stepValues: Record<string, any> = {};
        stepFields.forEach((field: any) => {
          if (formValues[field.fieldname] !== undefined) {
            stepValues[field.fieldname] = formValues[field.fieldname];
          }
        });
        setStepData(stepKey, stepValues);
      }
    });

    const currentTab = tabs[currentStep];
    if (currentTab) {
      const stepKey = currentTab.tab.toLowerCase().replace(/\s+/g, "_");
      const stepFields = currentTab.sections.flatMap(
        (s: any) => s.fields || [],
      );
      const formValues = methods.getValues();
      const stepValues: Record<string, any> = {};
      stepFields.forEach((field: any) => {
        if (formValues[field.fieldname] !== undefined) {
          stepValues[field.fieldname] = formValues[field.fieldname];
        }
      });
      setStepData(stepKey, stepValues);
    }
    return () => subscription.unsubscribe();
  }, [tabs, methods, currentStep, setStepData]);

  const validateCurrentStep = useCallback((): Record<string, string> => {
    const currentTab = tabs[currentStep];
    if (!currentTab) return {};
    const data = methods.getValues();
    const errors: Record<string, string> = {};
    currentTab.sections.forEach((section: any) => {
      section.fields?.forEach((field: any) => {
        const isRequired = field.reqd || field.is_mandatory;
        if (isRequired) {
          const val = data[field.fieldname];
          if (val === undefined || val === null || val === "") {
            errors[field.fieldname] = `${field.label} is required`;
          }
        }
      });
    });
    return errors;
  }, [tabs, currentStep, methods]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center w-full max-w-250 mx-auto bg-card border border-border rounded-3xl p-10 shadow-sm mt-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-semibold">
            Loading application form details...
          </p>
        </div>
      </div>
    );
  }

  if (!tabs.length) {
    return (
      <div className="max-w-250 mx-auto text-center py-12 text-muted-foreground border border-dashed border-border rounded-3xl p-8 bg-card shadow-sm w-full mt-8">
        <h3 className="font-bold text-sm">No form fields configured</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-2">
          We couldn&apos;t retrieve application form fields for this opening.
          Please contact support.
        </p>
        <Button
          onClick={onBackToSelect}
          className="mt-4 rounded-xl"
          variant="outline"
        >
          Back to Selection
        </Button>
      </div>
    );
  }

  const isReviewStep = currentStep === tabs.length;
  const currentTab = tabs[currentStep];
  const stepKey = currentTab?.tab.toLowerCase().replace(/\s+/g, "_") ?? "";

  const handleNext = () => {
    const errors = validateCurrentStep();
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return;
    }
    setCurrentStep((p) => Math.min(p + 1, tabs.length));
  };

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(p - 1, 0));
  };

  const handleStepClick = (nextIndex: number) => {
    if (nextIndex > currentStep) {
      const errors = validateCurrentStep();
      if (Object.keys(errors).length > 0) {
        toast.error(Object.values(errors)[0]);
        return;
      }
    }
    setCurrentStep(nextIndex);
  };

  const completedStepsKeys = new Set<string>();
  completedSteps.forEach((stepName) => {
    completedStepsKeys.add(stepName);
  });

  if (isSubmitted) {
    return (
      <div className="flex min-h-125 items-center justify-center w-full max-w-200 mx-auto p-4 mt-8">
        <div className="w-full bg-card border border-border rounded-3xl p-8 md:p-12 text-center shadow-lg transition-all duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">
            Application Submitted!
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8 leading-relaxed font-medium">
            Your profile has been received for the opening. Our recruiting team
            will review your application and get back to you shortly.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={async () => {
                await auth.signOut();
                router.push("/login");
              }}
              variant="outline"
              className="flex items-center gap-2 px-6 h-10 rounded-lg hover:bg-destructive/5 hover:text-destructive hover:border-destructive transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar Steps Nav */}
      <JobApplicationStepNav
        currentStep={currentStep}
        completedSteps={completedStepsKeys}
        onStepChange={handleStepClick}
        fieldProgress={fieldProgress}
        className="hidden w-64 shrink-0 md:flex h-full"
        onBackClick={onBackToSelect}
        backLabel="Change Opening"
      />

      {/* Form Details Card */}
      <main className="flex-1 w-full lg:max-w-7xl overflow-y-auto">
        <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          {/* Step header */}
          <div className="mb-6">
            <div className="md:hidden flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Step {currentStep + 1} of {tabs.length + 1}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {fieldProgress}%
              </p>
            </div>

            {/* Progress bar */}
            <div className="md:hidden h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${fieldProgress}%` }}
              />
            </div>

            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {isReviewStep ? "Review & Submit" : currentTab.tab}
            </h1>
          </div>

          {isReviewStep ? (
            <JobApplicationReviewStep
              completedSteps={completedStepsKeys}
              goToStep={handleStepClick}
              onPrev={handlePrev}
              jobID={selectedJobName}
              onSubmitSuccess={() => setIsSubmitted(true)}
            />
          ) : (
            <FormProvider {...methods}>
              <JobApplicationStep
                tab={currentTab}
                stepKey={stepKey}
                currentStep={currentStep}
                totalSteps={tabs.length + 1}
                jobID={selectedJobName}
                onNext={handleNext}
                onPrev={handlePrev}
                methods={methods}
              />
            </FormProvider>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CampusApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CampusApplyContent />
    </Suspense>
  );
}
