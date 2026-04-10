"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { bankDetailsSchema, type BankDetailsData } from '@/lib/validation/onboarding-schemas'
import { useOnboarding } from '@/lib/contexts/onboarding-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FileUploadField } from '@/components/onboarding/file-upload-field'
import { cn } from '@/lib/utils'

interface BankDetailsStepProps {
  data?: Record<string, unknown>
  onChange?: (field: string, value: unknown) => void
  className?: string
}

/**
 * Step 4: Bank Details.
 *
 * Collects bank name, account number, IFSC code, UAN number,
 * and cancelled cheque / passbook / statement upload.
 */
export function BankDetailsStep({ className }: BankDetailsStepProps) {
  const { stepData, setStepData, saveDraft, nextStep, prevStep, markStepComplete, isSaving } =
    useOnboarding()
  const existingData = (stepData.bank_details ?? {}) as Partial<BankDetailsData>

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BankDetailsData>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      account_holder_name: '',
      account_number: '',
      confirm_account_number: '',
      ifsc_code: '',
      uan_number: '',
      bank_name: '',
      branch_name: '',
      cheque_document_url: '',
      ...existingData,
    },
  })

  useEffect(() => {
    if (existingData && Object.keys(existingData).length > 0) {
      reset({
        account_holder_name: '',
        account_number: '',
        confirm_account_number: '',
        ifsc_code: '',
        uan_number: '',
        bank_name: '',
        branch_name: '',
        cheque_document_url: '',
        ...existingData,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const bankName = watch('bank_name')
  const accountNumber = watch('account_number')

  useEffect(() => {
    setValue('account_holder_name', bankName || '', { shouldValidate: true })
  }, [bankName, setValue])

  useEffect(() => {
    setValue('confirm_account_number', accountNumber || '', { shouldValidate: true })
  }, [accountNumber, setValue])

  const onNext = handleSubmit(async (data) => {
    setStepData('bank_details', data as unknown as Record<string, unknown>)
    markStepComplete('bank_details')
    await saveDraft().catch(() => { })
    nextStep()
  })

  return (
    <form onSubmit={onNext} className={cn("space-y-8", className)}>
      {/* Bank Details (Salary Account) */}
      <section>
        <h3 className="text-base font-bold text-foreground">Bank Details (Salary Account)</h3>
        <Separator className="mt-2 mb-5" />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
          {/* Bank Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Bank Name <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('bank_name')}
              placeholder="e.g. State Bank of India"
              className="bg-muted"
            />
            {errors.bank_name && (
              <p className="text-xs text-destructive">{errors.bank_name.message}</p>
            )}
          </div>

          {/* Account Number */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Account Number <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('account_number')}
              placeholder="Enter account number"
              className="bg-muted"
              autoComplete="off"
            />
            {errors.account_number && (
              <p className="text-xs text-destructive">{errors.account_number.message}</p>
            )}
          </div>

          {/* IFSC Code */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              IFSC Code <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('ifsc_code')}
              placeholder="e.g. SBIN0001234"
              className="bg-muted uppercase"
            />
            {errors.ifsc_code && (
              <p className="text-xs text-destructive">{errors.ifsc_code.message}</p>
            )}
          </div>

          {/* UAN Number (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              UAN Number (Optional)
            </Label>
            <Input
              {...register('uan_number')}
              placeholder="If applicable"
              className="bg-muted"
            />
          </div>
        </div>

        {/* Hidden confirm field for schema validation - handled by useEffects above */}

        {/* Upload Cancelled Cheque / Passbook / Statement */}
        <div className="mt-5">
          <FileUploadField
            label="Upload Cancelled Cheque / Passbook / Statement"
            required
            accept=".svg,.png,.jpg,.jpeg,.pdf"
            helpText="SVG, PNG, JPG or PDF (max. 5MB)"
            value={watch('cheque_document_url')}
            onChange={(url) => setValue('cheque_document_url', url || '', { shouldValidate: true })}
            error={errors.cheque_document_url?.message}
          />
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
