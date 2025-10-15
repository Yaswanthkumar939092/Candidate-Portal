"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Profile, ExperienceLevel } from "@/types/database";
import { X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  experience_level: z.enum(["entry", "junior", "mid", "senior", "lead"]).optional(),
  preferred_salary_min: z.number().min(0).optional(),
  preferred_salary_max: z.number().min(0).optional(),
  skills: z.array(z.string()).optional(),
  preferred_job_types: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile?: Partial<Profile>;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level (0-1 years)" },
  { value: "junior", label: "Junior (1-3 years)" },
  { value: "mid", label: "Mid Level (3-5 years)" },
  { value: "senior", label: "Senior (5-8 years)" },
  { value: "lead", label: "Lead/Principal (8+ years)" },
];

const jobTypes = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

const popularSkills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "HTML/CSS",
  "Git",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "REST APIs",
  "MongoDB",
  "PostgreSQL",
];

export function ProfileForm({
  profile,
  onSubmit,
  isLoading = false,
  className,
}: ProfileFormProps) {
  const [customSkill, setCustomSkill] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile?.skills || []
  );
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    profile?.preferred_job_types || []
  );

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
      bio: profile?.bio || "",
      experience_level: profile?.experience_level || undefined,
      preferred_salary_min: profile?.preferred_salary_min || undefined,
      preferred_salary_max: profile?.preferred_salary_max || undefined,
      skills: profile?.skills || [],
      preferred_job_types: profile?.preferred_job_types || [],
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      await onSubmit({
        ...data,
        skills: selectedSkills,
        preferred_job_types: selectedJobTypes,
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      form.setValue("skills", [...selectedSkills, skill]);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = selectedSkills.filter((skill) => skill !== skillToRemove);
    setSelectedSkills(updatedSkills);
    form.setValue("skills", updatedSkills);
  };

  const addCustomSkill = () => {
    if (customSkill.trim()) {
      addSkill(customSkill.trim());
      setCustomSkill("");
    }
  };

  const toggleJobType = (jobType: string) => {
    const isSelected = selectedJobTypes.includes(jobType);
    const updatedJobTypes = isSelected
      ? selectedJobTypes.filter((type) => type !== jobType)
      : [...selectedJobTypes, jobType];

    setSelectedJobTypes(updatedJobTypes);
    form.setValue("preferred_job_types", updatedJobTypes);
  };

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City, State/Country"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself, your experience, and career goals..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of your professional background (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Experience Level */}
            <FormField
              control={form.control}
              name="experience_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Salary Preferences */}
            <div className="space-y-4">
              <FormLabel>Salary Expectations (Annual)</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferred_salary_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50000"
                          {...field}
                          onChange={(e) => field.onChange(+e.target.value || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferred_salary_max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="80000"
                          {...field}
                          onChange={(e) => field.onChange(+e.target.value || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <FormLabel>Skills & Technologies</FormLabel>

              {/* Selected Skills */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-3 py-1 bg-[#1993e5]/10 text-[#1993e5] border border-[#1993e5]/20"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Popular Skills */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Popular skills:</p>
                <div className="flex flex-wrap gap-2">
                  {popularSkills
                    .filter((skill) => !selectedSkills.includes(skill))
                    .map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        + {skill}
                      </button>
                    ))}
                </div>
              </div>

              {/* Custom Skill Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom skill"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomSkill}
                  className="px-3"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Job Type Preferences */}
            <div className="space-y-4">
              <FormLabel>Preferred Job Types</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {jobTypes.map((jobType) => {
                  const isSelected = selectedJobTypes.includes(jobType.value);
                  return (
                    <button
                      key={jobType.value}
                      type="button"
                      onClick={() => toggleJobType(jobType.value)}
                      className={cn(
                        "p-3 rounded-lg border text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-[#1993e5] text-white border-[#1993e5]"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                      )}
                    >
                      {jobType.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#1993e5] hover:bg-[#1680cc] text-white min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}