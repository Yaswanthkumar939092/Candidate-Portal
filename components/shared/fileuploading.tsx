/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useFileUpload } from "@/lib/hooks/useFileUpload"


export const AttachField = ({ field, value, onChange, error, className }: any) => {
  const [fileName, setFileName] = useState("")
  const uploadMutation = useFileUpload()

  const handleFileUpload = (file: File | null) => {
    if (!file) {
      onChange(null)
      setFileName("")
      return
    }

    setFileName(file.name)

    uploadMutation.mutate(file, {
      onSuccess: (data: { file_url: string }) => {
        onChange(data.file_url) // ✅ IMPORTANT
      },
      onError: (err: Error) => {
        console.error(err)
      },
    })
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium text-foreground">
        {field.label} {!!(field.is_mandatory || field.reqd) && (
          <span className="text-destructive">*</span>
        )}
      </Label>

      <div className="rounded-[10px] border-2 border-dashed border-[#cbd5e1] overflow-hidden cursor-pointer">
        <label
          htmlFor={field.fieldname}
          className="flex items-center gap-2.5 px-0.5 py-3.5 cursor-pointer text-[#475569] text-[13px]"
        >
          <span>📎</span>
          {fileName || (value as string) || "Click to upload file"}
        </label>

        <input
          id={field.fieldname}
          type="file"
          className="hidden"
          onChange={(e) =>
            handleFileUpload(e.target.files?.[0] ?? null)
          }
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}