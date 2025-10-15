'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Bookmark,
  MessageCircle,
  Target,
  Award,
  MapPin,
  Building2,
  DollarSign,
  Plus,
  ArrowRight,
  Filter,
  Download,
  Share2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicationStats {
  total: number;
  submitted: number;
  reviewed: number;
  interviewing: number;
  offered: number;
  rejected: number;
  pending: number;
}

interface DashboardMetrics {
  applications: ApplicationStats;
  profileViews: number;
  savedJobs: number;
  interviews: {
    scheduled: number;
    completed: number;
    upcoming: number;
  };
  responseRate: number;
  averageResponseTime: number; // in days
  topSkills: Array<{ name: string; matches: number; trend: 'up' | 'down' | 'stable' }>;
  recentActivity: Array<{
    id: string;
    type: 'application' | 'interview' | 'message' | 'view';
    title: string;
    company: string;
    timestamp: string;
    status?: string;
  }>;
  monthlyStats: Array<{
    month: string;
    applications: number;
    interviews: number;
    offers: number;
  }>;
  goalProgress: {
    monthlyApplications: { current: number; target: number };
    interviewRate: { current: number; target: number };
    profileCompletion: { current: number; target: number };
  };
}

interface DashboardStatsProps {
  metrics: DashboardMetrics;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange?: (range: 'week' | 'month' | 'quarter' | 'year') => void;
  onRefresh?: () => Promise<void>;
  className?: string;
}

export function DashboardStats({
  metrics,
  timeRange = 'month',
  onTimeRangeChange,
  onRefresh,
  className
}: DashboardStatsProps) {
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

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const { applications } = metrics;
    const interviewRate = applications.total > 0
      ? Math.round((applications.interviewing / applications.total) * 100)
      : 0;

    const offerRate = applications.total > 0
      ? Math.round((applications.offered / applications.total) * 100)
      : 0;

    const rejectionRate = applications.total > 0
      ? Math.round((applications.rejected / applications.total) * 100)
      : 0;

    return {
      interviewRate,
      offerRate,
      rejectionRate
    };
  }, [metrics.applications]);

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    subtitle?: string,
    trend?: { value: number; direction: 'up' | 'down' },
    color: 'blue' | 'green' | 'orange' | 'red' | 'purple' = 'blue'
  ) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600'
    };

    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClasses[color])}>
                  {icon}
                </div>
                {trend && (
                  <div className={cn(
                    "flex items-center space-x-1 text-sm font-medium",
                    trend.direction === 'up' ? "text-green-600" : "text-red-600"
                  )}>
                    {trend.direction === 'up' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(trend.value)}%</span>
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
              <p className="text-sm font-medium text-gray-900">{title}</p>
              {subtitle && (
                <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderApplicationProgress = () => {
    const stages = [
      { label: 'Submitted', value: metrics.applications.submitted, color: 'bg-blue-500' },
      { label: 'Reviewed', value: metrics.applications.reviewed, color: 'bg-yellow-500' },
      { label: 'Interviewing', value: metrics.applications.interviewing, color: 'bg-purple-500' },
      { label: 'Offered', value: metrics.applications.offered, color: 'bg-green-500' },
      { label: 'Rejected', value: metrics.applications.rejected, color: 'bg-red-500' }
    ];

    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Target className="w-5 h-5 text-[#1993e5]" />
            <span>Application Pipeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage) => (
              <div key={stage.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                  <span className="text-sm font-medium text-gray-900">{stage.label}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={cn("h-2 rounded-full", stage.color)}
                      style={{
                        width: `${metrics.applications.total > 0
                          ? (stage.value / metrics.applications.total) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                    {stage.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGoalProgress = () => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Award className="w-5 h-5 text-[#1993e5]" />
          <span>Goal Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Monthly Applications</span>
            <span className="text-sm text-gray-600">
              {metrics.goalProgress.monthlyApplications.current} / {metrics.goalProgress.monthlyApplications.target}
            </span>
          </div>
          <Progress
            value={(metrics.goalProgress.monthlyApplications.current / metrics.goalProgress.monthlyApplications.target) * 100}
            className="h-2"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Interview Rate</span>
            <span className="text-sm text-gray-600">
              {metrics.goalProgress.interviewRate.current}% / {metrics.goalProgress.interviewRate.target}%
            </span>
          </div>
          <Progress
            value={(metrics.goalProgress.interviewRate.current / metrics.goalProgress.interviewRate.target) * 100}
            className="h-2"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Profile Completion</span>
            <span className="text-sm text-gray-600">
              {metrics.goalProgress.profileCompletion.current}% / {metrics.goalProgress.profileCompletion.target}%
            </span>
          </div>
          <Progress
            value={metrics.goalProgress.profileCompletion.current}
            className="h-2"
          />
          {metrics.goalProgress.profileCompletion.current < 100 && (
            <Button size="sm" variant="outline" className="mt-2 text-xs">
              Complete Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderTopSkills = () => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-[#1993e5]" />
          <span>Top Matching Skills</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics.topSkills.map((skill, index) => (
            <div key={skill.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-[#1993e5] text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{skill.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{skill.matches} matches</span>
                {skill.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {skill.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderRecentActivity = () => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#1993e5]" />
            <span>Recent Activity</span>
          </CardTitle>
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.recentActivity.map((activity) => {
            const getActivityIcon = (type: string) => {
              switch (type) {
                case 'application':
                  return <FileText className="w-4 h-4 text-blue-600" />;
                case 'interview':
                  return <Calendar className="w-4 h-4 text-purple-600" />;
                case 'message':
                  return <MessageCircle className="w-4 h-4 text-green-600" />;
                case 'view':
                  return <Eye className="w-4 h-4 text-gray-600" />;
                default:
                  return <Clock className="w-4 h-4 text-gray-600" />;
              }
            };

            return (
              <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Building2 className="w-3 h-3" />
                    <span>{activity.company}</span>
                    <span>•</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
                {activity.status && (
                  <Badge variant="secondary" className="text-xs">
                    {activity.status}
                  </Badge>
                )}
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Track your job search progress and performance</p>
        </div>

        <div className="flex items-center space-x-3">
          <Tabs value={timeRange} onValueChange={(value) => onTimeRangeChange?.(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>

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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatCard(
          "Total Applications",
          metrics.applications.total,
          <FileText className="w-5 h-5" />,
          `${metrics.applications.pending} pending`,
          { value: 12, direction: 'up' },
          'blue'
        )}

        {renderStatCard(
          "Interview Rate",
          `${derivedMetrics.interviewRate}%`,
          <Users className="w-5 h-5" />,
          `${metrics.applications.interviewing} active`,
          { value: 5, direction: 'up' },
          'purple'
        )}

        {renderStatCard(
          "Profile Views",
          metrics.profileViews,
          <Eye className="w-5 h-5" />,
          "This month",
          { value: 23, direction: 'up' },
          'green'
        )}

        {renderStatCard(
          "Response Rate",
          `${metrics.responseRate}%`,
          <CheckCircle2 className="w-5 h-5" />,
          `Avg. ${metrics.averageResponseTime} days`,
          { value: 8, direction: 'down' },
          'orange'
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {renderApplicationProgress()}
          {renderRecentActivity()}
        </div>

        <div className="space-y-6">
          {renderGoalProgress()}
          {renderTopSkills()}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Plus className="w-5 h-5 text-[#1993e5]" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <FileText className="w-6 h-6 text-[#1993e5]" />
              <span className="text-sm">New Application</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <Calendar className="w-6 h-6 text-[#1993e5]" />
              <span className="text-sm">Schedule Interview</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <Bookmark className="w-6 h-6 text-[#1993e5]" />
              <span className="text-sm">Saved Jobs</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <Download className="w-6 h-6 text-[#1993e5]" />
              <span className="text-sm">Export Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Example usage component with sample data
export function DashboardStatsExample() {
  const sampleMetrics: DashboardMetrics = {
    applications: {
      total: 45,
      submitted: 45,
      reviewed: 32,
      interviewing: 8,
      offered: 3,
      rejected: 12,
      pending: 22
    },
    profileViews: 156,
    savedJobs: 23,
    interviews: {
      scheduled: 3,
      completed: 5,
      upcoming: 2
    },
    responseRate: 71,
    averageResponseTime: 5,
    topSkills: [
      { name: 'React', matches: 28, trend: 'up' },
      { name: 'TypeScript', matches: 24, trend: 'up' },
      { name: 'Node.js', matches: 18, trend: 'stable' },
      { name: 'Python', matches: 15, trend: 'down' },
      { name: 'AWS', matches: 12, trend: 'up' }
    ],
    recentActivity: [
      {
        id: '1',
        type: 'application',
        title: 'Applied to Senior Frontend Developer',
        company: 'TechCorp Inc.',
        timestamp: '2 hours ago',
        status: 'Submitted'
      },
      {
        id: '2',
        type: 'interview',
        title: 'Interview scheduled',
        company: 'StartupXYZ',
        timestamp: '5 hours ago',
        status: 'Upcoming'
      },
      {
        id: '3',
        type: 'message',
        title: 'Message from recruiter',
        company: 'BigTech Co.',
        timestamp: '1 day ago'
      },
      {
        id: '4',
        type: 'view',
        title: 'Profile viewed',
        company: 'InnovateLabs',
        timestamp: '2 days ago'
      }
    ],
    monthlyStats: [
      { month: 'Jan', applications: 12, interviews: 3, offers: 1 },
      { month: 'Feb', applications: 15, interviews: 4, offers: 1 },
      { month: 'Mar', applications: 18, interviews: 5, offers: 2 }
    ],
    goalProgress: {
      monthlyApplications: { current: 18, target: 20 },
      interviewRate: { current: 18, target: 25 },
      profileCompletion: { current: 85, target: 100 }
    }
  };

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const handleRefresh = async () => {
    console.log('Refreshing dashboard...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <DashboardStats
      metrics={sampleMetrics}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      onRefresh={handleRefresh}
    />
  );
}