import { HeroSection } from "@/components/hero-section";
import { FeaturedJobs } from "@/components/featured-jobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle, UserCheck, Briefcase, TrendingUp, Shield, Clock, Globe, Heart } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: UserCheck,
      title: "Easy Application Process",
      description: "Apply to multiple jobs with just one click using your saved profile and documents."
    },
    {
      icon: Shield,
      title: "Verified Companies",
      description: "All companies are verified and vetted to ensure legitimate job opportunities."
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Get instant notifications about your application status and new matching jobs."
    },
    {
      icon: Globe,
      title: "Global Opportunities",
      description: "Access job opportunities from companies worldwide, including remote positions."
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Create Your Profile",
      description: "Build a comprehensive profile with your skills, experience, and preferences."
    },
    {
      step: "02",
      title: "Search & Apply",
      description: "Find jobs that match your criteria and apply with just one click."
    },
    {
      step: "03",
      title: "Track Progress",
      description: "Monitor your applications and get updates on your job search progress."
    },
    {
      step: "04",
      title: "Land Your Dream Job",
      description: "Connect with employers and start your new career journey."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Jobs Section */}
      <FeaturedJobs />

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Getting started with your job search is simple. Follow these easy steps to find your perfect job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#1993e5] to-transparent -translate-x-1/2 z-0"></div>
                )}
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-[#1993e5] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose JobPortal?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide the tools and features you need to find your perfect job efficiently and effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-[#1993e5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-16 bg-gradient-to-r from-[#1993e5] to-[#1565b3]">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
              Join thousands of professionals who found their dream jobs through JobPortal.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-yellow-300" />
                </div>
                <blockquote className="text-lg mb-4 italic">
                  "JobPortal helped me land my dream job at a top tech company. The application process was seamless!"
                </blockquote>
                <cite className="text-blue-100">- Sarah Chen, Software Engineer</cite>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-yellow-300" />
                </div>
                <blockquote className="text-lg mb-4 italic">
                  "Within 2 weeks of joining, I received 5 interview calls. Amazing platform for job seekers!"
                </blockquote>
                <cite className="text-blue-100">- Michael Rodriguez, Product Manager</cite>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-yellow-300" />
                </div>
                <blockquote className="text-lg mb-4 italic">
                  "The best job search platform I've used. Great companies and excellent user experience."
                </blockquote>
                <cite className="text-blue-100">- Emily Johnson, UX Designer</cite>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-8" asChild>
                <Link href="/register">Start Your Success Story</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#1993e5] font-semibold px-8" asChild>
                <Link href="/jobs">Explore Opportunities</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-[#1993e5] to-[#1565b3] rounded-3xl p-12 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Find Your Dream Job?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join over 50,000 job seekers who trust JobPortal to advance their careers.
                Create your profile today and start receiving personalized job recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-8" asChild>
                  <Link href="/register">Get Started for Free</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#1993e5] font-semibold px-8" asChild>
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
