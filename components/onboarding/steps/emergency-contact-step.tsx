"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  emergencyContactsSchema,
  type EmergencyContactsData,
} from '@/lib/validation/onboarding-schemas'
import { useOnboarding } from '@/lib/contexts/onboarding-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const EMPTY_CONTACT = {
  name: '',
  relationship: '',
  phone_number: '',
  email: '',
  address: '',
}

const RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Spouse',
  'Sibling',
  'Friend',
  'Other',
]

interface EmergencyContactStepProps {
  data?: Record<string, unknown>
  onChange?: (field: string, value: unknown) => void
  className?: string
}

/**
 * Step 5: Emergency Contact.
 *
 * Collects emergency contact name, relationship (dropdown), and contact number.
 */
export function EmergencyContactStep({ className }: EmergencyContactStepProps) {
  const { stepData, setStepData, saveDraft, nextStep, prevStep, markStepComplete, isSaving } =
    useOnboarding()
  const existingData = (stepData.emergency_contacts ?? {}) as Partial<EmergencyContactsData>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<EmergencyContactsData>({
    resolver: zodResolver(emergencyContactsSchema),
    defaultValues: {
      contacts: existingData.contacts?.length ? existingData.contacts : [{ ...EMPTY_CONTACT }],
    },
  })

  useEffect(() => {
    if (existingData && existingData.contacts?.length) {
      reset({ contacts: existingData.contacts })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onNext = handleSubmit(async (data) => {
    setStepData('emergency_contacts', data as unknown as Record<string, unknown>)
    markStepComplete('emergency_contacts')
    await saveDraft().catch(() => {})
    nextStep()
  })

  return (
    <form onSubmit={onNext} className={cn("space-y-8", className)}>
      {/* Emergency Contact */}
      <section>
        <h3 className="text-base font-bold text-foreground">Emergency Contact</h3>
        <Separator className="mt-2 mb-5" />

        {/* Root-level array error */}
        {errors.contacts?.root && (
          <p className="text-xs text-destructive mb-4">{errors.contacts.root.message}</p>
        )}
        {typeof errors.contacts?.message === 'string' && (
          <p className="text-xs text-destructive mb-4">{errors.contacts.message}</p>
        )}

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
          {/* Emergency Contact Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Emergency Contact Name <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('contacts.0.name')}
              placeholder=""
              className="bg-muted"
            />
            {errors.contacts?.[0]?.name && (
              <p className="text-xs text-destructive">{errors.contacts[0].name?.message}</p>
            )}
          </div>

          {/* Relationship */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Relationship <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch('contacts.0.relationship') || ''}
              onValueChange={(val) =>
                setValue('contacts.0.relationship', val, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full bg-muted">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <SelectItem key={rel} value={rel}>
                    {rel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contacts?.[0]?.relationship && (
              <p className="text-xs text-destructive">{errors.contacts[0].relationship?.message}</p>
            )}
          </div>
        </div>

        {/* Contact Number */}
        <div className="mt-5 max-w-md space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Contact Number <span className="text-destructive">*</span>
          </Label>
          <Input
            {...register('contacts.0.phone_number')}
            placeholder=""
            className="bg-muted"
          />
          {errors.contacts?.[0]?.phone_number && (
            <p className="text-xs text-destructive">{errors.contacts[0].phone_number?.message}</p>
          )}
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
