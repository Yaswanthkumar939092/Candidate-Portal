"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/job-card";
import { ArrowRight, MapPin, Clock, DollarSign, Building2, Star } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  job_type: string;
  salary_min?: number;
  salary_max?: number;
  description: string;
  created_at: string;
  skills_required?: string[];
  experience_level: string;
}

export function FeaturedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        const response = await fetch("/api/jobs?limit=6&sort_by=created_at&sort_order=desc");
        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (err) {
        console.error("Error fetching featured jobs:", err);
        setError("Failed to load jobs");
        // Fallback to mock data for demo
        setJobs(mockJobs);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedJobs();
  }, []);

  const mockJobs: Job[] = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      job_type: "full-time",
      salary_min: 120000,
      salary_max: 160000,
      description: "We are looking for an experienced Frontend Developer to join our dynamic team. You'll be working on cutting-edge web applications using React, TypeScript, and modern development practices.",
      created_at: "2 days ago",
      skills_required: ["React", "TypeScript", "JavaScript", "CSS", "Git"],
      experience_level: "senior",
    },
    {
      id: "2",
      title: "Full Stack Engineer",
      company: "StartupXYZ",
      location: "Remote",
      job_type: "full-time",
      salary_min: 100000,
      salary_max: 140000,
      description: "Join our growing startup as a Full Stack Engineer. You'll work across the entire technology stack, from React frontends to Node.js backends and cloud infrastructure.",
      created_at: "3 days ago",
      skills_required: ["React", "Node.js", "TypeScript", "AWS", "MongoDB"],
      experience_level: "mid",
    },
    {
      id: "3",
      title: "UI/UX Designer",
      company: "Design Studio",
      location: "New York, NY",
      job_type: "contract",
      salary_min: 80000,
      salary_max: 100000,
      description: "We're seeking a talented UI/UX Designer to create beautiful, user-friendly interfaces for our clients. Experience with Figma and modern design systems required.",
      created_at: "1 week ago",
      skills_required: ["Figma", "UI Design", "UX Design", "Prototyping", "Design Systems"],
      experience_level: "mid",
    },
    {
      id: "4",
      title: "DevOps Engineer",
      company: "CloudTech Solutions",
      location: "Austin, TX",
      job_type: "full-time",
      salary_min: 110000,
      salary_max: 150000,
      description: "Looking for a DevOps Engineer to help build and maintain our cloud infrastructure. Experience with Kubernetes, Docker, and CI/CD pipelines is essential.",
      created_at: "4 days ago",
      skills_required: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"],
      experience_level: "senior",
    },
    {
      id: "5",
      title: "Product Manager",
      company: "InnovateNow",
      location: "Seattle, WA",
      job_type: "full-time",
      salary_min: 130000,
      salary_max: 180000,
      description: "Join our product team to drive the development of innovative solutions. You'll work closely with engineering, design, and business teams to deliver exceptional products.",
      created_at: "5 days ago",
      skills_required: ["Product Strategy", "Agile", "Analytics", "Leadership", "Communication"],
      experience_level: "senior",
    },
    {
      id: "6",
      title: "Data Scientist",
      company: "DataCorp",
      location: "Boston, MA",
      job_type: "full-time",
      salary_min: 115000,
      salary_max: 155000,
      description: "We're looking for a Data Scientist to analyze complex datasets and derive actionable insights. Strong background in Python, machine learning, and statistical analysis required.",
      created_at: "1 week ago",
      skills_required: ["Python", "Machine Learning", "Statistics", "SQL", "Pandas"],
      experience_level: "mid",
    },
  ];

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    }
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return null;
  };

  const getTimeAgo = (createdAt: string) => {
    // Simple time ago calculation for mock data
    return createdAt;
  };

  const handleApply = (jobId: string) => {
    console.log("Apply to job:", jobId);
    // TODO: Implement application logic or redirect to job details
  };

  const handleSave = (jobId: string) => {
    console.log("Save job:", jobId);
    // TODO: Implement save job logic
  };

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Jobs</h2>
            <p className="text-gray-600 mb-8">Unable to load jobs at the moment. Please try again later.</p>
            <Button asChild className="bg-[#1993e5] hover:bg-[#1680cc]">
              <Link href="/jobs">Browse All Jobs</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-yellow-400 mr-2" />
            <span className="text-[#1993e5] font-semibold text-lg">Featured Opportunities</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Latest Job Openings
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover hand-picked opportunities from top companies looking for talented professionals like you.
          </p>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="w-6 h-6 rounded" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            ))
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 hover:border-[#1993e5] hover:shadow-lg transition-all duration-200 p-6 group">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {job.company_logo ? (
                          <img
                            src={job.company_logo}
                            alt={`${job.company} logo`}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#1993e5] transition-colors line-clamp-2 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">{job.company}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(job.id)}
                      className="text-gray-400 hover:text-[#1993e5] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Job Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className="capitalize">{job.job_type.replace("-", " ")}</span>
                      </div>
                    </div>

                    {formatSalary(job.salary_min, job.salary_max) && (
                      <div className="flex items-center text-sm text-gray-600 space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills */}
                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.skills_required.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 hover:bg-[#1993e5] hover:text-white transition-colors"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {job.skills_required.length > 3 && (
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700"
                        >
                          +{job.skills_required.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-500">{getTimeAgo(job.created_at)}</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-[#1993e5] border-[#1993e5] hover:bg-[#1993e5] hover:text-white transition-colors"
                      >
                        <Link href={`/jobs/${job.id}`}>View Details</Link>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApply(job.id)}
                        className="bg-[#1993e5] hover:bg-[#1680cc] text-white transition-colors"
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button asChild size="lg" className="bg-[#1993e5] hover:bg-[#1680cc] text-white px-8">
            <Link href="/jobs" className="flex items-center space-x-2">
              <span>View All Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}