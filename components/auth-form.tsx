"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (data: AuthFormData) => void;
  isLoading?: boolean;
}

export function AuthForm({ type, onSubmit, isLoading = false }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    fullName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "register" && formData.fullName) {
      // Split fullName into first and last name if needed by backend, though your logic uses fullName in handler.
    }
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Pane - 45% */}
      <div
        className="hidden md:flex flex-col w-[50%] relative"
        style={{
          background: "linear-gradient(to bottom, #0F172A, #1E293B, #0F172A)"
        }}
      >
        <div className="absolute top-[30%] left-[50%] translate-x-[-50%] translate-y-[-50%] size-60 bg-[#1E85FF] blur-[5rem] rounded-full opacity-10"></div>
        <div className="absolute top-[60%] left-[50%] translate-x-[-50%] translate-y-[-50%] size-72 bg-[#12B76A] blur-[5rem] rounded-full opacity-10"></div>
        <div className="flex items-center gap-3 text-white absolute top-12 left-12">
          <div className="w-20 h-20 bg-none rounded-full flex items-center justify-center overflow-hidden">
            <Image src="/brand.png" alt="PW Logo" width={100} height={100} className="object-cover" />
          </div>
          <span className="text-[26px] font-[800] tracking-tight">Physics Wallah</span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-12 mt-12 mb-12">
          {type === "login" ? (
            <>
              <h1 className="text-[42px] font-[700] text-white leading-[1.2] mb-6">
                Your Career Journey<br />Starts Here
              </h1>
              <p className="text-[16px] font-[400] text-[#CBD5E1] mb-12">
                Access your personalized dashboard, track your<br />
                onboarding progress, and connect with your team.
              </p>

              <ul className="space-y-6">
                {[
                  "Track your onboarding journey",
                  "Connect with your team",
                  "Access important resources"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0 fill-[#22C55E]" />
                    <span className="text-[16px] font-[500] text-[#E2E8F0]">{item}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h1 className="text-[42px] font-[700] text-white leading-[1.2] mb-6">
                Join Our Growing<br />Team
              </h1>
              <p className="text-[16px] font-[400] text-[#CBD5E1] mb-12">
                Create your account to get started with your career<br />
                journey and unlock exclusive benefits.
              </p>

              <ul className="space-y-8">
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0 mt-1 fill-[#22C55E]" />
                  <div>
                    <h3 className="text-[16px] font-[600] text-[#E2E8F0] mb-1">Seamless Onboarding</h3>
                    <p className="text-[14px] text-[#94A3B8]">Step-by-step guidance for your first day</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0 mt-1 fill-[#22C55E]" />
                  <div>
                    <h3 className="text-[16px] font-[600] text-[#E2E8F0] mb-1">Team Collaboration</h3>
                    <p className="text-[14px] text-[#94A3B8]">Connect with colleagues instantly</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0 mt-1 fill-[#22C55E]" />
                  <div>
                    <h3 className="text-[16px] font-[600] text-[#E2E8F0] mb-1">Career Growth</h3>
                    <p className="text-[14px] text-[#94A3B8]">Track progress and achievements</p>
                  </div>
                </li>
              </ul>
            </>
          )}
        </div>

        <div className="absolute bottom-12 left-12 lg:left-16 text-sm text-[#94A3B8]">
          © 2026 Physics Wallah. All rights reserved.
        </div>
      </div>

      {/* Right Pane - 55% */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-[440px] space-y-8">
          <div>
            <h2 className="text-[32px] font-[700] text-[#0F172A] mb-2 tracking-tight">
              {type === "login" ? "Welcome back! 👋" : "Create your account"}
            </h2>
            <p className="text-[16px] font-[400] text-[#64748B]">
              {type === "login"
                ? "Please enter your credentials to access your account"
                : "Start your journey with us today"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {type === "register" && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[14px] font-[500] text-[#344054]">
                  Full name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="h-11 pl-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[14px] font-[500] text-[#344054]">
                Email address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-11 pl-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[14px] font-[500] text-[#344054]">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="h-11 pl-10 pr-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                  placeholder={type === "login" ? "Enter your password" : "Create a strong password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F172A]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {type === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[14px] font-[500] text-[#344054]">
                  Confirm password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="h-11 pl-10 pr-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F172A]"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {type === "login" ? (
              <div className="flex items-center justify-between text-sm mt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="border-gray-300 text-[#0F172A] focus:ring-[#0F172A] rounded-[4px]" />
                  <label htmlFor="remember" className="text-[#64748B] font-medium cursor-pointer">
                    Remember me
                  </label>
                </div>
                <Link href="#" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                  Forgot password?
                </Link>
              </div>
            ) : (
              <div className="flex items-start space-x-2 mt-4">
                <Checkbox id="terms" className="border-gray-300 text-[#0F172A] focus:ring-[#0F172A] rounded-[4px] mt-1" required />
                <label htmlFor="terms" className="text-sm text-[#64748B] cursor-pointer">
                  I agree to the <Link href="#" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]">Terms and Conditions</Link> and <Link href="#" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]">Privacy Policy</Link>
                </label>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-[8px] transition-colors duration-200 mt-6 flex items-center justify-center gap-2"
            >
              {isLoading ? "Please wait..." : (type === "login" ? "Sign in to your account" : "Create your account")}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E2E8F0]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#94A3B8]">
                or {type === "login" ? "continue" : "sign up"} with
              </span>
            </div>
          </div>

          <div className="mt-6 gap-4 flex w-full">
            <Button variant="outline" type="button" className="flex-1 h-11 border-[#E2E8F0] text-[#475569] font-medium hover:bg-gray-50 bg-white">
              <FcGoogle className="size-6" />Google
            </Button>
            <Button variant="outline" type="button" className="flex-1 h-11 border-[#E2E8F0] text-[#475569] font-medium hover:bg-gray-50 bg-white">
              <FaGithub className="size-6" /> GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-[#64748B] mt-8">
            {type === "login" ? "Don't have an account? " : "Already have an account? "}
            <Link
              href={type === "login" ? "/register" : "/login"}
              className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
            >
              {type === "login" ? "Create account" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}