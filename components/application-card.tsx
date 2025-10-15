"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatus } from "@/components/application-status";
import { Application, Job } from "@/types/database";
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ApplicationCardProps {
  application: Application & {
    job: Job;
  };
  onWithdraw?: (applicationId: string) => void;
  className?: string;
}

export function ApplicationCard({
  application,
  onWithdraw,
  className,
}: ApplicationCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!onWithdraw) return;

    setIsLoading(true);
    try {
      await onWithdraw(application.id);
    } catch (error) {
      console.error("Failed to withdraw application:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canWithdraw = application.status === "pending" || application.status === "reviewing";

  return (
    <Card className={cn("hover:shadow-md transition-shadow border-0 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {application.job.company_logo ? (
                <img
                  src={application.job.company_logo}
                  alt={`${application.job.company} logo`}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Building2 className="w-6 h-6 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/applications/${application.id}`}>
                <h3 className="font-semibold text-gray-900 hover:text-[#1993e5] transition-colors truncate">
                  {application.job.title}
                </h3>
              </Link>
              <p className="text-gray-600 font-medium mb-1">{application.job.company}</p>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{application.job.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span className="capitalize">{application.job.job_type}</span>
                </div>
                {application.job.salary_min && application.job.salary_max && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3" />
                    <span>
                      ${application.job.salary_min.toLocaleString()} - ${application.job.salary_max.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/applications/${application.id}`} className="flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/jobs/${application.job.id}`} className="flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Job Posting
                </Link>
              </DropdownMenuItem>
              {canWithdraw && (
                <DropdownMenuItem
                  onClick={handleWithdraw}
                  disabled={isLoading}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Withdraw Application
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ApplicationStatus status={application.status} size="sm" />

            {application.job.skills_required && application.job.skills_required.length > 0 && (
              <div className="hidden sm:flex items-center space-x-1">
                {application.job.skills_required.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs px-2 py-0.5">
                    {skill}
                  </Badge>
                ))}
                {application.job.skills_required.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    +{application.job.skills_required.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Applied {formatDate(application.applied_at)}</span>
            </div>
          </div>
        </div>

        {application.status === "interviewing" && (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800 font-medium">
              Interview scheduled - Check your email for details
            </p>
          </div>
        )}

        {application.status === "offered" && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              Congratulations! You have received a job offer
            </p>
            <div className="flex space-x-2 mt-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                View Offer
              </Button>
            </div>
          </div>
        )}

        {application.status === "rejected" && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Your application was not selected for this position.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}