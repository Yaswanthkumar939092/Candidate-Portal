'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  MapPin,
  Phone,
  Mail,
  Globe,
  Camera,
  Upload,
  Plus,
  ArrowRight,
  Target,
  Star,
  Zap,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  required: boolean;
  weight: number; // Contribution to overall completion percentage
  fields: Array<{
    id: string;
    label: string;
    completed: boolean;
    required: boolean;
    example?: string;
  }>;
  actionText: string;
  actionUrl: string;
  estimatedTime: string; // "2 min", "5 min", etc.
  priority: 'high' | 'medium' | 'low';
}

interface ProfileCompletionProps {
  sections: ProfileSection[];
  onSectionClick: (sectionId: string) => void;
  onFieldClick?: (sectionId: string, fieldId: string) => void;
  className?: string;
  showDetailed?: boolean;
  variant?: 'compact' | 'detailed' | 'card';
}

export function ProfileCompletion({
  sections,
  onSectionClick,
  onFieldClick,
  className,
  showDetailed = false,
  variant = 'detailed'
}: ProfileCompletionProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Calculate overall completion
  const completion = useMemo(() => {
    const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0);
    const completedWeight = sections
      .filter(section => section.completed)
      .reduce((sum, section) => sum + section.weight, 0);

    const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    const completedSections = sections.filter(section => section.completed).length;
    const requiredSections = sections.filter(section => section.required).length;
    const completedRequired = sections.filter(section => section.required && section.completed).length;

    return {
      percentage,
      completedSections,
      totalSections: sections.length,
      requiredSections,
      completedRequired,
      nextSections: sections
        .filter(section => !section.completed)
        .sort((a, b) => {
          // Sort by required first, then by priority
          if (a.required !== b.required) return a.required ? -1 : 1;
          if (a.priority !== b.priority) {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return 0;
        })
        .slice(0, 3)
    };
  }, [sections]);

  const getCompletionLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage >= 75) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (percentage >= 50) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Needs Work', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Zap className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderCompactView = () => {
    const levelInfo = getCompletionLevel(completion.percentage);

    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="transparent"
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#1993e5]"
                  strokeWidth="3"
                  strokeDasharray={`${completion.percentage}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {completion.percentage}%
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">Profile Completion</h3>
                <Badge className={cn("text-xs", levelInfo.bgColor, levelInfo.color)}>
                  {levelInfo.level}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {completion.completedSections} of {completion.totalSections} sections completed
              </p>
              {completion.nextSections.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => onSectionClick(completion.nextSections[0].id)}
                  className="bg-[#1993e5] hover:bg-[#1680cc] h-8"
                >
                  Complete {completion.nextSections[0].title}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSectionCard = (section: ProfileSection) => {
    const isExpanded = expandedSection === section.id;
    const completedFields = section.fields.filter(field => field.completed).length;
    const fieldCompletionRate = section.fields.length > 0
      ? Math.round((completedFields / section.fields.length) * 100)
      : 100;

    return (
      <Card
        key={section.id}
        className={cn(
          "border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
          section.completed && "bg-green-50 border-green-200"
        )}
        onClick={() => {
          if (showDetailed) {
            setExpandedSection(isExpanded ? null : section.id);
          } else {
            onSectionClick(section.id);
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              section.completed ? "bg-green-100" : "bg-gray-100"
            )}>
              {section.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                section.icon
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                {section.required && (
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                    Required
                  </Badge>
                )}
                {getPriorityIcon(section.priority)}
              </div>

              <p className="text-sm text-gray-600 mb-2">{section.description}</p>

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Circle className="w-3 h-3" />
                  <span>{section.estimatedTime}</span>
                </span>
                <span>{completedFields}/{section.fields.length} fields</span>
              </div>

              {!section.completed && (
                <div className="mt-3">
                  <Progress value={fieldCompletionRate} className="h-2" />
                </div>
              )}
            </div>

            <div className="flex flex-col items-end space-y-2">
              {section.completed ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Complete
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSectionClick(section.id);
                  }}
                  className="bg-[#1993e5] hover:bg-[#1680cc] h-8 px-3"
                >
                  {section.actionText}
                </Button>
              )}

              {showDetailed && (
                <ArrowRight
                  className={cn(
                    "w-4 h-4 text-gray-400 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {showDetailed && isExpanded && (
            <div className="mt-4 pt-4 border-t">
              <div className="space-y-3">
                {section.fields.map((field) => (
                  <div
                    key={field.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      field.completed ? "bg-green-50 hover:bg-green-100" : "bg-gray-50 hover:bg-gray-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFieldClick?.(section.id, field.id);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      {field.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{field.label}</p>
                        {field.example && !field.completed && (
                          <p className="text-xs text-gray-500">e.g., {field.example}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {field.required && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDetailedView = () => {
    const levelInfo = getCompletionLevel(completion.percentage);

    return (
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-[#1993e5] rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Profile Completion</h2>
                    <p className="text-gray-600">
                      Complete your profile to increase your visibility to recruiters
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {completion.percentage}%
                      </span>
                      <Badge className={cn("text-sm", levelInfo.bgColor, levelInfo.color)}>
                        {levelInfo.level}
                      </Badge>
                    </div>
                    <Progress value={completion.percentage} className="h-3" />
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {completion.completedSections}
                    </p>
                    <p className="text-sm text-gray-600">
                      of {completion.totalSections} sections
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {completion.completedRequired}
                    </p>
                    <p className="text-sm text-gray-600">
                      of {completion.requiredSections} required
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {completion.nextSections.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Target className="w-5 h-5 text-[#1993e5]" />
                <span>Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {completion.nextSections.map((section, index) => (
                  <div
                    key={section.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onSectionClick(section.id)}
                  >
                    <div className="w-6 h-6 bg-[#1993e5] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{section.title}</p>
                      <p className="text-sm text-gray-600">{section.estimatedTime} to complete</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {section.required && (
                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                          Required
                        </Badge>
                      )}
                      {getPriorityIcon(section.priority)}
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Sections */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">All Sections</h3>
          {sections.map(renderSectionCard)}
        </div>
      </div>
    );
  };

  if (variant === 'compact') {
    return <div className={className}>{renderCompactView()}</div>;
  }

  if (variant === 'card') {
    return (
      <Card className={cn("border-0 shadow-sm", className)}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Profile Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.slice(0, 3).map(renderSectionCard)}
          {sections.length > 3 && (
            <Button variant="outline" className="w-full">
              View All Sections
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return <div className={className}>{renderDetailedView()}</div>;
}

// Example usage component with sample data
export function ProfileCompletionExample() {
  const sampleSections: ProfileSection[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Your name, contact information, and location',
      icon: <User className="w-5 h-5 text-gray-600" />,
      completed: true,
      required: true,
      weight: 20,
      actionText: 'Add Info',
      actionUrl: '/profile/basic',
      estimatedTime: '2 min',
      priority: 'high',
      fields: [
        { id: 'name', label: 'Full Name', completed: true, required: true },
        { id: 'email', label: 'Email Address', completed: true, required: true },
        { id: 'phone', label: 'Phone Number', completed: true, required: true },
        { id: 'location', label: 'Location', completed: true, required: false, example: 'San Francisco, CA' }
      ]
    },
    {
      id: 'resume',
      title: 'Resume & CV',
      description: 'Upload your latest resume or CV',
      icon: <FileText className="w-5 h-5 text-gray-600" />,
      completed: true,
      required: true,
      weight: 25,
      actionText: 'Upload Resume',
      actionUrl: '/profile/resume',
      estimatedTime: '1 min',
      priority: 'high',
      fields: [
        { id: 'resume-file', label: 'Resume File', completed: true, required: true },
        { id: 'cover-letter', label: 'Cover Letter Template', completed: false, required: false }
      ]
    },
    {
      id: 'experience',
      title: 'Work Experience',
      description: 'Add your work history and achievements',
      icon: <Briefcase className="w-5 h-5 text-gray-600" />,
      completed: false,
      required: true,
      weight: 25,
      actionText: 'Add Experience',
      actionUrl: '/profile/experience',
      estimatedTime: '10 min',
      priority: 'high',
      fields: [
        { id: 'current-job', label: 'Current Position', completed: false, required: true, example: 'Senior Developer at TechCorp' },
        { id: 'previous-jobs', label: 'Previous Positions', completed: false, required: false },
        { id: 'achievements', label: 'Key Achievements', completed: false, required: false }
      ]
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Your educational background and certifications',
      icon: <GraduationCap className="w-5 h-5 text-gray-600" />,
      completed: false,
      required: false,
      weight: 15,
      actionText: 'Add Education',
      actionUrl: '/profile/education',
      estimatedTime: '5 min',
      priority: 'medium',
      fields: [
        { id: 'degree', label: 'Highest Degree', completed: false, required: false },
        { id: 'university', label: 'University/College', completed: false, required: false },
        { id: 'certifications', label: 'Certifications', completed: false, required: false }
      ]
    },
    {
      id: 'skills',
      title: 'Skills & Technologies',
      description: 'List your technical and soft skills',
      icon: <Award className="w-5 h-5 text-gray-600" />,
      completed: false,
      required: false,
      weight: 10,
      actionText: 'Add Skills',
      actionUrl: '/profile/skills',
      estimatedTime: '5 min',
      priority: 'medium',
      fields: [
        { id: 'technical-skills', label: 'Technical Skills', completed: false, required: false },
        { id: 'soft-skills', label: 'Soft Skills', completed: false, required: false },
        { id: 'languages', label: 'Languages', completed: false, required: false }
      ]
    },
    {
      id: 'portfolio',
      title: 'Portfolio & Links',
      description: 'Showcase your work and professional profiles',
      icon: <Globe className="w-5 h-5 text-gray-600" />,
      completed: false,
      required: false,
      weight: 5,
      actionText: 'Add Portfolio',
      actionUrl: '/profile/portfolio',
      estimatedTime: '3 min',
      priority: 'low',
      fields: [
        { id: 'portfolio-url', label: 'Portfolio Website', completed: false, required: false },
        { id: 'linkedin', label: 'LinkedIn Profile', completed: false, required: false },
        { id: 'github', label: 'GitHub Profile', completed: false, required: false }
      ]
    }
  ];

  const handleSectionClick = (sectionId: string) => {
    console.log('Section clicked:', sectionId);
  };

  const handleFieldClick = (sectionId: string, fieldId: string) => {
    console.log('Field clicked:', sectionId, fieldId);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Profile Completion Examples</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Compact View</h3>
          <ProfileCompletion
            sections={sampleSections}
            onSectionClick={handleSectionClick}
            variant="compact"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Card View</h3>
          <ProfileCompletion
            sections={sampleSections}
            onSectionClick={handleSectionClick}
            variant="card"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Detailed View</h3>
        <ProfileCompletion
          sections={sampleSections}
          onSectionClick={handleSectionClick}
          onFieldClick={handleFieldClick}
          variant="detailed"
          showDetailed={true}
        />
      </div>
    </div>
  );
}