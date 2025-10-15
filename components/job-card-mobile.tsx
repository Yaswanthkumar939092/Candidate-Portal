'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Bookmark,
  BookmarkCheck,
  Heart,
  Share2,
  ExternalLink,
  ChevronRight,
  Star,
  Users,
  TrendingUp,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobCardMobileProps {
  job: {
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
    companyRating?: number;
    applicantCount?: number;
    matchScore?: number;
    isNew?: boolean;
    isTrending?: boolean;
    remote?: boolean;
    sponsored?: boolean;
  };
  saved?: boolean;
  liked?: boolean;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  onLike?: (jobId: string) => void;
  onShare?: (jobId: string) => void;
  onView?: (jobId: string) => void;
  className?: string;
  showGestures?: boolean;
}

export function JobCardMobile({
  job,
  saved = false,
  liked = false,
  onApply,
  onSave,
  onLike,
  onShare,
  onView,
  className,
  showGestures = true
}: JobCardMobileProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, time: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const minSwipeDistance = 50;
  const maxDragDistance = 120;

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showGestures) return;

    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });

    setIsPressed(true);

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!showGestures || !touchStart) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Clear long press if user moves too much
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    }

    // Handle horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault(); // Prevent scrolling
      const clampedOffset = Math.max(-maxDragDistance, Math.min(maxDragDistance, deltaX));
      setDragOffset(clampedOffset);

      if (Math.abs(deltaX) > minSwipeDistance) {
        setSwipeDirection(deltaX > 0 ? 'right' : 'left');
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!showGestures) return;

    const touch = e.changedTouches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
    setIsPressed(false);

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Handle swipe actions
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      setIsAnimating(true);

      if (deltaX > 0) {
        // Swipe right - save/unsave
        onSave?.(job.id);
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      } else {
        // Swipe left - like/unlike
        onLike?.(job.id);
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      }

      // Reset after animation
      setTimeout(() => {
        setDragOffset(0);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 300);
    } else {
      // Reset position if no action
      setIsAnimating(true);
      setTimeout(() => {
        setDragOffset(0);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 200);
    }

    // Handle tap
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      if (!showActions) {
        onView?.(job.id);
      }
      setShowActions(false);
    }
  };

  // Click handlers for non-touch devices
  const handleClick = () => {
    if (!showGestures) {
      onView?.(job.id);
    }
  };

  const handleLongPress = () => {
    setShowActions(true);
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Swipe Action Indicators */}
      {showGestures && (
        <>
          {/* Save action (swipe right) */}
          <div
            className={cn(
              "absolute left-4 top-0 bottom-0 flex items-center transition-opacity duration-200 z-10",
              dragOffset > 20 ? "opacity-100" : "opacity-0"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              swipeDirection === 'right' ? "bg-green-500 scale-110" : "bg-green-400"
            )}>
              <Bookmark className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Like action (swipe left) */}
          <div
            className={cn(
              "absolute right-4 top-0 bottom-0 flex items-center transition-opacity duration-200 z-10",
              dragOffset < -20 ? "opacity-100" : "opacity-0"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              swipeDirection === 'left' ? "bg-red-500 scale-110" : "bg-red-400"
            )}>
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
        </>
      )}

      {/* Main Card */}
      <Card
        ref={cardRef}
        className={cn(
          "border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden",
          isPressed && "scale-98 shadow-lg",
          isAnimating && "transition-transform duration-300",
          className
        )}
        style={{
          transform: showGestures ? `translateX(${dragOffset}px)` : undefined
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          {/* Header with Company Info */}
          <div className="flex items-start space-x-3 mb-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
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
                <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                  {job.title}
                </h3>
                {job.isNew && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    New
                  </Badge>
                )}
                {job.isTrending && (
                  <TrendingUp className="w-4 h-4 text-orange-500" />
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

            {/* Quick Actions */}
            <div className="flex items-center space-x-1">
              {job.matchScore && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                  {job.matchScore}%
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Job Details */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
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
            {job.applicantCount && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{job.applicantCount} applicants</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-700 text-sm line-clamp-2 leading-relaxed mb-3">
            {job.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {job.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md"
              >
                {tag}
              </Badge>
            ))}
            {job.tags.length > 3 && (
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md"
              >
                +{job.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{job.postedAt}</span>
              {job.sponsored && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                  Sponsored
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Status indicators */}
              <div className="flex items-center space-x-1">
                {saved && (
                  <BookmarkCheck className="w-4 h-4 text-green-600" />
                )}
                {liked && (
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                )}
              </div>

              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply?.(job.id);
                }}
                className="bg-[#1993e5] hover:bg-[#1680cc] text-white px-4 py-2 h-8"
              >
                Apply
              </Button>
            </div>
          </div>
        </CardContent>

        {/* Gesture Hint */}
        {showGestures && !showActions && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <ChevronRight className="w-3 h-3" />
                <span>Save</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Like</span>
                <ChevronRight className="w-3 h-3 rotate-180" />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Action Menu Overlay */}
      {showActions && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-20">
          <div className="bg-white rounded-xl p-4 mx-4 w-full max-w-xs">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.(job.id);
                  setShowActions(false);
                }}
                className="flex flex-col items-center space-y-1 h-16"
              >
                <Bookmark className={cn("w-5 h-5", saved && "fill-current text-green-600")} />
                <span className="text-xs">{saved ? 'Saved' : 'Save'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.(job.id);
                  setShowActions(false);
                }}
                className="flex flex-col items-center space-y-1 h-16"
              >
                <Heart className={cn("w-5 h-5", liked && "fill-current text-red-500")} />
                <span className="text-xs">{liked ? 'Liked' : 'Like'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(job.id);
                  setShowActions(false);
                }}
                className="flex flex-col items-center space-y-1 h-16"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-xs">Share</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(job.id);
                  setShowActions(false);
                }}
                className="flex flex-col items-center space-y-1 h-16"
              >
                <Eye className="w-5 h-5" />
                <span className="text-xs">View</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(false)}
              className="w-full mt-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Example usage component
export function JobCardMobileExample() {
  const sampleJob = {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120,000 - $150,000',
    description: 'We are looking for an experienced Frontend Developer to join our team and help build the next generation of web applications with React and TypeScript.',
    postedAt: '2 days ago',
    tags: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Tailwind CSS'],
    companyRating: 4.8,
    applicantCount: 23,
    matchScore: 95,
    isNew: true,
    remote: true,
    sponsored: false
  };

  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleApply = (jobId: string) => {
    console.log('Apply to job:', jobId);
  };

  const handleSave = (jobId: string) => {
    setSaved(!saved);
    console.log('Toggle save job:', jobId);
  };

  const handleLike = (jobId: string) => {
    setLiked(!liked);
    console.log('Toggle like job:', jobId);
  };

  const handleShare = (jobId: string) => {
    console.log('Share job:', jobId);
  };

  const handleView = (jobId: string) => {
    console.log('View job:', jobId);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Mobile Job Card with Gestures</h2>
      <p className="text-gray-600 text-sm">
        • Swipe right to save/unsave<br/>
        • Swipe left to like/unlike<br/>
        • Tap to view details<br/>
        • Long press for action menu
      </p>

      <JobCardMobile
        job={sampleJob}
        saved={saved}
        liked={liked}
        onApply={handleApply}
        onSave={handleSave}
        onLike={handleLike}
        onShare={handleShare}
        onView={handleView}
        showGestures={true}
      />
    </div>
  );
}