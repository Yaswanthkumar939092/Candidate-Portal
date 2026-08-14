"use client"

import { useState,  useRef } from "react"
import {  Upload, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { useFileUpload } from "@/lib/hooks/useFileUpload"

interface RaiseRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: {
    requestType: string
    description: string
    attachment: string
  }) => void
}

/**
 * Centered dialog modal for submitting a new request.
 * Contains a Request Type dropdown, Description textarea, file upload,
 * and Cancel/Submit buttons.
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to toggle visibility
 * @param onSubmit - Callback with form data when submitted
 */
export function RaiseRequestDialog({
  open,
  onOpenChange,
  onSubmit,
}: RaiseRequestDialogProps) {
  const [requestType, setRequestType] = useState("")
  const [description, setDescription] = useState("")
  const [attachment, setAttachment] = useState("") // ✅ URL store hoga
  const [fileName, setFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const uploadMutation = useFileUpload()

  const resetForm = () => {
    setRequestType("")
    setDescription("")
    setAttachment("")
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
        attachment,
      })
      resetForm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleFileUpload = (file: File | null) => {
    if (!file) {
      setAttachment("")
      setFileName("")
      return
    }

    setError(null)

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    setFileName(file.name)

    uploadMutation.mutate(file, {
      onSuccess: (data: { file_url: string }) => {
        setAttachment(data.file_url) // ✅ payload ke liye URL
      },
      onError: (err: Error) => {
        console.error(err)
        setError("File upload failed")
      },
    })
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[480px] w-[calc(100%-2rem)] p-6 rounded-xl border border-slate-200 shadow-xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-[18px] font-bold text-slate-900 dark:text-gray-100 font-sans">Raise a Request</DialogTitle>
          <DialogDescription className="text-[14px] font-normal text-[#475467] dark:text-slate-400 mt-1.5 leading-snug">
            Submit a new request to the HR team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5.5">
          {/* Request Type */}
          <div className="space-y-2">
            <Label htmlFor="req-type" className="text-[14px] font-medium text-[#344054] dark:text-slate-300">
              Request Type <span className="text-[#F04438]">*</span>
            </Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger id="req-type" className="w-full text-slate-600 outline-none rounded-lg h-11 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-slate-100 shadow-xs px-3.5">
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
          <div className="space-y-[8px]">
            <Label htmlFor="req-description" className="text-[14px] font-medium text-[#344054] dark:text-slate-300">
              Description <span className="text-[#F04438]">*</span>
            </Label>
            <Textarea
              id="req-description"
              placeholder="Please describe your request in detail..."
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none rounded-lg border border-slate-200 dark:border-slate-800 outline-none p-3.5 text-sm placeholder:text-slate- focus:ring-4 focus:ring-slate-100 shadow-xs"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-[8px]">
  <Label className="text-[14px] font-medium text-[#344054] dark:text-slate-300">
    Attachments
  </Label>

  {/* ✅ hidden file input */}
  <input
    type="file"
    ref={fileInputRef}
    className="hidden"
    onChange={(e) =>
      handleFileUpload(e.target.files?.[0] || null)
    }
  />

  <div
    className="flex cursor-pointer flex-col items-center gap-[12px] rounded-lg border-dashed border-2 border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 px-6 py-8 text-center transition-colors shadow-xs"
    onClick={() => fileInputRef.current?.click()} // ✅ FIX
  >
    <div className="flex size-[42px] items-center justify-center rounded-full bg-[#F2F4F7] dark:bg-slate-800 border-[6px] box-content border-[#F9FAFB] dark:border-slate-900 mt-1">
      <Upload
        className="h-[18px] w-[18px] text-[#475467] dark:text-slate-400"
        strokeWidth={2.5}
      />
    </div>

    <div className="mb-1 space-y-1">
      <p className="text-[14px] text-[#101828] dark:text-slate-300 font-medium tracking-normal">
        <span className="font-medium text-[#2E90FA] hover:text-[#1849A9] transition-colors">
          Click to upload
        </span>{" "}
        or drag and drop
      </p>
      <p className="text-xs text-[#667085] dark:text-slate-400 font-medium">
        SVG, PNG, JPG or PDF (max. 5MB)
      </p>
    </div>
  </div>

  {/* ✅ Fix: attachments string hai to map hatao */}
  {attachment && (
  <div className="mt-3">
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "center" }}
      className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm w-full"
    >
      <span
        className="text-slate-700 font-medium text-xs truncate block min-w-0"
        title={fileName}
      >
        {fileName}
      </span>

      <button
        className="text-slate-400 hover:text-red-500 font-medium text-xs whitespace-nowrap flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          setAttachment("")
          setFileName("")
        }}
      >
        Remove
      </button>
    </div>
  </div>
)}
</div>

          {error && <p className="text-[13px] text-red-500 font-medium">{error}</p>}

          {/* Actions */}
          <hr className="border-slate-200 dark:border-slate-800 -mx-6 hidden" />
          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-[2px] justify-between sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto px-[18px] py-2.5 h-11 rounded-lg font-bold text-[#344054] hover:bg-slate-50 border border-slate-200 shadow-xs text-[14px]"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto px-[18px] py-2.5 h-11 rounded-lg font-bold bg-[#101828] hover:bg-[#101828]/90 text-white shadow-xs text-[14px]"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-[8px] h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
