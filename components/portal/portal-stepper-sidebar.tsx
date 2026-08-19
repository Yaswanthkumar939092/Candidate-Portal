"use client";

import { useState } from "react";
import { ClipboardList, ShieldCheck, UserCheck, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSurvey } from "@/lib/hooks/useSurvey";

interface Step {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "ONGOING" | "PENDING" | "COMPLETED";
  redirect_url?: string;
}

export interface StepperExpandedItem {
  id: string;
  label: string;
}

interface PortalStepperSidebarProps {
  currentStep: "survey" | "offer" | "onboarding";
  className?: string;
  isViewOnly?: boolean;
  expandedItems?: StepperExpandedItem[];
  activeItemIndex?: number;
  onItemSelect?: (index: number) => void;
}

export function PortalStepperSidebar({
  currentStep,
  className,
  isViewOnly = true,
  expandedItems,
  activeItemIndex,
  onItemSelect,
}: PortalStepperSidebarProps) {
  const { data } = useSurvey();
  const [isExpandedState, setIsExpandedState] = useState(true);
  const hasDynamicSteps = data?.steps && data.steps.length > 0;

  // Define steps dynamically
  let steps: Step[] = [];

  if (hasDynamicSteps) {
    steps = data.steps.map((apiStep) => {
      let Icon = ClipboardList;
      const keyLower = apiStep.key.toLowerCase();
      if (keyLower.includes("offer")) {
        Icon = ShieldCheck;
      } else if (keyLower.includes("onboarding")) {
        Icon = UserCheck;
      } else if (keyLower.includes("survey")) {
        Icon = ClipboardList;
      }

      // Check ongoing
      const isCurrentStepPage =
        (currentStep === "survey" && keyLower.includes("survey")) ||
        (currentStep === "offer" && keyLower.includes("offer")) ||
        (currentStep === "onboarding" && keyLower.includes("onboarding"));

      const isOngoing =
        isCurrentStepPage ||
        apiStep.status.toLowerCase() === "ongoing" ||
        apiStep.key === data.current_step;

      const isCompleted =
        !isOngoing && apiStep.status.toLowerCase() === "completed";

      const statusUpper = isOngoing
        ? "ONGOING"
        : isCompleted
          ? "COMPLETED"
          : "PENDING";

      return {
        id: apiStep.key,
        label: apiStep.label,
        icon: Icon,
        status: statusUpper,
        redirect_url: apiStep.redirect_url,
      };
    });
  } else {
    // Fallback static steps
    steps = [
      {
        id: "survey",
        label: "Survey",
        icon: ClipboardList,
        status: currentStep === "survey" ? "ONGOING" : "COMPLETED",
      },
      {
        id: "offer",
        label: "Offer Preview",
        icon: ShieldCheck,
        status:
          currentStep === "survey"
            ? "PENDING"
            : currentStep === "offer"
              ? "ONGOING"
              : "COMPLETED",
      },
      {
        id: "onboarding",
        label: "Onboarding",
        icon: UserCheck,
        status: currentStep === "onboarding" ? "ONGOING" : "PENDING",
      },
    ];
  }

  // Determine next step description for bottom card
  let nextStepText = "";
  if (hasDynamicSteps && data.next_step) {
    const nextStepObj = data.steps.find((s) => s.key === data.next_step);
    nextStepText = nextStepObj ? nextStepObj.label : data.next_step;
  } else {
    nextStepText =
      currentStep === "survey"
        ? "Offer Preview"
        : currentStep === "offer"
          ? "Onboarding"
          : "Portal Completion";
  }

  return (
    <div
      className={cn(
        "w-full md:w-85 md:self-stretch shrink-0 bg-[#f8fafc] dark:bg-[#111827] border border-border/60 rounded-2xl p-5 flex flex-col gap-6 shadow-sm",
        className,
      )}
    >
      {/* Steps List */}
      <div className="flex flex-col gap-3">
        {steps.map((step) => {
          const isOngoing = step.status === "ONGOING";
          const isCompleted = step.status === "COMPLETED";
          const Icon = step.icon;

          const isCurrentStepPage = 
            (currentStep === "survey" && step.id.toLowerCase().includes("survey")) ||
            (currentStep === "offer" && step.id.toLowerCase().includes("offer")) ||
            (currentStep === "onboarding" && step.id.toLowerCase().includes("onboarding"));

          const hasExpandedItems = isCurrentStepPage && expandedItems && expandedItems.length > 0;

          const content = (
            <>
              {/* Left: Icon + Label */}
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isOngoing
                      ? "text-primary-foreground"
                      : isCompleted
                        ? "text-emerald-500"
                        : "text-muted-foreground",
                  )}
                />
                <span className="font-semibold text-sm truncate">
                  {step.label}
                </span>
              </div>

              {/* Right: Status Pill */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider",
                    isOngoing
                      ? "bg-white/20 text-white"
                      : isCompleted
                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {step.status}
                </span>
                {hasExpandedItems && (
                  isExpandedState ? (
                    <ChevronDown className="h-4 w-4 opacity-80" />
                  ) : (
                    <ChevronRight className="h-4 w-4 opacity-80" />
                  )
                )}
              </div>
            </>
          );

          const classNameStr = cn(
            "flex items-center justify-between p-4 rounded-xl transition-all duration-300 w-full text-left",
            isOngoing
              ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
              : "bg-white dark:bg-card border border-border/50 text-foreground",
            !isOngoing && ((!isViewOnly && step.redirect_url) || hasExpandedItems) &&
              "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer",
            isOngoing && hasExpandedItems &&
              "hover:opacity-90 cursor-pointer"
          );

          const stepElement = hasExpandedItems ? (
            <button
              onClick={() => setIsExpandedState(!isExpandedState)}
              className={classNameStr}
            >
              {content}
            </button>
          ) : step.redirect_url && !isViewOnly ? (
            <Link
              href={step.redirect_url}
              className={classNameStr}
            >
              {content}
            </Link>
          ) : (
            <div className={classNameStr}>
              {content}
            </div>
          );

          if (hasExpandedItems && isExpandedState) {
            return (
              <div key={step.id} className="flex flex-col gap-2">
                {stepElement}
                <div className="flex flex-col gap-1 ml-4 border-l-2 border-border/50 pl-3 py-1">
                  {expandedItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => onItemSelect?.(index)}
                      className={cn(
                        "text-left px-3 py-2 text-[0.8rem] font-medium rounded-lg transition-colors truncate",
                        activeItemIndex === index
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                      title={item.label}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={step.id}>
              {stepElement}
            </div>
          );
        })}
      </div>

      {/* Spacer pushing Next Step to bottom on desktop */}
      <div className="hidden md:block flex-1 min-h-10" />

      {/* Bottom Card: Next Step */}
      <div className="bg-[#eaf2ff] dark:bg-[#1e293b]/40 rounded-xl p-4 border border-blue-100/50 dark:border-slate-800">
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
          Next Step
        </span>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {nextStepText}
        </span>
      </div>
    </div>
  );
}
