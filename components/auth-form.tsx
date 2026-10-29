"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  MailCheck,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCandidateBranding } from "@/lib/hooks/useCandidateBranding";
import { useAuthPageContent } from "@/lib/hooks/useAuthPageContent";
import type { AuthPagePoint } from "@/lib/services/auth-page-content";
import { cn } from "@/lib/utils";
import { BrandLockup } from "@/components/brand-lockup";

// Generic left-pane content used when the backend doesn't provide it.
// Keep these company-agnostic — no hard-coded brand names.
const DEFAULT_LEFT_PANE: Record<
  "login" | "signup",
  { heading: string; subheading: string; points: AuthPagePoint[] }
> = {
  login: {
    heading: "Your Career Journey Starts Here",
    subheading:
      "Access your personalized dashboard, track your onboarding progress, and connect with your team.",
    points: [
      { title: "Track your onboarding journey" },
      { title: "Connect with your team" },
      { title: "Access important resources" },
    ],
  },
  signup: {
    heading: "Join Our Growing Team",
    subheading:
      "Create your account to get started with your career journey and unlock exclusive benefits.",
    points: [
      {
        title: "Seamless Onboarding",
        description: "Step-by-step guidance for your first day",
      },
      {
        title: "Team Collaboration",
        description: "Connect with colleagues instantly",
      },
      {
        title: "Career Growth",
        description: "Track progress and achievements",
      },
    ],
  },
};

function resolveFrappeAssetUrl(path?: string | null): string | undefined {
  const value = path?.trim();
  if (!value) return undefined;
  const base = (process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
  const url = value.startsWith("http")
    ? value
    : `${base}${value.startsWith("/") ? value : `/${value}`}`;
  // Frappe file names can contain spaces; encode without double-encoding.
  try {
    return encodeURI(decodeURI(url));
  } catch {
    return url;
  }
}

export interface AuthFormData {
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
  loginStep?: "credentials" | "otp" | "setPassword";
  otpEmail?: string;
  otpValue?: string;
  onOtpChange?: (value: string) => void;
  onBackToCredentials?: () => void;
  allowSignup?: boolean;
  enableEmailSignup?: boolean;
  isPasswordless?: boolean;
  onPasswordlessToggle?: (value: boolean) => void;
  purpose?: "Signup" | "Password Reset";
  defaultEmail?: string;
}

export function AuthForm({
  type,
  onSubmit,
  isLoading = false,
  loginStep = "credentials",
  otpEmail,
  otpValue = "",
  onOtpChange,
  onBackToCredentials,
  allowSignup = true,
  enableEmailSignup = false,
  isPasswordless = false,
  onPasswordlessToggle,
  purpose = "Signup",
  defaultEmail,
}: AuthFormProps) {
  const { data: branding } = useCandidateBranding();
  const { data: pageContent } = useAuthPageContent();
  const sectionKey = type === "login" ? "login" : "signup";
  const section = pageContent?.[sectionKey];
  const fallback = DEFAULT_LEFT_PANE[sectionKey];
  const heading = section?.heading?.trim() || fallback.heading;
  const subheading = section?.subheading?.trim() || fallback.subheading;
  const customBackground = resolveFrappeAssetUrl(section?.background_image);
  const [failedBackground, setFailedBackground] = useState<string | null>(
    null,
  );
  const showCustomBackground =
    Boolean(customBackground) && failedBackground !== customBackground;
  const apiPoints = (section?.points ?? []).filter(
    (point): point is AuthPagePoint => Boolean(point?.title?.trim()),
  );
  const points = apiPoints.length ? apiPoints : fallback.points;
  const logoSrc =
    resolveFrappeAssetUrl(pageContent?.logo) ||
    resolveFrappeAssetUrl(branding?.app_logo) ||
    "/fallback.png";
  const footer =
    pageContent?.footer?.trim() ||
    `© ${new Date().getFullYear()}${branding?.title_prefix ? ` ${branding.title_prefix}` : ""}. All rights reserved.`;
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectQuery = redirectParam
    ? `&redirect=${encodeURIComponent(redirectParam)}`
    : "";
  const redirectQueryQuestion = redirectParam
    ? `?redirect=${encodeURIComponent(redirectParam)}`
    : "";

  const [formData, setFormData] = useState<AuthFormData>({
    email: defaultEmail || "",
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
    <div className="w-full max-w-[1240px] mx-auto flex flex-col md:flex-row bg-card md:rounded-[24px] md:shadow-2xl overflow-hidden min-h-screen md:min-h-[580px] lg:min-h-[640px]">
      {/* Left Pane - 50% */}
      <div
        className="hidden md:flex flex-col w-[50%] relative overflow-hidden"
        style={{ backgroundColor: "#1B2132" }}
      >
        {showCustomBackground && customBackground ? (
          <Image
            src={customBackground}
            alt=""
            aria-hidden="true"
            data-testid="auth-pane-background"
            fill
            unoptimized
            priority
            sizes="50vw"
            className="pointer-events-none object-cover object-top"
            onError={() => setFailedBackground(customBackground)}
          />
        ) : (
          // Fallback glow (Figma: 384×384 #12B76A ellipse, layer blur 240).
          <div
            aria-hidden="true"
            data-testid="auth-pane-glow"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[384px] w-[384px] rounded-full bg-[#12B76A] opacity-20 blur-[120px]"
          />
        )}
        <div className="z-10 flex items-center gap-2 text-white absolute md:top-6 md:left-6 lg:top-10 lg:left-10 top-12 left-12">
          <BrandLockup branding={branding} logoSrc={logoSrc} tone="light" size="lg" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center md:px-6 lg:px-10 md:mt-4 md:mb-4 mt-12 mb-12">
          <h1 className="md:text-[28px] lg:text-[36px] text-[30px] font-[700] text-white leading-[1.2] mb-4 max-w-[480px]">
            {heading}
          </h1>
          <p className="md:text-[15px] lg:text-[17px] text-[15px] font-[400] text-[#CBD5E1] leading-relaxed md:mb-6 lg:mb-8 mb-6">
            {subheading}
          </p>

          <ul
            className={cn(
              "space-y-4",
              points.some((point) => point.description)
                ? "md:space-y-4 lg:space-y-6"
                : "md:space-y-3 lg:space-y-4",
            )}
          >
            {points.map((point, i) =>
              point.description ? (
                <li key={i} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5 fill-[#22C55E]" />
                  <div>
                    <h3 className="text-sm font-[600] text-[#E2E8F0] mb-0.5">
                      {point.title}
                    </h3>
                    <p className="text-[13px] text-[#94A3B8]">
                      {point.description}
                    </p>
                  </div>
                </li>
              ) : (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 fill-[#22C55E]" />
                  <span className="text-sm font-[500] text-[#E2E8F0]">
                    {point.title}
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="z-10 absolute md:bottom-6 md:left-6 lg:bottom-10 lg:left-10 bottom-12 left-12 text-xs text-[#94A3B8]">
          {footer}
        </div>
      </div>

      {/* Right Pane - 50% */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10">
        <div className="w-full max-w-[400px] space-y-5 md:space-y-6">
          <div>
            <h2 className="md:text-[24px] lg:text-[28px] text-[24px] font-[700] text-[#0F172A] mb-1.5 tracking-tight">
              {type === "login" && loginStep === "otp"
                ? "Check your email"
                : type === "login" && loginStep === "setPassword"
                  ? purpose === "Password Reset"
                    ? "Reset your password"
                    : "Set your password"
                  : type === "login" && isPasswordless
                    ? purpose === "Password Reset"
                      ? "Reset your password"
                      : "Verify your email"
                    : type === "login"
                      ? "Welcome! 👋"
                      : "Create your account"}
            </h2>
            <p className="text-sm font-[400] text-[#64748B]">
              {type === "login" && loginStep === "otp"
                ? `Enter the OTP sent to ${otpEmail || "your email"}`
                : type === "login" && loginStep === "setPassword"
                  ? purpose === "Password Reset"
                    ? "Create a new password for your account."
                    : "Create a password for your account to ensure secure access in the future."
                  : type === "login" && isPasswordless
                    ? purpose === "Password Reset"
                      ? "We'll send a 6-digit verification code to your email address to reset your password."
                      : "We'll send a 6-digit verification code to your email address to confirm your account."
                    : type === "login"
                      ? "Please enter your credentials to access your account"
                      : "Start your journey with us today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 lg:space-y-4">
            {type === "login" && loginStep === "otp" ? (
              <div className="space-y-3.5 lg:space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MailCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-otp"
                    className="text-[13px] font-[500] text-[#344054]"
                  >
                    Email OTP
                  </Label>
                  <Input
                    id="login-otp"
                    value={otpValue}
                    onChange={(e) => onOtpChange?.(e.target.value)}
                    className="h-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter OTP"
                    required
                  />
                </div>
              </div>
            ) : (
              type === "register" && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="fullName"
                    className="text-[13px] font-[500] text-[#344054]"
                  >
                    Full name
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      className="h-10 pl-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              )
            )}

            {loginStep === "setPassword" && (
              <>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="password-new"
                    className="text-[13px] font-[500] text-[#344054]"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <Input
                      id="password-new"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className="h-10 pl-10 pr-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-[13px] font-[500] text-[#344054]"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className="h-10 pl-10 pr-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {loginStep === "credentials" && (
              <>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-[13px] font-[500] text-[#344054]"
                  >
                    Email address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="h-10 pl-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {!isPasswordless && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="password"
                      className="text-[13px] font-[500] text-[#344054]"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="h-10 pl-10 pr-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                        placeholder={
                          type === "login"
                            ? "Enter your password"
                            : "Create a strong password"
                        }
                        required={!isPasswordless}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {type === "register" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[13px] font-[500] text-[#344054]"
                >
                  Confirm password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="h-10 pl-10 pr-10 rounded-[8px] border-[#E2E8F0] focus:border-[#0F172A] focus:ring-[#0F172A]"
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {type === "login" &&
            loginStep === "credentials" &&
            !isPasswordless ? (
              <div className="flex items-center justify-between text-sm mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    className="border-gray-300 text-[#0F172A] focus:ring-[#0F172A] rounded-[4px]"
                  />
                  <label
                    htmlFor="remember"
                    className="text-[#64748B] font-medium cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  href={`/verify-email?purpose=Password%20Reset${formData.email ? `&email=${encodeURIComponent(formData.email)}` : ""}${redirectQuery}`}
                  className="font-semibold text-accent-foreground hover:text-accent-foreground/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            ) : type === "register" ? (
              <div className="flex items-start space-x-2 mt-3">
                <Checkbox
                  id="terms"
                  className="border-gray-300 text-[#0F172A] focus:ring-[#0F172A] rounded-[4px] mt-1"
                  required
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-[#64748B] cursor-pointer"
                >
                  I agree to the{" "}
                  <Link
                    href="#"
                    className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#"
                    className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 font-medium transition-colors duration-200 mt-4 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : type === "login" && loginStep === "otp" ? (
                "Verify and continue"
              ) : type === "login" && loginStep === "setPassword" ? (
                "Set password"
              ) : type === "login" && isPasswordless ? (
                "Send verification code"
              ) : type === "login" ? (
                "Sign in to your account"
              ) : (
                "Create your account"
              )}
            </Button>

            {type === "login" && loginStep === "otp" && onBackToCredentials && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBackToCredentials}
                disabled={isLoading}
              >
                Use a different email
              </Button>
            )}

            {type === "login" &&
              loginStep === "setPassword" &&
              onBackToCredentials && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={onBackToCredentials}
                  disabled={isLoading}
                >
                  Cancel and back to login
                </Button>
              )}

            {/* {type === "login" &&
              isPasswordless &&
              loginStep === "credentials" && (
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-[12px] p-4 mt-6 flex gap-3 text-left">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-[600] text-[#1E3A8A]">
                      Why do I need to verify?
                    </h4>
                    <p className="text-[13px] font-[400] text-[#1E40AF] mt-1 leading-relaxed">
                      To protect your career data and ensure secure access to
                      your onboarding dashboard and team communications.
                    </p>
                  </div>
                </div>
              )} */}
          </form>

          {loginStep === "credentials" && (
            <div className="text-center text-sm text-[#64748B] mt-6 flex flex-col items-center justify-center gap-2">
              {type === "login" ? (
                isPasswordless ? (
                  <div>
                    <Link
                      href={`/login${redirectQueryQuestion}`}
                      className="font-semibold text-accent-foreground hover:text-accent-foreground/80 transition-colors"
                    >
                      Back to login
                    </Link>
                  </div>
                ) : (
                  <>
                    {allowSignup && (
                      <div>
                        {"Don't have an account? "}
                        <Link
                          href={`/register${redirectQueryQuestion}`}
                          className="font-semibold text-accent-foreground hover:text-accent-foreground/80 transition-colors"
                        >
                          Create account
                        </Link>
                      </div>
                    )}
                    {/* {enableEmailSignup && (
                      <button
                        type="button"
                        onClick={() => onPasswordlessToggle?.(true)}
                        className="font-semibold text-accent-foreground hover:text-accent-foreground/80 transition-colors"
                      >
                        Access Candidate portal
                      </button>
                    )} */}
                  </>
                )
              ) : (
                <div>
                  Already have an account?{" "}
                  <Link
                    href={`/login${redirectQueryQuestion}`}
                    className="font-semibold text-accent-foreground hover:text-accent-foreground/80 transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
