"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Settings,
  Database,
  Shield,
  Palette,
  Check
} from "lucide-react";

interface User {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  full_name?: string;
  email: string;
  role?: string;
}

interface OnboardingWizardProps {
  user: User;
  profile: UserProfile;
  onComplete: () => void;
}

interface StepData {
  welcome?: boolean;
  frappe?: {
    url: string;
    api_key: string;
    api_secret: string;
    brand_logo_url?: string;
  };
  oauth?: {
    google_client_id?: string;
    google_client_secret?: string;
    google_enabled?: boolean;
    linkedin_client_id?: string;
    linkedin_client_secret?: string;
    linkedin_enabled?: boolean;
  };
  review?: boolean;
}

export function OnboardingWizard({ user, profile, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<StepData>({});
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Setup your Job Candidate Portal',
      icon: Settings,
      completed: !!stepData.welcome
    },
    {
      id: 'frappe',
      title: 'Frappe ERPNext',
      description: 'Connect to your ERPNext instance',
      icon: Database,
      completed: !!stepData.frappe
    },
    {
      id: 'oauth',
      title: 'OAuth Providers',
      description: 'Configure social login options',
      icon: Shield,
      completed: !!stepData.oauth
    },
    {
      id: 'review',
      title: 'Review & Launch',
      description: 'Review settings and launch your portal',
      icon: Palette,
      completed: !!stepData.review
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = (data?: any) => {
    if (data) {
      setStepData(prev => ({ ...prev, [steps[currentStep].id]: data }));
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save all configuration data to the database
      const configData = {
        user_id: user.id,
        frappe_config: stepData.frappe,
        oauth_config: stepData.oauth,
        onboarding_completed: true,
        completed_at: new Date().toISOString()
      };

      // This would typically save to Supabase
      console.log('Saving onboarding data:', configData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1993e5] to-[#1565b3] rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Job Candidate Portal
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Let's set up your job portal in just a few steps. This wizard will help you configure
                your ERPNext integration, social login options, and customize your portal's appearance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-gray-200 hover:border-[#1993e5] transition-colors">
                <CardContent className="p-6 text-center">
                  <Database className="w-12 h-12 text-[#1993e5] mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">ERPNext Integration</h4>
                  <p className="text-sm text-gray-600">Connect to your Frappe ERPNext instance for job management</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200 hover:border-[#1993e5] transition-colors">
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-[#1993e5] mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Social Login</h4>
                  <p className="text-sm text-gray-600">Configure Google and LinkedIn OAuth for easy user access</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200 hover:border-[#1993e5] transition-colors">
                <CardContent className="p-6 text-center">
                  <Palette className="w-12 h-12 text-[#1993e5] mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Customization</h4>
                  <p className="text-sm text-gray-600">Brand your portal with your company logo and colors</p>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Admin Account Detected:</strong> You're logged in as {profile.full_name || user.email}.
                You have full access to configure all portal settings.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button onClick={() => handleNext({ welcome: true })} className="bg-[#1993e5] hover:bg-[#1680cc] px-8">
                Let's Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'frappe':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Frappe ERPNext Configuration</h3>
              <p className="text-muted-foreground">
                Connect to your ERPNext instance to sync job data and manage applications.
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-4">Frappe configuration will be implemented in the next phase.</p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => handleNext()}>
                  Skip for Now
                </Button>
                <Button onClick={() => handleNext({ frappe: { configured: true } })}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        );

      case 'oauth':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">OAuth Provider Setup</h3>
              <p className="text-muted-foreground">
                Configure social login options for your job portal users.
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-4">OAuth configuration will be implemented in the next phase.</p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => handleNext()}>
                  Skip for Now
                </Button>
                <Button onClick={() => handleNext({ oauth: { configured: true } })}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Review Your Configuration</h3>
              <p className="text-lg text-gray-600">
                Please review your settings before launching your job portal.
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Frappe ERPNext Integration</span>
                    <Badge variant="secondary">Configured</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Basic setup completed. You can configure detailed settings later in admin dashboard.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>OAuth Providers</span>
                    <Badge variant="secondary">Ready</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">OAuth providers can be configured later in admin settings.</p>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Once you complete the setup, your job portal will be ready for users to discover and apply for jobs.
                You can always modify these settings later in the admin dashboard.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Launching Portal...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Launch Job Portal
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Wizard</h1>
          <p className="text-gray-600">Configure your Job Candidate Portal</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-center mb-8 space-x-4 overflow-x-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || step.completed;

            return (
              <div key={step.id} className="flex items-center space-x-2 min-w-max">
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#1993e5] text-white'
                    : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {isCompleted && !isActive ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <div className="hidden sm:block">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            );
          })}
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {currentStep > 0 && steps[currentStep].id !== 'review' && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <div />
          </div>
        )}
      </div>
    </div>
  );
}