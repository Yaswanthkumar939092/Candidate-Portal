import { z } from 'zod'

export const ONBOARDING_STEPS = [
  { key: 'personal_info', label: 'Personal Information' },
  { key: 'address', label: 'Address' },
  { key: 'identity_documents', label: 'Identity Documents' },
  { key: 'bank_details', label: 'Bank Details' },
  { key: 'emergency_contacts', label: 'Emergency Contacts' },
  { key: 'education', label: 'Education' },
  { key: 'employment_history', label: 'Employment History' },
  { key: 'declaration_accepted', label: 'Review & Declaration' },
] as const

// Step 8: Review & Declaration
export const reviewDeclarationSchema = z.object({
  declaration_accepted: z.literal(true, {
    error: 'You must accept the declaration to submit',
  }),
})

// Export inferred types
export type ReviewDeclarationData = z.infer<typeof reviewDeclarationSchema>
