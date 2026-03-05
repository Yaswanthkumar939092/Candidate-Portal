import { describe, it, expect } from 'vitest'
import {
  personalInfoSchema,
  addressDetailsSchema,
  identityVerificationSchema,
  bankDetailsSchema,
  emergencyContactsSchema,
  educationSchema,
  employmentHistorySchema,
  reviewDeclarationSchema,
  ONBOARDING_STEPS,
} from './onboarding-schemas'

// ---------------------------------------------------------------------------
// TC-4.9: Personal Info Validation
// ---------------------------------------------------------------------------

describe('personalInfoSchema', () => {
  it('fails with empty data', () => {
    const result = personalInfoSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('passes with valid minimal data', () => {
    const result = personalInfoSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      gender: 'Male',
    })
    expect(result.success).toBe(true)
  })

  it('passes with all gender values', () => {
    const genders = ['Male', 'Female', 'Other', 'Prefer not to say']
    for (const gender of genders) {
      const result = personalInfoSchema.safeParse({
        first_name: 'Test',
        last_name: 'User',
        date_of_birth: '1995-06-15',
        gender,
      })
      expect(result.success).toBe(true)
    }
  })

  it('fails with invalid gender', () => {
    const result = personalInfoSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      gender: 'InvalidGender',
    })
    expect(result.success).toBe(false)
  })

  it('fails when first_name is empty string', () => {
    const result = personalInfoSchema.safeParse({
      first_name: '',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      gender: 'Male',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields', () => {
    const result = personalInfoSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      blood_group: 'O+',
      marital_status: 'Single',
      nationality: 'Indian',
      phone: '9876543210',
      personal_email: 'john@personal.com',
    })
    expect(result.success).toBe(true)
  })

  it('accepts family_members array', () => {
    const result = personalInfoSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      family_members: [
        { name: 'Jane Doe', relationship: 'Spouse' },
      ],
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Address Details
// ---------------------------------------------------------------------------

describe('addressDetailsSchema', () => {
  const validAddress = {
    line1: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin_code: '400001',
  }

  it('passes with valid addresses', () => {
    const result = addressDetailsSchema.safeParse({
      current_address: validAddress,
      permanent_address: validAddress,
    })
    expect(result.success).toBe(true)
  })

  it('fails without current_address', () => {
    const result = addressDetailsSchema.safeParse({
      permanent_address: validAddress,
    })
    expect(result.success).toBe(false)
  })

  it('fails with invalid PIN code (too short)', () => {
    const result = addressDetailsSchema.safeParse({
      current_address: { ...validAddress, pin_code: '400' },
      permanent_address: validAddress,
    })
    expect(result.success).toBe(false)
  })

  it('fails with invalid PIN code (too long)', () => {
    const result = addressDetailsSchema.safeParse({
      current_address: { ...validAddress, pin_code: '4000012' },
      permanent_address: validAddress,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// TC-4.14: PAN Validation / TC-4.15: Aadhaar Validation
// ---------------------------------------------------------------------------

describe('identityVerificationSchema', () => {
  it('passes with empty object (all fields optional)', () => {
    const result = identityVerificationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('validates PAN format correctly -- valid', () => {
    const result = identityVerificationSchema.safeParse({
      pan_number: 'ABCDE1234F',
    })
    expect(result.success).toBe(true)
  })

  it('validates PAN format correctly -- too short', () => {
    const result = identityVerificationSchema.safeParse({
      pan_number: 'ABCDE1234',
    })
    expect(result.success).toBe(false)
  })

  it('validates PAN format correctly -- wrong pattern', () => {
    const result = identityVerificationSchema.safeParse({
      pan_number: '12345ABCDE',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty string for PAN', () => {
    const result = identityVerificationSchema.safeParse({ pan_number: '' })
    expect(result.success).toBe(true)
  })

  it('validates Aadhaar format correctly -- 12 digits no spaces', () => {
    const result = identityVerificationSchema.safeParse({
      aadhaar_number: '123456789012',
    })
    expect(result.success).toBe(true)
  })

  it('validates Aadhaar format correctly -- 12 digits with spaces', () => {
    const result = identityVerificationSchema.safeParse({
      aadhaar_number: '1234 5678 9012',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid Aadhaar -- too few digits', () => {
    const result = identityVerificationSchema.safeParse({
      aadhaar_number: '1234 5678',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty string for Aadhaar', () => {
    const result = identityVerificationSchema.safeParse({ aadhaar_number: '' })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TC-4.17 / TC-4.18: Bank Details Validation
// ---------------------------------------------------------------------------

describe('bankDetailsSchema', () => {
  const validBank = {
    account_holder_name: 'John Doe',
    account_number: '12345678901',
    confirm_account_number: '12345678901',
    ifsc_code: 'SBIN0001234',
    bank_name: 'SBI',
  }

  it('fails without required fields', () => {
    const result = bankDetailsSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('passes with valid data', () => {
    const result = bankDetailsSchema.safeParse(validBank)
    expect(result.success).toBe(true)
  })

  it('validates IFSC format -- valid', () => {
    const result = bankDetailsSchema.safeParse(validBank)
    expect(result.success).toBe(true)
  })

  it('validates IFSC format -- invalid', () => {
    const result = bankDetailsSchema.safeParse({
      ...validBank,
      ifsc_code: 'INVALID',
    })
    expect(result.success).toBe(false)
  })

  it('validates IFSC format -- lowercase rejected', () => {
    const result = bankDetailsSchema.safeParse({
      ...validBank,
      ifsc_code: 'sbin0001234',
    })
    expect(result.success).toBe(false)
  })

  it('fails when account numbers do not match', () => {
    const result = bankDetailsSchema.safeParse({
      ...validBank,
      confirm_account_number: '99999999999',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional branch_name', () => {
    const result = bankDetailsSchema.safeParse({
      ...validBank,
      branch_name: 'Main Branch',
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TC-4.19: Emergency Contacts
// ---------------------------------------------------------------------------

describe('emergencyContactsSchema', () => {
  it('fails with empty contacts array', () => {
    const result = emergencyContactsSchema.safeParse({ contacts: [] })
    expect(result.success).toBe(false)
  })

  it('passes with valid contact', () => {
    const result = emergencyContactsSchema.safeParse({
      contacts: [
        {
          name: 'Jane',
          relationship: 'Spouse',
          phone_number: '9876543210',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('passes with multiple contacts', () => {
    const result = emergencyContactsSchema.safeParse({
      contacts: [
        { name: 'Jane', relationship: 'Spouse', phone_number: '9876543210' },
        { name: 'Bob', relationship: 'Parent', phone_number: '9876543211' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('fails with invalid phone number (too short)', () => {
    const result = emergencyContactsSchema.safeParse({
      contacts: [
        { name: 'Jane', relationship: 'Spouse', phone_number: '12345' },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional email and address', () => {
    const result = emergencyContactsSchema.safeParse({
      contacts: [
        {
          name: 'Jane',
          relationship: 'Spouse',
          phone_number: '9876543210',
          email: 'jane@test.com',
          address: '123 Street',
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TC-4.21: Education Repeater
// ---------------------------------------------------------------------------

describe('educationSchema', () => {
  it('requires at least one qualification', () => {
    const result = educationSchema.safeParse({ qualifications: [] })
    expect(result.success).toBe(false)
  })

  it('passes with valid qualification', () => {
    const result = educationSchema.safeParse({
      qualifications: [
        { degree: 'B.Tech', institution: 'IIT', year_of_passing: '2020' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('passes with optional fields', () => {
    const result = educationSchema.safeParse({
      qualifications: [
        {
          degree: 'B.Tech',
          institution: 'IIT',
          year_of_passing: '2020',
          percentage_or_cgpa: '8.5',
          specialization: 'Computer Science',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('fails without degree', () => {
    const result = educationSchema.safeParse({
      qualifications: [
        { degree: '', institution: 'IIT', year_of_passing: '2020' },
      ],
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Employment History
// ---------------------------------------------------------------------------

describe('employmentHistorySchema', () => {
  it('passes with empty experiences array', () => {
    const result = employmentHistorySchema.safeParse({ experiences: [] })
    expect(result.success).toBe(true)
  })

  it('passes with no experiences key (optional)', () => {
    const result = employmentHistorySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('passes with valid experience', () => {
    const result = employmentHistorySchema.safeParse({
      has_experience: true,
      experiences: [
        {
          company: 'Acme Corp',
          designation: 'Software Engineer',
          from_date: '2020-01-01',
          to_date: '2023-01-01',
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})

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

// ---------------------------------------------------------------------------
// ONBOARDING_STEPS
// ---------------------------------------------------------------------------

describe('ONBOARDING_STEPS', () => {
  it('has exactly 8 steps', () => {
    expect(ONBOARDING_STEPS).toHaveLength(8)
  })

  it('each step has key, label, and schema', () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step.key).toBeDefined()
      expect(typeof step.key).toBe('string')
      expect(step.label).toBeDefined()
      expect(typeof step.label).toBe('string')
      expect(step.schema).toBeDefined()
      expect(typeof step.schema.safeParse).toBe('function')
    }
  })

  it('step keys are in the expected order', () => {
    const keys = ONBOARDING_STEPS.map((s) => s.key)
    expect(keys).toEqual([
      'personal_info',
      'address',
      'identity_documents',
      'bank_details',
      'emergency_contacts',
      'education',
      'employment_history',
      'review',
    ])
  })

  it('step labels are non-empty strings', () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step.label.length).toBeGreaterThan(0)
    }
  })
})
