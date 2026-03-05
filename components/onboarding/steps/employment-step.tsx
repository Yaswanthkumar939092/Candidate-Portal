"use client"

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
  employmentHistorySchema,
  type EmploymentHistoryData,
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

interface EmploymentStepProps {
  data?: Record<string, unknown>
  onChange?: (field: string, value: unknown) => void
  className?: string
}

/**
 * Step 7: Employment.
 *
 * Collects total experience, fresher status, previous annual CTC,
 * an "+ Add Employer" repeater, and a referral question about
 * relatives working at PW.
 */
export function EmploymentStep({ className }: EmploymentStepProps) {
  const { stepData, setStepData, saveDraft, nextStep, prevStep, markStepComplete, isSaving } =
    useOnboarding()
  const existingData = (stepData.employment_history ?? {}) as Partial<EmploymentHistoryData>

  const [hasRelativeAtPW, setHasRelativeAtPW] = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<EmploymentHistoryData>({
    resolver: zodResolver(employmentHistorySchema),
    defaultValues: {
      has_experience: false,
      experiences: [],
      referral_name: '',
      referral_employee_id: '',
      ...existingData,
    },
  })

  const { fields, append } = useFieldArray({
    control,
    name: 'experiences',
  })

  const isFresher = watch('has_experience') === false

  useEffect(() => {
    if (existingData && Object.keys(existingData).length > 0) {
      reset({
        has_experience: false,
        experiences: [],
        referral_name: '',
        referral_employee_id: '',
        ...existingData,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onNext = handleSubmit(async (data) => {
    setStepData('employment_history', data as unknown as Record<string, unknown>)
    markStepComplete('employment_history')
    await saveDraft().catch(() => {})
    nextStep()
  })

  return (
    <form onSubmit={onNext} className={cn("space-y-8", className)}>
      {/* Employment section */}
      <section>
        <h3 className="text-base font-bold text-foreground">Employment</h3>
        <Separator className="mt-2 mb-5" />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-3">
          {/* Total Experience (Years) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Total Experience (Years) <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder=""
              className="bg-muted"
            />
          </div>

          {/* Are you a Fresher? */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Are you a Fresher? <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch('has_experience') === false ? 'Yes' : watch('has_experience') === true ? 'No' : ''}
              onValueChange={(val) => {
                const isFresherVal = val === 'Yes'
                setValue('has_experience', !isFresherVal, { shouldValidate: true })
                if (!isFresherVal && fields.length === 0) {
                  append({
                    company: '',
                    designation: '',
                    from_date: '',
                    to_date: '',
                    is_current: false,
                    reason_for_leaving: '',
                  })
                }
              }}
            >
              <SelectTrigger className="w-full bg-muted">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Previous Annual CTC */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Previous Annual CTC
            </Label>
            <Input
              placeholder=""
              className="bg-muted"
            />
          </div>
        </div>

        {/* Add Employer link */}
        {!isFresher && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() =>
                append({
                  company: '',
                  designation: '',
                  from_date: '',
                  to_date: '',
                  is_current: false,
                  reason_for_leaving: '',
                })
              }
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add Employer
            </button>
          </div>
        )}

        {/* Employer entries (hidden if fresher) */}
        {!isFresher && fields.map((field, index) => (
          <div key={field.id} className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 rounded-lg border border-border p-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Company <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register(`experiences.${index}.company`)}
                placeholder=""
                className="bg-muted"
              />
              {errors.experiences?.[index]?.company && (
                <p className="text-xs text-destructive">{errors.experiences[index].company?.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Designation <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register(`experiences.${index}.designation`)}
                placeholder=""
                className="bg-muted"
              />
              {errors.experiences?.[index]?.designation && (
                <p className="text-xs text-destructive">{errors.experiences[index].designation?.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                From Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                {...register(`experiences.${index}.from_date`)}
                className="bg-muted"
              />
              {errors.experiences?.[index]?.from_date && (
                <p className="text-xs text-destructive">{errors.experiences[index].from_date?.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                To Date
              </Label>
              <Input
                type="date"
                {...register(`experiences.${index}.to_date`)}
                className="bg-muted"
              />
            </div>
          </div>
        ))}
      </section>

      {/* Referral section */}
      <section>
        <h3 className="text-base font-bold text-foreground">Referral</h3>
        <Separator className="mt-2 mb-5" />

        <div className="space-y-4">
          <Label className="text-sm font-medium text-foreground">
            Do you have any relatives working at PW?
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={hasRelativeAtPW === true ? "default" : "outline"}
              size="sm"
              onClick={() => setHasRelativeAtPW(true)}
              className={cn(
                "min-w-[60px]",
                hasRelativeAtPW === true && "bg-primary text-primary-foreground"
              )}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={hasRelativeAtPW === false ? "default" : "outline"}
              size="sm"
              onClick={() => setHasRelativeAtPW(false)}
              className={cn(
                "min-w-[60px]",
                hasRelativeAtPW === false && "bg-primary text-primary-foreground"
              )}
            >
              No
            </Button>
          </div>

          {hasRelativeAtPW && (
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Referral Name
                </Label>
                <Input
                  {...register('referral_name')}
                  placeholder="Name of the referring employee"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Referral Employee ID
                </Label>
                <Input
                  {...register('referral_employee_id')}
                  placeholder="Employee ID (if known)"
                  className="bg-muted"
                />
              </div>
            </div>
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
