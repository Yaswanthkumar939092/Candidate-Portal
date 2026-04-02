import { z } from 'zod'

// Step 1: Personal Info
export const personalInfoSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say'], {
    message: 'Gender is required',
  }),
  blood_group: z.string().optional(),
  marital_status: z.enum(['Single', 'Married', 'Divorced', 'Widowed']).optional(),
  nationality: z.string().optional(),
  phone: z.string().min(10, 'Valid phone number required').optional().or(z.literal('')),
  personal_email: z.string().email('Valid email required').optional().or(z.literal('')),
  family_members: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        relationship: z.string().min(1, 'Relationship is required'),
        date_of_birth: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .optional(),
    resume_url: z.string().min(1, "Resume is required"),
   photo_url: z.string().min(1, "Photo is required"),
})

// Step 2: Address Details
export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pin_code: z.string().min(6, 'Valid PIN code required').max(6, 'PIN code must be 6 digits'),
  country: z.string().optional(),
})

export const addressDetailsSchema = z.object({
  current_address: addressSchema,
  same_as_current: z.boolean().optional(),
  permanent_address: addressSchema,
})

// Step 3: Identity Verification
export const identityVerificationSchema = z.object({
  pan_number: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format. Expected: ABCDE1234F')
    .optional()
    .or(z.literal('')),
  pan_document_url: z.string().optional(),
  aadhaar_number: z
    .string()
    .regex(/^\d{4}\s?\d{4}\s?\d{4}$/, 'Aadhaar must be 12 digits')
    .optional()
    .or(z.literal('')),
  aadhaar_document_url: z.string().optional(),
  passport_number: z.string().optional(),
  passport_document_url: z.string().optional(),
})

// Step 4: Bank Details
export const bankDetailsSchema = z
  .object({
    account_holder_name: z.string().min(1, 'Account holder name is required'),
    account_number: z.string().min(8, 'Valid account number required'),
    confirm_account_number: z.string().min(8, 'Please confirm account number'),
    ifsc_code: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format. Expected: SBIN0001234'),
    bank_name: z.string().min(1, 'Bank name is required'),
    branch_name: z.string().optional(),
    cheque_document_url: z.string().optional(),
  })
  .refine((data) => data.account_number === data.confirm_account_number, {
    message: 'Account numbers do not match',
    path: ['confirm_account_number'],
  })

// Step 5: Emergency Contacts
export const emergencyContactsSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        relationship: z.string().min(1, 'Relationship is required'),
        phone_number: z.string().min(10, 'Valid phone number required'),
        email: z.string().email('Valid email required').optional().or(z.literal('')),
        address: z.string().optional(),
      })
    )
    .min(1, 'At least one emergency contact is required'),
})

// Step 6: Education
export const educationSchema = z.object({
  qualifications: z
    .array(
      z.object({
        degree: z.string().min(1, 'Degree is required'),
        institution: z.string().min(1, 'Institution is required'),
        year_of_passing: z.string().min(4, 'Year required'),
        percentage_or_cgpa: z.string().optional(),
        specialization: z.string().optional(),
        document_url: z.string().optional(),
      })
    )
    .min(1, 'At least one qualification is required'),
})

// Step 7: Employment History
export const employmentHistorySchema = z.object({
  has_experience: z.boolean().optional(),
  experiences: z
    .array(
      z.object({
        company: z.string().min(1, 'Company name required'),
        designation: z.string().min(1, 'Designation required'),
        from_date: z.string().min(1, 'Start date required'),
        to_date: z.string().optional(),
        is_current: z.boolean().optional(),
        reason_for_leaving: z.string().optional(),
      })
    )
    .optional(),
  referral_name: z.string().optional(),
  referral_employee_id: z.string().optional(),
})

// Step 8: Review & Declaration
export const reviewDeclarationSchema = z.object({
  declaration_accepted: z.literal(true, {
    error: 'You must accept the declaration to submit',
  }),
})

// Export inferred types
export type PersonalInfoData = z.infer<typeof personalInfoSchema>
export type AddressDetailsData = z.infer<typeof addressDetailsSchema>
export type IdentityVerificationData = z.infer<typeof identityVerificationSchema>
export type BankDetailsData = z.infer<typeof bankDetailsSchema>
export type EmergencyContactsData = z.infer<typeof emergencyContactsSchema>
export type EducationData = z.infer<typeof educationSchema>
export type EmploymentHistoryData = z.infer<typeof employmentHistorySchema>
export type ReviewDeclarationData = z.infer<typeof reviewDeclarationSchema>

// Step definitions
export const ONBOARDING_STEPS = [
  { key: 'personal_info', label: 'Personal Info', schema: personalInfoSchema },
  { key: 'address', label: 'Address Details', schema: addressDetailsSchema },
  { key: 'identity_documents', label: 'Identity Verification', schema: identityVerificationSchema },
  { key: 'bank_details', label: 'Bank Details', schema: bankDetailsSchema },
  { key: 'emergency_contacts', label: 'Emergency Contact', schema: emergencyContactsSchema },
  { key: 'education', label: 'Education', schema: educationSchema },
  { key: 'employment_history', label: 'Employment', schema: employmentHistorySchema },
  { key: 'review', label: 'Review', schema: reviewDeclarationSchema },
] as const

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]['key']
