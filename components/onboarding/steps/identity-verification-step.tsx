"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  identityVerificationSchema,
  type IdentityVerificationData,
} from '@/lib/validation/onboarding-schemas'
import { useOnboarding } from '@/lib/contexts/onboarding-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FileUploadField } from '@/components/onboarding/file-upload-field'
import { cn } from '@/lib/utils'

interface IdentityVerificationStepProps {
  data?: Record<string, unknown>
  onChange?: (field: string, value: unknown) => void
  className?: string
}

/**
 * Step 3: Identity Verification.
 *
 * Collects PAN details (number, name, guardian name, DOB, upload)
 * and Aadhaar details (number, front upload, back upload).
 */
export function IdentityVerificationStep({ className }: IdentityVerificationStepProps) {
  const { stepData, setStepData, saveDraft, nextStep, prevStep, markStepComplete, isSaving } =
    useOnboarding()
  const existingData = (stepData.identity_documents ?? {}) as Partial<IdentityVerificationData>

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<IdentityVerificationData>({
    resolver: zodResolver(identityVerificationSchema),
    defaultValues: {
      pan_number: '',
      name_as_per_pan: '',
      guardian_name: '',
      dob_pan: '',
      pan_document_url: '',
      aadhaar_number: '',
      aadhaar_document_url: '',
      aadhaar_document_back_url: '',
      passport_number: '',
      passport_document_url: '',
      ...existingData,
    },
  })

  useEffect(() => {
    if (existingData && Object.keys(existingData).length > 0) {
      reset({
        pan_number: '',
        pan_document_url: '',
        aadhaar_number: '',
        aadhaar_document_url: '',
        passport_number: '',
        passport_document_url: '',
        ...existingData,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onNext = handleSubmit(async (data) => {
    setStepData('identity_documents', data as unknown as Record<string, unknown>)
    markStepComplete('identity_documents')
    await saveDraft().catch(() => {})
    nextStep()
  })

  return (
    <form onSubmit={onNext} className={cn("space-y-8", className)}>
      {/* PAN Details */}
      <section>
        <h3 className="text-base font-bold text-foreground">PAN Details</h3>
        <Separator className="mt-2 mb-5" />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
          {/* PAN Number */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              PAN Number <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('pan_number')}
              placeholder="ABCDE1234F"
              className="bg-muted uppercase"
            />
            {errors.pan_number && (
              <p className="text-xs text-destructive">{errors.pan_number.message}</p>
            )}
          </div>

          {/* Name as per PAN */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Name as per PAN <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('name_as_per_pan')}
              placeholder=""
              className="bg-muted"
            />
            {errors.name_as_per_pan && (
              <p className="text-xs text-destructive">{errors.name_as_per_pan.message}</p>
            )}
          </div>

          {/* Guardian Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Guardian Name
            </Label>
            <Input
              {...register('guardian_name')}
              placeholder=""
              className="bg-muted"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Date of Birth (as per PAN)
            </Label>
            <Input
              type="date"
              {...register('dob_pan')}
              className="bg-muted"
            />
          </div>
        </div>

        {/* Upload PAN Card */}
        <div className="mt-5">
          <FileUploadField
            label="Upload PAN Card"
            required
            accept=".svg,.png,.jpg,.jpeg,.pdf"
            helpText="SVG, PNG, JPG or PDF (max. 5MB)"
            value={watch('pan_document_url')}
            onChange={(url) => setValue('pan_document_url', url || '', { shouldValidate: true })}
            error={errors.pan_document_url?.message}
          />
        </div>
      </section>

      {/* Aadhaar Details */}
      <section>
        <h3 className="text-base font-bold text-foreground">Aadhaar Details</h3>
        <Separator className="mt-2 mb-5" />

        <div className="space-y-5">
          {/* Aadhaar Number */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Aadhaar Number <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('aadhaar_number')}
              placeholder="1234 5678 9012"
              className="bg-muted"
            />
            {errors.aadhaar_number && (
              <p className="text-xs text-destructive">{errors.aadhaar_number.message}</p>
            )}
          </div>

          {/* Upload Aadhaar (Front and Back) */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
            <FileUploadField
              label="Upload Aadhaar (Front)"
              required
              accept=".svg,.png,.jpg,.jpeg,.pdf"
              helpText="SVG, PNG, JPG or PDF (max. 5MB)"
              value={watch('aadhaar_document_url')}
              onChange={(url) => setValue('aadhaar_document_url', url || '', { shouldValidate: true })}
              error={errors.aadhaar_document_url?.message}
            />
            <FileUploadField
              label="Upload Aadhaar (Back)"
              required
              accept=".svg,.png,.jpg,.jpeg,.pdf"
              helpText="SVG, PNG, JPG or PDF (max. 5MB)"
              value={watch('aadhaar_document_back_url')}
              onChange={(url) => setValue('aadhaar_document_back_url', url || '', { shouldValidate: true })}
              error={errors.aadhaar_document_back_url?.message}
            />
          </div>
        </div>
      </section>

      {/* Navigation */}
      <Separator />
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={prevStep}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" disabled={isSaving}>
          Next Step
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
