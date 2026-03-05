"use client"

import { useState, useCallback } from "react"
import { Plus, Upload, Loader2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RaiseRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: {
    requestType: string
    description: string
    attachments: File[]
  }) => void
}

/**
 * Right-side sheet/panel form for submitting a new request.
 * Contains a Request Type dropdown, Description textarea, file upload,
 * and Cancel/Submit buttons.
 *
 * @param open - Whether the sheet is open
 * @param onOpenChange - Callback to toggle sheet visibility
 * @param onSubmit - Callback with form data when submitted
 */
export function RaiseRequestDialog({
  open,
  onOpenChange,
  onSubmit,
}: RaiseRequestDialogProps) {
  const [requestType, setRequestType] = useState("")
  const [description, setDescription] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setRequestType("")
    setDescription("")
    setAttachments([])
    setError(null)
  }

  const handleSubmit = async () => {
    if (!requestType) {
      setError("Request type is required.")
      return
    }
    if (!description.trim()) {
      setError("Description is required.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      onSubmit?.({
        requestType,
        description: description.trim(),
        attachments,
      })
      resetForm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from(
        (e.target as HTMLInputElement).files ?? []
      )
      setAttachments((prev) => [...prev, ...files])
    }
    input.click()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) resetForm()
      }}
    >
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Raise a Request</SheetTitle>
          <SheetDescription className="sr-only">
            Submit a new request to your admin team
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Request Type */}
          <div className="space-y-2">
            <Label htmlFor="req-type">
              Request Type <span className="text-destructive">*</span>
            </Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger id="req-type" className="w-full">
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="document">Document Request</SelectItem>
                <SelectItem value="leave">Leave Request</SelectItem>
                <SelectItem value="salary">Salary Related</SelectItem>
                <SelectItem value="joining_date">
                  Extension of Joining Date
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="req-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="req-description"
              placeholder="Describe your request in detail..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-6 text-center transition-colors hover:border-primary/50"
              onClick={handleFileSelect}
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Click to{" "}
                  <span className="font-medium text-primary">upload</span> or
                  drag and drop
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  jpg, jpeg, pdf or file max 3MB
                </p>
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-xs"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
