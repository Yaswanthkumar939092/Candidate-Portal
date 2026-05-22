"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm, AuthFormData } from "@/components/auth-form";
import { auth, type FrappeAuthSettings } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, MailCheck, CheckCircle2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [settings, setSettings] = useState<FrappeAuthSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    auth.getAuthSettings()
      .then((data) => {
        if (isMounted) setSettings(data);
      })
      .catch((error) => {
        console.error("Auth settings error:", error);
        if (isMounted) setError(error instanceof Error ? error.message : "Failed to load auth settings");
      })
      .finally(() => {
        if (isMounted) setIsSettingsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRequestOtp = async (formData: AuthFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await auth.requestEmailSignupOtp({
        email: formData.email,
      });
      setPendingOtpEmail(formData.email);
    } catch (error) {
      console.error("Request OTP error:", error);
      setError(error instanceof Error ? error.message : "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingOtpEmail) return;

    setIsLoading(true);
    setError(null);

    try {
      await auth.verifyOtp({
        identifier: pendingOtpEmail,
        otp,
        purpose: "Signup",
        identifierType: "Email",
      });
      setIsSettingPassword(true);
    } catch (error) {
      console.error("Verify OTP error:", error);
      setError(error instanceof Error ? error.message : "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (formData: AuthFormData) => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await auth.setPassword(formData.password);
      await auth.signOut();

      setIsSettingPassword(false);
      setPendingOtpEmail(null);
      setOtp("");
      setSuccessMessage("Password set successfully! Please log in using your email and password.");
      router.push("/login");
    } catch (error) {
      console.error("Set password error:", error);
      setError(error instanceof Error ? error.message : "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setPendingOtpEmail(null);
    setOtp("");
    setError(null);
    setSuccessMessage(null);
    setIsSettingPassword(false);
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-0 md:p-8">
      {successMessage && (
        <div className="p-4 w-full max-w-md">
          <Alert className="border-emerald-500/30 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="p-4 w-full max-w-md">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

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
