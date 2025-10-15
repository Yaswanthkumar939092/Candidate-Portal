"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { DocumentUpload } from "@/components/document-upload";
import {
  ArrowLeft,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Edit,
  Plus,
  Eye,
  Star,
  Calendar,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  category: "resume" | "cover_letter" | "portfolio" | "certificate" | "other";
  isDefault?: boolean;
  description?: string;
}

// Mock documents data
const mockDocuments: Document[] = [
  {
    id: "1",
    name: "John_Doe_Resume_2024.pdf",
    type: "application/pdf",
    size: 245760,
    url: "/documents/resume.pdf",
    uploadedAt: "2024-01-15T10:30:00Z",
    category: "resume",
    isDefault: true,
    description: "Updated resume with latest experience",
  },
  {
    id: "2",
    name: "Frontend_Developer_Cover_Letter.pdf",
    type: "application/pdf",
    size: 156320,
    url: "/documents/cover-letter.pdf",
    uploadedAt: "2024-01-10T14:20:00Z",
    category: "cover_letter",
    description: "Generic cover letter for frontend positions",
  },
  {
    id: "3",
    name: "Portfolio_Projects_Showcase.pdf",
    type: "application/pdf",
    size: 2048000,
    url: "/documents/portfolio.pdf",
    uploadedAt: "2024-01-05T09:15:00Z",
    category: "portfolio",
    description: "Showcase of key projects and achievements",
  },
  {
    id: "4",
    name: "React_Certification.jpg",
    type: "image/jpeg",
    size: 512000,
    url: "/documents/react-cert.jpg",
    uploadedAt: "2024-01-01T16:45:00Z",
    category: "certificate",
    description: "React Developer Certification from Meta",
  },
];

const documentCategories = [
  { value: "resume", label: "Resume/CV", icon: FileText },
  { value: "cover_letter", label: "Cover Letter", icon: FileText },
  { value: "portfolio", label: "Portfolio", icon: Image },
  { value: "certificate", label: "Certificate", icon: File },
  { value: "other", label: "Other", icon: File },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setDocuments(mockDocuments);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: any[]) => {
    try {
      // TODO: Implement actual upload logic
      console.log("Uploading files:", files);
      setShowUploadDialog(false);
      // Refresh documents list
      await loadDocuments();
    } catch (error) {
      console.error("Failed to upload documents:", error);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // TODO: Implement actual delete logic
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handleSetDefault = async (documentId: string, category: string) => {
    try {
      // TODO: Implement actual set default logic
      setDocuments((prev) =>
        prev.map((doc) => ({
          ...doc,
          isDefault: doc.id === documentId && doc.category === category,
        }))
      );
    } catch (error) {
      console.error("Failed to set default document:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-5 h-5 text-red-600" />;
    if (type.includes("image")) return <Image className="w-5 h-5 text-green-600" />;
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = documentCategories.find((cat) => cat.value === category);
    if (categoryConfig) {
      const Icon = categoryConfig.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getCategoryLabel = (category: string) => {
    const categoryConfig = documentCategories.find((cat) => cat.value === category);
    return categoryConfig?.label || category;
  };

  const filteredDocuments = selectedCategory === "all"
    ? documents
    : documents.filter((doc) => doc.category === selectedCategory);

  const getCategoryCount = (category: string) => {
    if (category === "all") return documents.length;
    return documents.filter((doc) => doc.category === category).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-10 h-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="inline-flex items-center text-gray-600 hover:text-[#1993e5] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Management</h1>
              <p className="text-gray-600">
                Upload and manage your resumes, cover letters, and other documents
              </p>
            </div>
          </div>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#1993e5] hover:bg-[#1680cc] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Upload resumes, cover letters, portfolios, or other relevant documents
                </DialogDescription>
              </DialogHeader>
              <DocumentUpload
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                maxSize={10}
                multiple={true}
                onUpload={handleUpload}
                placeholder="Click to upload or drag and drop"
                description="PDF, DOC, DOCX, TXT, JPG, PNG up to 10MB"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card
            className={`border-0 shadow-sm cursor-pointer transition-colors ${
              selectedCategory === "all" ? "ring-2 ring-[#1993e5] bg-blue-50" : ""
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <File className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">{getCategoryCount("all")}</p>
              <p className="text-xs text-gray-600">All Files</p>
            </CardContent>
          </Card>

          {documentCategories.map((category) => {
            const Icon = category.icon;
            const count = getCategoryCount(category.value);
            return (
              <Card
                key={category.value}
                className={`border-0 shadow-sm cursor-pointer transition-colors ${
                  selectedCategory === category.value ? "ring-2 ring-[#1993e5] bg-blue-50" : ""
                }`}
                onClick={() => setSelectedCategory(category.value)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{count}</p>
                  <p className="text-xs text-gray-600">{category.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <Empty
            title="No documents found"
            description={
              selectedCategory === "all"
                ? "Upload your first document to get started"
                : `No ${getCategoryLabel(selectedCategory).toLowerCase()} documents found`
            }
            action={
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-[#1993e5] hover:bg-[#1680cc] text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getFileIcon(document.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {document.name}
                          </h3>
                          {document.isDefault && (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800 border-yellow-200"
                            >
                              <Star className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            {getCategoryIcon(document.category)}
                            <span>{getCategoryLabel(document.category)}</span>
                          </div>
                          <span>{formatFileSize(document.size)}</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Uploaded {formatDate(document.uploadedAt)}</span>
                          </div>
                        </div>

                        {document.description && (
                          <p className="text-sm text-gray-600 mt-2 truncate">
                            {document.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(document.url, "_blank")}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = document.url;
                          link.download = document.name;
                          link.click();
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!document.isDefault && (
                            <DropdownMenuItem
                              onClick={() => handleSetDefault(document.id, document.category)}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setEditingDocument(document)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(document.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Document Dialog */}
        <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Document Details</DialogTitle>
              <DialogDescription>
                Update the name, category, and description for this document
              </DialogDescription>
            </DialogHeader>
            {editingDocument && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="document-name">Document Name</Label>
                  <Input
                    id="document-name"
                    defaultValue={editingDocument.name}
                    placeholder="Enter document name"
                  />
                </div>

                <div>
                  <Label htmlFor="document-category">Category</Label>
                  <Select defaultValue={editingDocument.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="document-description">Description</Label>
                  <Input
                    id="document-description"
                    defaultValue={editingDocument.description}
                    placeholder="Brief description of this document"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDocument(null)}>
                Cancel
              </Button>
              <Button className="bg-[#1993e5] hover:bg-[#1680cc] text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}