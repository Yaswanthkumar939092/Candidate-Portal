/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { transformFieldsToTabs } from "@/lib/utils/transformJobFields";
import { useJobApplicationForm } from "../hooks/useJobOpening";

interface JobAppContextType {
  stepData: Record<string, Record<string, unknown>>;
  setStepData: (step: string, data: Record<string, unknown>) => void;
  initializeAllStepsFromDraft: (flatData: Record<string, unknown>) => void;
  tabs: any[];
  allFields: any[]; // ✅ expose karo
  isLoading: boolean;
}

const JobAppContext = createContext<JobAppContextType | undefined>(undefined);

export function JobAppProvider({ children }: { children: React.ReactNode }) {
  const [stepData, setStepDataState] = useState<Record<string, Record<string, unknown>>>({});

  const { data, isLoading } = useJobApplicationForm();

  // ✅ API se flat fields array — data se seedha lo, useState ki zaroorat nahi
  const allFields = useMemo(() => {
    return data?.fields || [];
  }, [data]);

  // ✅ tabs bhi data se
  const tabs = useMemo(() => {
    return transformFieldsToTabs(allFields);
  }, [allFields]);

  const setStepData = useCallback((step: string, data: Record<string, unknown>) => {
    setStepDataState((prev) => ({
      ...prev,
      [step]: data,
    }));
  }, []);

  // ✅ Bulk initialization logic
  const initializeAllStepsFromDraft = useCallback(
    (flatData: Record<string, unknown>) => {
      setStepDataState((prev) => {
        const next = { ...prev };
        tabs.forEach((tab: any) => {
          const key = tab.tab.toLowerCase().replace(/\s+/g, "_");
          const tabFieldNames = new Set(
            tab.sections.flatMap((s: any) => s.fields.map((f: any) => f.fieldname))
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
    <JobAppContext.Provider
      value={{
        stepData,
        setStepData,
        initializeAllStepsFromDraft,
        tabs,
        allFields,
        isLoading,
      }}
    >
      {children}
    </JobAppContext.Provider>
  );
}

export function useJobApp() {
  const ctx = useContext(JobAppContext);
  if (!ctx) throw new Error("useJobApp must be used inside provider");
  return ctx;
}