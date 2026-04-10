"use client"

import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { educationSchema, type EducationData } from '@/lib/validation/onboarding-schemas'
import { useOnboarding } from '@/lib/contexts/onboarding-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUploadField } from '@/components/onboarding/file-upload-field'
import { cn } from '@/lib/utils'

const EMPTY_QUALIFICATION = {
  educational_category: '',
  course_type: '',
  university: '',
  degree: '',
  institution: '',
  start_date: '',
  end_date: '',
  registration_number: '',
  mode_of_learning: '',
  is_currently_pursuing: false,
  percentage_or_cgpa: '',
  specialization: '',
  document_url: '',
}

const EDUCATION_CATEGORIES = [
  '10th / SSC',
  '12th / HSC',
  'Diploma',
  'Graduation',
  'Post Graduation',
  'Doctorate',
  'Other',
]

const COURSE_TYPES = [
  'Full Time',
  'Part Time',
  'Distance / Correspondence',
]

const MODE_OF_LEARNING = [
  'Regular',
  'Online',
  'Distance',
  'Hybrid',
]

interface EducationStepProps {
  data?: Record<string, unknown>
  onChange?: (field: string, value: unknown) => void
  className?: string
}

/**
 * Step 6: Education.
 *
 * Collects education details in a grid layout with education category,
 * degree, specialization, course type, institute, university/board,
 * marks/CGPA, dates, registration number, mode of learning,
 * currently pursuing toggle, marksheet upload, and ability to add
 * more qualifications.
 */
export function EducationStep({ className }: EducationStepProps) {
  const { stepData, setStepData, saveDraft, nextStep, prevStep, markStepComplete, isSaving } =
    useOnboarding()
  const existingData = (stepData.education ?? {}) as Partial<EducationData>

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<EducationData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      qualifications: existingData.qualifications?.length
        ? existingData.qualifications
        : [{ ...EMPTY_QUALIFICATION }],
    },
  })

  const { fields, append } = useFieldArray({
    control,
    name: 'qualifications',
  })

  useEffect(() => {
    if (existingData && existingData.qualifications?.length) {
      reset({ qualifications: existingData.qualifications })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onNext = handleSubmit(async (data) => {
    setStepData('education', data as unknown as Record<string, unknown>)
    markStepComplete('education')
    await saveDraft().catch(() => {})
    nextStep()
  })

  return (
    <form onSubmit={onNext} className={cn("space-y-8", className)}>
      {/* Root-level array error */}
      {errors.qualifications?.root && (
        <p className="text-xs text-destructive">{errors.qualifications.root.message}</p>
      )}
      {typeof errors.qualifications?.message === 'string' && (
        <p className="text-xs text-destructive">{errors.qualifications.message}</p>
      )}

      {fields.map((field, index) => (
        <section key={field.id}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Education Details</h3>
            {index === 0 && (
              <span className="text-xs text-muted-foreground italic">
                In ascending order
              </span>
            )}
          </div>
          <Separator className="mt-2 mb-5" />

          <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-3">
            {/* Education Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Education Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch(`qualifications.${index}.educational_category`) || ""}
                onValueChange={(value) => setValue(`qualifications.${index}.educational_category`, value, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full bg-muted">
                  <SelectValue placeholder="Select education category" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.qualifications?.[index]?.educational_category && (
                <p className="text-xs text-destructive">
                  {errors.qualifications[index].educational_category?.message}
                </p>
              )}
            </div>

            {/* Degree / Qualification */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Degree / Qualification <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register(`qualifications.${index}.degree`)}
                placeholder=""
                className="bg-muted"
              />
              {errors.qualifications?.[index]?.degree && (
                <p className="text-xs text-destructive">
                  {errors.qualifications[index].degree?.message}
                </p>
              )}
            </div>

            {/* Field of Specialization */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Field of Specialization
              </Label>
              <Input
                {...register(`qualifications.${index}.specialization`)}
                placeholder=""
                className="bg-muted"
              />
            </div>

            {/* Course Type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Course Type
              </Label>
              <Select
                value={watch(`qualifications.${index}.course_type`) || ""}
                onValueChange={(value) => setValue(`qualifications.${index}.course_type`, value, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full bg-muted">
                  <SelectValue placeholder="Select course type" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {ct}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Institute Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Institute Name <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register(`qualifications.${index}.institution`)}
                placeholder=""
                className="bg-muted"
              />
              {errors.qualifications?.[index]?.institution && (
                <p className="text-xs text-destructive">
                  {errors.qualifications[index].institution?.message}
                </p>
              )}
            </div>

            {/* University / Board */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                University / Board
              </Label>
              <Input
                {...register(`qualifications.${index}.university`)}
                placeholder="Enter university or board name"
                className="bg-muted"
              />
            </div>

            {/* Marks / CGPA */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Marks / CGPA
              </Label>
              <Input
                {...register(`qualifications.${index}.percentage_or_cgpa`)}
                placeholder=""
                className="bg-muted"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Start Date
              </Label>
              <Input
                type="date"
                className="bg-muted"
                {...register(`qualifications.${index}.start_date`)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                End Date
              </Label>
              <Input
                type="date"
                className="bg-muted"
                {...register(`qualifications.${index}.end_date`)}
              />
            </div>

            {/* Registration Number */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Registration Number
              </Label>
              <Input
                {...register(`qualifications.${index}.registration_number`)}
                placeholder="Enter registration number"
                className="bg-muted"
              />
            </div>

            {/* Mode of Learning */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Mode of Learning
              </Label>
              <Select
                value={watch(`qualifications.${index}.mode_of_learning`) || ""}
                onValueChange={(value) => setValue(`qualifications.${index}.mode_of_learning`, value, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full bg-muted">
                  <SelectValue placeholder="Select mode of learning" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OF_LEARNING.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>



          {/* Currently Pursuing + Upload */}
          <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
            {/* Currently Pursuing */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Currently Pursuing?
              </Label>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id={`currently_pursuing_${index}`}
                  checked={watch(`qualifications.${index}.is_currently_pursuing`) || false}
                  onCheckedChange={(checked) => setValue(`qualifications.${index}.is_currently_pursuing`, checked === true, { shouldValidate: true })}
                />
                <Label
                  htmlFor={`currently_pursuing_${index}`}
                  className="cursor-pointer text-sm font-normal text-muted-foreground"
                >
                  Yes, I am currently pursuing this
                </Label>
              </div>
            </div>

            {/* Upload Marksheet / Degree */}
            <FileUploadField
              label="Upload Marksheet / Degree"
              accept=".svg,.png,.jpg,.jpeg,.pdf"
              helpText="SVG, PNG, JPG or PDF (max. 5MB)"
              value={watch(`qualifications.${index}.document_url`)}
              onChange={(url) => setValue(`qualifications.${index}.document_url`, url || '', { shouldValidate: true })}
            />
          </div>
        </section>
      ))}

      {/* Add Another Qualification button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ ...EMPTY_QUALIFICATION })}
        className="w-full border-primary text-primary hover:bg-primary/5"
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Another Qualification
      </Button>

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
