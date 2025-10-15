import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatus as ApplicationStatusType } from "@/types/database";
import {
  Clock,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";

interface ApplicationStatusProps {
  status: ApplicationStatusType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    darkColor: "dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  },
  reviewing: {
    label: "Under Review",
    icon: Eye,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    darkColor: "dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  interviewing: {
    label: "Interviewing",
    icon: Calendar,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    darkColor: "dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  },
  offered: {
    label: "Job Offered",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    darkColor: "dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  },
  rejected: {
    label: "Not Selected",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    darkColor: "dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  },
  withdrawn: {
    label: "Withdrawn",
    icon: ArrowLeft,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    darkColor: "dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
  },
};

const sizeConfig = {
  sm: {
    badge: "text-xs px-2 py-1",
    icon: "w-3 h-3",
  },
  md: {
    badge: "text-sm px-3 py-1",
    icon: "w-4 h-4",
  },
  lg: {
    badge: "text-base px-4 py-2",
    icon: "w-5 h-5",
  },
};

export function ApplicationStatus({
  status,
  size = "md",
  showIcon = true,
  className,
}: ApplicationStatusProps) {
  const config = statusConfig[status];
  const sizing = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
        config.color,
        config.darkColor,
        sizing.badge,
        className
      )}
    >
      {showIcon && <Icon className={sizing.icon} />}
      {config.label}
    </Badge>
  );
}

// Helper function to get status description
export function getStatusDescription(status: ApplicationStatusType): string {
  const descriptions = {
    pending: "Your application has been submitted and is awaiting review.",
    reviewing: "The employer is currently reviewing your application.",
    interviewing: "Congratulations! You've been selected for an interview.",
    offered: "Great news! You've received a job offer.",
    rejected: "Unfortunately, your application was not selected for this position.",
    withdrawn: "You have withdrawn your application for this position.",
  };

  return descriptions[status];
}

// Helper function to get next possible actions
export function getStatusActions(status: ApplicationStatusType): string[] {
  const actions = {
    pending: ["View Application", "Withdraw Application"],
    reviewing: ["View Application", "Withdraw Application"],
    interviewing: ["View Application", "Prepare for Interview", "Withdraw Application"],
    offered: ["View Offer Details", "Accept Offer", "Decline Offer"],
    rejected: ["View Feedback"],
    withdrawn: ["View Application"],
  };

  return actions[status] || [];
}