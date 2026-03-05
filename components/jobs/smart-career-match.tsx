"use client"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  Rocket,
  CheckCircle2,
  Loader2,
  Brain,
  Target,
  TrendingUp,
  Lock,
  X,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/shared/circular-progress"
import { cn } from "@/lib/utils"

type AnalysisStep = "parsing" | "extracting" | "matching"

const ANALYSIS_STEPS: { key: AnalysisStep; label: string }[] = [
  { key: "parsing", label: "Parsing resume document" },
  { key: "extracting", label: "Extracting key skills" },
  { key: "matching", label: "Matching against job database" },
]

interface SmartCareerMatchProps {
  onAnalysisComplete?: (results: MatchedJob[]) => void
  className?: string
}

export interface MatchedJob {
  id: string
  title: string
  company: string
  location: string
  experience: string
  salary: string
  type: string
  skills: string[]
  matchPercentage: number
}

/**
 * Smart Career Match component with three visual states:
 * 1. Upload state -- drag/drop resume area with rocket icon
 * 2. Analyzing state -- circular progress with step checklist
 * 3. Triggers onAnalysisComplete callback with mock results
 */
export function SmartCareerMatch({
  onAnalysisComplete,
  className,
}: SmartCareerMatchProps) {
  const [state, setState] = useState<"upload" | "analyzing">("upload")
  const [currentStep, setCurrentStep] = useState<AnalysisStep | null>(null)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mockResults: MatchedJob[] = [
    {
      id: "1",
      title: "Senior Product Designer",
      company: "Physics Wallah",
      location: "Noida, India (Headquarters)",
      experience: "3-5 Years",
      salary: "8 - 12 LPA",
      type: "Full Time",
      skills: ["UI/UX Design", "Figma", "Design Systems"],
      matchPercentage: 92,
    },
    {
      id: "2",
      title: "Senior Product Designer",
      company: "Physics Wallah",
      location: "Noida, India (Headquarters)",
      experience: "3-5 Years",
      salary: "8 - 12 LPA",
      type: "Full Time",
      skills: ["Product Strategy", "Design Systems"],
      matchPercentage: 85,
    },
    {
      id: "3",
      title: "Senior Product Designer",
      company: "Physics Wallah",
      location: "Noida, India (Headquarters)",
      experience: "3-5 Years",
      salary: "8 - 12 LPA",
      type: "Full Time",
      skills: ["UI/UX Design", "Figma", "Design Systems"],
      matchPercentage: 78,
    },
  ]

  const runAnalysis = useCallback(async () => {
    setState("analyzing")
    setError(null)
    setProgress(0)

    // Step 1: Parsing
    setCurrentStep("parsing")
    await new Promise((r) => setTimeout(r, 1200))
    setProgress(45)

    // Step 2: Extracting
    setCurrentStep("extracting")
    await new Promise((r) => setTimeout(r, 1200))
    setProgress(72)

    // Step 3: Matching
    setCurrentStep("matching")
    await new Promise((r) => setTimeout(r, 1500))
    setProgress(86)

    // Complete
    await new Promise((r) => setTimeout(r, 500))
    onAnalysisComplete?.(mockResults)
  }, [onAnalysisComplete])

  const handleFileUpload = useCallback(
    async (file: File) => {
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]
      if (!allowed.includes(file.type)) {
        setError("Please upload a PDF, DOC, DOCX, or TXT file.")
        return
      }
      setError(null)
      setSelectedFile(file)
    },
    []
  )

  const startAnalysis = useCallback(async () => {
    if (!selectedFile) return
    await runAnalysis()
  }, [selectedFile, runAnalysis])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Upload State
  if (state === "upload") {
    return (
      <div className={cn("space-y-8", className)}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Smart Career Match
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload your resume and let our AI analyze your profile to find the
              perfect internal opportunities for you.
            </p>
          </div>
        </div>

        {/* Drop zone / Selected file */}
        {selectedFile ? (
          <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 px-6 py-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={removeSelectedFile}
              className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30"
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={openFilePicker}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop your resume here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload your CV (PDF, DOC) and let us AI analyze your profile to
                match you with the best opportunities.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {/* Analyze button */}
        {selectedFile && (
          <div className="flex justify-center">
            <Button onClick={startAnalysis} className="gap-2">
              <Rocket className="h-4 w-4" />
              Analyze Resume
            </Button>
          </div>
        )}

        {/* Bottom indicators */}
        <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            Skills Analysis
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Role Matching
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Gap Analysis
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>
            Powered by <span className="font-semibold">AI</span>
          </span>
          <span>&middot;</span>
          <button className="text-primary hover:underline">
            Privacy Policy
          </button>
        </div>
      </div>
    )
  }

  // Analyzing State
  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Smart Career Match
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload your resume and let our AI analyze your profile to find the
            perfect internal opportunities for you.
          </p>
        </div>
      </div>

      {/* Progress + Steps */}
      <div className="flex flex-col items-center gap-8 py-6 sm:flex-row sm:justify-center sm:gap-16">
        <CircularProgress value={progress} size={160} strokeWidth={8} />

        <div className="space-y-1">
          <h3 className="mb-3 text-base font-semibold text-foreground">
            Analyzing your profile...
          </h3>
          <div className="space-y-2.5">
            {ANALYSIS_STEPS.map((step) => {
              const stepIndex = ANALYSIS_STEPS.findIndex(
                (s) => s.key === step.key
              )
              const currentIndex = ANALYSIS_STEPS.findIndex(
                (s) => s.key === currentStep
              )
              const isComplete = stepIndex < currentIndex
              const isCurrent = step.key === currentStep

              return (
                <div
                  key={step.key}
                  className={cn(
                    "flex items-center gap-2.5 text-sm",
                    isComplete && "text-green-600",
                    isCurrent && "text-muted-foreground",
                    !isComplete && !isCurrent && "text-muted-foreground/50"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/30" />
                  )}
                  {step.label}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom indicators */}
      <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5" />
          Skills Analysis
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" />
          Role Matching
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Gap Analysis
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>
          Powered by <span className="font-semibold">AI</span>
        </span>
        <span>&middot;</span>
        <button className="text-primary hover:underline">Privacy Policy</button>
      </div>
    </div>
  )
}
