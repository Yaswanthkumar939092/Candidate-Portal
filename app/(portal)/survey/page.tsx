"use client";

import { DynamicSurveyForm } from "@/components/survey/dynamic-survey-form";
import { Button } from "@/components/ui/button";
import { useSurvey, useSubmitSurvey } from "@/lib/hooks/useSurvey";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import NextImage from "next/image";
import { useCurrentUser } from "@/lib/hooks/useUser";
import { useJobOfferSummary } from "@/lib/hooks/useJobOffer";
import { useCompanyLogo } from "@/lib/hooks/useCompanyLogo";

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
  const { userEmail } = useCurrentUser();
  const { data: offerData } = useJobOfferSummary(userEmail || "");
  const { data: logoData } = useCompanyLogo();
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-secondary/30">
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-secondary/30">
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-secondary/30">
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-secondary/30">
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-secondary/40 flex justify-center items-start">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header containing Company Logo and User Profile */}
        <div className="flex items-center justify-between mb-8">
          <NextImage
            src={
              logoData?.logo_url
                ? `${process.env.NEXT_PUBLIC_FRAPPE_URL}${logoData.logo_url}`
                : "/Logo.jpg"
            }
            alt="LOGO"
            width={180}
            height={60}
            className="h-25 md:h-25  max-w-full w-auto object-contain"
            priority
            unoptimized={!!logoData?.logo_url}
          />
          <div className="flex items-center gap-2.5 pr-2.5">
            <div className="w-10 h-10 rounded-full bg-[#1a2332] text-white flex items-center justify-center text-[1rem] font-bold shadow-sm">
              {(offerData?.applicant_name || "U")[0].toUpperCase()}
            </div>
            <span className="text-[0.95rem] font-semibold text-[#1a2332] dark:text-slate-200">
              {offerData?.applicant_name || ""}
            </span>
          </div>
        </div>

        {/* Survey Form Card */}
        <div className="max-w-2xl mx-auto mt-4 sm:mt-8">
          <div className="mb-6 rounded-2xl p-6 bg-card border border-border shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1
                  className="text-xl font-bold text-foreground truncate"
                  title={form_name || "Survey"}
                >
                  {form_name || "Recruitment Survey"}
                </h1>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/75 backdrop-blur-md shadow-lg overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary/80 to-purple-500" />
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
