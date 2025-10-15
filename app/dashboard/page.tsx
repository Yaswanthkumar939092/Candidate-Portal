"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Briefcase,
  Bell,
  Settings,
  Eye,
  Calendar,
  MapPin,
  Building2,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

// Mock data
const user = {
  name: "John Doe",
  email: "john.doe@example.com",
  title: "Frontend Developer",
  location: "San Francisco, CA",
  profileCompletion: 85,
};

const recentApplications = [
  {
    id: "1",
    jobTitle: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    appliedDate: "2024-01-15",
    status: "Under Review",
    salary: "$120k - $160k",
  },
  {
    id: "2",
    jobTitle: "Full Stack Engineer",
    company: "StartupXYZ",
    appliedDate: "2024-01-12",
    status: "Interview Scheduled",
    salary: "$100k - $140k",
  },
  {
    id: "3",
    jobTitle: "UI/UX Designer",
    company: "Design Studio",
    appliedDate: "2024-01-10",
    status: "Rejected",
    salary: "$80k - $100k",
  },
];

const savedJobs = [
  {
    id: "4",
    title: "DevOps Engineer",
    company: "CloudTech Solutions",
    location: "Austin, TX",
    salary: "$110k - $150k",
    postedAt: "4 days ago",
  },
  {
    id: "5",
    title: "Product Manager",
    company: "InnovateNow",
    location: "Seattle, WA",
    salary: "$130k - $180k",
    postedAt: "5 days ago",
  },
];

const recommendations = [
  {
    id: "6",
    title: "React Developer",
    company: "WebFlow Inc.",
    location: "Remote",
    salary: "$90k - $120k",
    match: 95,
  },
  {
    id: "7",
    title: "Frontend Engineer",
    company: "NextGen Tech",
    location: "New York, NY",
    salary: "$105k - $135k",
    match: 88,
  },
];

const activities = [
  {
    type: "application",
    title: "Applied to Senior Frontend Developer at TechCorp Inc.",
    date: "2 days ago",
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    type: "view",
    title: "Viewed DevOps Engineer position at CloudTech",
    date: "3 days ago",
    icon: <Eye className="w-4 h-4" />,
  },
  {
    type: "save",
    title: "Saved Product Manager role at InnovateNow",
    date: "5 days ago",
    icon: <Star className="w-4 h-4" />,
  },
  {
    type: "interview",
    title: "Interview scheduled with StartupXYZ",
    date: "1 week ago",
    icon: <Calendar className="w-4 h-4" />,
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Under Review":
        return "bg-yellow-100 text-yellow-800";
      case "Interview Scheduled":
        return "bg-blue-100 text-blue-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Under Review":
        return <Clock className="w-3 h-3" />;
      case "Interview Scheduled":
        return <Calendar className="w-3 h-3" />;
      case "Rejected":
        return <Clock className="w-3 h-3" />;
      case "Accepted":
        return <CheckCircle2 className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your job search
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <div className="w-12 h-12 bg-[#1993e5] bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#1993e5]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Saved Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Profile Views</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full bg-white rounded-lg p-1 shadow-sm">
                <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
                <TabsTrigger value="applications" className="rounded-md">Applications</TabsTrigger>
                <TabsTrigger value="saved" className="rounded-md">Saved Jobs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Recent Applications */}
                <Card className="bg-white border-0 shadow-sm rounded-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Recent Applications
                    </CardTitle>
                    <Link href="/dashboard?tab=applications">
                      <Button variant="ghost" size="sm" className="text-[#1993e5]">
                        View All
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentApplications.slice(0, 3).map((application) => (
                      <div key={application.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {application.jobTitle}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{application.company}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Applied {application.appliedDate}</span>
                            <span>{application.salary}</span>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(application.status)} flex items-center space-x-1`}>
                          {getStatusIcon(application.status)}
                          <span>{application.status}</span>
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recommended Jobs */}
                <Card className="bg-white border-0 shadow-sm rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Recommended for You
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.map((job) => (
                      <div key={job.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-[#1993e5] transition-colors">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{job.title}</h3>
                            <Badge className="bg-green-100 text-green-800">
                              {job.match}% match
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{job.location}</span>
                            </div>
                            <span>{job.salary}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#1993e5] hover:bg-[#1680cc] text-white ml-4"
                        >
                          View Job
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="applications" className="space-y-6">
                <Card className="bg-white border-0 shadow-sm rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      All Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentApplications.map((application) => (
                      <div key={application.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {application.jobTitle}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{application.company}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Applied {application.appliedDate}</span>
                            <span>{application.salary}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={`${getStatusColor(application.status)} flex items-center space-x-1`}>
                            {getStatusIcon(application.status)}
                            <span>{application.status}</span>
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-[#1993e5]">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="saved" className="space-y-6">
                <Card className="bg-white border-0 shadow-sm rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Saved Jobs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {savedJobs.map((job) => (
                      <div key={job.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{job.location}</span>
                            </div>
                            <span>{job.salary}</span>
                            <span>Posted {job.postedAt}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 border-gray-300"
                          >
                            Remove
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#1993e5] hover:bg-[#1680cc] text-white"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardContent className="p-6 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="bg-[#1993e5] text-white text-xl">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-gray-900 mb-1">{user.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{user.title}</p>
                <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mb-4">
                  <MapPin className="w-3 h-3" />
                  <span>{user.location}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Profile Completion</span>
                    <span className="font-medium text-gray-900">{user.profileCompletion}%</span>
                  </div>
                  <Progress value={user.profileCompletion} className="h-2" />
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4 text-[#1993e5] border-[#1993e5] hover:bg-blue-50"
                >
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activities.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-[#1993e5] to-[#1680cc] text-white border-0 shadow-sm rounded-xl">
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Ready for More?</h3>
                <p className="text-sm text-blue-100 mb-4">
                  Explore new opportunities and advance your career
                </p>
                <Link href="/jobs">
                  <Button className="w-full bg-white text-[#1993e5] hover:bg-gray-50 font-medium">
                    Browse Jobs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}