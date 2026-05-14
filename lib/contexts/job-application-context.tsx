/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { transformFieldsToTabs } from "@/lib/utils/transformJobFields";
import { useJobApplicationForm } from "../hooks/useJobOpening";

interface JobAppContextType {
  stepData: Record<string, Record<string, unknown>>;
  setStepData: (step: string, data: Record<string, unknown>) => void;
  tabs: any[];
  allFields: any[]; // ✅ expose karo
  isLoading: boolean;
}

const JobAppContext = createContext<JobAppContextType | undefined>(undefined);

export function JobAppProvider({
  children,
  job_opening,
  form_name,
}: {
  children: React.ReactNode;
  job_opening?: string;
  form_name?: string;
}) {
  const [stepData, setStepDataState] = useState<
    Record<string, Record<string, unknown>>
  >({});

  const { data, isLoading } = useJobApplicationForm(job_opening, form_name);

  // ✅ API se flat fields array — data se seedha lo, useState ki zaroorat nahi
  const allFields = useMemo(() => {
    return data?.fields || [];
  }, [data]);

  // ✅ tabs bhi data se
  const tabs = useMemo(() => {
    return transformFieldsToTabs(allFields);
  }, [allFields]);

  const setStepData = (step: string, data: Record<string, unknown>) => {
    setStepDataState((prev) => ({
      ...prev,
      [step]: data,
    }));
  };

  return (
    <JobAppContext.Provider
      value={{
        stepData,
        setStepData,
        tabs,
        allFields, // ✅ context mein pass karo
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
