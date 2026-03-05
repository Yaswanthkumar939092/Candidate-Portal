"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight } from 'lucide-react'
import { personalInfoSchema, type PersonalInfoData } from '@/lib/validation/onboarding-schemas'
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
import { FileUploadField } from '@/components/onboarding/file-upload-field'
import { cn } from '@/lib/utils'

interface PersonalInfoStepProps {
  data?: Record<string, unknown>
  onChange?: (field: string, value: unknown) => void
  className?: string
}

/**
 * Step 1: Personal Information.
 *
 * Collects basic personal details, demographics, family details,
 * and file uploads (resume + passport photo) matching the PW design.
 */
export function PersonalInfoStep({ className }: PersonalInfoStepProps) {
  const { stepData, setStepData, saveDraft, nextStep, markStepComplete, isSaving } = useOnboarding()
  const existingData = (stepData.personal_info ?? {}) as Partial<PersonalInfoData> & Record<string, unknown>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PersonalInfoData & Record<string, unknown>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: undefined,
      blood_group: '',
      marital_status: undefined,
      nationality: '',
      phone: '',
      personal_email: '',
      photo_url: '',
      family_members: [],
      ...existingData,
    },
  })

  useEffect(() => {
    if (existingData && Object.keys(existingData).length > 0) {
      reset({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: undefined,
        blood_group: '',
        marital_status: undefined,
        nationality: '',
        phone: '',
        personal_email: '',
        photo_url: '',
        family_members: [],
        ...existingData,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onNext = handleSubmit(async (data) => {
    setStepData('personal_info', data as unknown as Record<string, unknown>)
    markStepComplete('personal_info')
    await saveDraft().catch(() => {})
    nextStep()
  })

  return (
    <form onSubmit={onNext} className={cn("space-y-8", className)}>
      {/* Section: Basic Details */}
      <section>
        <h3 className="text-base font-bold text-foreground">Basic Details</h3>
        <Separator className="mt-2 mb-5" />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-3">
          {/* First Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('first_name')}
              placeholder="Ex. Rahul"
              className="bg-muted"
            />
            {errors.first_name && (
              <p className="text-xs text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          {/* Middle Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Middle Name
            </Label>
            <Input
              {...register('nationality')}
              placeholder="Ex. Kumar"
              className="bg-muted"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('last_name')}
              placeholder="Ex. Sharma"
              className="bg-muted"
            />
            {errors.last_name && (
              <p className="text-xs text-destructive">{errors.last_name.message}</p>
            )}
          </div>

          {/* Personal Email ID */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Personal Email ID <span className="text-destructive">*</span>
            </Label>
            <Input
              type="email"
              {...register('personal_email')}
              placeholder="rahul@example.com"
              className="bg-muted"
            />
            {errors.personal_email && (
              <p className="text-xs text-destructive">{errors.personal_email.message}</p>
            )}
          </div>

          {/* Primary Contact Number */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Primary Contact Number <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('phone')}
              placeholder="+91 98765 43210"
              className="bg-muted"
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Office Mobile Number */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Office Mobile Number
            </Label>
            <Input
              placeholder="Optional"
              className="bg-muted"
              disabled
            />
          </div>

          {/* Date of Joining */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Date of Joining <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              className="bg-muted"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              {...register('date_of_birth')}
              className="bg-muted"
            />
            {errors.date_of_birth && (
              <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Section: Demographics */}
      <section>
        <h3 className="text-base font-bold text-foreground">Demographics</h3>
        <Separator className="mt-2 mb-5" />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
          {/* Gender */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch('gender') || ''}
              onValueChange={(val) =>
                setValue('gender', val as PersonalInfoData['gender'], { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full bg-muted">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-xs text-destructive">{errors.gender.message}</p>
            )}
          </div>

          {/* Marital Status */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Marital Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch('marital_status') || ''}
              onValueChange={(val) =>
                setValue('marital_status', val as PersonalInfoData['marital_status'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full bg-muted">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Blood Group */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Blood Group
            </Label>
            <Select
              value={watch('blood_group') || ''}
              onValueChange={(val) => setValue('blood_group', val)}
            >
              <SelectTrigger className="w-full bg-muted">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Languages Known */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Languages Known
            </Label>
            <Input
              placeholder="English, Hindi, etc."
              className="bg-muted"
            />
          </div>
        </div>
      </section>

      {/* Section: Family Details */}
      <section>
        <h3 className="text-base font-bold text-foreground">Family Details</h3>
        <Separator className="mt-2 mb-5" />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
          {/* Father's Full Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Father&apos;s Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              className="bg-muted"
              placeholder=""
            />
          </div>

          {/* Mother's Full Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Mother&apos;s Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              className="bg-muted"
              placeholder=""
            />
          </div>

          {/* Spouse Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Spouse Name
            </Label>
            <Input
              placeholder="Optional"
              className="bg-muted"
            />
          </div>

          {/* Children */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Children
            </Label>
            <Input
              placeholder="Optional"
              className="bg-muted"
            />
          </div>
        </div>
      </section>

      {/* Section: Uploads */}
      <section>
        <h3 className="text-base font-bold text-foreground">Uploads</h3>
        <Separator className="mt-2 mb-5" />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
          <FileUploadField
            label="Upload Resume"
            required
            accept=".svg,.png,.jpg,.jpeg,.pdf"
            helpText="SVG, PNG, JPG or PDF (max. 5MB)"
          />
          <FileUploadField
            label="Upload Passport Size Photo"
            required
            accept=".svg,.png,.jpg,.jpeg,.pdf"
            helpText="SVG, PNG, JPG or PDF (max. 5MB)"
          />
        </div>
      </section>

      {/* Navigation */}
      <Separator />
      <div className="flex items-center justify-end pt-2">
        <Button type="submit" disabled={isSaving}>
          Next Step
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
