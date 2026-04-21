import { describe, it, expect } from 'vitest'
import {
  reviewDeclarationSchema,
} from '@/lib/validation/onboarding-schemas'

// ---------------------------------------------------------------------------
// TC-4.24: Review Declaration
// ---------------------------------------------------------------------------

describe('reviewDeclarationSchema', () => {
  it('fails without accepting declaration', () => {
    const result = reviewDeclarationSchema.safeParse({ declaration_accepted: false })
    expect(result.success).toBe(false)
  })

  it('passes when declaration accepted', () => {
    const result = reviewDeclarationSchema.safeParse({ declaration_accepted: true })
    expect(result.success).toBe(true)
  })

  it('fails when declaration_accepted is missing', () => {
    const result = reviewDeclarationSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
