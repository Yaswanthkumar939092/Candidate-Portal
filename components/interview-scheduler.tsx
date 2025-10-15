'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CalendarDays,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  interviewer: {
    name: string;
    title: string;
    avatar?: string;
  };
}

export interface InterviewType {
  id: string;
  name: string;
  duration: number; // in minutes
  description: string;
  icon: React.ReactNode;
  requirements?: string[];
}

interface InterviewSchedulerProps {
  availableSlots: TimeSlot[];
  interviewTypes: InterviewType[];
  applicationId: string;
  jobTitle: string;
  companyName: string;
  onSchedule: (data: {
    slotId: string;
    interviewTypeId: string;
    timezone: string;
    notes?: string;
  }) => Promise<void>;
  className?: string;
}

export function InterviewScheduler({
  availableSlots,
  interviewTypes,
  applicationId,
  jobTitle,
  companyName,
  onSchedule,
  className
}: InterviewSchedulerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInterviewType, setSelectedInterviewType] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedTimezone, setSelectedTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);

  const totalSteps = 3;

  // Group slots by week
  const slotsByWeek = useMemo(() => {
    const weeks: { [key: number]: TimeSlot[] } = {};

    availableSlots.forEach(slot => {
      const date = new Date(slot.date);
      const weekNumber = Math.floor((date.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000));

      if (!weeks[weekNumber]) {
        weeks[weekNumber] = [];
      }
      weeks[weekNumber].push(slot);
    });

    return weeks;
  }, [availableSlots]);

  const currentWeekSlots = slotsByWeek[currentWeek] || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSelectedInterviewType = () => {
    return interviewTypes.find(type => type.id === selectedInterviewType);
  };

  const getSelectedSlot = () => {
    return availableSlots.find(slot => slot.id === selectedSlot);
  };

  const handleSchedule = async () => {
    if (!selectedSlot || !selectedInterviewType) return;

    setIsSubmitting(true);

    try {
      await onSchedule({
        slotId: selectedSlot,
        interviewTypeId: selectedInterviewType,
        timezone: selectedTimezone,
        notes: notes.trim()
      });
      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to schedule interview:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return !!selectedInterviewType;
      case 2:
        return !!selectedSlot;
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (isSuccess) {
    const slot = getSelectedSlot();
    const interviewType = getSelectedInterviewType();

    return (
      <Card className={cn("border-0 shadow-lg", className)}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Scheduled!</h2>
          <p className="text-gray-600 mb-6">
            Your {interviewType?.name.toLowerCase()} interview has been scheduled successfully.
          </p>

          {slot && interviewType && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Interview Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{formatDate(slot.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)} ({selectedTimezone})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{slot.interviewer.name}, {slot.interviewer.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {interviewType.icon}
                  <span>{interviewType.name} ({interviewType.duration} minutes)</span>
                </div>
              </div>
            </div>
          )}

          <Alert className="mb-6 text-left">
            <AlertCircle className="w-4 h-4" />
            <div>
              <p className="font-medium">What's Next?</p>
              <p className="text-sm mt-1">
                You'll receive a calendar invitation via email with meeting details.
                We recommend joining 5 minutes early to test your connection.
              </p>
            </div>
          </Alert>

          <div className="flex justify-center space-x-3">
            <Button variant="outline">
              Add to Calendar
            </Button>
            <Button className="bg-[#1993e5] hover:bg-[#1680cc]">
              View Application
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Schedule Interview
            </CardTitle>
            <p className="text-gray-600 mt-1">
              {jobTitle} at {companyName}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStep === 1 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Interview Type
            </h3>
            <div className="grid gap-4">
              {interviewTypes.map((type) => (
                <div
                  key={type.id}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all",
                    selectedInterviewType === type.id
                      ? "border-[#1993e5] bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedInterviewType(type.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedInterviewType === type.id
                        ? "bg-[#1993e5] text-white"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{type.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {type.duration} min
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      {type.requirements && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {type.requirements.map((req, index) => (
                              <li key={index} className="flex items-start">
                                <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Choose Date & Time
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(currentWeek - 1)}
                  disabled={currentWeek === 0}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  Week {currentWeek + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(currentWeek + 1)}
                  disabled={!slotsByWeek[currentWeek + 1]}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentWeekSlots.length > 0 ? (
              <div className="grid gap-3">
                {currentWeekSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      !slot.available && "opacity-50 cursor-not-allowed",
                      selectedSlot === slot.id && slot.available
                        ? "border-[#1993e5] bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => slot.available && setSelectedSlot(slot.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(slot.date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {slot.interviewer.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {slot.interviewer.title}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!slot.available && (
                        <Badge variant="secondary" className="text-red-600 bg-red-50">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No available slots this week
                </h3>
                <p className="text-gray-600">
                  Try checking other weeks using the navigation arrows above.
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Details
            </h3>

            {(() => {
              const slot = getSelectedSlot();
              const interviewType = getSelectedInterviewType();

              return (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Interview Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{slot && formatDate(slot.date)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>
                          {slot && `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`} ({selectedTimezone})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{slot && `${slot.interviewer.name}, ${slot.interviewer.title}`}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {interviewType?.icon}
                        <span>{interviewType && `${interviewType.name} (${interviewType.duration} minutes)`}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requirements, questions, or information you'd like to share with the interviewer..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <div>
                      <p className="font-medium">Before the interview</p>
                      <p className="text-sm mt-1">
                        You'll receive a calendar invitation and connection details via email.
                        Please test your camera and microphone beforehand.
                      </p>
                    </div>
                  </Alert>
                </div>
              );
            })()}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNextStep()}
              className="bg-[#1993e5] hover:bg-[#1680cc]"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSchedule}
              disabled={!canProceedToNextStep() || isSubmitting}
              className="bg-[#1993e5] hover:bg-[#1680cc]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Scheduling...
                </>
              ) : (
                'Schedule Interview'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage component with sample data
export function InterviewSchedulerExample() {
  const sampleSlots: TimeSlot[] = [
    {
      id: '1',
      date: '2024-01-22',
      startTime: '09:00',
      endTime: '10:00',
      available: true,
      interviewer: {
        name: 'Sarah Johnson',
        title: 'Engineering Manager'
      }
    },
    {
      id: '2',
      date: '2024-01-22',
      startTime: '14:00',
      endTime: '15:00',
      available: true,
      interviewer: {
        name: 'Mike Chen',
        title: 'Senior Developer'
      }
    },
    {
      id: '3',
      date: '2024-01-23',
      startTime: '10:00',
      endTime: '11:00',
      available: false,
      interviewer: {
        name: 'Sarah Johnson',
        title: 'Engineering Manager'
      }
    }
  ];

  const sampleInterviewTypes: InterviewType[] = [
    {
      id: 'phone',
      name: 'Phone Screening',
      duration: 30,
      description: 'Initial conversation about your background and the role.',
      icon: <Phone className="w-5 h-5" />,
      requirements: ['Quiet environment', 'Good phone connection']
    },
    {
      id: 'video',
      name: 'Video Interview',
      duration: 60,
      description: 'Technical discussion with the engineering team.',
      icon: <Video className="w-5 h-5" />,
      requirements: ['Stable internet connection', 'Camera and microphone', 'Quiet environment']
    },
    {
      id: 'onsite',
      name: 'On-site Interview',
      duration: 120,
      description: 'In-person interview at our office including team meetings.',
      icon: <MapPin className="w-5 h-5" />,
      requirements: ['Photo ID', 'Portfolio/samples', 'Arrive 15 minutes early']
    }
  ];

  const handleSchedule = async (data: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Interview scheduled:', data);
  };

  return (
    <InterviewScheduler
      availableSlots={sampleSlots}
      interviewTypes={sampleInterviewTypes}
      applicationId="app-123"
      jobTitle="Senior Frontend Developer"
      companyName="TechCorp Inc."
      onSchedule={handleSchedule}
    />
  );
}