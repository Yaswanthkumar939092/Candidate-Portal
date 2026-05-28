"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm, AuthFormData } from "@/components/auth-form";
import { auth } from "@/lib/auth";
import { useAuthSettings } from "@/lib/hooks/useAuthSettings";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-0 md:p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-[#64748B]">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purposeParam = searchParams.get("purpose");
  const emailParam = searchParams.get("email") || "";
  const isPasswordReset = purposeParam === "Password Reset";

  const { data: settings, isLoading: isSettingsLoading, error: settingsError } = useAuthSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [receivedOtpLog, setReceivedOtpLog] = useState<string | null>(null);
  const [receivedPurpose, setReceivedPurpose] = useState<string | null>(null);

  useEffect(() => {
    if (settingsError) {
      const msg = settingsError instanceof Error ? settingsError.message : "Failed to load auth settings";
      toast.error(msg);
    }
  }, [settingsError]);

  const handleRequestOtp = async (formData: AuthFormData) => {
    setIsLoading(true);

    try {
      let response;
      if (isPasswordReset) {
        response = await auth.resetPassword(formData.email);
      } else {
        response = await auth.requestEmailSignupOtp({
          email: formData.email,
          mode: "verify_email",
        });
      }
      setPendingOtpEmail(formData.email);
      if (response) {
        if (response.otp_log) {
          setReceivedOtpLog(response.otp_log);
        }
        if (response.purpose) {
          setReceivedPurpose(response.purpose);
        }
      }
      toast.success(`Verification code sent to ${formData.email}`);
    } catch (error) {
      console.error("Request OTP error:", error);
      const msg = error instanceof Error ? error.message : "Failed to send verification code";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingOtpEmail) return;

    setIsLoading(true);

    try {
      await auth.verifyOtp({
        identifier: pendingOtpEmail,
        otp,
        purpose: (receivedPurpose || (isPasswordReset ? "Password Reset" : "Signup")) as any,
        identifierType: "Email",
        otp_log: receivedOtpLog || undefined,
      });
      setIsSettingPassword(true);
      toast.success("OTP verified successfully!");
    } catch (error) {
      console.error("Verify OTP error:", error);
      const msg = error instanceof Error ? error.message : "Failed to verify OTP";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (formData: AuthFormData) => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await auth.setPassword(formData.password);
      await auth.signOut();

      setIsSettingPassword(false);
      setPendingOtpEmail(null);
      setOtp("");
      toast.success("Password resetted successfully please login!");
      router.push("/login");
    } catch (error) {
      console.error("Set password error:", error);
      const msg = error instanceof Error ? error.message : "Failed to set password";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setPendingOtpEmail(null);
    setOtp("");
    setIsSettingPassword(false);
    setReceivedOtpLog(null);
    setReceivedPurpose(null);
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-0 md:p-8">
      {isSettingsLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-[#64748B]">Loading settings...</p>
        </div>
      ) : (
        <>
          {settings && settings.enable_email_signup === 1 ? (
            <AuthForm
              type="login"
              onSubmit={isSettingPassword ? handleSetPassword : pendingOtpEmail ? handleVerifyOtp : handleRequestOtp}
              isLoading={isLoading}
              loginStep={isSettingPassword ? "setPassword" : pendingOtpEmail ? "otp" : "credentials"}
              otpEmail={pendingOtpEmail || undefined}
              otpValue={otp}
              onOtpChange={setOtp}
              onBackToCredentials={resetState}
              allowSignup={settings.allow_signup === 1}
              enableEmailSignup={settings.enable_email_signup === 1}
              isPasswordless={true}
              onPasswordlessToggle={handleBackToLogin}
              purpose={isPasswordReset ? "Password Reset" : "Signup"}
              defaultEmail={emailParam}
            />
          ) : (
            <AuthUnavailable
              title="Access unavailable"
              message="Accessing candidate portal via email verification is not enabled."
            />
          )}
        </>
      )}
    </div>
  );
}

function AuthUnavailable({ title, message }: { title: string; message: string }) {
  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center text-card-foreground shadow-sm">
      <MailCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <h2 className="mb-1 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
