"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileForm } from "@/components/profile-form";
import { Profile } from "@/types/database";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  FileText,
  Settings,
  Edit,
  Calendar,
  Award,
} from "lucide-react";
import { auth, getProfile, updateProfile } from "@/lib/auth";

// Mock profile data for development
const mockProfile: Profile = {
  id: "user1",
  email: "john.doe@example.com",
  full_name: "John Doe",
  avatar_url: null,
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  bio: "Passionate frontend developer with 6+ years of experience building user-centric web applications. I specialize in React, TypeScript, and modern frontend technologies. Always eager to learn new technologies and contribute to impactful projects.",
  skills: ["React", "TypeScript", "JavaScript", "CSS", "HTML", "Node.js", "Git", "Redux", "Next.js", "Tailwind CSS"],
  experience_level: "senior",
  preferred_salary_min: 120000,
  preferred_salary_max: 160000,
  preferred_job_types: ["full-time", "contract"],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProfile(mockProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (data: any) => {
    setIsSaving(true);
    try {
      // TODO: Implement actual save logic
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setProfile({ ...profile!, ...data, updated_at: new Date().toISOString() });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatExperienceLevel = (level: string) => {
    const levels = {
      entry: "Entry Level (0-1 years)",
      junior: "Junior (1-3 years)",
      mid: "Mid Level (3-5 years)",
      senior: "Senior (5-8 years)",
      lead: "Lead/Principal (8+ years)",
    };
    return levels[level as keyof typeof levels] || level;
  };

  const formatJobTypes = (types: string[]) => {
    return types.map((type) => {
      const formatted = {
        "full-time": "Full-time",
        "part-time": "Part-time",
        contract: "Contract",
        freelance: "Freelance",
        internship: "Internship",
      };
      return formatted[type as keyof typeof formatted] || type;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't load your profile information. Please try again.
            </p>
            <Button
              onClick={loadProfile}
              className="bg-[#1993e5] hover:bg-[#1680cc] text-white"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
            <p className="text-gray-600">
              Update your profile information to help employers find you
            </p>
          </div>

          <div className="space-y-6">
            <ProfileForm
              profile={profile}
              onSubmit={handleSaveProfile}
              isLoading={isSaving}
            />

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">
              Manage your profile information and preferences
            </p>
          </div>

          <div className="flex space-x-3">
            <Link href="/profile/documents">
              <Button variant="outline" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </Button>
            </Link>
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#1993e5] hover:bg-[#1680cc] text-white flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="space-y-6">
            {/* Avatar and Basic Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-lg bg-[#1993e5] text-white">
                    {getInitials(profile.full_name || profile.email)}
                  </AvatarFallback>
                </Avatar>

                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {profile.full_name || "Anonymous User"}
                </h2>
                <p className="text-gray-600 mb-4">{profile.email}</p>

                {profile.experience_level && (
                  <Badge
                    variant="secondary"
                    className="bg-[#1993e5]/10 text-[#1993e5] border border-[#1993e5]/20"
                  >
                    {formatExperienceLevel(profile.experience_level)}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{profile.email}</span>
                </div>

                {profile.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{profile.phone}</span>
                  </div>
                )}

                {profile.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{profile.location}</span>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Joined {new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Salary Expectations */}
            {(profile.preferred_salary_min || profile.preferred_salary_max) && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Salary Expectations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ${profile.preferred_salary_min?.toLocaleString() || "N/A"} - ${profile.preferred_salary_max?.toLocaleString() || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">Annual salary</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    About Me
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Skills & Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Preferences */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Job Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.experience_level && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Experience Level</h4>
                    <Badge variant="outline" className="px-3 py-1">
                      {formatExperienceLevel(profile.experience_level)}
                    </Badge>
                  </div>
                )}

                {profile.preferred_job_types && profile.preferred_job_types.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Preferred Job Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {formatJobTypes(profile.preferred_job_types).map((type) => (
                        <Badge key={type} variant="outline" className="px-3 py-1">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(profile.preferred_salary_min || profile.preferred_salary_max) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Salary Range</h4>
                    <p className="text-gray-700">
                      ${profile.preferred_salary_min?.toLocaleString() || "Not specified"} - ${profile.preferred_salary_max?.toLocaleString() || "Not specified"} annually
                    </p>
                  </div>
                )}

                {profile.location && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                    <p className="text-gray-700">{profile.location}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Completeness */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Profile Completeness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Basic Information", completed: !!(profile.full_name && profile.email) },
                    { label: "Contact Details", completed: !!(profile.phone && profile.location) },
                    { label: "Professional Bio", completed: !!profile.bio },
                    { label: "Skills & Experience", completed: !!(profile.skills?.length && profile.experience_level) },
                    { label: "Job Preferences", completed: !!(profile.preferred_job_types?.length && profile.preferred_salary_min) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        {item.completed ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            ✓ Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-gray-300">
                            Incomplete
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Complete your profile to increase your visibility to employers
                  </p>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}