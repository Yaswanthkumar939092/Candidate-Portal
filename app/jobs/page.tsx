"use client";

import { useState } from "react";
import { SearchFilters as SearchFiltersComponent, SearchFilters as SearchFiltersType } from "@/components/search-filters";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Mock job data
const mockJobs = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120k - $160k",
    description: "We are looking for an experienced Frontend Developer to join our dynamic team. You'll be working on cutting-edge web applications using React, TypeScript, and modern development practices.",
    postedAt: "2 days ago",
    tags: ["React", "TypeScript", "JavaScript", "CSS", "Git"],
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    location: "Remote",
    type: "Full-time",
    salary: "$100k - $140k",
    description: "Join our growing startup as a Full Stack Engineer. You'll work across the entire technology stack, from React frontends to Node.js backends and cloud infrastructure.",
    postedAt: "3 days ago",
    tags: ["React", "Node.js", "TypeScript", "AWS", "MongoDB"],
  },
  {
    id: "3",
    title: "UI/UX Designer",
    company: "Design Studio",
    location: "New York, NY",
    type: "Contract",
    salary: "$80k - $100k",
    description: "We're seeking a talented UI/UX Designer to create beautiful, user-friendly interfaces for our clients. Experience with Figma and modern design systems required.",
    postedAt: "1 week ago",
    tags: ["Figma", "UI Design", "UX Design", "Prototyping", "Design Systems"],
  },
  {
    id: "4",
    title: "DevOps Engineer",
    company: "CloudTech Solutions",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$110k - $150k",
    description: "Looking for a DevOps Engineer to help build and maintain our cloud infrastructure. Experience with Kubernetes, Docker, and CI/CD pipelines is essential.",
    postedAt: "4 days ago",
    tags: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"],
  },
  {
    id: "5",
    title: "Product Manager",
    company: "InnovateNow",
    location: "Seattle, WA",
    type: "Full-time",
    salary: "$130k - $180k",
    description: "Join our product team to drive the development of innovative solutions. You'll work closely with engineering, design, and business teams to deliver exceptional products.",
    postedAt: "5 days ago",
    tags: ["Product Strategy", "Agile", "Analytics", "Leadership", "Communication"],
  },
  {
    id: "6",
    title: "Data Scientist",
    company: "DataCorp",
    location: "Boston, MA",
    type: "Full-time",
    salary: "$115k - $155k",
    description: "We're looking for a Data Scientist to analyze complex datasets and derive actionable insights. Strong background in Python, machine learning, and statistical analysis required.",
    postedAt: "1 week ago",
    tags: ["Python", "Machine Learning", "Statistics", "SQL", "Pandas"],
  },
];

export default function JobsPage() {
  const [jobs] = useState(mockJobs);
  const [filteredJobs, setFilteredJobs] = useState(mockJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState<SearchFiltersType>({
    query: "",
    location: "",
    jobType: "",
    salaryRange: "",
    experienceLevel: "",
    skills: [],
  });

  const jobsPerPage = 10;
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  const handleSearch = (filters: SearchFiltersType) => {
    setIsLoading(true);
    setAppliedFilters(filters);

    // Simulate API call delay
    setTimeout(() => {
      let filtered = [...jobs];

      // Apply filters
      if (filters.query) {
        filtered = filtered.filter(job =>
          job.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          job.company.toLowerCase().includes(filters.query.toLowerCase()) ||
          job.description.toLowerCase().includes(filters.query.toLowerCase())
        );
      }

      if (filters.location) {
        filtered = filtered.filter(job =>
          job.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.jobType) {
        filtered = filtered.filter(job => job.type === filters.jobType);
      }

      if (filters.skills.length > 0) {
        filtered = filtered.filter(job =>
          filters.skills.some(skill =>
            job.tags.some(tag => tag.toLowerCase().includes(skill.toLowerCase()))
          )
        );
      }

      setFilteredJobs(filtered);
      setCurrentPage(1);
      setIsLoading(false);
    }, 800);
  };

  const handleClearFilters = () => {
    setAppliedFilters({
      query: "",
      location: "",
      jobType: "",
      salaryRange: "",
      experienceLevel: "",
      skills: [],
    });
    setFilteredJobs(jobs);
    setCurrentPage(1);
  };

  const handleApply = (jobId: string) => {
    console.log("Apply to job:", jobId);
    // TODO: Implement job application logic
  };

  const handleSave = (jobId: string) => {
    console.log("Save job:", jobId);
    // TODO: Implement save job logic
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters = Object.values(appliedFilters).some(value =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Find Your Next Opportunity
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing job opportunities from top companies around the world
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <SearchFiltersComponent onSearch={handleSearch} onClear={handleClearFilters} />
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {appliedFilters.query && (
                <Badge className="bg-[#1993e5] text-white">
                  Query: {appliedFilters.query}
                </Badge>
              )}
              {appliedFilters.location && (
                <Badge className="bg-[#1993e5] text-white">
                  Location: {appliedFilters.location}
                </Badge>
              )}
              {appliedFilters.jobType && (
                <Badge className="bg-[#1993e5] text-white">
                  Type: {appliedFilters.jobType}
                </Badge>
              )}
              {appliedFilters.skills.map(skill => (
                <Badge key={skill} className="bg-[#1993e5] text-white">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isLoading ? "Searching..." : `${filteredJobs.length} jobs found`}
          </h2>
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-4 mb-8">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start space-x-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-18" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : currentJobs.length > 0 ? (
            currentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={handleApply}
                onSave={handleSave}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or clearing filters
              </p>
              <Button
                onClick={handleClearFilters}
                className="bg-[#1993e5] hover:bg-[#1680cc] text-white"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const distance = Math.abs(page - currentPage);
                  return distance <= 2 || page === 1 || page === totalPages;
                })
                .map((page, index, array) => {
                  if (index > 0 && array[index - 1] !== page - 1) {
                    return (
                      <span key={`ellipsis-${page}`} className="text-gray-400 px-2">
                        ...
                      </span>
                    );
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                      className={
                        currentPage === page
                          ? "bg-[#1993e5] hover:bg-[#1680cc] text-white"
                          : ""
                      }
                    >
                      {page}
                    </Button>
                  );
                })}
            </div>

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}