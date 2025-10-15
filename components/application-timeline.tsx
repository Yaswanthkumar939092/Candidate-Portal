'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  FileText,
  Video,
  UserCheck,
  XCircle,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  type: 'submitted' | 'reviewed' | 'interview_scheduled' | 'interview_completed' | 'decision' | 'feedback' | 'offer' | 'rejected';
  title: string;
  description?: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  metadata?: {
    interviewType?: 'phone' | 'video' | 'onsite';
    interviewDate?: string;
    interviewerName?: string;
    feedbackScore?: number;
    offerAmount?: string;
    rejectionReason?: string;
    nextSteps?: string[];
  };
}

interface ApplicationTimelineProps {
  events: TimelineEvent[];
  applicationId: string;
  currentStatus: string;
  className?: string;
  showActions?: boolean;
}

export function ApplicationTimeline({
  events,
  applicationId,
  currentStatus,
  className,
  showActions = false
}: ApplicationTimelineProps) {
  const getEventIcon = (type: string, status: string) => {
    const iconClass = cn(
      "w-5 h-5 flex-shrink-0",
      status === 'completed' && "text-green-600",
      status === 'current' && "text-blue-600",
      status === 'pending' && "text-gray-400",
      status === 'failed' && "text-red-600"
    );

    switch (type) {
      case 'submitted':
        return <FileText className={iconClass} />;
      case 'reviewed':
        return <UserCheck className={iconClass} />;
      case 'interview_scheduled':
        return <Calendar className={iconClass} />;
      case 'interview_completed':
        return <Video className={iconClass} />;
      case 'feedback':
        return <MessageCircle className={iconClass} />;
      case 'offer':
        return <CheckCircle2 className={iconClass} />;
      case 'rejected':
        return <XCircle className={iconClass} />;
      case 'decision':
        return status === 'failed' ? <XCircle className={iconClass} /> : <CheckCircle2 className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800 border-green-200",
      current: "bg-blue-100 text-blue-800 border-blue-200",
      pending: "bg-gray-100 text-gray-600 border-gray-200",
      failed: "bg-red-100 text-red-800 border-red-200"
    };

    const labels = {
      completed: "Completed",
      current: "In Progress",
      pending: "Pending",
      failed: "Failed"
    };

    return (
      <Badge className={cn("border", variants[status as keyof typeof variants])}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderEventDetails = (event: TimelineEvent) => {
    if (!event.metadata) return null;

    const { metadata } = event;

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
        {metadata.interviewType && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-24">Type:</span>
            <Badge variant="secondary" className="capitalize">
              {metadata.interviewType} Interview
            </Badge>
          </div>
        )}

        {metadata.interviewDate && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-24">Date:</span>
            <span className="text-gray-600">
              {formatTimestamp(metadata.interviewDate)}
            </span>
          </div>
        )}

        {metadata.interviewerName && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-24">Interviewer:</span>
            <span className="text-gray-600">{metadata.interviewerName}</span>
          </div>
        )}

        {metadata.feedbackScore !== undefined && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-24">Score:</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">{metadata.feedbackScore}/10</span>
              <div className="w-20 h-2 bg-gray-200 rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full",
                    metadata.feedbackScore >= 7 ? "bg-green-500" :
                    metadata.feedbackScore >= 5 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${(metadata.feedbackScore / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {metadata.offerAmount && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-24">Offer:</span>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {metadata.offerAmount}
            </Badge>
          </div>
        )}

        {metadata.rejectionReason && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Reason:</span>
            <p className="text-gray-600 mt-1">{metadata.rejectionReason}</p>
          </div>
        )}

        {metadata.nextSteps && metadata.nextSteps.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Next Steps:</span>
            <ul className="mt-1 space-y-1">
              {metadata.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start text-gray-600">
                  <ArrowRight className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderActionButtons = (event: TimelineEvent) => {
    if (!showActions || event.status !== 'current') return null;

    switch (event.type) {
      case 'interview_scheduled':
        return (
          <div className="flex space-x-2 mt-3">
            <Button size="sm" variant="outline">
              View Details
            </Button>
            <Button size="sm" variant="outline">
              Reschedule
            </Button>
            <Button size="sm" className="bg-[#1993e5] hover:bg-[#1680cc]">
              Join Interview
            </Button>
          </div>
        );

      case 'offer':
        return (
          <div className="flex space-x-2 mt-3">
            <Button size="sm" variant="outline">
              View Offer
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Accept Offer
            </Button>
          </div>
        );

      case 'feedback':
        return (
          <div className="flex space-x-2 mt-3">
            <Button size="sm" variant="outline">
              View Feedback
            </Button>
            <Button size="sm" className="bg-[#1993e5] hover:bg-[#1680cc]">
              Respond
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Application Timeline
        </CardTitle>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Current Status:</span>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {currentStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Events */}
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex items-start space-x-4">
                {/* Timeline Node */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2",
                  event.status === 'completed' && "bg-green-50 border-green-200",
                  event.status === 'current' && "bg-blue-50 border-blue-200",
                  event.status === 'pending' && "bg-gray-50 border-gray-200",
                  event.status === 'failed' && "bg-red-50 border-red-200"
                )}>
                  {getEventIcon(event.type, event.status)}
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {event.title}
                    </h3>
                    {getStatusBadge(event.status)}
                  </div>

                  <p className="text-sm text-gray-500 mb-2">
                    {formatTimestamp(event.timestamp)}
                  </p>

                  {event.description && (
                    <p className="text-sm text-gray-700 mb-3">
                      {event.description}
                    </p>
                  )}

                  {renderEventDetails(event)}
                  {renderActionButtons(event)}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {events.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Timeline Events
              </h3>
              <p className="text-gray-600">
                Timeline events will appear here as your application progresses.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage component with sample data
export function ApplicationTimelineExample() {
  const sampleEvents: TimelineEvent[] = [
    {
      id: '1',
      type: 'submitted',
      title: 'Application Submitted',
      description: 'Your application has been successfully submitted and received.',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'completed'
    },
    {
      id: '2',
      type: 'reviewed',
      title: 'Application Under Review',
      description: 'Our hiring team is reviewing your application and qualifications.',
      timestamp: '2024-01-16T14:20:00Z',
      status: 'completed'
    },
    {
      id: '3',
      type: 'interview_scheduled',
      title: 'Phone Interview Scheduled',
      description: 'A phone screening has been scheduled with our hiring manager.',
      timestamp: '2024-01-18T09:00:00Z',
      status: 'current',
      metadata: {
        interviewType: 'phone',
        interviewDate: '2024-01-22T15:00:00Z',
        interviewerName: 'Sarah Johnson, Hiring Manager',
        nextSteps: [
          'Prepare answers for common interview questions',
          'Research the company and team structure',
          'Test your phone connection 15 minutes before'
        ]
      }
    },
    {
      id: '4',
      type: 'interview_completed',
      title: 'Technical Interview',
      description: 'Technical interview with the engineering team.',
      timestamp: '2024-01-25T10:00:00Z',
      status: 'pending',
      metadata: {
        interviewType: 'video',
        interviewDate: '2024-01-25T10:00:00Z'
      }
    },
    {
      id: '5',
      type: 'decision',
      title: 'Final Decision',
      description: 'Final hiring decision will be communicated.',
      timestamp: '',
      status: 'pending'
    }
  ];

  return (
    <ApplicationTimeline
      events={sampleEvents}
      applicationId="app-123"
      currentStatus="Phone Interview Scheduled"
      showActions={true}
    />
  );
}