"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/shared/circular-progress"
import { cn } from "@/lib/utils"
import { useJobOpening } from "@/lib/hooks/useJobOpening"

// ---------------- TYPES ----------------
export interface MatchedJob {
  upper_range: null
  lower_range: null
  custom_qualifications: never[]
  id: string
  title: string
  company: string
  location: string
  experience: string
  salary: string
  type: string
  skills: string[]
  matchPercentage: number
  description: string
  status: string
}

interface FrappeJobOpening {
  name: string
  job_title: string
  designation?: string
  company: string
  location?: string
  custom_work_experience?: string
  custom_salary?: string
  employment_type?: string
  description: string
  status: string
  skills_required?: string
}

interface Props {
  onAnalysisComplete?: (results: MatchedJob[]) => void
  className?: string
}

// ---------------- SKILL DICTIONARY ----------------
const SKILLS = [
  "react", "next", "javascript", "typescript",
  "html", "css", "tailwind", "node", "express",
  "mongodb", "mysql", "python", "django",
  "flask", "git", "github", "api", "redux"
]

// ---------------- COMPONENT ----------------
export function SmartCareerMatch({ onAnalysisComplete, className }: Props) {
  const [state, setState] = useState<"upload" | "analyzing">("upload")
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: jobOpenings } = useJobOpening({ page: 1, limit: 50 })

  // ---------------- API ----------------
  const extractTextFromAPI = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/parse-resume", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()
    return data.text || ""
  }

  // ---------------- CLEAN TEXT ----------------
  const cleanText = (text: string) => {
    return text
      .replace(/\u0000/g, " ") // remove null chars
      .replace(/([a-z])([A-Z])/g, "$1 $2") // ReactNext → React Next
      .replace(/[^a-zA-Z0-9+#. ]/g, " ")
      .toLowerCase()
  }

  // ---------------- EXTRACT SKILLS ----------------
  const extractSkills = (text: string) => {
    const cleaned = cleanText(text)

    return SKILLS.filter(skill => cleaned.includes(skill))
  }

  const extractSkillsFromJob = (job: FrappeJobOpening) => {
    const text = cleanText(`
      ${job.job_title}
      ${job.description}
      ${job.skills_required || ""}
    `)

    return SKILLS.filter(skill => text.includes(skill))
  }

  // ---------------- MATCH ----------------
  const getMatchScore = (candidateSkills: string[], jobSkills: string[]) => {
    if (!jobSkills.length) return 0

    const matched = jobSkills.filter(skill =>
      candidateSkills.includes(skill)
    )

    return Math.round((matched.length / jobSkills.length) * 100)
  }

  // ---------------- MAIN ----------------
  const runAnalysis = useCallback(async () => {
    if (!selectedFile) return

    setState("analyzing")
    setProgress(20)

    const rawText = await extractTextFromAPI(selectedFile)
    const text = cleanText(rawText)

    setProgress(50)

    const jobs = Array.isArray(jobOpenings)
      ? jobOpenings
      : (jobOpenings?.data ?? [])

    if (!jobs.length) {
      setError("No jobs available")
      return
    }

    // 🔥 Candidate Skills
    const candidateSkills = extractSkills(text)

    console.log("✅ Clean Resume Text:", text)
    console.log("✅ Candidate Skills:", candidateSkills)

    setProgress(75)

    const results: MatchedJob[] = jobs.map((job: FrappeJobOpening) => {
      const jobSkills = extractSkillsFromJob(job)
      const match = getMatchScore(candidateSkills, jobSkills)

      console.log("JOB:", job.job_title, {
        jobSkills,
        match
      })

      return {
        id: job.name,
        title: job.job_title || job.designation,
        company: job.company,
        location: job.location || "Not specified",
        experience: job.custom_work_experience,
        salary: job.custom_salary || "Not disclosed",
        type: job.employment_type || "Full-time",
        skills: jobSkills,
        matchPercentage: match,
        description: job.description,
        status: job.status,
      }
    })

    // ✅ KEEP ALL (no aggressive filter)
    const sorted = results.sort(
      (a, b) => b.matchPercentage - a.matchPercentage
    )

    setProgress(100)

    onAnalysisComplete?.(sorted)
  }, [selectedFile, jobOpenings, onAnalysisComplete])

  // ---------------- FILE ----------------
  const handleFileUpload = (file: File) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowed.includes(file.type)) {
      setError("Upload PDF/DOC/TXT")
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  // ---------------- UI ----------------
  if (state === "upload") {
    return (
      <div className={cn("space-y-8", className)}>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) =>
            e.target.files?.[0] &&
            handleFileUpload(e.target.files[0])
          }
        />

        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-6 py-12 text-center"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-6 w-6" />
          <p>Drop your resume here</p>
        </div>

        {selectedFile && (
          <div className="flex justify-center">
            <Button onClick={runAnalysis}>
              <Rocket className="h-4 w-4 mr-2" />
              Analyze Resume
            </Button>
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-8 text-center">
      <CircularProgress value={progress} />
      <p>Analyzing resume...</p>
    </div>
  )
}