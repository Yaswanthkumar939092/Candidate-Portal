"use client";

import { ClipboardList, ShieldCheck, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: "survey" | "offer" | "onboarding";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "ONGOING" | "PENDING" | "COMPLETED";
}

interface PortalStepperSidebarProps {
  currentStep: "survey" | "offer" | "onboarding";
  className?: string;
}

export function PortalStepperSidebar({
  currentStep,
  className,
}: PortalStepperSidebarProps) {
  // Define steps dynamically based on current page
  const steps: Step[] = [
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

  // Determine next step description for bottom card
  const nextStepText =
    currentStep === "survey"
      ? "Offer Preview"
      : currentStep === "offer"
        ? "Onboarding"
        : "Portal Completion";

  return (
    <div
      className={cn(
        "w-full md:w-[340px] md:self-stretch shrink-0 bg-[#f8fafc] dark:bg-[#111827] border border-border/60 rounded-2xl p-5 flex flex-col gap-6 shadow-sm",
        className,
      )}
    >
      {/* Steps List */}
      <div className="flex flex-col gap-3">
        {steps.map((step) => {
          const isOngoing = step.status === "ONGOING";
          const isCompleted = step.status === "COMPLETED";
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl transition-all duration-300",
                isOngoing
                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                  : "bg-white dark:bg-card border border-border/50 text-foreground",
              )}
            >
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
            </div>
          );
        })}
      </div>

      {/* Spacer pushing Next Step to bottom on desktop */}
      <div className="hidden md:block flex-1 min-h-[40px]" />

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
