"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/shared/circular-progress"
import { cn } from "@/lib/utils"

// ---------------- TYPES ----------------
export interface MatchedJob {
  upper_range?: number | null
  lower_range?: number | null
  custom_qualifications?: string[]
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
  applied?: boolean
  saved?: boolean
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

  // ---------------- MAIN ----------------
  const runAnalysis = useCallback(async () => {
    if (!selectedFile) return

    setState("analyzing")
    setProgress(20)

    const rawText = await extractTextFromAPI(selectedFile)
    const text = cleanText(rawText)

    setProgress(50)

    // 🔥 Candidate Skills
    const candidateSkills = extractSkills(text)

    console.log("✅ Clean Resume Text:", text)
    console.log("✅ Candidate Skills:", candidateSkills)

    setProgress(100)

    onAnalysisComplete?.([])
  }, [selectedFile, onAnalysisComplete])

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