"use client";

import { useEffect, useState } from "react";
import { AuthForm, AuthFormData } from "@/components/auth-form";
import { auth } from "@/lib/auth";
import { useAuthSettings } from "@/lib/hooks/useAuthSettings";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { data: settings, isLoading: isSettingsLoading, error: settingsError } = useAuthSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [isPasswordless, setIsPasswordless] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [receivedOtpLog, setReceivedOtpLog] = useState<string | null>(null);
  const [receivedPurpose, setReceivedPurpose] = useState<string | null>(null);

  useEffect(() => {
    if (settingsError) {
      const msg = settingsError instanceof Error ? settingsError.message : "Failed to load auth settings";
      toast.error(msg);
    }
  }, [settingsError]);

  const handleLogin = async (formData: AuthFormData) => {
    setIsLoading(true);

    try {
      if (isPasswordless) {
        const response = await auth.requestEmailSignupOtp({
          email: formData.email,
          mode: "verify_email",
        });
        setPendingOtpEmail(formData.email);
        if (response) {
          if (response.otp_log) setReceivedOtpLog(response.otp_log);
          if (response.purpose) setReceivedPurpose(response.purpose);
        }
        toast.success(`Verification code sent to ${formData.email}`);
        return;
      }

      await auth.signIn({
        email: formData.email,
        password: formData.password,
      });

      if (settings?.allow_email_otp_login === 1 && settings.enable_email_otp === 1) {
        const response = await auth.requestOtp({
          identifier: formData.email,
          purpose: "Login",
          identifierType: "Email",
        });
        setPendingOtpEmail(formData.email);
        if (response) {
          if (response.otp_log) setReceivedOtpLog(response.otp_log);
          if (response.purpose) setReceivedPurpose(response.purpose);
        }
        toast.success(`Verification code sent to ${formData.email}`);
        return;
      }

      redirectToDashboard(settings?.redirect_to);
    } catch (error) {
      console.error("Login error:", error);
      const msg = error instanceof Error ? error.message : "Failed to sign in";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    if (!pendingOtpEmail) return;

    setIsLoading(true);

    try {
      await auth.verifyOtp({
        identifier: pendingOtpEmail,
        otp,
        purpose: (receivedPurpose || (isPasswordless ? "Signup" : "Login")) as any,
        identifierType: "Email",
        otp_log: receivedOtpLog || undefined,
      });

      if (isPasswordless) {
        setIsSettingPassword(true);
        toast.success("OTP verified successfully!");
        return;
      }

      redirectToDashboard(settings?.redirect_to);
    } catch (error) {
      console.error("OTP login error:", error);
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

      setIsPasswordless(false);
      setIsSettingPassword(false);
      setPendingOtpEmail(null);
      setOtp("");
      toast.success("Password resetted successfully please login!");
    } catch (error) {
      console.error("Set password error:", error);
      const msg = error instanceof Error ? error.message : "Failed to set password";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetLoginStep = () => {
    setPendingOtpEmail(null);
    setOtp("");
    setIsSettingPassword(false);
    setReceivedOtpLog(null);
    setReceivedPurpose(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-0 md:p-4 lg:p-8">
      {isSettingsLoading ? (
        <AuthUnavailable title="Loading login" message="Checking candidate authentication settings." />
      ) : !settings ? (
        <AuthUnavailable title="Login unavailable" message="Unable to load candidate authentication settings." />
      ) : settings?.enabled === 0 ? (
        <AuthUnavailable title="Login unavailable" message="Candidate portal authentication is disabled." />
      ) : (
        <>
          {settings.allow_password_login === 1 && (
            <AuthForm
              type="login"
              onSubmit={isSettingPassword ? handleSetPassword : pendingOtpEmail ? handleVerifyLoginOtp : handleLogin}
              isLoading={isLoading}
              loginStep={isSettingPassword ? "setPassword" : pendingOtpEmail ? "otp" : "credentials"}
              otpEmail={pendingOtpEmail || undefined}
              otpValue={otp}
              onOtpChange={setOtp}
              onBackToCredentials={resetLoginStep}
              allowSignup={settings.allow_signup === 1}
              enableEmailSignup={settings.enable_email_signup === 1}
              isPasswordless={isPasswordless}
              onPasswordlessToggle={setIsPasswordless}
            />
          )}

          {settings.allow_password_login === 0 && (
            <AuthUnavailable title="Login unavailable" message="Password login is not enabled for candidate accounts." />
          )}
        </>
      )}
    </div>
  );
}

function redirectToDashboard(redirectTo?: string) {
  const landingRoutes: Record<string, string> = {
    home: "/dashboard",
    open_jobs: "/open-jobs",
    my_jobs: "/my-jobs",
    action_center: "/action-center",
    documents: "/documents",
    candidate_dashboard: "/dashboard",
  };
  const target = redirectTo ? (landingRoutes[redirectTo] || "/dashboard") : "/dashboard";
  if (typeof window !== "undefined" && window.sessionStorage) {
    sessionStorage.setItem("showLoginToast", "true");
  }
  window.location.assign(target);
}

function AuthUnavailable({ title, message }: { title: string; message: string }) {
  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center text-card-foreground shadow-sm">
      <MailCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
