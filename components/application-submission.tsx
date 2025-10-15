"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentUpload } from "@/components/document-upload";
import { Job } from "@/types/database";
import {
  FileText,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  Star,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const applicationSchema = z.object({
  resume_url: z.string().min(1, "Please select a resume"),
  cover_letter: z.string().min(10, "Cover letter must be at least 10 characters"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

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

interface ApplicationSubmissionProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  hasAlreadyApplied?: boolean;
}

// Mock documents for development
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
    name: "Senior_Developer_Resume.pdf",
    type: "application/pdf",
    size: 189440,
    url: "/documents/senior-resume.pdf",
    uploadedAt: "2024-01-10T14:20:00Z",
    category: "resume",
    description: "Resume tailored for senior positions",
  },
];

export function ApplicationSubmission({
  job,
  isOpen,
  onClose,
  onSubmit,
  hasAlreadyApplied = false,
}: ApplicationSubmissionProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      resume_url: "",
      cover_letter: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
      // Set default resume if available
      const defaultResume = mockDocuments.find(
        (doc) => doc.category === "resume" && doc.isDefault
      );
      if (defaultResume) {
        form.setValue("resume_url", defaultResume.url);
      }
    }
  }, [isOpen, form]);

  const loadDocuments = async () => {
    try {
      // TODO: Replace with actual API call
      setDocuments(mockDocuments);
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  const handleSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      setCurrentStep(3); // Success step
    } catch (error) {
      console.error("Failed to submit application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    form.reset();
    onClose();
  };

  const handleUploadComplete = async () => {
    setShowUploadDialog(false);
    await loadDocuments();
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

  if (hasAlreadyApplied) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              Already Applied
            </DialogTitle>
            <DialogDescription>
              You have already submitted an application for this position.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              You can track the status of your application in your applications dashboard.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button
              onClick={() => (window.location.href = "/applications")}
              className="bg-[#1993e5] hover:bg-[#1680cc] text-white"
            >
              View Applications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Apply for {job.title} at {job.company}
            </DialogTitle>
            <DialogDescription>
              Submit your application with a resume and cover letter
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 py-4 border-b">
            <div className={cn(
              "flex items-center space-x-2",
              currentStep >= 1 ? "text-[#1993e5]" : "text-gray-400"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep >= 1 ? "bg-[#1993e5] text-white" : "bg-gray-200 text-gray-600"
              )}>
                1
              </div>
              <span className="text-sm font-medium">Select Resume</span>
            </div>

            <div className="flex-1 h-px bg-gray-200" />

            <div className={cn(
              "flex items-center space-x-2",
              currentStep >= 2 ? "text-[#1993e5]" : "text-gray-400"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep >= 2 ? "bg-[#1993e5] text-white" : "bg-gray-200 text-gray-600"
              )}>
                2
              </div>
              <span className="text-sm font-medium">Cover Letter</span>
            </div>

            <div className="flex-1 h-px bg-gray-200" />

            <div className={cn(
              "flex items-center space-x-2",
              currentStep >= 3 ? "text-green-600" : "text-gray-400"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep >= 3 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
              )}>
                {currentStep >= 3 ? <CheckCircle className="w-4 h-4" /> : "3"}
              </div>
              <span className="text-sm font-medium">Submit</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Select Your Resume
                    </h3>

                    <FormField
                      control={form.control}
                      name="resume_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-4">
                              {documents.filter(doc => doc.category === "resume").length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-600 mb-4">No resumes uploaded yet</p>
                                  <Button
                                    type="button"
                                    onClick={() => setShowUploadDialog(true)}
                                    className="bg-[#1993e5] hover:bg-[#1680cc] text-white"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Resume
                                  </Button>
                                </div>
                              ) : (
                                <div className="grid gap-3">
                                  {documents
                                    .filter((doc) => doc.category === "resume")
                                    .map((doc) => (
                                      <Card
                                        key={doc.id}
                                        className={cn(
                                          "cursor-pointer transition-all border-2",
                                          field.value === doc.url
                                            ? "border-[#1993e5] bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        )}
                                        onClick={() => field.onChange(doc.url)}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center space-x-3">
                                            <FileText className="w-8 h-8 text-red-600" />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                  {doc.name}
                                                </h4>
                                                {doc.isDefault && (
                                                  <Badge
                                                    variant="secondary"
                                                    className="bg-yellow-100 text-yellow-800 border-yellow-200"
                                                  >
                                                    <Star className="w-3 h-3 mr-1" />
                                                    Default
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <span>{formatFileSize(doc.size)}</span>
                                                <span>•</span>
                                                <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                                              </div>
                                              {doc.description && (
                                                <p className="text-sm text-gray-600 mt-1 truncate">
                                                  {doc.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}

                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowUploadDialog(true)}
                                    className="w-full"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload New Resume
                                  </Button>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!form.watch("resume_url")}
                      className="bg-[#1993e5] hover:bg-[#1680cc] text-white"
                    >
                      Continue to Cover Letter
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Write Your Cover Letter
                    </h3>

                    <FormField
                      control={form.control}
                      name="cover_letter"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Dear Hiring Manager,

I am writing to express my interest in the position at your company..."
                              className="min-h-[200px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Write a personalized cover letter explaining why you're interested in this position and how your skills match the requirements.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Job Requirements Reminder */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-blue-900">
                        Job Requirements Reminder
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {job.requirements?.slice(0, 3).map((req, index) => (
                          <div key={index} className="flex items-start space-x-2 text-sm text-blue-800">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            <span>{req}</span>
                          </div>
                        ))}
                        {job.requirements && job.requirements.length > 3 && (
                          <p className="text-sm text-blue-700 mt-2">
                            +{job.requirements.length - 3} more requirements
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !form.watch("cover_letter")}
                      className="bg-[#1993e5] hover:bg-[#1680cc] text-white min-w-[120px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {currentStep === 3 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Application Submitted Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your application for {job.title} at {job.company} has been submitted.
                    You'll receive updates on your application status via email.
                  </p>

                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={handleClose}>
                      Close
                    </Button>
                    <Button
                      onClick={() => (window.location.href = "/applications")}
                      className="bg-[#1993e5] hover:bg-[#1680cc] text-white"
                    >
                      View My Applications
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Resume</DialogTitle>
            <DialogDescription>
              Upload a new resume to use for job applications
            </DialogDescription>
          </DialogHeader>
          <DocumentUpload
            accept=".pdf,.doc,.docx"
            maxSize={10}
            multiple={false}
            onUpload={handleUploadComplete}
            placeholder="Upload your resume"
            description="PDF, DOC, DOCX up to 10MB"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}