"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, FileText, Loader2, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResubmitButton } from "@/components/ui/field-renderer";

interface FileUploadFieldProps {
  label: string;
  required?: boolean;
  accept?: string;
  helpText?: string;
  value?: string | null;
  onChange?: (url: string | null) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
  isRejected?: boolean;
  hrComment?: string;
  isApproved?: boolean;
  fieldname?: string;
}

/**
 * A styled file upload field with drag-and-drop support.
 * Renders a dashed border upload area with an upload cloud icon,
 * matching the Physics Wallah onboarding design.
 *
 * @param label - The label text for the upload field
 * @param required - Whether the field is required (shows red asterisk)
 * @param accept - Accepted file types (default: images + PDF)
 * @param helpText - Helper text below the upload area
 * @param value - Current file or URL string
 * @param onChange - Callback when a file is selected or removed
 */
export function FileUploadField({
  label,
  required = false,
  accept = ".svg,.png,.jpg,.jpeg,.pdf",
  helpText = "SVG, PNG, JPG or PDF (max. 5MB)",
  value,
  onChange,
  disabled = false,
  error,
  className,
  isRejected = false,
  hrComment,
  isApproved = false,
  fieldname,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const { mutateAsync: uploadFile, isPending } = useFileUpload();

  const fileName =
    typeof value === "string" && value.length > 0
      ? value.split("/").pop() || value
      : null;

  const handleClick = () => {
    if (disabled || isPending) return;
    inputRef.current?.click();
  };

  const uploadAndSetFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      
      setInternalError(null);
      
      if (file.size > 5 * 1024 * 1024) {
        setInternalError("File size must be less than 5MB");
        return;
      }

      try {
        const response = await uploadFile(file);
        onChange?.(response.file_url);
      } catch (error) {
        console.error("Upload failed", error);
        setInternalError("Upload failed. Please try again.");
      }
    },
    [uploadFile, onChange],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    await uploadAndSetFile(file);
    // Reset input so the same file can be re-selected
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isPending) return;
    onChange?.(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || isPending) return;
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0] ?? null;
      if (file) {
        uploadAndSetFile(file);
      }
    },
    [disabled, isPending, uploadAndSetFile],
  );

  const renderTooltip = () => {
    if (isApproved) {
      return (
        <div className="flex items-center justify-center text-success" aria-label="Approved field">
          <Check className="h-5 w-5" />
        </div>
      );
    }
    if (!isRejected || !hrComment) return null;
    return (
      <div className="flex items-center gap-1.5">
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex cursor-help items-center justify-center text-destructive bg-transparent rounded-full z-10 transition-colors hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
              onClick={(e) => e.stopPropagation()}
              aria-label="Rejection reason"
            >
              <AlertCircle className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-62.5 whitespace-pre-wrap text-white font-medium bg-black"
          >
            <p>{hrComment}</p>
          </TooltipContent>
        </Tooltip>
        <ResubmitButton fieldname={fieldname} />
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive"> *</span>}
          </Label>
          {renderTooltip()}
        </div>

        {fileName ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer",
              isRejected
                ? "border-destructive bg-destructive/5"
                : isApproved
                  ? "border-success bg-success/5"
                  : "border-border bg-muted",
            )}
            onClick={handleClick}
          >
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <span className="flex-1 truncate text-sm text-foreground">
              {fileName}
            </span>
            {!(disabled || isPending) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={handleRemove}
                aria-label={`Remove ${label}`}
                disabled={disabled || isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition-colors overflow-hidden",
              isRejected
                ? "border-destructive bg-destructive/5 hover:border-destructive/80"
                : isApproved
                  ? "border-success bg-success/5 hover:border-success/80"
                  : isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/50",
              (disabled || isPending) &&
              "opacity-50 cursor-not-allowed hover:border-border hover:bg-card",
            )}
          >
            {isPending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm font-medium text-primary">
                  Uploading...
                </p>
              </div>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">{helpText}</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          aria-label={label}
        />

        {(error || internalError) && <p className="text-xs text-destructive">{error || internalError}</p>}
      </div>
    </TooltipProvider>
  );
}
