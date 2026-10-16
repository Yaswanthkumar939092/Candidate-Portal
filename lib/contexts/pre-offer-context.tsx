"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { usePreOfferForm, usePreOfferFormState } from "../hooks/usePreOfferForm";
import { PreOfferTab, PreOfferField } from "../types/pre-offer";

interface PreOfferContextType {
  stepData: Record<string, Record<string, unknown>>;
  setStepData: (step: string, data: Record<string, unknown>) => void;
  initializeAllStepsFromDraft: (flatData: Record<string, unknown>) => void;
  tabs: PreOfferTab[];
  allFields: PreOfferField[];
  isLoading: boolean;
  applicantId: string;
  /**
   * True when this form has already been submitted and HR has sent nothing back
   * for correction: the page then shows a read-only copy of what was sent,
   * because the Action Center card stays after the action is completed.
   */
  isSubmitted: boolean;
  /** When it was submitted, for the review header. */
  submittedAt: string | null;
}

const PreOfferContext = createContext<PreOfferContextType | undefined>(undefined);

export function PreOfferProvider({
  children,
  applicantId,
}: {
  children: React.ReactNode;
  applicantId: string;
}) {
  const [stepData, setStepDataState] = useState<Record<string, Record<string, unknown>>>({});

  const { data, isLoading } = usePreOfferForm(applicantId);
  const { data: formState, isLoading: isStateLoading } = usePreOfferFormState(applicantId);

  const tabs = useMemo(() => {
    return data?.tabs || [];
  }, [data]);

  const allFields = useMemo(() => {
    return tabs.flatMap((tab) => tab.sections.flatMap((s) => s.fields));
  }, [tabs]);

  const setStepData = useCallback((step: string, data: Record<string, unknown>) => {
    setStepDataState((prev) => ({
      ...prev,
      [step]: data,
    }));
  }, []);

  const initializeAllStepsFromDraft = useCallback(
    (flatData: Record<string, unknown>) => {
      setStepDataState((prev) => {
        const next = { ...prev };
        tabs.forEach((tab) => {
          const key = tab.tab.toLowerCase().replace(/\s+/g, "_");
          const tabFieldNames = new Set(
            tab.sections.flatMap((s) => s.fields.map((f) => f.fieldname))
          );

          const tabData: Record<string, unknown> = { ...(prev[key] || {}) };
          Object.entries(flatData).forEach(([fieldName, value]) => {
            if (tabFieldNames.has(fieldName) && (tabData[fieldName] === undefined || tabData[fieldName] === null || tabData[fieldName] === "")) {
              tabData[fieldName] = value;
            }
          });
          next[key] = tabData;
        });
        return next;
      });
    },
    [tabs]
  );

  return (
    <PreOfferContext.Provider
      value={{
        stepData,
        setStepData,
        initializeAllStepsFromDraft,
        tabs,
        allFields,
        isLoading: isLoading || isStateLoading,
        applicantId,
        isSubmitted: !!formState?.filled,
        submittedAt: formState?.filled_at ?? null,
      }}
    >
      {children}
    </PreOfferContext.Provider>
  );
}

export function usePreOffer() {
  const ctx = useContext(PreOfferContext);
  if (!ctx) throw new Error("usePreOffer must be used inside PreOfferProvider");
  return ctx;
}
