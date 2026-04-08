"use client";
import { cn } from "@/lib/utils";
import { useState, ChangeEvent, ReactNode } from "react";
import { Button } from "../ui/button";
import { useCreateJobApplicant } from "@/lib/hooks/useJobOpening";
import { toast } from "sonner";
import { useFileUpload } from "@/lib/hooks/useFileUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EducationLevel =
  | "Graduate"
  | "Post Graduate"
  | "Under Graduate"
  | "Doctorate"
  | "Diploma"
  | "High School"
  | "Other"
  | "";

export type Gender = "Male" | "Female" | "Other" | "Prefer not to say" | "";
export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed" | "";

export interface EducationalQualificationRow {
  school_univ: string;
  qualification: string;
  custom_educational_details: string;
  level: EducationLevel;
}

export interface WorkExperienceRow {
  company_name: string;
  designation: string;
  salary: string;
  address: string;
}

export interface JobApplicantFormState {
  applicant_name: string;
  email_id: string;
  job_title: string;
  custom_gender: Gender;
  custom_marital_status: MaritalStatus;
  custom_expected_ctc: string;
  custom_permanent_address: string;
  custom_current_address: string;
  custom_linkedin_url: string;
  resume_attachment: string | null;
  phone_number: string;
  custom_educational_qualification: EducationalQualificationRow[];
  custom_previous_work_experience: WorkExperienceRow[];
}

export interface EducationalQualificationPayload
  extends EducationalQualificationRow {
  doctype: "custom_educational_qualification";
  idx: number;
}

export interface WorkExperiencePayload extends WorkExperienceRow {
  doctype: "custom_previous_work_experience";
  idx: number;
}

export interface JobApplicantPayload {
  doctype: "Job Applicant";
  applicant_name: string;
  resume_attachment: string | null;
  email_id: string;
  job_title: string;
  custom_gender: Gender;
  custom_marital_status: MaritalStatus;
  custom_expected_ctc: string;
  custom_permanent_address: string;
  custom_current_address: string;
  custom_linkedin_url: string;
  phone_number: string;
  custom_educational_qualification: EducationalQualificationPayload[];
  custom_previous_work_experience: WorkExperiencePayload[];
}

export type FormErrors = Partial<Record<keyof JobApplicantFormState, string>>;

export type ChildTable = keyof Pick<
  JobApplicantFormState,
  "custom_educational_qualification" | "custom_previous_work_experience"
>;

interface props {
  jobID: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const initialEducation: EducationalQualificationRow = {
  school_univ: "",
  qualification: "",
  custom_educational_details: "",
  level: "",
};

const initialWorkExp: WorkExperienceRow = {
  company_name: "",
  designation: "",
  salary: "",
  address: "",
};

const educationLevels: Exclude<EducationLevel, "">[] = [
  "Graduate",
  "Post Graduate",
  "Under Graduate",
  "Doctorate",
  "Diploma",
  "High School",
  "Other",
];

const sections: { label: string; icon: string }[] = [
  { label: "Personal", icon: "👤" },
  { label: "Contact", icon: "📞" },
  { label: "Education", icon: "🎓" },
  { label: "Experience", icon: "💼" },
];

// ─── Field style helper ───────────────────────────────────────────────────────

const fieldCls = (hasError: boolean) =>
  `w-full px-[14px] py-[10px] rounded-lg text-sm font-[family-name:var(--font-dm)] text-[#0f172a] bg-[#f8fafc] outline-none box-border transition-colors duration-200 ${
    hasError
      ? "border-[1.5px] border-[#ef4444]"
      : "border-[1.5px] border-[#e2e8f0]"
  } focus:border-[#6366f1] focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobApplicantForm({ jobID }: props) {
  const [form, setForm] = useState<JobApplicantFormState>({
    applicant_name: "",
    email_id: "",
    job_title: "",
    custom_gender: "",
    custom_marital_status: "",
    custom_expected_ctc: "",
    custom_permanent_address: "",
    custom_current_address: "",
    custom_linkedin_url: "",
    resume_attachment: "" , 
    phone_number: "",
    custom_educational_qualification: [{ ...initialEducation }],
    custom_previous_work_experience: [{ ...initialWorkExp }],
  });

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<number>(0);
  const [errors, setErrors] = useState<FormErrors>({});
 const uploadMutation = useFileUpload()
 const [fileName, setFileName] = useState<string>("")
  const { mutate, isPending } = useCreateJobApplicant();

  // ─── Field Handlers ───────────────────────────────────────────────────────
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  // ─── Child Table Handlers ─────────────────────────────────────────────────
  const handleChildChange = <
    T extends ChildTable,
    F extends keyof JobApplicantFormState[T][number]
  >(
    table: T,
    index: number,
    field: F,
    value: JobApplicantFormState[T][number][F]
  ): void => {
    setForm((prev) => {
      const updated = (prev[table] as JobApplicantFormState[T]).map(
        (row: JobApplicantFormState[T][number], i: number) =>
          i === index ? { ...row, [field]: value } : row
      );
      return { ...prev, [table]: updated };
    });
  };

  const addRow = <T extends ChildTable>(
    table: T,
    template: JobApplicantFormState[T][number]
  ): void => {
    setForm((prev) => ({
      ...prev,
      [table]: [...(prev[table] as JobApplicantFormState[T]), { ...template }],
    }));
  };

  const removeRow = (table: ChildTable, index: number): void => {
    setForm((prev) => ({
      ...prev,
      [table]: (prev[table] as Array<unknown>).filter((_, i) => i !== index),
    }));
  };

  // ─── Validation ───────────────────────────────────────────────────────────

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.applicant_name.trim()) e.applicant_name = "Name is required";
    if (!form.email_id.trim()) e.email_id = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email_id)) e.email_id = "Invalid email";
    if (!form.phone_number.trim()) e.phone_number = "Phone is required";
    if (!form.job_title.trim()) e.job_title = "Job title is required";
    return e;
  };

  //file uploading using useUploadFile hook
  
  const handleFileUpload = (file: File | null) => {
    if (!file) {
      setForm((prev) => ({
        ...prev,
        resume_attachment: null,
      }))
      setFileName("")
      return
    }
  
    setFileName(file.name)
  
    uploadMutation.mutate(file, {
      onSuccess(data: { file_url: string }) {
        setForm((prev) => ({
          ...prev,
          resume_attachment: data.file_url,
        }))
  
        toast.success("File uploaded successfully")
      },
      onError(err: Error) {
        console.error(err)
        toast.error("File upload failed")
      },
    })
  }

  // ─── Build Payload ────────────────────────────────────────────────────────

  const buildPayload = (): JobApplicantPayload => ({
    doctype: "Job Applicant",
    job_title: jobID,
    applicant_name: form.applicant_name,
    email_id: form.email_id,
    resume_attachment: form.resume_attachment,
    custom_gender: form.custom_gender,
    custom_marital_status: form.custom_marital_status,
    custom_expected_ctc: form.custom_expected_ctc,
    custom_permanent_address: form.custom_permanent_address,
    custom_current_address: form.custom_current_address,
    custom_linkedin_url: form.custom_linkedin_url,
    phone_number: form.phone_number,
    custom_educational_qualification: form.custom_educational_qualification.map(
      (row, idx): EducationalQualificationPayload => ({
        doctype: "custom_educational_qualification",
        idx: idx + 1,
        school_univ: row.school_univ,
        qualification: row.qualification,
        custom_educational_details: row.custom_educational_details,
        level: row.level,
      })
    ),
    custom_previous_work_experience: form.custom_previous_work_experience.map(
      (row, idx): WorkExperiencePayload => ({
        doctype: "custom_previous_work_experience",
        idx: idx + 1,
        company_name: row.company_name,
        designation: row.designation,
        salary: row.salary,
        address: row.address,
      })
    ),
  });

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (): Promise<void> => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setActiveSection(0);
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      mutate(payload);
      await new Promise<void>((r) => setTimeout(r, 1200));
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 bg-muted pb-16">
      <div className="max-w-full mx-auto mt-20 bg-white rounded-3xl shadow-[0_12px_48px_rgba(0,0,0,0.1)] px-12 py-14 text-center">
         <div
            className="w-18 h-18 rounded-full bg-[#dcfce7] mx-auto mb-6 flex items-center justify-center text-3xl text-[#16a34a]"
            style={{ width: 72, height: 72 }}
        >
            ✓
         </div>
        <h2
            className="font-extrabold text-[26px] text-[#0f172a] mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
         >
            Application Submitted
         </h2>
        <p className="text-[#64748b] text-[15px] leading-relaxed mb-8">
            Thank you! Your application has been received and is under review.
          </p>
          <button
            className="px-7 py-3 rounded-xl border-none bg-[#6366f1] text-white text-sm font-semibold cursor-pointer"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
            onClick={() => {
              setSubmitted(false);
              setActiveSection(0);
            }}
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-var(--navbar-height,64px))] flex bg-muted overflow-hidden">
      <div className="w-60 shrink-0 sticky h-[calc(100vh-64px)] bg-card border-r border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Form Steps</h2>
          <p className="text-xs text-muted-foreground">
            Fill all required details
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-1 p-2">
          {sections.map((s, i) => {
            const isActive = activeSection === i;
            const isPast = i < activeSection;

            return (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",

                  isActive && "bg-primary/10 text-primary font-medium",
                  isPast && !isActive && "text-muted-foreground hover:bg-muted",
                  !isActive &&
                    !isPast &&
                    "text-muted-foreground/70 hover:bg-muted"
                )}
              >
                {/* Step circle */}
                <div
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold",

                    isActive && "bg-primary text-white",
                    isPast && !isActive && "bg-green-100 text-green-600",
                    !isActive &&
                      !isPast &&
                      "border border-border text-muted-foreground"
                  )}
                >
                  {i + 1}
                </div>

                {/* Icon */}

                {/* Label */}
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="max-w-4xl mx-auto bg-white rounded-lg border  overflow-hidden">
          {/* ── Section 0: Personal ── */}
          {activeSection === 0 && (
            <div className="px-9 pt-8 pb-2">
              <SectionTitle>Personal Information</SectionTitle>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-4">
                <Field label="Full Name *" error={errors.applicant_name}>
                  <input
                    className={fieldCls(!!errors.applicant_name)}
                    name="applicant_name"
                    value={form.applicant_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </Field>
                <Field label="Job Title *" error={errors.job_title}>
                  <input
                    className={fieldCls(!!errors.job_title)}
                    name="job_title"
                    value={jobID}
                    onChange={handleChange}
                    placeholder="Software Engineer"
                  />
                </Field>
                <Field label="Gender">
                  <select
                    className={fieldCls(false)}
                    name="custom_gender"
                    value={form.custom_gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </Field>
                <Field label="Marital Status">
                  <select
                    className={fieldCls(false)}
                    name="custom_marital_status"
                    value={form.custom_marital_status}
                    onChange={handleChange}
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </Field>
                <Field label="Expected CTC">
                  <input
                    className={fieldCls(false)}
                    name="custom_expected_ctc"
                    value={form.custom_expected_ctc}
                    onChange={handleChange}
                    placeholder="e.g. 8,00,000"
                  />
                </Field>
                <Field label="LinkedIn URL">
                  <input
                    className={fieldCls(false)}
                    name="custom_linkedin_url"
                    value={form.custom_linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                  />
                </Field>
              </div>
              <Field label="Resume / CV">
  <div className="rounded-[10px] border-2 border-dashed border-[#cbd5e1] overflow-hidden cursor-pointer transition-colors duration-200">
    <label
      className="flex items-center gap-2.5 px-[18px] py-3.5 cursor-pointer text-[#475569] text-[13px]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      htmlFor="resume_file"
    >
      <span className="text-xl">📎</span>
      {fileName
        ? fileName
        : "Click to upload resume (PDF/DOC)"}
    </label>

    <input
      id="resume_file"
      type="file"
      accept=".pdf,.doc,.docx"
      className="hidden"
      onChange={(e) =>
        handleFileUpload(
          e.target.files?.[0] ?? null
        )
      }
    />
  </div>
</Field>
            </div>
          )}

          {/* ── Section 1: Contact ── */}
          {activeSection === 1 && (
            <div className="px-9 pt-8 pb-2">
              <SectionTitle>Contact Details</SectionTitle>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-4">
                <Field label="Email Address *" error={errors.email_id}>
                  <input
                    className={fieldCls(!!errors.email_id)}
                    name="email_id"
                    type="email"
                    value={form.email_id}
                    onChange={handleChange}
                    placeholder="john@example.com"
                  />
                </Field>
                <Field label="Phone Number *" error={errors.phone_number}>
                  <input
                    className={fieldCls(!!errors.phone_number)}
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                  />
                </Field>
              </div>
              <Field label="Permanent Address">
                <textarea
                  className={`${fieldCls(false)} h-[90px] resize-y`}
                  name="custom_permanent_address"
                  value={form.custom_permanent_address}
                  onChange={handleChange}
                  placeholder="House No., Street, City, State, PIN"
                />
              </Field>
              <Field label="Current Address">
                <textarea
                  className={`${fieldCls(false)} h-[90px] resize-y`}
                  name="custom_current_address"
                  value={form.custom_current_address}
                  onChange={handleChange}
                  placeholder="Same as permanent or different address"
                />
              </Field>
            </div>
          )}

          {/* ── Section 2: Education ── */}
          {activeSection === 2 && (
            <div className="px-9 pt-8 pb-2">
              <SectionTitle>Educational Qualifications</SectionTitle>
              <p className="text-xs text-[#94a3b8] mb-5">
                Child Table: <code>custom_educational_qualification</code>
              </p>
              {form.custom_educational_qualification.map((row, idx) => (
                <div
                  key={idx}
                  className="bg-[#f8fafc] rounded-xl px-5 py-4 mb-4 border border-[#e2e8f0]"
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-bold text-[#6366f1] bg-[#eef2ff] px-2.5 py-0.5 rounded-full">
                      #{idx + 1}
                    </span>
                    {form.custom_educational_qualification.length > 1 && (
                      <button
                        className="text-xs text-[#ef4444] bg-[#fff0f0] border border-[#fecaca] px-2.5 py-1 rounded-lg cursor-pointer"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                        onClick={() =>
                          removeRow("custom_educational_qualification", idx)
                        }
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-4">
                    <Field label="School / University">
                      <input
                        className={fieldCls(false)}
                        value={row.school_univ}
                        onChange={(e) =>
                          handleChildChange(
                            "custom_educational_qualification",
                            idx,
                            "school_univ",
                            e.target.value
                          )
                        }
                        placeholder="Harvard University"
                      />
                    </Field>
                    <Field label="Qualification">
                      <input
                        className={fieldCls(false)}
                        value={row.qualification}
                        onChange={(e) =>
                          handleChildChange(
                            "custom_educational_qualification",
                            idx,
                            "qualification",
                            e.target.value
                          )
                        }
                        placeholder="B.Tech Computer Science"
                      />
                    </Field>
                    <Field label="Level">
                      <select
                        className={fieldCls(false)}
                        value={row.level}
                        onChange={(e) =>
                          handleChildChange(
                            "custom_educational_qualification",
                            idx,
                            "level",
                            e.target.value as EducationLevel
                          )
                        }
                      >
                        <option value="">Select Level</option>
                        {educationLevels.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Educational Details">
                      <input
                        className={fieldCls(false)}
                        value={row.custom_educational_details}
                        onChange={(e) =>
                          handleChildChange(
                            "custom_educational_qualification",
                            idx,
                            "custom_educational_details",
                            e.target.value
                          )
                        }
                        placeholder="Percentage / CGPA / Details"
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button
                className="inline-flex items-center gap-1.5 my-1 mb-6 px-[18px] py-2.5 rounded-[10px] border-[1.5px] border-dashed border-[#6366f1] bg-[#f5f3ff] text-[#6366f1] text-[13px] font-semibold cursor-pointer"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onClick={() =>
                  addRow("custom_educational_qualification", initialEducation)
                }
              >
                + Add Education
              </button>
            </div>
          )}

          {/* ── Section 3: Work Experience ── */}
          {activeSection === 3 && (
            <div className="px-9 pt-8 pb-2">
              <SectionTitle>Previous Work Experience</SectionTitle>
              <p className="text-xs text-[#94a3b8] mb-5">
                Child Table: <code>custom_previous_work_experience</code>
              </p>
              {form.custom_previous_work_experience.map((row, idx) => (
                <div
                  key={idx}
                  className="bg-[#f8fafc] rounded-xl px-5 py-4 mb-4 border border-[#e2e8f0]"
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-bold text-[#6366f1] bg-[#eef2ff] px-2.5 py-0.5 rounded-full">
                      #{idx + 1}
                    </span>
                    {form.custom_previous_work_experience.length > 1 && (
                      <button
                        className="text-xs text-[#ef4444] bg-[#fff0f0] border border-[#fecaca] px-2.5 py-1 rounded-lg cursor-pointer"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                        onClick={() =>
                          removeRow("custom_previous_work_experience", idx)
                        }
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-4">
                    <Field label="Company Name">
                      <input
                        className={fieldCls(false)}
                        value={row.company_name}
                        onChange={(e) =>
                          handleChildChange(
                            "custom_previous_work_experience",
                            idx,
                            "company_name",
                            e.target.value
                          )
                        }
                        placeholder="Acme Corp"
                      />
                    </Field>
                    <Field label="Designation">
                      <input
                        className={fieldCls(false)}
                        value={row.designation}
                        onChange={(e) =>
                          handleChildChange(
                            "custom_previous_work_experience",
                            idx,
                            "designation",
                            e.target.value
                          )
                        }
                        placeholder="Senior Developer"
                      />
                    </Field>
                    <Field label="Salary (CTC)">
                      <input
                        className={fieldCls(false)}
                        value={row.salary}
                        onChange={(e) =>
                          handleChildChange(
                            "custom_previous_work_experience",
                            idx,
                            "salary",
                            e.target.value
                          )
                        }
                        placeholder="6,00,000"
                      />
                    </Field>
                    <Field label="Office Address">
                      <input
                        className={fieldCls(false)}
                        value={row.address}
                        onChange={(e) =>
                          handleChildChange(
                            "custom_previous_work_experience",
                            idx,
                            "address",
                            e.target.value
                          )
                        }
                        placeholder="City, State"
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button
                className="inline-flex items-center gap-1.5 my-1 mb-6 px-[18px] py-2.5 rounded-[10px] border-[1.5px] border-dashed border-[#6366f1] bg-[#f5f3ff] text-[#6366f1] text-[13px] font-semibold cursor-pointer"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onClick={() =>
                  addRow("custom_previous_work_experience", initialWorkExp)
                }
              >
                + Add Work Experience
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center px-9 pt-5 pb-7 border-t border-[#f1f5f9] mt-2 gap-3">
            {activeSection > 0 && (
              <button
                className="px-[22px] py-[11px] rounded-[10px] border-[1.5px] border-[#e2e8f0] bg-white text-[#475569] text-sm font-semibold cursor-pointer"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => setActiveSection((s) => s - 1)}
              >
                ← Back
              </button>
            )}
            <div className="flex-1" />
            {activeSection < sections.length - 1 ? (
              <Button
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => setActiveSection((s) => s + 1)}
              >
                Next →
              </Button>
            ) : (
              <button
                className={`px-[26px] py-[11px] rounded-[10px] border-none text-white text-sm font-semibold cursor-pointer tracking-wide ${
                  submitting ? "bg-[#94a3b8]" : "bg-[#0f172a]"
                }`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Payload Preview */}
      {/* <details className="max-w-[780px] mx-auto mt-5 bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <summary
          className="px-6 py-3.5 text-[13px] font-semibold text-[#475569] bg-[#f8fafc] cursor-pointer"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          🔍 Preview Payload (doctype structure)
        </summary>
        <pre className="px-6 py-5 text-xs text-[#334155] bg-[#f8fafc] overflow-x-auto max-h-[340px]">
          {JSON.stringify(buildPayload(), null, 2)}
        </pre>
      </details> */}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SectionTitleProps {
  children: ReactNode;
}
function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2
      className="font-extrabold text-xl text-[#0f172a] mb-2 tracking-tight"
      style={{ fontFamily: "'Syne', sans-serif" }}
    >
      {children}
    </h2>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
  error?: string;
}
function Field({ label, children, error }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#475569] uppercase tracking-[0.6px]">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[11px] text-[#ef4444] font-medium">{error}</span>
      )}
    </div>
  );
}
