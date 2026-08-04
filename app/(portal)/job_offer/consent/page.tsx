"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useConsentForm, useSubmitConsent } from "@/lib/hooks/useJobOffer";

export default function DpdpConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="font-sans text-[#334155] bg-[#f8fafc] min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-[#64748b]">Loading consent form...</p>
          </div>
        </div>
      }
    >
      <ConsentContent />
    </Suspense>
  );
}

function ConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appl = searchParams.get("appl") || "";
  const token = searchParams.get("token") || "";

  // Call the consent form API hook
  const { data: consentData, isLoading: isConsentLoading } = useConsentForm(
    appl,
    token,
  );
  const { mutateAsync: submitConsent } = useSubmitConsent();
  console.log("Consent Form data:", consentData);

  useEffect(() => {
    if (consentData) {
      console.log("Consent Form response:", consentData);
    }
  }, [consentData]);

  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [acknowledgement, setAcknowledgement] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Pre-populate name and date when consentData finishes loading
  useEffect(() => {
    if (consentData) {
      const initialAck: Record<string, string> = {};

      consentData.acknowledgement?.forEach((field) => {
        if (
          field.fieldname === "employee_name" &&
          consentData.applicant?.name
        ) {
          initialAck[field.fieldname] = consentData.applicant.name;
        } else if (field.fieldtype === "Date") {
          initialAck[field.fieldname] = new Date().toISOString().split("T")[0];
        }
      });

      setAcknowledgement(initialAck);

      if (consentData.already_consented) {
        setIsSubmitted(true);
      }
    }
  }, [consentData]);

  useEffect(() => {
    if (isSubmitted) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        const params = new URLSearchParams();
        if (appl) params.append("appl", appl);
        if (token) params.append("token", token);
        router.push(`/onboarding?${params.toString()}`);
      }
    }
  }, [isSubmitted, countdown, appl, token, router]);

  if (isConsentLoading) {
    return (
      <div className="font-sans text-[#334155] bg-[#f8fafc] min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-[#64748b]">Loading consent details...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="font-sans text-[#334155] bg-[#f8fafc] min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 text-center flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 mb-5 border border-emerald-100">
            <ShieldCheck className="h-12 w-12 stroke-2" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-3">
            Consent Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
            {consentData?.confirmation_note ||
              "Thank you. Your DPDP consent declaration has been successfully submitted and recorded. You can now proceed to your onboarding dashboard."}
          </p>
          <div className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm text-slate-600 bg-slate-50 border border-slate-100">
            <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
            Redirecting to Onboarding in {countdown} {countdown === 1 ? "second" : "seconds"}...
          </div>
        </div>
      </div>
    );
  }

  const declarationHeading =
    consentData?.declaration?.heading || "Employee Declaration and Consent";
  const statements = consentData?.declaration?.statements || [];
  const acknowledgementFields = consentData?.acknowledgement || [];

  const isFormValid =
    statements.every(
      (stmt) => !stmt.is_mandatory || consents[stmt.consent_key],
    ) &&
    acknowledgementFields.every((field) => {
      if (field.fieldtype === "Signature") return true;
      return !field.is_mandatory || acknowledgement[field.fieldname];
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const responses = Object.entries(consents)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

      await submitConsent({
        appl,
        token,
        responses,
        ...acknowledgement,
      });
      toast.success("DPDP Consent submitted successfully!");
      setIsSubmitted(true);
    } catch {
      toast.error("Failed to submit consent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    if (appl) params.append("appl", appl);
    if (token) params.append("token", token);
    router.push(`/job_offer?${params.toString()}`);
  };

  const headerInfo = consentData?.header;
  const introContent = consentData?.intro_content;
  const infoKeys = consentData?.information?.[0]
    ? Object.keys(consentData.information[0])
    : [];

  return (
    <div className="font-sans text-[#334155] bg-[#f8fafc] min-h-[calc(100vh-4rem)] py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6 pb-6 border-b border-slate-100">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors mt-0.5"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-2" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 leading-snug">
              {headerInfo?.title || "DPDP Consent Form"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              {headerInfo?.subtitle ||
                "Digital Personal Data Protection Act compliance requirements"}
            </p>
          </div>
        </div>

        {/* Info Box */}
        {introContent && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
              {introContent}
            </p>
          </div>
        )}

        {/* Information Table */}
        {consentData?.information &&
          consentData.information.length > 0 &&
          infoKeys.length > 0 && (
            <div className="w-full border border-slate-200 rounded-xl overflow-hidden mb-8 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {infoKeys.map((key, index) => (
                        <th
                          key={key}
                          className={`py-4 px-6 font-semibold text-slate-700 ${
                            index === 0 ? "w-1/3" : "w-2/3"
                          }`}
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {consentData.information.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {infoKeys.map((key, index) => (
                          <td
                            key={key}
                            className={`py-4 px-6 align-top ${
                              index === 0
                                ? "font-medium text-slate-800"
                                : "text-slate-600 leading-relaxed"
                            }`}
                          >
                            {item[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Closing Content */}
        {consentData?.closing_content && (
          <div
            className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed mb-8 border-t border-slate-100 pt-6"
            dangerouslySetInnerHTML={{ __html: consentData.closing_content }}
          />
        )}

        {/* Declaration Form */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-100 pt-6"
        >
          {/* Declaration Statements */}
          <div className="mb-8">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-4">
              {declarationHeading}
            </h3>
            <div className="flex flex-col gap-4">
              {statements.map((stmt) => {
                const isChecked = consents[stmt.consent_key] || false;
                return (
                  <label
                    key={stmt.consent_key}
                    className="flex items-start gap-3 cursor-pointer group select-none"
                  >
                    <div className="relative flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setConsents((prev) => ({
                            ...prev,
                            [stmt.consent_key]: e.target.checked,
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`h-5 w-5 rounded border transition-all flex items-center justify-center ${
                          isChecked
                            ? "border-primary bg-primary text-white"
                            : "border-slate-300 bg-white group-hover:border-slate-400"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-3" />}
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {stmt.statement}
                      {stmt.is_mandatory ? (
                        <span className="text-red-500 ml-1">*</span>
                      ) : (
                        ""
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Acknowledgement Fields */}
          {acknowledgementFields.length > 0 && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
              {acknowledgementFields.map((field) => {
                const isMandatory = field.is_mandatory;
                const value = acknowledgement[field.fieldname] || "";

                if (field.fieldtype === "Signature") {
                  return null;
                }

                if (field.fieldtype === "Date") {
                  return (
                    <div key={field.fieldname} className="flex flex-col gap-2">
                      <label className="text-xs sm:text-sm font-semibold text-slate-700">
                        {field.label}{" "}
                        {!!isMandatory && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <input
                        type="date"
                        value={value}
                        onChange={(e) =>
                          setAcknowledgement((prev) => ({
                            ...prev,
                            [field.fieldname]: e.target.value,
                          }))
                        }
                        className="w-full p-[10px_14px] border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  );
                }

                // Default: Data (Text Input)
                return (
                  <div key={field.fieldname} className="flex flex-col gap-2">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">
                      {field.label}{" "}
                      {!!isMandatory && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={value}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      onChange={(e) =>
                        setAcknowledgement((prev) => ({
                          ...prev,
                          [field.fieldname]: e.target.value,
                        }))
                      }
                      className="w-full p-[10px_14px] border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-end border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Consent"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
