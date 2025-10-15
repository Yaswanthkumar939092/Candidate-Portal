'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import {
  Bookmark,
  BookmarkCheck,
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  Trash2,
  Share2,
  Eye,
  ExternalLink,
  Plus,
  Archive,
  Star,
  MoreVertical,
  SortAsc,
  SortDesc,
  CheckCircle2,
  AlertCircle,
  Folder,
  Tag,
  Heart,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { JobCard } from "./job-card";

export interface SavedJob {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  postedAt: string;
  savedAt: string;
  tags: string[];
  logo?: string;
  status: 'active' | 'archived' | 'expired';
  applicationStatus?: 'not_applied' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  notes?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  deadlineDate?: string;
  isUrgent?: boolean;
  companyRating?: number;
  matchScore?: number;
}

export interface SavedJobsCategory {
  id: string;
  name: string;
  color: string;
  jobCount: number;
}

interface SavedJobsListProps {
  jobs: SavedJob[];
  categories: SavedJobsCategory[];
  onApply: (jobId: string) => void;
  onRemove: (savedJobId: string) => void;
  onArchive: (savedJobId: string) => void;
  onUpdateNotes: (savedJobId: string, notes: string) => void;
  onUpdateCategory: (savedJobId: string, categoryId: string) => void;
  onUpdatePriority: (savedJobId: string, priority: 'low' | 'medium' | 'high') => void;
  onCreateCategory: (name: string, color: string) => void;
  className?: string;
  showBulkActions?: boolean;
}

export function SavedJobsList({
  jobs,
  categories,
  onApply,
  onRemove,
  onArchive,
  onUpdateNotes,
  onUpdateCategory,
  onUpdatePriority,
  onCreateCategory,
  className,
  showBulkActions = true
}: SavedJobsListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');

  // Filter and sort jobs
  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.tags.some(tag => tag.toLowerCase().includes(query)) ||
        job.notes?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(job => job.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(job => job.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(job => job.priority === selectedPriority);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof SavedJob];
      let bValue: any = b[sortBy as keyof SavedJob];

      if (sortBy === 'savedAt' || sortBy === 'postedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredJobs(filtered);
  }, [jobs, searchQuery, selectedCategory, selectedStatus, selectedPriority, sortBy, sortOrder]);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filteredJobs.map(job => job.id)));
    }
  };

  const handleBulkAction = (action: 'remove' | 'archive' | 'apply') => {
    selectedJobs.forEach(jobId => {
      switch (action) {
        case 'remove':
          onRemove(jobId);
          break;
        case 'archive':
          onArchive(jobId);
          break;
        case 'apply':
          const job = jobs.find(j => j.id === jobId);
          if (job) onApply(job.jobId);
          break;
      }
    });
    setSelectedJobs(new Set());
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      onCreateCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('blue');
      setShowCategoryDialog(false);
    }
  };

  const getStatusBadge = (status: string, applicationStatus?: string) => {
    if (applicationStatus) {
      const statusConfig = {
        not_applied: { label: 'Not Applied', class: 'bg-gray-100 text-gray-800 border-gray-200' },
        applied: { label: 'Applied', class: 'bg-blue-100 text-blue-800 border-blue-200' },
        interviewing: { label: 'Interviewing', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        offered: { label: 'Offered', class: 'bg-green-100 text-green-800 border-green-200' },
        rejected: { label: 'Rejected', class: 'bg-red-100 text-red-800 border-red-200' }
      };

      const config = statusConfig[applicationStatus as keyof typeof statusConfig];
      return (
        <Badge className={cn("text-xs border", config.class)}>
          {config.label}
        </Badge>
      );
    }

    const statusConfig = {
      active: { label: 'Active', class: 'bg-green-100 text-green-800 border-green-200' },
      archived: { label: 'Archived', class: 'bg-gray-100 text-gray-600 border-gray-200' },
      expired: { label: 'Expired', class: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={cn("text-xs border", config.class)}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Star className="w-4 h-4 text-red-500 fill-current" />;
      case 'medium':
        return <Star className="w-4 h-4 text-yellow-500 fill-current" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderJobCard = (job: SavedJob) => (
    <Card key={job.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {showBulkActions && (
            <Checkbox
              checked={selectedJobs.has(job.id)}
              onCheckedChange={() => handleSelectJob(job.id)}
              className="mt-1"
            />
          )}

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
              {getPriorityIcon(job.priority)}
              {job.isUrgent && (
                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                  Urgent
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <p className="text-sm text-gray-600 font-medium">{job.company}</p>
              {job.companyRating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-gray-500">{job.companyRating}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
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
            </div>

            <div className="flex items-center space-x-2 mb-2">
              {getStatusBadge(job.status, job.applicationStatus)}
              {job.matchScore && (
                <Badge variant="secondary" className="text-xs">
                  {job.matchScore}% match
                </Badge>
              )}
              {job.category && (
                <Badge variant="secondary" className="text-xs">
                  <Folder className="w-3 h-3 mr-1" />
                  {categories.find(c => c.id === job.category)?.name || job.category}
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-700 line-clamp-2 mb-3">{job.description}</p>

            {job.notes && (
              <div className="p-2 bg-blue-50 rounded-md mb-3">
                <p className="text-xs text-blue-800 line-clamp-2">
                  <strong>Notes:</strong> {job.notes}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {job.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1"
                >
                  {tag}
                </Badge>
              ))}
              {job.tags.length > 3 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs px-2 py-1">
                  +{job.tags.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <span>Saved {formatDate(job.savedAt)}</span>
                <span>Posted {job.postedAt}</span>
                {job.deadlineDate && (
                  <span className="text-red-600">
                    Deadline: {formatDate(job.deadlineDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onApply(job.jobId)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Apply Now
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" />
                Share Job
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Tag className="w-4 h-4 mr-2" />
                Edit Notes
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Folder className="w-4 h-4 mr-2" />
                Change Category
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="w-4 h-4 mr-2" />
                Set Priority
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onArchive(job.id)}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRemove(job.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  const renderListView = (job: SavedJob) => (
    <div key={job.id} className="flex items-center space-x-4 p-4 border-b hover:bg-gray-50 transition-colors">
      {showBulkActions && (
        <Checkbox
          checked={selectedJobs.has(job.id)}
          onCheckedChange={() => handleSelectJob(job.id)}
        />
      )}

      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {job.logo ? (
          <img
            src={job.logo}
            alt={`${job.company} logo`}
            className="w-6 h-6 object-contain"
          />
        ) : (
          <Building2 className="w-5 h-5 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="text-base font-semibold text-gray-900 truncate">{job.title}</h3>
          {getPriorityIcon(job.priority)}
          {getStatusBadge(job.status, job.applicationStatus)}
        </div>
        <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
      </div>

      <div className="hidden md:block text-sm text-gray-500">
        Saved {formatDate(job.savedAt)}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          onClick={() => onApply(job.jobId)}
          className="bg-[#1993e5] hover:bg-[#1680cc]"
        >
          Apply
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRemove(job.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <BookmarkCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Saved Jobs</h2>
            <p className="text-gray-600 text-sm">
              {filteredJobs.length} of {jobs.length} saved jobs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Category Name</label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Select value={newCategoryColor} onValueChange={setNewCategoryColor}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateCategory} className="w-full">
                  Create Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center space-x-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Overview */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div
            className={cn(
              "p-3 border-2 rounded-lg cursor-pointer transition-colors",
              selectedCategory === 'all' ? "border-[#1993e5] bg-blue-50" : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => setSelectedCategory('all')}
          >
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{jobs.length}</p>
              <p className="text-xs text-gray-600">All Jobs</p>
            </div>
          </div>
          {categories.map((category) => (
            <div
              key={category.id}
              className={cn(
                "p-3 border-2 rounded-lg cursor-pointer transition-colors",
                selectedCategory === category.id ? "border-[#1993e5] bg-blue-50" : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{category.jobCount}</p>
                <p className="text-xs text-gray-600">{category.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search saved jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savedAt">Date Saved</SelectItem>
                  <SelectItem value="postedAt">Date Posted</SelectItem>
                  <SelectItem value="title">Job Title</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {showBulkActions && selectedJobs.size > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedJobs.size === filteredJobs.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium text-blue-900">
                  {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''} selected
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('apply')}
                  className="text-blue-700 border-blue-300"
                >
                  Apply to Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('archive')}
                  className="text-blue-700 border-blue-300"
                >
                  Archive Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('remove')}
                  className="text-red-600 border-red-300"
                >
                  Remove Selected
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredJobs.map(renderJobCard)}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {filteredJobs.map(renderListView)}
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <BookmarkCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'No jobs found'
                : 'No saved jobs yet'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Start saving jobs you\'re interested in to keep track of them here.'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && selectedStatus === 'all' && (
              <Button className="bg-[#1993e5] hover:bg-[#1680cc]">
                Browse Jobs
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Example usage component with sample data
export function SavedJobsListExample() {
  const sampleJobs: SavedJob[] = [
    {
      id: '1',
      jobId: 'job-123',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$120,000 - $150,000',
      description: 'We are looking for an experienced Frontend Developer to join our team and help build the next generation of web applications.',
      postedAt: '3 days ago',
      savedAt: '2024-01-20T10:30:00Z',
      tags: ['React', 'TypeScript', 'Next.js', 'GraphQL'],
      status: 'active',
      applicationStatus: 'not_applied',
      priority: 'high',
      category: 'frontend',
      notes: 'Great company culture, remote-friendly, matches my React skills perfectly.',
      matchScore: 95,
      companyRating: 4.8,
      deadlineDate: '2024-02-15T00:00:00Z'
    },
    {
      id: '2',
      jobId: 'job-456',
      title: 'Product Manager',
      company: 'StartupXYZ',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$130,000 - $160,000',
      description: 'Lead product strategy and work with engineering teams to build innovative solutions.',
      postedAt: '1 week ago',
      savedAt: '2024-01-18T14:20:00Z',
      tags: ['Product Management', 'Strategy', 'Analytics'],
      status: 'active',
      applicationStatus: 'applied',
      priority: 'medium',
      category: 'product',
      notes: 'Applied last week, waiting for response.',
      companyRating: 4.2
    }
  ];

  const sampleCategories: SavedJobsCategory[] = [
    { id: 'frontend', name: 'Frontend', color: 'blue', jobCount: 12 },
    { id: 'product', name: 'Product', color: 'green', jobCount: 8 },
    { id: 'design', name: 'Design', color: 'purple', jobCount: 5 },
    { id: 'startup', name: 'Startups', color: 'orange', jobCount: 15 }
  ];

  const [jobs, setJobs] = useState(sampleJobs);
  const [categories] = useState(sampleCategories);

  const handleApply = (jobId: string) => {
    console.log('Apply to job:', jobId);
  };

  const handleRemove = (savedJobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== savedJobId));
  };

  const handleArchive = (savedJobId: string) => {
    setJobs(prev => prev.map(job =>
      job.id === savedJobId ? { ...job, status: 'archived' as const } : job
    ));
  };

  const handleUpdateNotes = (savedJobId: string, notes: string) => {
    setJobs(prev => prev.map(job =>
      job.id === savedJobId ? { ...job, notes } : job
    ));
  };

  const handleUpdateCategory = (savedJobId: string, categoryId: string) => {
    setJobs(prev => prev.map(job =>
      job.id === savedJobId ? { ...job, category: categoryId } : job
    ));
  };

  const handleUpdatePriority = (savedJobId: string, priority: 'low' | 'medium' | 'high') => {
    setJobs(prev => prev.map(job =>
      job.id === savedJobId ? { ...job, priority } : job
    ));
  };

  const handleCreateCategory = (name: string, color: string) => {
    console.log('Create category:', { name, color });
  };

  return (
    <SavedJobsList
      jobs={jobs}
      categories={categories}
      onApply={handleApply}
      onRemove={handleRemove}
      onArchive={handleArchive}
      onUpdateNotes={handleUpdateNotes}
      onUpdateCategory={handleUpdateCategory}
      onUpdatePriority={handleUpdatePriority}
      onCreateCategory={handleCreateCategory}
    />
  );
}