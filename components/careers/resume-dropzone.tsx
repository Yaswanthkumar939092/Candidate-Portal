"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { loginHref, RESUME_CONTINUE_PATH } from "@/lib/careers/login-redirect";
import { ACCEPTED_RESUME_TYPES, savePendingResume } from "@/lib/careers/pending-resume";

interface ResumeDropzoneProps {
  title?: string;
  hint?: string;
  className?: string;
}

/**
 * Drop or pick a resume. The file is parked for after login and the visitor is
 * sent straight to the login page, which returns them to the portal resume matcher.
 */
export function ResumeDropzone({
  title = "Drop your resume here or click to browse",
  hint = "PDF, DOC, DOCX or TXT. You'll be asked to log in next.",
  className,
}: ResumeDropzoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (file: File | undefined) => {
    if (!file || busy) return;
    if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
      setError("Upload a PDF, DOC, DOCX or TXT file.");
      return;
    }
    setError(null);
    setBusy(true);
    await savePendingResume(file);
    router.push(loginHref(RESUME_CONTINUE_PATH));
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        data-testid="resume-input"
        onChange={(e) => submit(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          submit(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:bg-accent",
          dragging && "border-primary bg-accent",
        )}
      >
        {busy ? (
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
        <span className="text-sm font-medium text-foreground">{busy ? "Taking you to login…" : title}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
