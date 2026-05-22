"use client";

import { useEffect, useState } from "react";
import { AuthForm, AuthFormData } from "@/components/auth-form";
import { auth, type FrappeAuthSettings } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, MailCheck, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [settings, setSettings] = useState<FrappeAuthSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isPasswordless, setIsPasswordless] = useState(false);
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

  const handleLogin = async (formData: AuthFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isPasswordless) {
        await auth.requestEmailSignupOtp({
          email: formData.email,
        });
        setPendingOtpEmail(formData.email);
        return;
      }

      await auth.signIn({
        email: formData.email,
        password: formData.password,
      });

      if (settings?.allow_email_otp_login === 1 && settings.enable_email_otp === 1) {
        await auth.requestOtp({
          identifier: formData.email,
          purpose: "Login",
          identifierType: "Email",
        });
        setPendingOtpEmail(formData.email);
        return;
      }

      redirectToDashboard(settings?.redirect_to);
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    if (!pendingOtpEmail) return;

    setIsLoading(true);
    setError(null);

    try {
      await auth.verifyOtp({
        identifier: pendingOtpEmail,
        otp,
        purpose: isPasswordless ? "Signup" : "Login",
        identifierType: "Email",
      });

      if (isPasswordless) {
        setIsSettingPassword(true);
        return;
      }

      redirectToDashboard(settings?.redirect_to);
    } catch (error) {
      console.error("OTP login error:", error);
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

      setIsPasswordless(false);
      setIsSettingPassword(false);
      setPendingOtpEmail(null);
      setOtp("");
      setSuccessMessage("Password set successfully! Please log in using your email and password.");
    } catch (error) {
      console.error("Set password error:", error);
      setError(error instanceof Error ? error.message : "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  const resetLoginStep = () => {
    setPendingOtpEmail(null);
    setOtp("");
    setError(null);
    setSuccessMessage(null);
    setIsSettingPassword(false);
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
          <Alert className="border-destructive/30 bg-destructive/10">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}
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
