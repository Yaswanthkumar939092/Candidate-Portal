import { z } from 'zod'

// Step 8: Review & Declaration
export const reviewDeclarationSchema = z.object({
  declaration_accepted: z.literal(true, {
    error: 'You must accept the declaration to submit',
  }),
})

// Export inferred types
export type ReviewDeclarationData = z.infer<typeof reviewDeclarationSchema>
