"use client";

import { useSurvey, useSubmitSurvey } from "@/lib/hooks/useSurvey";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  Send,
  FileText,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function SurveyPage() {
  const { data, isLoading, error } = useSurvey();
  const { mutateAsync: submitSurveyMutate } = useSubmitSurvey();
  const router = useRouter();
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isLoading && data && !data.survey_required) {
      // If survey is not required, redirect to action-center or home
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

  // Double check if redirect is in progress
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
  const components = (form_schema as any)?.components || [];

  const handleValueChange = (key: string, val: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await submitSurveyMutate({
        job_applicant,
        job_opening,
        response: formValues,
      });
      setSubmitted(true);
      toast.success("Survey submitted successfully!");

      setTimeout(() => {
        router.push(res.redirect_url || "/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Survey submit error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit survey. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComponent = (comp: any) => {
    if (comp.type === "button" && comp.key === "submit") {
      return null;
    }

    const isRequired = comp.validate?.required;
    const value = formValues[comp.key] ?? "";

    switch (comp.type) {
      case "textfield":
      case "email":
      case "number":
      case "phoneNumber":
      case "password":
        return (
          <div key={comp.key} className="space-y-2">
            <Label
              htmlFor={comp.key}
              className="text-sm font-semibold text-foreground/90 flex items-center gap-1"
            >
              {comp.label}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={comp.key}
              type={
                comp.type === "phoneNumber"
                  ? "tel"
                  : comp.type === "textfield"
                    ? "text"
                    : comp.type
              }
              placeholder={comp.placeholder}
              required={isRequired}
              value={value}
              onChange={(e) => handleValueChange(comp.key, e.target.value)}
              className="bg-background/50 border-border focus-visible:ring-primary focus-visible:ring-offset-background transition-all"
            />
          </div>
        );

      case "textarea":
        return (
          <div key={comp.key} className="space-y-2">
            <Label
              htmlFor={comp.key}
              className="text-sm font-semibold text-foreground/90 flex items-center gap-1"
            >
              {comp.label}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={comp.key}
              placeholder={comp.placeholder}
              required={isRequired}
              value={value}
              onChange={(e) => handleValueChange(comp.key, e.target.value)}
              className="bg-background/50 border-border min-h-[100px] focus-visible:ring-primary transition-all"
            />
          </div>
        );

      case "checkbox":
        return (
          <div
            key={comp.key}
            className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 bg-background/30 border-border/80"
          >
            <Checkbox
              id={comp.key}
              checked={!!value}
              onCheckedChange={(checked) =>
                handleValueChange(comp.key, checked)
              }
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor={comp.key}
                className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-1"
              >
                {comp.label}
                {isRequired && <span className="text-destructive">*</span>}
              </Label>
              {comp.description && (
                <p className="text-xs text-muted-foreground">
                  {comp.description}
                </p>
              )}
            </div>
          </div>
        );

      case "select":
        const options = comp.data?.values || [];
        return (
          <div key={comp.key} className="space-y-2">
            <Label
              htmlFor={comp.key}
              className="text-sm font-semibold text-foreground/90 flex items-center gap-1"
            >
              {comp.label}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <select
              id={comp.key}
              required={isRequired}
              value={value}
              onChange={(e) => handleValueChange(comp.key, e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all text-foreground"
            >
              <option value="" className="bg-card text-foreground">
                {comp.placeholder || `Select ${comp.label}`}
              </option>
              {options.map((opt: any) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-card text-foreground"
                >
                  {opt.label || opt.value}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return (
          <div key={comp.key} className="space-y-2">
            <Label
              htmlFor={comp.key}
              className="text-sm font-semibold text-foreground/90 flex items-center gap-1"
            >
              {comp.label}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={comp.key}
              placeholder={comp.placeholder}
              required={isRequired}
              value={value}
              onChange={(e) => handleValueChange(comp.key, e.target.value)}
              className="bg-background/50 border-border focus-visible:ring-primary transition-all"
            />
          </div>
        );
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
      <div className="w-full max-w-2xl mt-4 sm:mt-8">
        {/* Upper Header Card */}
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

        {/* Form Container */}
        <div className="rounded-2xl border border-border bg-card/75 backdrop-blur-md shadow-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary/80 to-purple-500" />

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {components.length > 0 ? (
              <div className="space-y-6">
                {components.map((comp: any) => renderComponent(comp))}
              </div>
            ) : (
              /* Fallback default questionnaire fields if components are empty */
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground border-b border-border pb-4">
                  Please provide the following details to assist us with the
                  onboarding process.
                </p>
                <div className="space-y-2">
                  <Label
                    htmlFor="q1"
                    className="text-sm font-semibold text-foreground flex items-center gap-1"
                  >
                    Why are you interested in this position?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="q1"
                    required
                    placeholder="Describe your motivations and interest in the role"
                    value={formValues.interest_reason ?? ""}
                    onChange={(e) =>
                      handleValueChange("interest_reason", e.target.value)
                    }
                    className="bg-background/50 border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="q2"
                    className="text-sm font-semibold text-foreground flex items-center gap-1"
                  >
                    What is your standard notice period (in days)?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="q2"
                    type="number"
                    required
                    placeholder="e.g. 30"
                    value={formValues.notice_period ?? ""}
                    onChange={(e) =>
                      handleValueChange("notice_period", e.target.value)
                    }
                    className="bg-background/50 border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="q3"
                    className="text-sm font-semibold text-foreground flex items-center gap-1"
                  >
                    Do you require visa sponsorship to work?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="q3"
                    required
                    value={formValues.visa_sponsorship ?? ""}
                    onChange={(e) =>
                      handleValueChange("visa_sponsorship", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all text-foreground"
                  >
                    <option value="" className="bg-card">
                      Select an option
                    </option>
                    <option value="No" className="bg-card">
                      No
                    </option>
                    <option value="Yes" className="bg-card">
                      Yes
                    </option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 font-medium flex items-center justify-center gap-2 group transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Responses
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
