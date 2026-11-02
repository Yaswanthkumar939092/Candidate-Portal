import { describe, it, expect } from 'vitest'
import {
  reviewDeclarationSchema,
} from '@/lib/validation/onboarding-schemas'

// ---------------------------------------------------------------------------
// TC-4.24: Review Declaration
// ---------------------------------------------------------------------------

describe('reviewDeclarationSchema', () => {
  // Spec: CAND-05-A6.10A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-10a)
  it('fails without accepting declaration', () => {
    const result = reviewDeclarationSchema.safeParse({ declaration_accepted: false })
    expect(result.success).toBe(false)
  })

  // Spec: CAND-05-A6.10B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-10b)
  it('passes when declaration accepted', () => {
    const result = reviewDeclarationSchema.safeParse({ declaration_accepted: true })
    expect(result.success).toBe(true)
  })

  // Spec: CAND-05-A6.10C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-10c)
  it('fails when declaration_accepted is missing', () => {
    const result = reviewDeclarationSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
