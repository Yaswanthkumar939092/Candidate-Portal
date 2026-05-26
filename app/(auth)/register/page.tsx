"use client";

import { useEffect, useState } from "react";
import { AuthForm, AuthFormData } from "@/components/auth-form";
import { auth, type FrappeAuthSettings } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, MailCheck } from "lucide-react";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [settings, setSettings] = useState<FrappeAuthSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

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

  const handleRegister = async (formData: AuthFormData) => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullName = formData.fullName || `${formData.firstName} ${formData.lastName}`.trim();

      const result = await auth.signUp({
        email: formData.email,
        password: formData.password,
        fullName: fullName || undefined,
      });

      if (result.status === "otp_required") {
        setPendingEmail(formData.email);
        return;
      }

      redirectToDashboard();
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingEmail) return;

    setIsLoading(true);
    setError(null);
    try {
      await auth.verifyOtp({
        identifier: pendingEmail,
        otp,
        purpose: "Signup",
        identifierType: "Email",
      });
      redirectToDashboard();
    } catch (error) {
      console.error("OTP verification error:", error);
      setError(error instanceof Error ? error.message : "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-0 md:p-4 lg:p-8">
      {error && (
        <div className="p-4">
          <Alert className="max-w-md mx-auto border-destructive/30 bg-destructive/10">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {isSettingsLoading ? (
        <AuthUnavailable title="Loading signup" message="Checking candidate authentication settings." />
      ) : !settings ? (
        <AuthUnavailable title="Signup unavailable" message="Unable to load candidate authentication settings." />
      ) : settings?.enabled === 0 ? (
        <AuthUnavailable title="Signup unavailable" message="Candidate portal authentication is disabled." />
      ) : settings?.allow_signup === 0 ? (
        <AuthUnavailable title="Signup unavailable" message="Candidate signup is disabled." />
      ) : pendingEmail ? (
        <form
          onSubmit={handleVerifyOtp}
          className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
        >
          <div className="space-y-2">
            <MailCheck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold">Verify your email</h1>
            <p className="text-sm text-muted-foreground">
              Enter the OTP sent to {pendingEmail}.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp">Email OTP</Label>
            <Input
              id="otp"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify and continue"}
          </Button>
        </form>
      ) : (
        <AuthForm
          type="register"
          onSubmit={handleRegister}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

function redirectToDashboard() {
  window.location.assign("/dashboard");
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
