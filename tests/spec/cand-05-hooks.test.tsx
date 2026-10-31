import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

vi.mock("@/lib/services/candidate-onboarding", () => ({
  candidateOnboardingService: { getOnboardingForm: vi.fn(), submitOnboarding: vi.fn() },
}))

vi.mock("@/lib/services/link-field", () => ({
  linkFieldService: { getLinkFieldOptions: vi.fn() },
}))

vi.mock("@/lib/services/uploadProofFile", () => ({
  fileUploadService: { uploadFile: vi.fn() },
}))

import { useOnboardingForm } from "@/lib/hooks/useOnboardingForm"
import { useOnboardingSubmit } from "@/lib/hooks/useOnboardingMutation"
import { useLinkFieldOptions } from "@/lib/hooks/useLinkFieldOptions"
import { useFileUpload } from "@/lib/hooks/useFileUpload"
import { candidateOnboardingService } from "@/lib/services/candidate-onboarding"
import { linkFieldService } from "@/lib/services/link-field"
import { fileUploadService } from "@/lib/services/uploadProofFile"

const getOnboardingForm = vi.mocked(candidateOnboardingService.getOnboardingForm)
const submitOnboarding = vi.mocked(candidateOnboardingService.submitOnboarding)
const getLinkFieldOptions = vi.mocked(linkFieldService.getLinkFieldOptions)
const uploadFile = vi.mocked(fileUploadService.uploadFile)

let queryClient: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
})

describe("useOnboardingForm cache entry", () => {
  // Spec: CAND-05-A10.1A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a10-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("stores the form under the onboarding-form key carrying the e-mail and keeps it fresh for one minute", async () => {
    const form = { applicantId: "CAND-TEST-0001", status: "Draft", tabs: [] }
    getOnboardingForm.mockResolvedValue(form as never)

    const { result } = renderHook(() => useOnboardingForm("cand@example.invalid"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const entry = queryClient.getQueryCache().find({ queryKey: ["onboarding-form", { userEmail: "cand@example.invalid" }] })
    expect(entry).toBeDefined()
    expect(entry!.options.staleTime).toBe(60000)
    expect(queryClient.getQueryData(["onboarding-form", { userEmail: "cand@example.invalid" }])).toBe(form)

    // A different e-mail is a different cache entry, so it refetches.
    renderHook(() => useOnboardingForm("other@example.invalid"), { wrapper })
    await waitFor(() => expect(getOnboardingForm).toHaveBeenCalledTimes(2))
    expect(getOnboardingForm).toHaveBeenLastCalledWith("other@example.invalid")
  })
})

describe("useLinkFieldOptions cache entry", () => {
  // Spec: CAND-05-A10.2A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a10-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("puts the doctype, the search text and the filters in the key and keeps each answer fresh for five minutes", async () => {
    const reply = { status: "success" as const, doctype: "Designation", title_field: "name", total: 0, results: [] }
    getLinkFieldOptions.mockResolvedValue(reply)

    const filters = { company: "Test Company" }
    const { result } = renderHook(() => useLinkFieldOptions("Designation", "eng", filters), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const entry = queryClient
      .getQueryCache()
      .find({ queryKey: ["link-field-options", { doctype: "Designation", searchText: "eng", filters }] })
    expect(entry).toBeDefined()
    expect(entry!.options.staleTime).toBe(300000)
    expect(getLinkFieldOptions).toHaveBeenCalledWith("Designation", "eng", filters)

    // Each distinct search text starts its own request; nothing debounces inside the hook.
    renderHook(() => useLinkFieldOptions("Designation", "engi", filters), { wrapper })
    await waitFor(() => expect(getLinkFieldOptions).toHaveBeenCalledTimes(2))
  })
})

describe("useOnboardingSubmit and useFileUpload mutations", () => {
  // Spec: CAND-05-A10.3A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a10-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("rejects from mutateAsync when the submit service throws and invalidates no query of its own", async () => {
    submitOnboarding.mockRejectedValue(new Error("Submission failed"))
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useOnboardingSubmit(), { wrapper })
    await expect(
      result.current.mutateAsync({ stepData: { personal_info: {} }, userEmail: "cand@example.invalid", action: "save" }),
    ).rejects.toThrow("Submission failed")
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).not.toHaveBeenCalled()
  })

  // Spec: CAND-05-A10.3B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a10-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("sends only the file to the upload service, so the doctype and the document name are never passed", async () => {
    uploadFile.mockResolvedValue({ file_url: "/files/test.pdf", name: "FILE-TEST-0001" })

    const { result } = renderHook(() => useFileUpload(), { wrapper })
    const file = new File(["test"], "test.pdf", { type: "application/pdf" })
    const uploaded = await result.current.mutateAsync(file)

    expect(uploaded).toEqual({ file_url: "/files/test.pdf", name: "FILE-TEST-0001" })
    expect(uploadFile).toHaveBeenCalledWith(file)
    expect(uploadFile.mock.calls[0]).toHaveLength(1)
  })
})
