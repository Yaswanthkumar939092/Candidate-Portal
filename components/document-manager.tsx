'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import {
  FileText,
  Image,
  File as FileIcon,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  Upload,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Edit,
  Share2,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentUpload } from "./document-upload";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export interface ManagedDocument {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  category: 'resume' | 'cover-letter' | 'portfolio' | 'certificate' | 'transcript' | 'other';
  status: 'active' | 'archived' | 'processing';
  applicationId?: string;
  isPublic: boolean;
  tags: string[];
  description?: string;
  version?: number;
}

interface DocumentManagerProps {
  documents: ManagedDocument[];
  onUpload: (files: File[], category: string, tags: string[], description?: string) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onUpdate: (documentId: string, updates: Partial<ManagedDocument>) => Promise<void>;
  onDownload: (documentId: string) => void;
  onPreview: (documentId: string) => void;
  className?: string;
  showFilters?: boolean;
  allowedCategories?: string[];
}

export function DocumentManager({
  documents,
  onUpload,
  onDelete,
  onUpdate,
  onDownload,
  onPreview,
  className,
  showFilters = true,
  allowedCategories = ['resume', 'cover-letter', 'portfolio', 'certificate', 'transcript', 'other']
}: DocumentManagerProps) {
  const [filteredDocuments, setFilteredDocuments] = useState(documents);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const categoryLabels = {
    resume: 'Resume',
    'cover-letter': 'Cover Letter',
    portfolio: 'Portfolio',
    certificate: 'Certificate',
    transcript: 'Transcript',
    other: 'Other'
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-green-600" />;
    } else if (type === 'application/pdf' || type.includes('document')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <FileIcon className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      resume: 'bg-blue-100 text-blue-800 border-blue-200',
      'cover-letter': 'bg-green-100 text-green-800 border-green-200',
      portfolio: 'bg-purple-100 text-purple-800 border-purple-200',
      certificate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      transcript: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Filter documents based on search and filters
  useEffect(() => {
    let filtered = documents;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.originalName.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query)) ||
        doc.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, selectedCategory, selectedStatus]);

  const handleUpload = async (files: any[]) => {
    if (!uploadCategory) return;

    setIsUploading(true);
    try {
      const fileObjects = files.map(f => new File([f], f.name, { type: f.type }));
      const tags = uploadTags.split(',').map(tag => tag.trim()).filter(Boolean);

      await onUpload(fileObjects, uploadCategory, tags, uploadDescription);

      // Reset form
      setUploadCategory('');
      setUploadTags('');
      setUploadDescription('');
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      await onDelete(documentId);
    }
  };

  const renderDocumentCard = (document: ManagedDocument) => (
    <Card key={document.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getFileIcon(document.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {document.originalName}
              </h3>
              {document.version && document.version > 1 && (
                <Badge variant="secondary" className="text-xs">
                  v{document.version}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <Badge className={cn("text-xs border", getCategoryColor(document.category))}>
                {categoryLabels[document.category as keyof typeof categoryLabels]}
              </Badge>
              {getStatusIcon(document.status)}
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
              <span>{formatFileSize(document.size)}</span>
              <span>{formatDate(document.uploadedAt)}</span>
              <span className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {document.uploadedBy}
              </span>
            </div>

            {document.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {document.description}
              </p>
            )}

            {document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {document.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    +{document.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(document.id)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(document.id)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              {document.status === 'active' ? (
                <DropdownMenuItem onClick={() => onUpdate(document.id, { status: 'archived' })}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onUpdate(document.id, { status: 'active' })}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(document.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Manager</h2>
          <p className="text-gray-600 text-sm">
            Manage your application documents and files
          </p>
        </div>

        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogTrigger asChild>
            <Button className="bg-[#1993e5] hover:bg-[#1680cc]">
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="e.g., frontend, react, 2024"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of the document"
                  className="mt-1"
                />
              </div>

              <DocumentUpload
                onUpload={handleUpload}
                multiple={true}
                maxFiles={10}
                placeholder="Select files to upload"
                description="PDF, DOC, DOCX, PNG, JPG up to 10MB each"
              />

              {!uploadCategory && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <p>Please select a category before uploading files.</p>
                </Alert>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allowedCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(d => d.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Total Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(documents.reduce((sum, doc) => sum + doc.size, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(d => {
                    const uploadDate = new Date(d.uploadedAt);
                    const now = new Date();
                    return uploadDate.getMonth() === now.getMonth() &&
                           uploadDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(renderDocumentCard)}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'No documents found'
                : 'No documents yet'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Upload your first document to get started.'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && selectedStatus === 'all' && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-[#1993e5] hover:bg-[#1680cc]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Example usage component with sample data
export function DocumentManagerExample() {
  const sampleDocuments: ManagedDocument[] = [
    {
      id: '1',
      name: 'john_doe_resume_2024.pdf',
      originalName: 'John Doe - Resume 2024.pdf',
      size: 245760,
      type: 'application/pdf',
      url: '/documents/john_doe_resume_2024.pdf',
      uploadedAt: '2024-01-15T10:30:00Z',
      uploadedBy: 'John Doe',
      category: 'resume',
      status: 'active',
      isPublic: true,
      tags: ['frontend', 'react', '2024'],
      description: 'Updated resume with latest work experience',
      version: 2
    },
    {
      id: '2',
      name: 'cover_letter_techcorp.pdf',
      originalName: 'Cover Letter - TechCorp Position.pdf',
      size: 156432,
      type: 'application/pdf',
      url: '/documents/cover_letter_techcorp.pdf',
      uploadedAt: '2024-01-18T14:20:00Z',
      uploadedBy: 'John Doe',
      category: 'cover-letter',
      status: 'active',
      applicationId: 'app-123',
      isPublic: false,
      tags: ['techcorp', 'frontend-position'],
      description: 'Tailored cover letter for Senior Frontend Developer role'
    }
  ];

  const handleUpload = async (files: File[], category: string, tags: string[], description?: string) => {
    console.log('Uploading:', { files, category, tags, description });
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const handleDelete = async (documentId: string) => {
    console.log('Deleting document:', documentId);
  };

  const handleUpdate = async (documentId: string, updates: Partial<ManagedDocument>) => {
    console.log('Updating document:', documentId, updates);
  };

  const handleDownload = (documentId: string) => {
    console.log('Downloading document:', documentId);
  };

  const handlePreview = (documentId: string) => {
    console.log('Previewing document:', documentId);
  };

  return (
    <DocumentManager
      documents={sampleDocuments}
      onUpload={handleUpload}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
      onDownload={handleDownload}
      onPreview={handlePreview}
    />
  );
}