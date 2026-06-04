"use client";

import { DynamicSurveyForm } from "@/components/survey/dynamic-survey-form";
import { Button } from "@/components/ui/button";
import { useSurvey, useSubmitSurvey } from "@/lib/hooks/useSurvey";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { PortalStepperSidebar } from "@/components/portal/portal-stepper-sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const fallbackSurveySchema = {
  components: [
    {
      key: "interest_reason",
      type: "textarea",
      label: "Why are you interested in this position?",
      placeholder: "Describe your motivations and interest in the role",
      validate: { required: true },
    },
    {
      key: "notice_period",
      type: "number",
      label: "What is your standard notice period (in days)?",
      placeholder: "e.g. 30",
      validate: { required: true, min: 0 },
    },
    {
      key: "visa_sponsorship",
      type: "select",
      label: "Do you require visa sponsorship to work?",
      placeholder: "Select an option",
      validate: { required: true },
      data: {
        values: [
          { label: "No", value: "No" },
          { label: "Yes", value: "Yes" },
        ],
      },
    },
  ],
};

export default function SurveyPage() {
  const { data, isLoading, error } = useSurvey();
  const { mutateAsync: submitSurveyMutate } = useSubmitSurvey();
  const router = useRouter();
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isLoading && data && !data.survey_required) {
      router.push((data as any).redirect_url || "/dashboard");
    }
  }, [data, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-linear-to-br from-background via-background to-secondary/30">
        <div className="relative flex flex-col items-center p-8 rounded-2xl bg-card/60 backdrop-blur-md border border-border shadow-xl max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Loading Survey
          </h3>
          <p className="text-sm text-muted-foreground animate-pulse">
            Fetching your survey configuration...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-linear-to-br from-background via-background to-secondary/30">
        <div className="flex flex-col items-center p-8 rounded-2xl bg-card border border-destructive/20 shadow-xl max-w-md w-full text-center">
          <div className="bg-destructive/10 text-destructive p-4 rounded-full mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Failed to Load Survey
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            There was an issue retrieving the survey configuration. Please
            verify your connection or try again.
          </p>
          <Button
            className="w-full"
            onClick={() => window.location.assign("/login")}
          >
            Go back to login
          </Button>
        </div>
      </div>
    );
  }

  if (!data.survey_required) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-linear-to-br from-background via-background to-secondary/30">
        <div className="flex flex-col items-center p-8 rounded-2xl bg-card/60 backdrop-blur-md border border-border shadow-xl max-w-sm w-full text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">
            Redirecting you to the portal...
          </p>
        </div>
      </div>
    );
  }

  const { form_name, form_schema, job_applicant, job_opening } = data;
  const surveySchema = (form_schema as { components?: any[] })?.components
    ?.length
    ? (form_schema as { components?: any[] })
    : fallbackSurveySchema;

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);

    try {
      const res = await submitSurveyMutate({
        job_applicant,
        job_opening,
        response: values,
      });
      setSubmitted(true);
      toast.success("Survey submitted successfully!");

      setTimeout(() => {
        router.push(res.redirect_url || "/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Survey submit error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to submit survey. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-linear-to-br from-background via-background to-secondary/30">
        <div className="flex flex-col items-center p-8 rounded-2xl bg-card border border-border shadow-xl max-w-md w-full text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Thank you!
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your survey responses have been successfully submitted. Redirecting
            you to the portal...
          </p>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-background via-background to-secondary/40 flex justify-center items-start">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
        {/* Stepper Sidebar */}
        <PortalStepperSidebar currentStep="survey" />

        {/* Survey Form Card */}
        <div className="flex-1 w-full max-w-2xl">
          <div className="rounded-2xl border border-border bg-card/75 backdrop-blur-md shadow-lg overflow-hidden">
            {/* Header attached inside the card */}
            <div className="py-5 px-6 sm:px-8 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1
                  className="text-lg font-bold text-foreground truncate"
                  title={form_name || "Survey"}
                >
                  {form_name || "Recruitment Survey"}
                </h1>
              </div>
            </div>

            <DynamicSurveyForm
              schema={surveySchema}
              values={formValues}
              onValuesChange={setFormValues}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
