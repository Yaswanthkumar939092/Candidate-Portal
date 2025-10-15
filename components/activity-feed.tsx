'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Calendar,
  MessageCircle,
  Eye,
  Bookmark,
  Heart,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  ArrowRight,
  Filter,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  type: 'application' | 'interview' | 'message' | 'profile_view' | 'job_save' | 'job_like' | 'document_upload' | 'profile_update' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    jobId?: string;
    jobTitle?: string;
    companyName?: string;
    companyLogo?: string;
    applicationId?: string;
    interviewType?: string;
    interviewDate?: string;
    senderName?: string;
    senderAvatar?: string;
    documentName?: string;
    fieldName?: string;
    achievementType?: string;
    count?: number;
  };
  status?: 'success' | 'pending' | 'failed' | 'info';
  actionUrl?: string;
  actionText?: string;
  priority?: 'high' | 'medium' | 'low';
  read?: boolean;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onActivityClick?: (activity: ActivityItem) => void;
  onMarkAsRead?: (activityId: string) => void;
  onMarkAllAsRead?: () => void;
  onRefresh?: () => Promise<void>;
  className?: string;
  showFilters?: boolean;
  showGrouping?: boolean;
  maxItems?: number;
  variant?: 'full' | 'compact' | 'card';
}

export function ActivityFeed({
  activities,
  onActivityClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
  className,
  showFilters = true,
  showGrouping = true,
  maxItems,
  variant = 'full'
}: ActivityFeedProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const filtered = selectedFilter === 'all'
      ? activities
      : activities.filter(activity => activity.type === selectedFilter);

    const limited = maxItems ? filtered.slice(0, maxItems) : filtered;

    if (!showGrouping) {
      return [{ date: '', activities: limited }];
    }

    const groups: { [key: string]: ActivityItem[] } = {};

    limited.forEach(activity => {
      const date = new Date(activity.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;

      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        groupKey = date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        groupKey = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    });

    return Object.entries(groups).map(([date, activities]) => ({
      date,
      activities
    }));
  }, [activities, selectedFilter, maxItems, showGrouping]);

  const getActivityIcon = (type: string, status?: string) => {
    const iconClass = "w-5 h-5";

    switch (type) {
      case 'application':
        return status === 'success' ? (
          <CheckCircle2 className={cn(iconClass, "text-green-600")} />
        ) : status === 'failed' ? (
          <XCircle className={cn(iconClass, "text-red-600")} />
        ) : (
          <FileText className={cn(iconClass, "text-blue-600")} />
        );

      case 'interview':
        return <Calendar className={cn(iconClass, "text-purple-600")} />;

      case 'message':
        return <MessageCircle className={cn(iconClass, "text-green-600")} />;

      case 'profile_view':
        return <Eye className={cn(iconClass, "text-gray-600")} />;

      case 'job_save':
        return <Bookmark className={cn(iconClass, "text-yellow-600")} />;

      case 'job_like':
        return <Heart className={cn(iconClass, "text-red-600")} />;

      case 'document_upload':
        return <FileText className={cn(iconClass, "text-indigo-600")} />;

      case 'profile_update':
        return <User className={cn(iconClass, "text-teal-600")} />;

      case 'recommendation':
        return <Star className={cn(iconClass, "text-orange-600")} />;

      case 'achievement':
        return <TrendingUp className={cn(iconClass, "text-emerald-600")} />;

      default:
        return <Clock className={cn(iconClass, "text-gray-600")} />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig = {
      success: { label: 'Success', class: 'bg-green-100 text-green-800 border-green-200' },
      pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      failed: { label: 'Failed', class: 'bg-red-100 text-red-800 border-red-200' },
      info: { label: 'Info', class: 'bg-blue-100 text-blue-800 border-blue-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge className={cn("text-xs border", config.class)}>
        {config.label}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderActivityItem = (activity: ActivityItem) => {
    const isUnread = !activity.read;

    return (
      <div
        key={activity.id}
        className={cn(
          "flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-all duration-200",
          isUnread ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50",
          activity.priority === 'high' && "border-l-4 border-l-red-500",
          activity.priority === 'medium' && "border-l-4 border-l-yellow-500"
        )}
        onClick={() => {
          if (onActivityClick) onActivityClick(activity);
          if (isUnread && onMarkAsRead) onMarkAsRead(activity.id);
        }}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isUnread ? "bg-white border-2 border-blue-200" : "bg-gray-100"
          )}>
            {getActivityIcon(activity.type, activity.status)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={cn(
              "text-sm font-semibold truncate",
              isUnread ? "text-gray-900" : "text-gray-700"
            )}>
              {activity.title}
            </h3>
            {getStatusBadge(activity.status)}
            {isUnread && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </div>

          <p className={cn(
            "text-sm line-clamp-2 mb-2",
            isUnread ? "text-gray-700" : "text-gray-600"
          )}>
            {activity.description}
          </p>

          {/* Metadata */}
          {activity.metadata && (
            <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
              {activity.metadata.companyName && (
                <div className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span>{activity.metadata.companyName}</span>
                </div>
              )}
              {activity.metadata.senderName && (
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{activity.metadata.senderName}</span>
                </div>
              )}
              {activity.metadata.count && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{activity.metadata.count} times</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatTimestamp(activity.timestamp)}
            </span>

            {activity.actionUrl && activity.actionText && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle action click
                }}
                className="text-xs h-6 px-2"
              >
                {activity.actionText}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Avatar for messages */}
        {activity.type === 'message' && activity.metadata?.senderAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={activity.metadata.senderAvatar} />
            <AvatarFallback>
              {activity.metadata.senderName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  const renderCompactView = () => (
    <div className="space-y-2">
      {activities.slice(0, maxItems || 5).map(renderActivityItem)}
      {activities.length > (maxItems || 5) && (
        <Button variant="ghost" size="sm" className="w-full">
          View All Activity
        </Button>
      )}
    </div>
  );

  const renderCardView = () => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.slice(0, maxItems || 5).map(renderActivityItem)}
        {activities.length > (maxItems || 5) && (
          <Button variant="outline" size="sm" className="w-full">
            View All Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderFullView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Feed</h2>
          <p className="text-gray-600">Stay updated with your job search activities</p>
        </div>

        <div className="flex items-center space-x-3">
          {onMarkAllAsRead && activities.some(a => !a.read) && (
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}

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

      {/* Filters */}
      {showFilters && (
        <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="application">Applications</TabsTrigger>
            <TabsTrigger value="interview">Interviews</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
            <TabsTrigger value="profile_view">Views</TabsTrigger>
            <TabsTrigger value="job_save">Saves</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Activity Groups */}
      <div className="space-y-6">
        {groupedActivities.map((group) => (
          <div key={group.date}>
            {group.date && (
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {group.date}
              </h3>
            )}
            <div className="space-y-2">
              {group.activities.map(renderActivityItem)}
            </div>
          </div>
        ))}

        {groupedActivities.length === 0 || groupedActivities.every(g => g.activities.length === 0) && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No activity found
              </h3>
              <p className="text-gray-600">
                {selectedFilter === 'all'
                  ? "Your activity will appear here as you use the platform."
                  : "No activity found for the selected filter."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  if (variant === 'compact') {
    return <div className={className}>{renderCompactView()}</div>;
  }

  if (variant === 'card') {
    return <div className={className}>{renderCardView()}</div>;
  }

  return <div className={className}>{renderFullView()}</div>;
}

// Example usage component with sample data
export function ActivityFeedExample() {
  const sampleActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'application',
      title: 'Application submitted',
      description: 'You applied for Senior Frontend Developer at TechCorp Inc.',
      timestamp: '2024-01-20T10:30:00Z',
      status: 'success',
      priority: 'high',
      read: false,
      metadata: {
        jobId: 'job-123',
        jobTitle: 'Senior Frontend Developer',
        companyName: 'TechCorp Inc.',
        applicationId: 'app-456'
      },
      actionUrl: '/applications/app-456',
      actionText: 'View Application'
    },
    {
      id: '2',
      type: 'message',
      title: 'New message from recruiter',
      description: 'Sarah Johnson sent you a message about the Frontend Developer position.',
      timestamp: '2024-01-20T08:15:00Z',
      priority: 'medium',
      read: false,
      metadata: {
        senderName: 'Sarah Johnson',
        senderAvatar: '/api/placeholder/32/32',
        companyName: 'TechCorp Inc.'
      },
      actionUrl: '/messages/msg-789',
      actionText: 'Reply'
    },
    {
      id: '3',
      type: 'interview',
      title: 'Interview scheduled',
      description: 'Your video interview has been scheduled for tomorrow at 2:00 PM.',
      timestamp: '2024-01-19T16:45:00Z',
      status: 'info',
      priority: 'high',
      read: true,
      metadata: {
        interviewType: 'video',
        interviewDate: '2024-01-21T14:00:00Z',
        companyName: 'StartupXYZ'
      },
      actionUrl: '/interviews/int-321',
      actionText: 'Join Meeting'
    },
    {
      id: '4',
      type: 'profile_view',
      title: 'Profile viewed',
      description: 'A recruiter from InnovateLabs viewed your profile.',
      timestamp: '2024-01-19T14:20:00Z',
      read: true,
      metadata: {
        companyName: 'InnovateLabs',
        count: 3
      }
    },
    {
      id: '5',
      type: 'job_save',
      title: 'Job saved',
      description: 'You saved Product Manager position at BigTech Corp.',
      timestamp: '2024-01-19T11:30:00Z',
      read: true,
      metadata: {
        jobId: 'job-789',
        jobTitle: 'Product Manager',
        companyName: 'BigTech Corp.'
      },
      actionUrl: '/jobs/job-789',
      actionText: 'View Job'
    },
    {
      id: '6',
      type: 'achievement',
      title: 'Profile completion milestone',
      description: 'Congratulations! You\'ve completed 85% of your profile.',
      timestamp: '2024-01-18T19:00:00Z',
      status: 'success',
      read: true,
      metadata: {
        achievementType: 'profile_completion'
      },
      actionUrl: '/profile',
      actionText: 'Complete Profile'
    },
    {
      id: '7',
      type: 'document_upload',
      title: 'Document uploaded',
      description: 'You uploaded a new resume: John_Doe_Resume_2024.pdf',
      timestamp: '2024-01-18T15:30:00Z',
      status: 'success',
      read: true,
      metadata: {
        documentName: 'John_Doe_Resume_2024.pdf'
      }
    }
  ];

  const [activities, setActivities] = useState(sampleActivities);

  const handleActivityClick = (activity: ActivityItem) => {
    console.log('Activity clicked:', activity);
  };

  const handleMarkAsRead = (activityId: string) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId ? { ...activity, read: true } : activity
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setActivities(prev =>
      prev.map(activity => ({ ...activity, read: true }))
    );
  };

  const handleRefresh = async () => {
    console.log('Refreshing activity feed...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Activity Feed Examples</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Card View</h3>
          <ActivityFeed
            activities={activities}
            onActivityClick={handleActivityClick}
            onMarkAsRead={handleMarkAsRead}
            onRefresh={handleRefresh}
            variant="card"
            maxItems={5}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Compact View</h3>
          <ActivityFeed
            activities={activities}
            onActivityClick={handleActivityClick}
            onMarkAsRead={handleMarkAsRead}
            variant="compact"
            maxItems={5}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Full View</h3>
        <ActivityFeed
          activities={activities}
          onActivityClick={handleActivityClick}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onRefresh={handleRefresh}
          variant="full"
          showFilters={true}
          showGrouping={true}
        />
      </div>
    </div>
  );
}