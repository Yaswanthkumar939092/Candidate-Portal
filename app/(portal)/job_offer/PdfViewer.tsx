"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface PdfViewerProps {
  pdfUrl: string;
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIframeSrc(null);
    setIsLoading(Boolean(pdfUrl));

    if (!pdfUrl) {
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    const fetchPdf = async () => {
      try {
        const response = await fetch(pdfUrl, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }
        const blob = await response.blob();
        
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setIframeSrc(`${objectUrl}#toolbar=0&navpanes=0`);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("Failed to load PDF via blob, falling back to direct URL:", error);
        if (active) {
          // Fallback to the direct URL if blob fetch fails (e.g. due to CORS or network issues)
          setIframeSrc(`${pdfUrl}#toolbar=0&navpanes=0`);
          setIsLoading(false);
        }
      }
    };

    fetchPdf();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="relative w-full h-full" style={{ height: "100%", minHeight: "600px" }}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-slate-500 font-medium">Loading preview...</p>
        </div>
      )}
      
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          title="Offer Letter"
          className="w-full h-full border-0 rounded-lg"
          style={{ height: "100%", width: "100%" }}
        />
      )}
    </div>
  );
}

