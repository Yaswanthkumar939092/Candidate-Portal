"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignatureMethod = "Drawn" | "Uploaded";

export interface SignatureValue {
  /** A `data:image/...` URL - sent as-is with the acceptance. */
  dataUrl: string;
  method: SignatureMethod;
}

interface SignatureCaptureProps {
  allowDraw: boolean;
  allowUpload: boolean;
  value: SignatureValue | null;
  onChange: (value: SignatureValue | null) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
// The backend refuses anything much past this; say so before the upload.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Draw-or-upload signature box for accepting an offer.
 *
 * Which of the two is offered comes from Recruitment Settings (via the offer
 * summary). The result is a data URL that travels with `job_offer_update`; the
 * backend crops, scales and stores it on the Job Offer, so nothing is uploaded
 * as a File here.
 */
export function SignatureCapture({
  allowDraw,
  allowUpload,
  value,
  onChange,
  disabled = false,
}: SignatureCaptureProps) {
  const [mode, setMode] = useState<SignatureMethod>(
    allowDraw ? "Drawn" : "Uploaded",
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const switchMode = (next: SignatureMethod) => {
    if (next === mode) return;
    setMode(next);
    setUploadError(null);
    onChange(null);
  };

  return (
    <div className="mb-4 rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[0.85rem] font-semibold text-foreground">
          Your signature
        </span>
        {allowDraw && allowUpload && (
          <div
            role="tablist"
            aria-label="Signature method"
            className="inline-flex rounded-md border border-border p-0.5 text-[0.75rem]"
          >
            {(["Drawn", "Uploaded"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                disabled={disabled}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "Drawn" ? (
                  <PenLine className="h-3.5 w-3.5" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {m === "Drawn" ? "Draw" : "Upload"}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === "Drawn" ? (
        <SignaturePad
          disabled={disabled}
          onChange={(dataUrl) =>
            onChange(dataUrl ? { dataUrl, method: "Drawn" } : null)
          }
        />
      ) : (
        <SignatureUpload
          disabled={disabled}
          value={value?.method === "Uploaded" ? value.dataUrl : null}
          error={uploadError}
          onError={setUploadError}
          onChange={(dataUrl) =>
            onChange(dataUrl ? { dataUrl, method: "Uploaded" } : null)
          }
        />
      )}

      <p className="mt-2 text-[0.75rem] text-muted-foreground">
        This signature will appear on your offer letter.
      </p>
    </div>
  );
}

function SignaturePad({
  disabled,
  onChange,
}: {
  disabled: boolean;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  // Size the backing store to the element and the screen's pixel ratio, so the
  // stroke is crisp and pointer coordinates map 1:1.
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    setHasInk(false);
    onChange(null);
  }, [onChange]);

  useEffect(() => {
    resize();
    // Resizing clears the canvas, so only redo it when the width really changes
    // (mobile browsers fire resize on scroll as the toolbar hides).
    let width = canvasRef.current?.getBoundingClientRect().width;
    const onResize = () => {
      const next = canvasRef.current?.getBoundingClientRect().width;
      if (next !== width) {
        width = next;
        resize();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    const ctx = e.currentTarget.getContext("2d");
    if (ctx && last.current) {
      // A tap leaves a dot.
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = "#111827";
      ctx.fill();
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    setHasInk(true);
    onChange(canvasRef.current?.toDataURL("image/png") ?? null);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setHasInk(false);
    onChange(null);
  };

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          aria-label="Draw your signature"
          className={cn(
            "block h-32 w-full touch-none rounded-md border border-dashed border-foreground/30 bg-white",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[0.8rem] text-muted-foreground">
            Sign here
          </span>
        )}
      </div>
      <div className="mt-1.5 flex justify-end">
        <button
          type="button"
          onClick={clear}
          disabled={disabled || !hasInk}
          className="flex items-center gap-1 text-[0.75rem] font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
    </div>
  );
}

function SignatureUpload({
  disabled,
  value,
  error,
  onError,
  onChange,
}: {
  disabled: boolean;
  value: string | null;
  error: string | null;
  onError: (message: string | null) => void;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    onError(null);
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError("Please choose a PNG or JPG image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      onError("The image is larger than 5 MB. Please choose a smaller one.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      onChange(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => onError("Could not read that image. Please try another.");
    reader.readAsDataURL(file);
  };

  const remove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {value ? (
        <div className="relative flex h-32 items-center justify-center rounded-md border border-border bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Your uploaded signature"
            className="max-h-full max-w-full object-contain"
          />
          <button
            type="button"
            onClick={remove}
            disabled={disabled}
            aria-label="Remove signature"
            className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1 text-muted-foreground shadow-sm hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-foreground/30 text-[0.8rem] text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-5 w-5" />
          <span>Upload an image of your signature</span>
          <span className="text-[0.7rem]">PNG or JPG, up to 5 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {error && (
        <p className="mt-1.5 text-[0.75rem] text-destructive">{error}</p>
      )}
    </div>
  );
}
