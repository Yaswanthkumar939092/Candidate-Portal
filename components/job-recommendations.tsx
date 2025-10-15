'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  TrendingUp,
  Target,
  Star,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Filter,
  Settings,
  Eye,
  Users,
  Calendar,
  BarChart3,
  Heart,
  X,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JobCard } from "./job-card";

export interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  postedAt: string;
  tags: string[];
  logo?: string;
  matchScore: number;
  matchReasons: string[];
  isNew: boolean;
  isTrending: boolean;
  applicantCount: number;
  requirements: string[];
  benefits: string[];
  companyRating?: number;
  remote: boolean;
  sponsored: boolean;
}

export interface RecommendationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  jobs: JobRecommendation[];
  algorithm: 'skill_match' | 'location_match' | 'experience_match' | 'trending' | 'similar_roles';
}

interface JobRecommendationsProps {
  categories: RecommendationCategory[];
  userProfile?: {
    skills: string[];
    experience: string;
    location: string;
    preferences: {
      jobTypes: string[];
      salaryRange: [number, number];
      remote: boolean;
    };
  };
  onApply: (jobId: string) => void;
  onSave: (jobId: string) => void;
  onFeedback: (jobId: string, feedback: 'like' | 'dislike', reason?: string) => void;
  onRefresh: () => Promise<void>;
  className?: string;
  showMatchScores?: boolean;
}

export function JobRecommendations({
  categories,
  userProfile,
  onApply,
  onSave,
  onFeedback,
  onRefresh,
  className,
  showMatchScores = true
}: JobRecommendationsProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFeedback = (jobId: string, feedback: 'like' | 'dislike') => {
    onFeedback(jobId, feedback);
    setFeedbackGiven(prev => new Set([...prev, jobId]));
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const renderJobCard = (job: JobRecommendation, showDetailedMatch = false) => (
    <Card key={job.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4">
        {/* Header with company info and match score */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {job.logo ? (
                <img
                  src={job.logo}
                  alt={`${job.company} logo`}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Building2 className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#1993e5] transition-colors line-clamp-1">
                  {job.title}
                </h3>
                {job.isNew && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    New
                  </Badge>
                )}
                {job.isTrending && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
                {job.sponsored && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                    Sponsored
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600 font-medium">{job.company}</p>
                {job.companyRating && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-500">{job.companyRating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showMatchScores && (
            <div className={cn(
              "px-2 py-1 rounded-md text-xs font-semibold",
              getMatchScoreColor(job.matchScore)
            )}>
              {job.matchScore}% match
            </div>
          )}
        </div>

        {/* Job details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
            {job.remote && (
              <Badge variant="secondary" className="text-xs ml-1">Remote</Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{job.type}</span>
          </div>
          {job.salary && (
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>{job.salary}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{job.applicantCount} applicants</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm line-clamp-2 leading-relaxed mb-3">
          {job.description}
        </p>

        {/* Match reasons (detailed view) */}
        {showDetailedMatch && job.matchReasons.length > 0 && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-1" />
              Why this matches you:
            </h4>
            <ul className="space-y-1">
              {job.matchReasons.slice(0, 3).map((reason, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {job.tags.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium px-2 py-1 rounded-md"
            >
              {tag}
            </Badge>
          ))}
          {job.tags.length > 4 && (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-md"
            >
              +{job.tags.length - 4}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">{job.postedAt}</span>
            {!feedbackGiven.has(job.id) && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback(job.id, 'like')}
                  className="h-7 px-2 text-gray-500 hover:text-green-600"
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback(job.id, 'dislike')}
                  className="h-7 px-2 text-gray-500 hover:text-red-600"
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSave(job.id)}
              className="text-gray-400 hover:text-[#1993e5] hover:bg-blue-50 transition-colors h-8 px-2"
            >
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onApply(job.id)}
              className="bg-[#1993e5] hover:bg-[#1680cc] text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 h-8"
            >
              Apply Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCategoryOverview = (category: RecommendationCategory) => (
    <Card key={category.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => setActiveCategory(category.id)}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            {category.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-600">{category.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{category.jobs.length}</p>
            <p className="text-xs text-gray-500">jobs</p>
          </div>
        </div>

        {/* Top 2 jobs preview */}
        <div className="space-y-2">
          {category.jobs.slice(0, 2).map((job) => (
            <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                <p className="text-xs text-gray-600">{job.company} • {job.location}</p>
              </div>
              {showMatchScores && (
                <Badge className={cn("text-xs", getMatchScoreColor(job.matchScore))}>
                  {job.matchScore}%
                </Badge>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <span className="text-sm text-gray-600">View all recommendations</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );

  const activeJobs = categories.find(c => c.id === activeCategory)?.jobs || [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Job Recommendations</h2>
            <p className="text-gray-600 text-sm">Personalized jobs based on your profile</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* User Profile Summary */}
      {userProfile && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {userProfile.skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {userProfile.skills.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{userProfile.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Experience</p>
                <p className="text-gray-600">{userProfile.experience}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Location</p>
                <p className="text-gray-600">{userProfile.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 lg:grid-cols-5 h-auto p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">
            Overview
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="data-[state=active]:bg-white flex items-center space-x-1"
            >
              <span className="hidden sm:inline">{category.icon}</span>
              <span>{category.name}</span>
              <Badge variant="secondary" className="text-xs">
                {category.jobs.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(renderCategoryOverview)}
          </div>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {category.icon}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
              <Badge variant="secondary">
                {category.jobs.length} recommendations
              </Badge>
            </div>

            <div className="space-y-4">
              {category.jobs.length > 0 ? (
                category.jobs.map((job) => renderJobCard(job, true))
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No recommendations yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We're still learning about your preferences. Apply to more jobs or update your profile to get better recommendations.
                    </p>
                    <Button className="bg-[#1993e5] hover:bg-[#1680cc]">
                      Update Profile
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Example usage component with sample data
export function JobRecommendationsExample() {
  const sampleCategories: RecommendationCategory[] = [
    {
      id: 'skill_match',
      name: 'Skill Match',
      description: 'Jobs that match your technical skills',
      icon: <Target className="w-5 h-5 text-blue-600" />,
      algorithm: 'skill_match',
      jobs: [
        {
          id: '1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp Inc.',
          location: 'San Francisco, CA',
          type: 'Full-time',
          salary: '$120,000 - $150,000',
          description: 'We are looking for an experienced Frontend Developer to join our team and help build the next generation of web applications.',
          postedAt: '2 days ago',
          tags: ['React', 'TypeScript', 'Next.js', 'GraphQL'],
          matchScore: 95,
          matchReasons: [
            'Strong React and TypeScript skills match',
            'Next.js experience aligns with job requirements',
            'Remote work preference matches job offering'
          ],
          isNew: true,
          isTrending: false,
          applicantCount: 23,
          requirements: ['5+ years React', 'TypeScript proficiency', 'GraphQL experience'],
          benefits: ['Health insurance', 'Remote work', 'Stock options'],
          companyRating: 4.8,
          remote: true,
          sponsored: false
        }
      ]
    },
    {
      id: 'trending',
      name: 'Trending',
      description: 'Popular jobs with high application rates',
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      algorithm: 'trending',
      jobs: [
        {
          id: '2',
          title: 'Product Manager',
          company: 'StartupXYZ',
          location: 'New York, NY',
          type: 'Full-time',
          salary: '$130,000 - $160,000',
          description: 'Lead product strategy and work with engineering teams to build innovative solutions.',
          postedAt: '1 day ago',
          tags: ['Product Management', 'Strategy', 'Analytics', 'Roadmapping'],
          matchScore: 78,
          matchReasons: [
            'Leadership experience matches role requirements',
            'Analytics skills relevant to position'
          ],
          isNew: false,
          isTrending: true,
          applicantCount: 156,
          requirements: ['3+ years PM experience', 'Technical background', 'Analytics skills'],
          benefits: ['Equity', 'Flexible hours', 'Learning budget'],
          companyRating: 4.2,
          remote: false,
          sponsored: true
        }
      ]
    },
    {
      id: 'location_match',
      name: 'Location',
      description: 'Jobs in your preferred location',
      icon: <MapPin className="w-5 h-5 text-purple-600" />,
      algorithm: 'location_match',
      jobs: []
    },
    {
      id: 'similar_roles',
      name: 'Similar',
      description: 'Jobs similar to your current role',
      icon: <Users className="w-5 h-5 text-orange-600" />,
      algorithm: 'similar_roles',
      jobs: []
    }
  ];

  const sampleUserProfile = {
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
    experience: '5+ years',
    location: 'San Francisco Bay Area',
    preferences: {
      jobTypes: ['Full-time', 'Contract'],
      salaryRange: [100000, 180000] as [number, number],
      remote: true
    }
  };

  const handleApply = (jobId: string) => {
    console.log('Apply to job:', jobId);
  };

  const handleSave = (jobId: string) => {
    console.log('Save job:', jobId);
  };

  const handleFeedback = (jobId: string, feedback: 'like' | 'dislike', reason?: string) => {
    console.log('Job feedback:', { jobId, feedback, reason });
  };

  const handleRefresh = async () => {
    console.log('Refreshing recommendations...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <JobRecommendations
      categories={sampleCategories}
      userProfile={sampleUserProfile}
      onApply={handleApply}
      onSave={handleSave}
      onFeedback={handleFeedback}
      onRefresh={handleRefresh}
    />
  );
}