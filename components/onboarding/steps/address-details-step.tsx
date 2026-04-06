"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addressDetailsSchema, type AddressDetailsData } from '@/lib/validation/onboarding-schemas'
import { useOnboarding } from '@/lib/contexts/onboarding-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FileUploadField } from '@/components/onboarding/file-upload-field'
import { cn } from '@/lib/utils'

const DEFAULT_ADDRESS = {
  flat_house_wing: '',
  street_locality_area: '',
  landmark: '',
  city: '',
  state: '',
  pin_code: '',
  country: 'India',
}

interface AddressDetailsStepProps {
  data?: Record<string, unknown>
  onChange?: (field: string, value: unknown) => void
  className?: string
}

/**
 * Step 2: Address Details.
 *
 * Collects current address, address proof upload, a "Same as Current Address"
 * link/toggle, and permanent address fields.
 */
export function AddressDetailsStep({ className }: AddressDetailsStepProps) {
  const { stepData, setStepData, saveDraft, nextStep, prevStep, markStepComplete, isSaving } =
    useOnboarding()
  const existingData = (stepData.address ?? {}) as Partial<AddressDetailsData>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AddressDetailsData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addressDetailsSchema) as any,
    defaultValues: {
      current_address: { ...DEFAULT_ADDRESS },
      same_as_current: false,
      permanent_address: { ...DEFAULT_ADDRESS },
      ...existingData,
    },
  })

  useEffect(() => {
    if (existingData && Object.keys(existingData).length > 0) {
      reset({
        current_address: { ...DEFAULT_ADDRESS },
        same_as_current: false,
        permanent_address: { ...DEFAULT_ADDRESS },
        ...existingData,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sameAsCurrent = watch('same_as_current')
  const currentAddress = watch('current_address')

  useEffect(() => {
    if (sameAsCurrent && currentAddress) {
      setValue('permanent_address', { ...currentAddress })
    }
  }, [sameAsCurrent, currentAddress, setValue])

  const handleSameAsCurrentToggle = () => {
    const newValue = !sameAsCurrent
    setValue('same_as_current', newValue, { shouldValidate: true })
    if (newValue) {
      setValue('permanent_address', { ...watch('current_address') })
    }
  }

  const onNext = handleSubmit(async (data) => {
    setStepData('address', data as unknown as Record<string, unknown>)
    markStepComplete('address')
    await saveDraft().catch(() => { })
    nextStep()
  })

  const renderAddressFields = (prefix: 'current_address' | 'permanent_address', disabled = false) => {
    const e = prefix === 'current_address' ? errors.current_address : errors.permanent_address

    return (
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
        {/* Flat / House / Wing */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Flat / House / Wing
          </Label>
          <Input
            {...register(`${prefix}.flat_house_wing`)}
            placeholder=""
            className="bg-muted"
            disabled={disabled}
          />
        </div>

        {/* Street / Locality / Area */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Street / Locality / Area <span className="text-destructive">*</span>
          </Label>
          <Input
            {...register(`${prefix}.street_locality_area`)}
            placeholder=""
            className="bg-muted"
            disabled={disabled}
          />
          {e?.street_locality_area && <p className="text-xs text-destructive">{e.street_locality_area.message}</p>}
        </div>

        {/* Landmark */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Landmark
          </Label>
          <Input
            {...register(`${prefix}.landmark`)}
            placeholder=""
            className="bg-muted"
            disabled={disabled}
          />
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            {...register(`${prefix}.city`)}
            placeholder=""
            className="bg-muted"
            disabled={disabled}
          />
          {e?.city && <p className="text-xs text-destructive">{e.city.message}</p>}
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            State <span className="text-destructive">*</span>
          </Label>
          <Input
            {...register(`${prefix}.state`)}
            placeholder=""
            className="bg-muted"
            disabled={disabled}
          />
          {e?.state && <p className="text-xs text-destructive">{e.state.message}</p>}
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Country <span className="text-destructive">*</span>
          </Label>
          <Input
            {...register(`${prefix}.country`)}
            placeholder=""
            className="bg-muted"
            disabled={disabled}
          />
          {e?.country && <p className="text-xs text-destructive">{e.country.message}</p>}
        </div>

        {/* Pincode */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Pincode <span className="text-destructive">*</span>
          </Label>
          <Input
            {...register(`${prefix}.pin_code`)}
            placeholder=""
            maxLength={6}
            className="bg-muted"
            disabled={disabled}
          />
          {e?.pin_code && <p className="text-xs text-destructive">{e.pin_code.message}</p>}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onNext} className={cn("space-y-8", className)}>
      {/* Current Address */}
      <section>
        <h3 className="text-base font-bold text-foreground">Current Address</h3>
        <Separator className="mt-2 mb-5" />
        {renderAddressFields('current_address')}

        {/* Upload Address Proof */}
        <div className="mt-5">
          <FileUploadField
            label="Upload Address Proof"
            required
            accept=".svg,.png,.jpg,.jpeg,.pdf"
            helpText="SVG, PNG, JPG or PDF (max. 5MB)"
            value={watch('address_proof_url')}
            onChange={(url) => setValue('address_proof_url', url || '', { shouldValidate: true })}
            error={errors.address_proof_url?.message}
          />
        </div>
      </section>

      {/* Same as Permanent Address link */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSameAsCurrentToggle}
          className={cn(
            "text-sm underline transition-colors",
            sameAsCurrent ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"
          )}
        >
          {sameAsCurrent ? "Addresses are the same (click to unlink)" : "Same as Permanent Address"}
        </button>
      </div>

      {/* Permanent Address */}
      <section>
        <h3 className="text-base font-bold text-foreground">Permanent Address</h3>
        <Separator className="mt-2 mb-5" />
        {renderAddressFields('permanent_address', sameAsCurrent)}
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
