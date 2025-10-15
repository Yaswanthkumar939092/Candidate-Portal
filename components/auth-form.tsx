"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { OAuthButtons } from "@/components/oauth-buttons";

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border-0 rounded-2xl">
        <CardHeader className="space-y-4 pb-6">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              {type === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {type === "login"
                ? "Sign in to your account to continue"
                : "Join us to find your next opportunity"
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* OAuth Buttons */}
          <OAuthButtons mode={type === "login" ? "signin" : "signup"} />

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="h-11 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5]"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="h-11 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5]"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-11 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5]"
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="h-11 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5] pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {type === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="h-11 rounded-lg border-gray-300 focus:border-[#1993e5] focus:ring-[#1993e5] pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#1993e5] hover:bg-[#1680cc] text-white font-medium rounded-lg transition-colors duration-200"
            >
              {isLoading ? "Please wait..." : (type === "login" ? "Sign In" : "Create Account")}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              {type === "login" ? "Don't have an account? " : "Already have an account? "}
              <a
                href={type === "login" ? "/register" : "/login"}
                className="text-[#1993e5] hover:text-[#1680cc] font-medium transition-colors"
              >
                {type === "login" ? "Sign up" : "Sign in"}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}