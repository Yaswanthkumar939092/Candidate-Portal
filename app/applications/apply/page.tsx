'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  FileText,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/document-upload";

interface JobDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements: string[];
  benefits: string[];
}

function JobApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    // Application Details
    coverLetter: '',
    expectedSalary: '',
    availabilityDate: '',
    workAuthorization: '',
    willingToRelocate: false,
    // Experience
    yearsExperience: '',
    currentRole: '',
    noticePeriod: '',
    // Documents
    resumeFile: null as File | null,
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
  });

  // Mock job details - in real app, fetch from API
  const jobDetails: JobDetails = {
    id: jobId || '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120,000 - $150,000',
    description: 'We are looking for an experienced Frontend Developer to join our team...',
    requirements: [
      '5+ years of React experience',
      'TypeScript proficiency',
      'Experience with modern build tools',
      'Strong CSS and responsive design skills'
    ],
    benefits: [
      'Health, dental, and vision insurance',
      'Flexible working hours',
      'Professional development budget',
      '401k matching'
    ]
  };

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone);
      case 2:
        return !!(formData.coverLetter && formData.expectedSalary && formData.workAuthorization);
      case 3:
        return !!(formData.yearsExperience && formData.currentRole);
      case 4:
        return !!formData.resumeFile;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/applications');
      }, 3000);
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="location">Current Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, State/Country"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="coverLetter">Cover Letter *</Label>
                  <Textarea
                    id="coverLetter"
                    value={formData.coverLetter}
                    onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.coverLetter.length}/1000 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expectedSalary">Expected Salary *</Label>
                    <Input
                      id="expectedSalary"
                      value={formData.expectedSalary}
                      onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
                      placeholder="e.g., $120,000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="availabilityDate">Availability Date</Label>
                    <Input
                      id="availabilityDate"
                      type="date"
                      value={formData.availabilityDate}
                      onChange={(e) => handleInputChange('availabilityDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="workAuth">Work Authorization *</Label>
                  <Select onValueChange={(value) => handleInputChange('workAuthorization', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your work authorization status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">US Citizen</SelectItem>
                      <SelectItem value="permanent-resident">Permanent Resident</SelectItem>
                      <SelectItem value="h1b">H1-B Visa</SelectItem>
                      <SelectItem value="opt">F1-OPT</SelectItem>
                      <SelectItem value="other">Other (require sponsorship)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="relocate"
                    checked={formData.willingToRelocate}
                    onCheckedChange={(checked) => handleInputChange('willingToRelocate', checked)}
                  />
                  <Label htmlFor="relocate">I am willing to relocate for this position</Label>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience & Background</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearsExp">Years of Experience *</Label>
                    <Select onValueChange={(value) => handleInputChange('yearsExperience', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="2-3">2-3 years</SelectItem>
                        <SelectItem value="4-6">4-6 years</SelectItem>
                        <SelectItem value="7-10">7-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="noticePeriod">Notice Period</Label>
                    <Select onValueChange={(value) => handleInputChange('noticePeriod', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select notice period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="2-weeks">2 weeks</SelectItem>
                        <SelectItem value="1-month">1 month</SelectItem>
                        <SelectItem value="2-months">2 months</SelectItem>
                        <SelectItem value="3-months">3+ months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentRole">Current Role *</Label>
                  <Input
                    id="currentRole"
                    value={formData.currentRole}
                    onChange={(e) => handleInputChange('currentRole', e.target.value)}
                    placeholder="e.g., Senior Frontend Developer at ABC Company"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub Profile</Label>
                    <Input
                      id="github"
                      value={formData.githubUrl}
                      onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="portfolio">Portfolio URL</Label>
                  <Input
                    id="portfolio"
                    value={formData.portfolioUrl}
                    onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents & Resume</h3>
              <DocumentUpload
                label="Upload Resume *"
                accept=".pdf,.doc,.docx"
                maxSize={5 * 1024 * 1024} // 5MB
                onUpload={(file) => handleInputChange('resumeFile', file)}
                description="Upload your resume in PDF, DOC, or DOCX format (max 5MB)"
              />

              {formData.resumeFile && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Resume uploaded: {formData.resumeFile.name}
                  </span>
                </div>
              )}

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <div>
                  <h4 className="font-medium">Application Review Process</h4>
                  <p className="text-sm mt-1">
                    Once submitted, our hiring team will review your application within 3-5 business days.
                    You'll receive an email confirmation and status updates throughout the process.
                  </p>
                </div>
              </Alert>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for applying to {jobDetails.title} at {jobDetails.company}.
                We've received your application and will review it shortly.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600">
                  You'll receive an email confirmation within a few minutes.
                  We'll keep you updated on your application status.
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Redirecting to your applications in a few seconds...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Apply for Position</h1>
            <p className="text-gray-600">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Personal Info</span>
            <span>Application</span>
            <span>Experience</span>
            <span>Documents</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 mt-8 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      onClick={handleNext}
                      disabled={!validateStep(currentStep)}
                      className="bg-[#1993e5] hover:bg-[#1680cc]"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!validateStep(currentStep) || isSubmitting}
                      className="bg-[#1993e5] hover:bg-[#1680cc]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{jobDetails.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Building2 className="w-4 h-4 mr-1" />
                    {jobDetails.company}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{jobDetails.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{jobDetails.type}</span>
                  </div>
                  {jobDetails.salary && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{jobDetails.salary}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Requirements</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {jobDetails.requirements.slice(0, 3).map((req, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#1993e5] rounded-full mt-2 mr-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                  <div className="flex flex-wrap gap-1">
                    {jobDetails.benefits.slice(0, 2).map((benefit, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 text-xs"
                      >
                        {benefit}
                      </Badge>
                    ))}
                    {jobDetails.benefits.length > 2 && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                        +{jobDetails.benefits.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobApplicationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>}>
      <JobApplicationContent />
    </Suspense>
  );
}