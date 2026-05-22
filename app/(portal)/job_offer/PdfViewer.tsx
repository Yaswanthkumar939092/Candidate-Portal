"use client";

import React from "react";

interface PdfViewerProps {
  pdfUrl: string;
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
  return (
    <iframe
      src={pdfUrl}
      title="Offer Letter"
      className="w-full border-0 rounded-lg"
      style={{ height: "80vh", minHeight: "600px" }}
    />
  );
}
