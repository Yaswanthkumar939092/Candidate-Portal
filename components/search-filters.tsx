"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, Filter, X } from "lucide-react";

interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
  onClear?: () => void;
}

export interface SearchFilters {
  query: string;
  location: string;
  jobType: string;
  salaryRange: string;
  experienceLevel: string;
  skills: string[];
}

export function SearchFilters({ onSearch, onClear }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    location: "",
    jobType: "",
    salaryRange: "",
    experienceLevel: "",
    skills: [],
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const jobTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship",
    "Remote",
  ];

  const salaryRanges = [
    "Under $50k",
    "$50k - $75k",
    "$75k - $100k",
    "$100k - $150k",
    "Over $150k",
  ];

  const experienceLevels = [
    "Entry Level",
    "Mid Level",
    "Senior Level",
    "Lead/Principal",
    "Executive",
  ];

  const popularSkills = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "TypeScript",
    "Java",
    "AWS",
    "Docker",
    "Kubernetes",
    "GraphQL",
    "MongoDB",
    "PostgreSQL",
  ];

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  const handleSkillToggle = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];

    const newFilters = { ...filters, skills: newSkills };
    setFilters(newFilters);
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    const clearedFilters = {
      query: "",
      location: "",
      jobType: "",
      salaryRange: "",
      experienceLevel: "",
      skills: [],
    };
    setFilters(clearedFilters);
    onClear?.();
  };

  const activeFiltersCount = Object.values(filters).filter(value =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  ).length;

  return (
    <Card className="bg-white border-0 shadow-sm rounded-xl">
      <CardContent className="p-6 space-y-4">
        {/* Main Search Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search jobs, companies, or keywords..."
              value={filters.query}
              onChange={(e) => handleInputChange("query", e.target.value)}
              className="pl-10 h-12 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5]"
            />
          </div>
          <div className="relative md:w-64">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Location"
              value={filters.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="pl-10 h-12 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5]"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="h-12 bg-[#1993e5] hover:bg-[#1680cc] text-white font-medium px-8 rounded-lg transition-colors duration-200"
          >
            Search
          </Button>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-[#1993e5] text-white text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Job Type</label>
                <Select value={filters.jobType} onValueChange={(value) => handleInputChange("jobType", value)}>
                  <SelectTrigger className="h-10 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5]">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Salary Range</label>
                <Select value={filters.salaryRange} onValueChange={(value) => handleInputChange("salaryRange", value)}>
                  <SelectTrigger className="h-10 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5]">
                    <SelectValue placeholder="Any salary" />
                  </SelectTrigger>
                  <SelectContent>
                    {salaryRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Experience Level</label>
                <Select value={filters.experienceLevel} onValueChange={(value) => handleInputChange("experienceLevel", value)}>
                  <SelectTrigger className="h-10 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5]">
                    <SelectValue placeholder="Any level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Skills</label>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={skill}
                      checked={filters.skills.includes(skill)}
                      onCheckedChange={() => handleSkillToggle(skill)}
                      className="rounded"
                    />
                    <label
                      htmlFor={skill}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {skill}
                    </label>
                  </div>
                ))}
              </div>
              {filters.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {filters.skills.map((skill) => (
                    <Badge
                      key={skill}
                      className="bg-[#1993e5] text-white hover:bg-[#1680cc] cursor-pointer"
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}