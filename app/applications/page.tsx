"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { ApplicationCard } from "@/components/application-card";
import { ApplicationStatus } from "@/components/application-status";
import { Application, Job, ApplicationStatus as ApplicationStatusType } from "@/types/database";
import {
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// Mock data for development
const mockApplications = [
  {
    id: "1",
    job_id: "1",
    candidate_id: "user1",
    status: "pending" as ApplicationStatusType,
    cover_letter: "I am very interested in this position...",
    resume_url: "/documents/resume.pdf",
    applied_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    notes: null,
    job: {
      id: "1",
      title: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      company_logo: null,
      description: "We are looking for an experienced Frontend Developer...",
      requirements: ["React", "TypeScript", "5+ years experience"],
      benefits: ["Health insurance", "401k", "Remote work"],
      salary_min: 120000,
      salary_max: 160000,
      location: "San Francisco, CA",
      job_type: "full-time" as const,
      experience_level: "senior" as const,
      skills_required: ["React", "TypeScript", "JavaScript", "CSS"],
      application_deadline: "2024-02-15T00:00:00Z",
      is_active: true,
      posted_by: "employer1",
      created_at: "2024-01-10T00:00:00Z",
      updated_at: "2024-01-10T00:00:00Z",
    },
  },
  {
    id: "2",
    job_id: "2",
    candidate_id: "user1",
    status: "reviewing" as ApplicationStatusType,
    cover_letter: "I am excited about this opportunity...",
    resume_url: "/documents/resume.pdf",
    applied_at: "2024-01-12T14:30:00Z",
    updated_at: "2024-01-13T09:15:00Z",
    notes: null,
    job: {
      id: "2",
      title: "Full Stack Engineer",
      company: "StartupXYZ",
      company_logo: null,
      description: "Join our growing team as a Full Stack Engineer...",
      requirements: ["Node.js", "React", "PostgreSQL"],
      benefits: ["Equity", "Flexible hours", "Learning budget"],
      salary_min: 90000,
      salary_max: 130000,
      location: "New York, NY",
      job_type: "full-time" as const,
      experience_level: "mid" as const,
      skills_required: ["React", "Node.js", "PostgreSQL", "TypeScript"],
      application_deadline: "2024-02-01T00:00:00Z",
      is_active: true,
      posted_by: "employer2",
      created_at: "2024-01-08T00:00:00Z",
      updated_at: "2024-01-08T00:00:00Z",
    },
  },
  {
    id: "3",
    job_id: "3",
    candidate_id: "user1",
    status: "interviewing" as ApplicationStatusType,
    cover_letter: "Looking forward to contributing to your team...",
    resume_url: "/documents/resume.pdf",
    applied_at: "2024-01-05T16:45:00Z",
    updated_at: "2024-01-10T11:20:00Z",
    notes: "Phone interview scheduled for Jan 18th",
    job: {
      id: "3",
      title: "React Developer",
      company: "DevCorp",
      company_logo: null,
      description: "We need a React specialist to join our team...",
      requirements: ["React", "Redux", "3+ years experience"],
      benefits: ["Remote work", "Health insurance", "PTO"],
      salary_min: 80000,
      salary_max: 110000,
      location: "Remote",
      job_type: "full-time" as const,
      experience_level: "mid" as const,
      skills_required: ["React", "Redux", "JavaScript"],
      application_deadline: "2024-01-31T00:00:00Z",
      is_active: true,
      posted_by: "employer3",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
];

type ApplicationWithJob = Application & { job: Job };

const statusCounts = {
  all: mockApplications.length,
  pending: mockApplications.filter((app) => app.status === "pending").length,
  reviewing: mockApplications.filter((app) => app.status === "reviewing").length,
  interviewing: mockApplications.filter((app) => app.status === "interviewing").length,
  offered: mockApplications.filter((app) => app.status === "offered").length,
  rejected: mockApplications.filter((app) => app.status === "rejected").length,
  withdrawn: mockApplications.filter((app) => app.status === "withdrawn").length,
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusType | "all">("all");
  const [sortBy, setSortBy] = useState<"applied_at" | "updated_at" | "company">("applied_at");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterAndSortApplications();
  }, [applications, searchQuery, statusFilter, sortBy]);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setApplications(mockApplications);
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortApplications = () => {
    let filtered = [...applications];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (app) =>
          app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.job.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((app) => app.status === activeTab);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "applied_at":
          return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
        case "updated_at":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "company":
          return a.job.company.localeCompare(b.job.company);
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  };

  const handleWithdraw = async (applicationId: string) => {
    try {
      // TODO: Implement actual withdrawal logic
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: "withdrawn" as ApplicationStatusType }
            : app
        )
      );
    } catch (error) {
      console.error("Failed to withdraw application:", error);
    }
  };

  const getStatusCount = (status: ApplicationStatusType | "all") => {
    if (status === "all") return applications.length;
    return applications.filter((app) => app.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">
            Track and manage your job applications in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {getStatusCount("pending") + getStatusCount("reviewing")}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {getStatusCount("interviewing")}
                  </p>
                  <p className="text-sm text-gray-600">Interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {getStatusCount("offered")}
                  </p>
                  <p className="text-sm text-gray-600">Offers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by job title, company, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as ApplicationStatusType | "all")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Under Review</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as typeof sortBy)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied_at">Date Applied</SelectItem>
                    <SelectItem value="updated_at">Last Updated</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 bg-white">
            <TabsTrigger value="all">All ({getStatusCount("all")})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({getStatusCount("pending")})</TabsTrigger>
            <TabsTrigger value="reviewing">Review ({getStatusCount("reviewing")})</TabsTrigger>
            <TabsTrigger value="interviewing">Interview ({getStatusCount("interviewing")})</TabsTrigger>
            <TabsTrigger value="offered">Offers ({getStatusCount("offered")})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({getStatusCount("rejected")})</TabsTrigger>
            <TabsTrigger value="withdrawn">Withdrawn ({getStatusCount("withdrawn")})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredApplications.length === 0 ? (
              <Empty
                title="No applications found"
                description={
                  searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start applying to jobs to see them here"
                }
                action={
                  searchQuery || statusFilter !== "all" ? (
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button
                      onClick={() => (window.location.href = "/jobs")}
                      className="bg-[#1993e5] hover:bg-[#1680cc] text-white"
                    >
                      Browse Jobs
                    </Button>
                  )
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onWithdraw={handleWithdraw}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}