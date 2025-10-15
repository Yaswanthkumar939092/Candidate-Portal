"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, Users, TrendingUp, Award } from "lucide-react";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    if (searchQuery) searchParams.set("search", searchQuery);
    if (location) searchParams.set("location", location);

    router.push(`/jobs?${searchParams.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const popularSearches = [
    "Software Engineer",
    "Product Manager",
    "Data Scientist",
    "UX Designer",
    "Marketing Manager",
    "Sales Representative"
  ];

  const stats = [
    { icon: Briefcase, label: "Active Jobs", value: "10,000+" },
    { icon: Users, label: "Job Seekers", value: "50,000+" },
    { icon: TrendingUp, label: "Success Rate", value: "85%" },
    { icon: Award, label: "Top Companies", value: "500+" },
  ];

  return (
    <section className="relative">
      {/* Hero Background */}
      <div className="relative bg-gradient-to-br from-[#1993e5] via-[#1680cc] to-[#1565b3] overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-50">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }} />
        </div>

        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Find Your{" "}
                <span className="text-yellow-300">Dream Job</span>
                <br />
                Today
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Discover amazing opportunities from top companies worldwide.
                Join thousands of professionals who found their perfect career match.
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-2xl mb-8 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Job title, skills, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-12 h-14 text-lg border-0 focus:ring-2 focus:ring-[#1993e5] rounded-xl"
                  />
                </div>
                <div className="md:w-64 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Location..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-12 h-14 text-lg border-0 focus:ring-2 focus:ring-[#1993e5] rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="h-14 px-8 bg-[#1993e5] hover:bg-[#1680cc] text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  Search Jobs
                </Button>
              </div>

              {/* Popular Searches */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-gray-600 text-sm font-medium">Popular:</span>
                {popularSearches.map((search) => (
                  <Badge
                    key={search}
                    variant="secondary"
                    className="cursor-pointer hover:bg-[#1993e5] hover:text-white transition-colors duration-200 text-gray-700"
                    onClick={() => {
                      setSearchQuery(search);
                      const searchParams = new URLSearchParams();
                      searchParams.set("search", search);
                      if (location) searchParams.set("location", location);
                      router.push(`/jobs?${searchParams.toString()}`);
                    }}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => router.push("/register")}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[#1993e5] font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-200"
                onClick={() => router.push("/jobs")}
              >
                Browse All Jobs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-16 h-16 bg-[#1993e5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600 mb-6 font-medium">Trusted by leading companies worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {/* Placeholder for company logos */}
              {["TechCorp", "Innovation Labs", "Global Solutions", "StartupHub", "Enterprise Co", "Future Tech"].map((company) => (
                <div key={company} className="text-gray-400 font-bold text-lg">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}