"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Users,
  Calendar,
  Share2,
  Bookmark,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// Mock job detail data
const mockJobDetails = {
  "1": {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120k - $160k",
    description: "We are looking for an experienced Frontend Developer to join our dynamic team. You'll be working on cutting-edge web applications using React, TypeScript, and modern development practices.",
    fullDescription: `
      <h3>About the Role</h3>
      <p>We are looking for an experienced Frontend Developer to join our dynamic team. You'll be working on cutting-edge web applications using React, TypeScript, and modern development practices. This is an excellent opportunity to work with a talented team on products that are used by millions of users worldwide.</p>

      <h3>Key Responsibilities</h3>
      <ul>
        <li>Develop and maintain high-quality React applications</li>
        <li>Collaborate with designers and backend developers to implement user interfaces</li>
        <li>Write clean, maintainable, and well-tested code</li>
        <li>Optimize applications for maximum speed and scalability</li>
        <li>Participate in code reviews and contribute to best practices</li>
        <li>Stay up-to-date with the latest frontend technologies and trends</li>
      </ul>

      <h3>Requirements</h3>
      <ul>
        <li>5+ years of experience with React and JavaScript/TypeScript</li>
        <li>Strong understanding of modern CSS and responsive design</li>
        <li>Experience with state management libraries (Redux, Context API)</li>
        <li>Familiarity with testing frameworks (Jest, React Testing Library)</li>
        <li>Knowledge of build tools and bundlers (Webpack, Vite)</li>
        <li>Experience with version control systems (Git)</li>
        <li>Strong problem-solving skills and attention to detail</li>
      </ul>

      <h3>Nice to Have</h3>
      <ul>
        <li>Experience with Next.js or similar frameworks</li>
        <li>Knowledge of GraphQL and Apollo Client</li>
        <li>Familiarity with CI/CD pipelines</li>
        <li>Experience with design systems and component libraries</li>
        <li>Understanding of accessibility best practices</li>
      </ul>
    `,
    postedAt: "2 days ago",
    tags: ["React", "TypeScript", "JavaScript", "CSS", "Git"],
    companyInfo: {
      size: "500-1000 employees",
      industry: "Technology",
      founded: "2010",
      website: "https://techcorp.com",
      description: "TechCorp is a leading technology company that builds innovative solutions for businesses worldwide.",
    },
    benefits: [
      "Health, dental, and vision insurance",
      "401(k) with company matching",
      "Flexible work arrangements",
      "Professional development budget",
      "Stock options",
      "Unlimited PTO",
    ],
    applicationDeadline: "2024-02-15",
  },
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const jobDetail = mockJobDetails[jobId as keyof typeof mockJobDetails];
      setJob(jobDetail || null);
      setIsLoading(false);
    }, 1000);
  }, [jobId]);

  const handleApply = () => {
    setHasApplied(true);
    // TODO: Implement job application logic
    console.log("Applied to job:", jobId);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Implement save job logic
    console.log("Saved job:", jobId);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // TODO: Add toast notification
    console.log("Job URL copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
            <div className="flex items-start space-x-4 mb-6">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="flex space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-6">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/jobs">
              <Button className="bg-[#1993e5] hover:bg-[#1680cc] text-white">
                Browse All Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/jobs"
          className="inline-flex items-center text-gray-600 hover:text-[#1993e5] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Link>

        {/* Job Header */}
        <Card className="bg-white border-0 shadow-sm rounded-xl mb-6">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4 flex-1">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {job.title}
                  </h1>
                  <p className="text-lg text-gray-600 font-medium mb-4">{job.company}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{job.type}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Posted {job.postedAt}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.tags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium px-2 py-1 rounded-md"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  className={`border-gray-300 ${
                    isSaved
                      ? "text-[#1993e5] bg-blue-50 border-[#1993e5]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleApply}
                disabled={hasApplied}
                className="bg-[#1993e5] hover:bg-[#1680cc] text-white font-medium px-8 py-3 rounded-lg transition-colors duration-200"
              >
                {hasApplied ? "Application Submitted" : "Apply Now"}
              </Button>

              <Link href={job.companyInfo.website} target="_blank">
                <Button
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Company Website
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: job.fullDescription }}
                />
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Benefits & Perks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.benefits.map((benefit: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2 text-gray-700">
                      <div className="w-2 h-2 bg-[#1993e5] rounded-full mt-2 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">
                  About {job.company}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {job.companyInfo.description}
                </p>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Industry</span>
                    <span className="text-gray-900 font-medium">{job.companyInfo.industry}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Company Size</span>
                    <span className="text-gray-900 font-medium">{job.companyInfo.size}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Founded</span>
                    <span className="text-gray-900 font-medium">{job.companyInfo.founded}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Deadline */}
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Application Deadline</h3>
                  <p className="text-sm text-gray-600">
                    Apply before {new Date(job.applicationDeadline).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Apply */}
            <Card className="bg-gradient-to-br from-[#1993e5] to-[#1680cc] text-white border-0 shadow-sm rounded-xl">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold mb-2">Ready to Apply?</h3>
                <p className="text-sm text-blue-100 mb-4">
                  Don't wait - great opportunities don't last long!
                </p>
                <Button
                  onClick={handleApply}
                  disabled={hasApplied}
                  className="w-full bg-white text-[#1993e5] hover:bg-gray-50 font-medium"
                >
                  {hasApplied ? "Applied!" : "Apply Now"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}