import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Building2, Bookmark } from "lucide-react";

interface JobCardProps {
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
  };
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
}

export function JobCard({ job, onApply, onSave }: JobCardProps) {
  const handleApply = () => {
    onApply?.(job.id);
  };

  const handleSave = () => {
    onSave?.(job.id);
  };

  return (
    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
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
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#1993e5] transition-colors line-clamp-2">
                {job.title}
              </h3>
              <p className="text-sm text-gray-600 font-medium">{job.company}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="text-gray-400 hover:text-[#1993e5] hover:bg-blue-50 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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

        <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2">
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

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">{job.postedAt}</span>
          <Button
            onClick={handleApply}
            className="bg-[#1993e5] hover:bg-[#1680cc] text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Apply Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}