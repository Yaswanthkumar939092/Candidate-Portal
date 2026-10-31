import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock("@/lib/frappe-api", () => ({ FrappeAPI: { get, post } }))

import { ctcProposalService, proposalAccessKey } from "@/lib/services/ctc-proposal"
import { accessKey, directApplicantFormService } from "@/lib/services/direct-applicant-form"
import { preOfferService, transformPreOfferField } from "@/lib/services/pre-offer"
import { profileService } from "@/lib/services/profileService"
import { surveyService } from "@/lib/services/survey"

let fetchMock: ReturnType<typeof vi.fn>

function reply(status: number, body: unknown) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response)
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchMock = vi.fn()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("CTC proposal access modes", () => {
  // Spec: CAND-07-A4.1A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a4-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("reads the session proposal by name and the emailed proposal by token, on different endpoints", async () => {
    fetchMock.mockReturnValue(reply(200, { message: { applicant_name: "Test Candidate" } }))

    await ctcProposalService.getProposal({ proposal: "CAND-TEST-CTC-0001" })
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/backend/api/method/recruitment.api.ctc_proposal_portal.get_my_proposal?proposal=CAND-TEST-CTC-0001",
    )
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET", credentials: "include" })
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Accept: "application/json" })

    await ctcProposalService.getProposal({ token: "tok-test" })
    expect(fetchMock.mock.calls[1][0]).toBe(
      "/backend/api/method/recruitment.api.ctc_proposal_portal.get_proposal?t=tok-test",
    )
  })

  // Spec: CAND-07-A4.1B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a4-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("posts the response with the identifying field merged into the payload, and returns only the message", async () => {
    fetchMock.mockReturnValue(reply(200, { message: { status: "Accepted" } }))

    const result = await ctcProposalService.respond({ proposal: "CAND-TEST-CTC-0001" }, { action: "Accept" } as never)
    expect(result).toEqual({ status: "Accepted" })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/backend/api/method/recruitment.api.ctc_proposal_portal.respond_my_proposal")
    expect(init.headers).toMatchObject({ "Content-Type": "application/json", Accept: "application/json" })
    expect(JSON.parse(init.body)).toEqual({ proposal: "CAND-TEST-CTC-0001", action: "Accept" })

    await ctcProposalService.respond({ token: "tok-test" }, { action: "Reject" } as never)
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[1]
    expect(tokenUrl).toBe("/backend/api/method/recruitment.api.ctc_proposal_portal.respond")
    expect(JSON.parse(tokenInit.body)).toEqual({ t: "tok-test", action: "Reject" })
  })

  // Spec: CAND-07-A4.1C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a4-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("raises the backend's own text on an error, and its own fallback for a body it cannot read", async () => {
    fetchMock.mockReturnValueOnce(
      reply(403, { _server_messages: JSON.stringify([JSON.stringify({ message: "This proposal is not available." })]) }),
    )
    await expect(ctcProposalService.getProposal({ proposal: "CAND-TEST-CTC-0009" })).rejects.toThrow(
      "This proposal is not available.",
    )

    fetchMock.mockReturnValueOnce(
      Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new SyntaxError("not json")) } as unknown as Response),
    )
    await expect(ctcProposalService.getProposal({ proposal: "CAND-TEST-CTC-0009" })).rejects.toThrow(
      "Something went wrong. Please try again.",
    )
  })

  // Spec: CAND-07-A4.1D (docs/spec/clauses/07-services-and-hooks.md#cand-07-a4-1d)
  // Characterization: pins current behaviour, not endorsed.
  it("prefers the token over the proposal name as the cache key and is empty for neither", () => {
    expect(proposalAccessKey({ token: "tok-test" })).toBe("tok-test")
    expect(proposalAccessKey({ proposal: "CAND-TEST-CTC-0001" })).toBe("CAND-TEST-CTC-0001")
    expect(proposalAccessKey({} as never)).toBe("")
    expect(accessKey({ token: "tok-test" })).toBe("tok-test")
    expect(accessKey({ request: "CAND-TEST-DAFR-0001" })).toBe("CAND-TEST-DAFR-0001")
    expect(accessKey({} as never)).toBe("")
  })
})

describe("direct applicant form link search", () => {
  // Spec: CAND-07-A4.2A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a4-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("sends the search text and the child column as query parameters and drops the column when absent", async () => {
    fetchMock.mockReturnValue(reply(200, { message: [{ value: "OPT-1", label: "Option one" }] }))

    const options = await directApplicantFormService.searchLink(
      { request: "CAND-TEST-DAFR-0001" },
      "state",
      "kar",
      "proof",
    )
    expect(options).toEqual([{ value: "OPT-1", label: "Option one" }])
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/backend/api/method/recruitment.api.direct_applicant_portal.search_my_link?request=CAND-TEST-DAFR-0001&fieldname=state&txt=kar&child_fieldname=proof",
    )

    await directApplicantFormService.searchLink({ token: "tok-test" }, "state", "kar")
    expect(fetchMock.mock.calls[1][0]).toBe(
      "/backend/api/method/recruitment.api.direct_applicant_portal.search_link?t=tok-test&fieldname=state&txt=kar",
    )
  })
})

describe("pre-offer form state and field mapping", () => {
  // Spec: CAND-07-A5.1A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a5-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("reports an unfilled form without a request when no applicant is named, and falls back to the same shape for an empty reply", async () => {
    const blank = await preOfferService.getPreOfferFormState("")
    expect(blank).toEqual({ filled: false, filled_at: null, rejected_fields: [] })
    expect(get).not.toHaveBeenCalled()

    get.mockResolvedValueOnce(null)
    const empty = await preOfferService.getPreOfferFormState("CAND-TEST-0001@example.invalid")
    expect(empty).toEqual({ filled: false, filled_at: null, rejected_fields: [] })
    expect(get).toHaveBeenCalledWith("recruitment.api.channels.pre_offer.get_form_state", {
      job_applicant: "CAND-TEST-0001@example.invalid",
    })
  })

  // Spec: CAND-07-A5.1B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a5-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("refuses a form reply that is not a list, and refuses to submit without an applicant", async () => {
    get.mockResolvedValueOnce({ not: "a list" })
    await expect(preOfferService.getPreOfferForm("CAND-TEST-0001@example.invalid")).rejects.toThrow(
      "Failed to fetch pre-offer form: Response is not a valid list of fields",
    )

    await expect(preOfferService.submitPreOffer("", {})).rejects.toThrow("Job applicant is required")
    expect(post).not.toHaveBeenCalled()
  })

  // Spec: CAND-07-A5.1C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a5-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("derives read_only and hidden from editability and visibility only when the explicit flags are absent", () => {
    const derived = transformPreOfferField({
      reference_name: "pan",
      display_name: "PAN",
      fieldtype: "Data",
      editability: "Read Only",
      visibility: "Hidden",
    } as never)
    expect(derived).toMatchObject({ fieldname: "pan", label: "PAN", read_only: 1, hidden: 1, reqd: 0, is_mandatory: 0, value: "" })

    const explicit = transformPreOfferField({
      fieldname: "aadhaar",
      fieldtype: "Data",
      read_only: 0,
      hidden: 0,
      editability: "Read Only",
      visibility: "Hidden",
    } as never)
    expect(explicit).toMatchObject({ fieldname: "aadhaar", label: "aadhaar", read_only: 0, hidden: 0 })
  })

  // Spec: CAND-07-A5.1D (docs/spec/clauses/07-services-and-hooks.md#cand-07-a5-1d)
  // Characterization: pins current behaviour, not endorsed.
  it("takes the form status from a status field, keeps it out of the rendered fields and groups the rest by section", async () => {
    get.mockResolvedValueOnce([
      { reference_name: "pre_offer_form_status", fieldtype: "Data", value: "Submitted" },
      { reference_name: "pan", display_name: "PAN", fieldtype: "Data", section: "Identity" },
      { reference_name: "bank", display_name: "Bank", fieldtype: "Data" },
    ])

    const form = await preOfferService.getPreOfferForm("CAND-TEST-0001@example.invalid")
    expect(form.status).toBe("Submitted")
    expect(form.tabs.map((t) => t.tab)).toEqual(["Identity", "Basic Details"])
    expect(form.tabs[0].sections[0].fields.map((f) => f.fieldname)).toEqual(["pan"])
    expect(form.tabs[1].sections[0].fields.map((f) => f.fieldname)).toEqual(["bank"])
  })
})

describe("profile and survey calls", () => {
  // Spec: CAND-07-A6.1A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a6-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("wraps the profile update in a data object but posts the password change flat", async () => {
    post.mockResolvedValue({ status: "ok" })

    await profileService.updateProfile({ full_name: "Test Candidate", mobile_no: "0000000000" })
    expect(post).toHaveBeenNthCalledWith(1, "recruitment.api.candidate_auth.update_me", {
      data: { full_name: "Test Candidate", mobile_no: "0000000000" },
    })

    const change = { current_password: "old-secret", new_password: "new-secret", confirm_password: "new-secret" }
    await profileService.changePassword(change)
    expect(post).toHaveBeenNthCalledWith(2, "recruitment.api.candidate_auth.change_password", change)
  })

  // Spec: CAND-07-A6.1B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a6-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("logs and re-raises a failed profile update instead of swallowing it", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    post.mockRejectedValue(new Error("Not permitted"))

    await expect(profileService.updateProfile({ full_name: "Test Candidate" })).rejects.toThrow("Not permitted")
    await expect(profileService.changePassword({ current_password: "a", new_password: "b", confirm_password: "b" })).rejects.toThrow(
      "Not permitted",
    )
    expect(consoleError).toHaveBeenCalledTimes(2)
    consoleError.mockRestore()
  })

  // Spec: CAND-07-A6.2A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a6-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("reads the post-login route with no parameters and posts the survey answers as given", async () => {
    get.mockResolvedValue({ survey_required: false, redirect_url: "/dashboard" })
    post.mockResolvedValue({ status: "ok" })

    await surveyService.getPostLoginRoute()
    expect(get).toHaveBeenCalledWith("recruitment.api.candidate_portal_survey.get_post_login_route")

    const payload = { survey: "CAND-TEST-SURVEY-0001", answers: [{ question: "q1", answer: "a1" }] }
    await surveyService.submitSurvey(payload as never)
    expect(post).toHaveBeenCalledWith("recruitment.api.candidate_portal_survey.submit_survey", payload)
  })
})
