"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useJobApplicantDetails } from "@/lib/hooks/useApplicantStatus"
import { Loader2 } from "lucide-react"

interface ViewApplicationModalProps {
  jobApplicantName: string | null
  isOpen: boolean
  onClose: () => void
}

export function ViewApplicationModal({
  jobApplicantName,
  isOpen,
  onClose,
}: ViewApplicationModalProps) {
  const { data: response, isLoading, error } = useJobApplicantDetails(jobApplicantName)

  const applicantData = response?.data || {}

  // Fields to exclude from the dynamic display
  const excludeFields = [
    "name",
    "owner",
    "creation",
    "modified",
    "modified_by",
    "docstatus",
    "idx",
    "doctype",
  ]

  const formatLabel = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/custom /i, "")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const renderValue = (value: unknown) => {
    if (value === null || value === undefined) return "—"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (Array.isArray(value)) {
      if (value.length === 0) return "—"
      return (
        <div className="space-y-2 mt-2">
          {value.map((item, idx) => (
            <div key={idx} className="rounded-md border p-3 bg-muted/30 text-xs">
              {Object.entries(item)
                .filter(([k]) => !excludeFields.includes(k))
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-1 border-b last:border-0 border-border/50">
                    <span className="font-medium text-muted-foreground">{formatLabel(k)}</span>
                    <span className="text-foreground text-right">{renderValue(v)}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )
    }
    return String(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
            {jobApplicantName ? `Viewing application ${jobApplicantName}` : "Loading application..."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">
              Failed to load application details. Please try again.adasd
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {Object.entries(applicantData)
                .filter(([key, value]) => !excludeFields.includes(key) && typeof value !== 'object')
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-4 border-b border-border/50 pb-2 last:border-0">
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatLabel(key)}
                    </span>
                    <span className="text-sm text-foreground">
                      {renderValue(value)}
                    </span>
                  </div>
                ))}

              {/* Child Tables / Objects */}
              {Object.entries(applicantData)
                .filter(([key, value]) => !excludeFields.includes(key) && typeof value === 'object' && value !== null)
                .map(([key, value]) => (
                  <div key={key} className="space-y-2 pt-2">
                    <h4 className="text-sm font-semibold text-foreground border-l-2 border-primary pl-2">
                      {formatLabel(key)}
                    </h4>
                    <div className="text-sm text-foreground">
                      {renderValue(value)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
