"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
}

interface DocumentUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  multiple?: boolean;
  onUpload?: (files: UploadedFile[]) => Promise<void>;
  onRemove?: (fileId: string) => void;
  existingFiles?: UploadedFile[];
  className?: string;
  placeholder?: string;
  description?: string;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": { icon: FileText, color: "text-red-600" },
  "application/msword": { icon: FileText, color: "text-blue-600" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: FileText,
    color: "text-blue-600",
  },
  "image/jpeg": { icon: Image, color: "text-green-600" },
  "image/png": { icon: Image, color: "text-green-600" },
  "image/webp": { icon: Image, color: "text-green-600" },
  "text/plain": { icon: File, color: "text-gray-600" },
};

export function DocumentUpload({
  accept = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp",
  maxSize = 10, // 10MB default
  maxFiles = 5,
  multiple = true,
  onUpload,
  onRemove,
  existingFiles = [],
  className,
  placeholder = "Click to upload or drag and drop",
  description = "PDF, DOC, DOCX, TXT, JPG, PNG up to 10MB",
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    const config = ACCEPTED_FILE_TYPES[type as keyof typeof ACCEPTED_FILE_TYPES];
    if (config) {
      const Icon = config.icon;
      return <Icon className={cn("w-5 h-5", config.color)} />;
    }
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    const acceptedTypes = accept.split(",").map((type) => type.trim());
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const isAccepted = acceptedTypes.some((type) => {
      if (type.startsWith(".")) {
        return type === fileExtension;
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return "File type not supported";
    }

    return null;
  };

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const filesToProcess = Array.from(fileList);

      if (!multiple && filesToProcess.length > 1) {
        alert("Only one file is allowed");
        return;
      }

      if (files.length + filesToProcess.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newFiles: UploadedFile[] = [];

      for (const file of filesToProcess) {
        const validationError = validateFile(file);
        if (validationError) {
          alert(`${file.name}: ${validationError}`);
          continue;
        }

        const uploadedFile: UploadedFile = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          type: file.type,
          status: "uploading",
          uploadProgress: 0,
        };

        newFiles.push(uploadedFile);
      }

      setFiles((prev) => [...prev, ...newFiles]);

      // Simulate upload process
      for (const uploadedFile of newFiles) {
        try {
          // Simulate upload progress
          for (let progress = 0; progress <= 100; progress += 20) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? { ...f, uploadProgress: progress }
                  : f
              )
            );
          }

          // Mark as success
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: "success", url: URL.createObjectURL(filesToProcess.find(file => file.name === f.name)!) }
                : f
            )
          );
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? {
                    ...f,
                    status: "error",
                    errorMessage: "Upload failed",
                  }
                : f
            )
          );
        }
      }

      // Call onUpload callback
      if (onUpload) {
        const successFiles = newFiles.filter((f) => f.status === "success");
        await onUpload(successFiles);
      }
    },
    [files, maxFiles, maxSize, multiple, onUpload, accept]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      processFiles(fileList);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = "";
  };

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      const fileList = event.dataTransfer.files;
      if (fileList) {
        processFiles(fileList);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleRemove = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (onRemove) {
      onRemove(fileId);
    }
  };

  const handleRetry = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, status: "uploading", uploadProgress: 0, errorMessage: undefined }
          : f
      )
    );
    // Re-trigger upload logic here
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver
            ? "border-[#1993e5] bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">{placeholder}</p>
          <p className="text-xs text-gray-500">{description}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>

                  {file.status === "uploading" && (
                    <div className="mt-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-[#1993e5] h-1.5 rounded-full transition-all"
                            style={{ width: `${file.uploadProgress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {file.uploadProgress || 0}%
                        </span>
                      </div>
                    </div>
                  )}

                  {file.status === "error" && (
                    <p className="text-xs text-red-600 mt-1">
                      {file.errorMessage}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {file.status === "uploading" && (
                    <Loader2 className="w-4 h-4 text-[#1993e5] animate-spin" />
                  )}

                  {file.status === "success" && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}

                  {file.status === "error" && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetry(file.id)}
                        className="text-xs px-2 py-1"
                      >
                        Retry
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(file.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}