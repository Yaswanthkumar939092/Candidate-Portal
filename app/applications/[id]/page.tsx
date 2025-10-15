"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationStatus, getStatusDescription } from "@/components/application-status";
import { Application, Job } from "@/types/database";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  ExternalLink,
  Download,
  Edit,
  Trash2,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
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

// Mock data for development
const mockApplicationDetail = {
  id: "1",
  job_id: "1",
  candidate_id: "user1",
  status: "interviewing" as const,
  cover_letter: `Dear Hiring Manager,

I am writing to express my strong interest in the Senior Frontend Developer position at TechCorp Inc. With over 6 years of experience in React, TypeScript, and modern frontend technologies, I am confident that I would be a valuable addition to your team.

In my current role at DevCorp, I have:
- Led the development of a customer-facing React application serving 100k+ users
- Implemented a design system that improved development efficiency by 40%
- Mentored junior developers and established frontend best practices
- Optimized application performance, reducing load times by 50%

I am particularly excited about TechCorp's mission to build innovative solutions for businesses worldwide. Your recent work on the enterprise platform aligns perfectly with my experience in building scalable, user-friendly applications.

I would welcome the opportunity to discuss how my skills and experience can contribute to your team's success. Thank you for considering my application.

Best regards,
John Doe`,
  resume_url: "/documents/john-doe-resume.pdf",
  applied_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-18T14:30:00Z",
  notes: "Phone interview scheduled for Jan 20th at 2:00 PM. Technical round scheduled for Jan 25th.",
  job: {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    company_logo: null,
    description: `We are looking for an experienced Frontend Developer to join our dynamic team. You'll be working on cutting-edge web applications using React, TypeScript, and modern development practices.

This is an excellent opportunity to work with a talented team on products that are used by millions of users worldwide.`,
    requirements: [
      "5+ years of experience with React and JavaScript/TypeScript",
      "Strong understanding of modern CSS and responsive design",
      "Experience with state management libraries (Redux, Context API)",
      "Familiarity with testing frameworks (Jest, React Testing Library)",
      "Knowledge of build tools and bundlers (Webpack, Vite)",
      "Experience with version control systems (Git)",
      "Strong problem-solving skills and attention to detail",
    ],
    benefits: [
      "Health, dental, and vision insurance",
      "401(k) with company matching",
      "Flexible work arrangements",
      "Professional development budget",
      "Stock options",
      "Unlimited PTO",
    ],
    salary_min: 120000,
    salary_max: 160000,
    location: "San Francisco, CA",
    job_type: "full-time" as const,
    experience_level: "senior" as const,
    skills_required: ["React", "TypeScript", "JavaScript", "CSS", "Git"],
    application_deadline: "2024-02-15T00:00:00Z",
    is_active: true,
    posted_by: "employer1",
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z",
  },
  timeline: [
    {
      date: "2024-01-15T10:00:00Z",
      status: "pending",
      title: "Application Submitted",
      description: "Your application has been successfully submitted.",
    },
    {
      date: "2024-01-16T14:00:00Z",
      status: "reviewing",
      title: "Application Under Review",
      description: "The hiring team is reviewing your application.",
    },
    {
      date: "2024-01-18T14:30:00Z",
      status: "interviewing",
      title: "Interview Scheduled",
      description: "Congratulations! You've been selected for an interview.",
    },
  ],
};

type ApplicationWithJob = Application & {
  job: Job;
  timeline?: Array<{
    date: string;
    status: string;
    title: string;
    description: string;
  }>;
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<ApplicationWithJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setApplication(mockApplicationDetail);
    } catch (error) {
      console.error("Failed to load application:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      // TODO: Implement actual withdrawal logic
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setApplication((prev) => prev ? { ...prev, status: "withdrawn" } : null);
      setShowWithdrawDialog(false);
      setWithdrawReason("");
    } catch (error) {
      console.error("Failed to withdraw application:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canWithdraw = application?.status === "pending" || application?.status === "reviewing";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
            <p className="text-gray-600 mb-6">
              The application you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/applications">
              <Button className="bg-[#1993e5] hover:bg-[#1680cc] text-white">
                Back to Applications
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/applications"
          className="inline-flex items-center text-gray-600 hover:text-[#1993e5] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Header */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {application.job.company_logo ? (
                        <img
                          src={application.job.company_logo}
                          alt={`${application.job.company} logo`}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {application.job.title}
                      </h1>
                      <p className="text-lg text-gray-600 font-medium mb-3">
                        {application.job.company}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{application.job.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span className="capitalize">{application.job.job_type}</span>
                        </div>
                        {application.job.salary_min && application.job.salary_max && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              ${application.job.salary_min.toLocaleString()} - ${application.job.salary_max.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <ApplicationStatus status={application.status} size="md" />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/jobs/${application.job.id}`}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Eye className="w-4 h-4 mr-2" />
                      View Job Posting
                    </Button>
                  </Link>

                  {application.resume_url && (
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Download className="w-4 h-4 mr-2" />
                      Download Resume
                    </Button>
                  )}

                  {canWithdraw && (
                    <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Withdraw Application
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Withdraw Application</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to withdraw your application for this position? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Reason for withdrawal (optional)
                          </label>
                          <Textarea
                            placeholder="Please let us know why you're withdrawing..."
                            value={withdrawReason}
                            onChange={(e) => setWithdrawReason(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleWithdraw}
                            disabled={isWithdrawing}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {isWithdrawing ? "Withdrawing..." : "Withdraw Application"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cover Letter */}
            {application.cover_letter && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Cover Letter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {application.cover_letter}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Description */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    {application.job.description}
                  </p>

                  {application.job.requirements && application.job.requirements.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Requirements:</h4>
                      <ul className="space-y-1">
                        {application.job.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <div className="w-2 h-2 bg-[#1993e5] rounded-full mt-2 flex-shrink-0" />
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {application.job.skills_required && application.job.skills_required.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Required Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.job.skills_required.map((skill) => (
                          <Badge key={skill} variant="secondary" className="px-2 py-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Status */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Application Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <ApplicationStatus status={application.status} size="lg" />
                  <p className="text-sm text-gray-600 mt-2">
                    {getStatusDescription(application.status)}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Applied</span>
                    <span className="text-gray-900 font-medium">
                      {formatDateShort(application.applied_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-gray-900 font-medium">
                      {formatDateShort(application.updated_at)}
                    </span>
                  </div>
                  {application.job.application_deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Deadline</span>
                      <span className="text-gray-900 font-medium">
                        {formatDateShort(application.job.application_deadline)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            {application.timeline && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Application Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.timeline.map((event, index) => (
                      <div key={index} className="flex space-x-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.status === 'pending' ? 'bg-yellow-100' :
                            event.status === 'reviewing' ? 'bg-blue-100' :
                            event.status === 'interviewing' ? 'bg-purple-100' :
                            'bg-green-100'
                          }`}>
                            {event.status === 'pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                            {event.status === 'reviewing' && <Eye className="w-4 h-4 text-blue-600" />}
                            {event.status === 'interviewing' && <Calendar className="w-4 h-4 text-purple-600" />}
                            {event.status === 'offered' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                          {index < application.timeline!.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(event.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {application.notes && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Notes & Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{application.notes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {application.job.benefits && application.job.benefits.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Benefits & Perks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {application.job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-[#1993e5] rounded-full mt-2 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}