"use client";

import { Suspense, useState, useEffect } from "react";
import { Loader2, ClipboardX, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/lib/contexts/onboarding-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OnboardingStepNav } from "@/components/onboarding/onboarding-step-nav";
import { ReviewStep } from "@/components/onboarding/steps/review-step";
import { OnboardingFormStep } from "@/components/onboarding/onboarding-form-step";
import { OnboardingRightRail } from "@/components/onboarding/onboarding-right-rail";
import { Progress } from "@/components/ui/progress";
import { evaluateDependsOn } from "@/lib/onboarding-utils";
import { cn } from "@/lib/utils";
import type { OnboardingTab } from "@/lib/types/onboarding";

const formatSectionTitle = (value: string) =>
  value
    .replace(/^section-/, "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const normalizeSectionTitle = (value: string) =>
  value.toLowerCase().replace(/[\s_-]+/g, "");

const getInitialSectionTitle = (tab?: OnboardingTab) =>
  tab?.sections?.[0]?.section ? formatSectionTitle(tab.sections[0].section) : "";

function AutosaveBar({
  isSaving,
  requiredFilled,
  requiredTotal,
  activeSection,
}: {
  isSaving: boolean;
  requiredFilled: number;
  requiredTotal: number;
  activeSection: string;
}) {
  return (
    <div className="sticky top-32 lg:top-0 z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border px-4 py-3 rounded-xl gap-2 shadow-sm select-none">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            isSaving
              ? "bg-amber-500 animate-pulse ring-4 ring-amber-500/20"
              : "bg-emerald-500 ring-4 ring-emerald-500/20",
          )}
        />
        {isSaving ? "Saving changes..." : "All changes saved"}
      </div>
      {activeSection && (
        <div className="text-xs text-muted-foreground font-semibold">
          Editing{" "}
          <strong className="text-foreground font-bold">{activeSection}</strong>{" "}
          ·{" "}
          <span className="font-mono">
            {requiredFilled}/{requiredTotal} required filled
          </span>
        </div>
      )}
    </div>
  );
}

function OnboardingContent() {
  const {
    currentStep,
    completedSteps,
    isLoading,
    formConfig,
    status,
    isError,
    stepData,
    isSaving,
    prevStep,
    triggerSubmit,
  } = useOnboarding();
  const [focusedFieldname, setFocusedFieldname] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const tabs = formConfig?.tabs || [];
  const currentTabConfig = tabs[currentStep];

  useEffect(() => {
    setActiveSection(getInitialSectionTitle(currentTabConfig));
  }, [currentStep, currentTabConfig]);

  // Setup focus and blur listeners to track currently focused field
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const fieldEl = target.closest("[data-fieldname]");
      if (fieldEl) {
        setFocusedFieldname(fieldEl.getAttribute("data-fieldname"));
      }
    };
    const handleBlur = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || !active.closest("[data-fieldname]")) {
          setFocusedFieldname(null);
        }
      }, 50);
    };
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, []);

  // Scroll spy to detect active section card
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[id^="section-"]');
      let currentSectionId = "";
      let minDistance = Infinity;
      const threshold = 180; // offset distance in pixels

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - threshold);
        if (
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          distance < minDistance
        ) {
          minDistance = distance;
          currentSectionId =
            section.getAttribute("data-section-title") ||
            section.id;
        }
      });

      if (currentSectionId && currentSectionId !== activeSection) {
        setActiveSection(formatSectionTitle(currentSectionId));
      }
    };

    const container = document.getElementById("onboarding-form-container");

    window.addEventListener("scroll", handleScroll, { passive: true });
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    handleScroll();
    const timer = setTimeout(handleScroll, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [activeSection, currentStep]);

  if (isLoading || (!formConfig && !isError)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading your onboarding data...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-red-500/10 blur-xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl shadow-red-500/10">
                <ClipboardX className="h-12 w-12 text-red-500" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#101828]">
              Onboarding not yet started
            </h1>
            <p className="text-lg text-[#475467]">
              It seems your onboarding journey hasn&apos;t been initialized yet.
              This usually happens while we&apos;re setting up your profile.
            </p>
          </div>

          <div className="pt-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl px-8 bg-[#101828] text-white hover:bg-[#101828]/90"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <p className="text-sm text-[#475467]">
            If you believe this is an error, please reach out to your HR
            coordinator.
          </p>
        </div>
      </div>
    );
  }

  // Total steps: one for each tab + one final review step
  const totalSteps = tabs.length + 1;
  const progressPercentage =
    formConfig?.field_status_counts && formConfig.field_status_counts.total > 0
      ? ((formConfig.field_status_counts.filled +
          formConfig.field_status_counts.approved) /
          formConfig.field_status_counts.total) *
        100
      : (completedSteps.size / totalSteps) * 100;

  let stepTitle = "";
  let StepComponent: React.ReactNode = null;

  if (status === "submitted") {
    stepTitle = "Review";
    StepComponent = <ReviewStep />;
  } else if (currentStep < tabs.length) {
    const currentTab = tabs[currentStep];
    stepTitle = currentTab.tab;
    StepComponent = (
      <OnboardingFormStep
        key={currentStep}
        tab={currentTab}
        stepKey={currentTab.tab.toLowerCase().replace(/\s+/g, "_")}
      />
    );
  } else {
    stepTitle = "Review";
    StepComponent = <ReviewStep />;
  }

  // Get active tab fields for AutosaveBar and checklist calculation
  const activeSectionBelongsToCurrentTab = currentTabConfig?.sections.some(
    (section) =>
      normalizeSectionTitle(section.section) ===
      normalizeSectionTitle(activeSection),
  );
  const displaySection = activeSectionBelongsToCurrentTab
    ? activeSection
    : getInitialSectionTitle(currentTabConfig);
  const doc = {} as Record<string, any>;
  if (stepData) {
    Object.keys(stepData).forEach((key) => {
      Object.assign(doc, stepData[key]);
    });
  }

  const requiredFields = (() => {
    if (!currentTabConfig) return [];

    const activeSectionNormalized = displaySection
      ? normalizeSectionTitle(displaySection)
      : "";
    const matchedSection = activeSectionNormalized
      ? currentTabConfig.sections.find(
          (section) =>
            normalizeSectionTitle(section.section) === activeSectionNormalized ||
            normalizeSectionTitle(section.section.toLowerCase().replace(/\s+/g, "_")) ===
              activeSectionNormalized,
        )
      : null;

    const sectionsToEvaluate = matchedSection
      ? [matchedSection]
      : currentTabConfig.sections;

    const list: string[] = [];
    sectionsToEvaluate.forEach((section) => {
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

        if (isMandatory) {
          list.push(field.fieldname);
        }
      });
    });
    return list;
  })();

  const requiredFilledCount = requiredFields.filter((fieldname) => {
    const val = doc[fieldname];
    let isTable = false;
    let isCheck = false;

    currentTabConfig.sections.forEach((s) => {
      const f = s.fields.find((field) => field.fieldname === fieldname);
      if (f) {
        if (f.fieldtype === "Table") isTable = true;
        if (f.fieldtype === "Check") isCheck = true;
      }
    });

    if (isTable) {
      return Array.isArray(val) && val.length > 0;
    }
    if (isCheck) {
      return Boolean(val);
    }
    return val !== undefined && val !== null && String(val).trim() !== "";
  }).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] lg:overflow-hidden flex flex-col bg-[#F4F5F7] dark:bg-zinc-950">
      {/* Mobile progress indicator */}
      {status !== "submitted" && (
        <div className="fixed left-0 right-0 top-16 z-45 border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          <Progress value={progressPercentage} className="mt-2" />
          <p className="mt-1 text-sm font-medium text-foreground">
            {stepTitle}
          </p>
        </div>
      )}
      {/* 3-Column Responsive Grid Layout */}
      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 lg:px-8 py-8 pt-24 pb-28 lg:pt-3 lg:pb-3 lg:h-[calc(100vh-4rem)] flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_340px] gap-8 items-start">
          {/* Column 1: Desktop sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-16 self-start h-[calc(100vh-5.5rem)] overflow-y-auto pr-1 scrollbar-thin">
            <OnboardingStepNav />
          </aside>

          {/* Column 2: Main content area */}
          <div id="onboarding-form-container" className="flex flex-col gap-6 min-w-0 lg:h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
            {status !== "submitted" && (
              <AutosaveBar
                isSaving={isSaving}
                requiredFilled={requiredFilledCount}
                requiredTotal={requiredFields.length}
                activeSection={displaySection}
              />
            )}

            {/* Page header */}
            {/* {status !== 'submitted' && (
              <div className="mb-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{stepTitle}</h1>
                <p className="mt-1 text-sm text-muted-foreground font-medium">
                  Please fill in the details below accurately. All required fields are marked with *.
                </p>
              </div>
            )} */}

            {/* Current step component */}
            <main className="bg-transparent">{StepComponent}</main>
          </div>

          {/* Column 3: Desktop Right Rail */}
          {status !== "submitted" && (
            <aside className="hidden xl:block xl:sticky xl:top-16 self-start h-[calc(100vh-5.5rem)] overflow-y-auto pr-1 scrollbar-thin">
              <OnboardingRightRail focusedFieldname={focusedFieldname} />
            </aside>
          )}
        </div>
      </div>

      {status !== "submitted" && currentStep < tabs.length && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[1700px] items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              onClick={prevStep}
              disabled={currentStep === 0 || isSaving}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              className="h-11 flex-1"
              onClick={() => {
                void triggerSubmit?.("save_continue");
              }}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save & Next"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OnboardingProvider>
        <OnboardingContent />
      </OnboardingProvider>
    </Suspense>
  );
}
