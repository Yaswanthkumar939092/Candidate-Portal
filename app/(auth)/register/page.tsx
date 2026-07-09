"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm, AuthFormData } from "@/components/auth-form";
import { auth } from "@/lib/auth";
import { useAuthSettings } from "@/lib/hooks/useAuthSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, MailCheck, Loader2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-0 md:p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-[#64748B]">Loading...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const { data: settings, isLoading: isSettingsLoading, error: settingsError } = useAuthSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const displayError = settingsError
    ? (settingsError instanceof Error ? settingsError.message : "Failed to load auth settings")
    : error;

  const handlePostRegistrationRouting = () => {
    if (redirectParam) {
      router.push(redirectParam);
    } else {
      router.push("/dashboard");
    }
  };

  const handleRegister = async (formData: AuthFormData) => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullName = formData.fullName || `${formData.firstName} ${formData.lastName}`.trim();
      const redirectPathname = redirectParam?.split("?")[0];
      const isCampusApply = redirectPathname === "/campus-apply" || redirectPathname?.startsWith("/campus-apply/");
      const candidateSource = isCampusApply ? "Campus" : undefined;

      const result = await auth.signUp({
        email: formData.email,
        password: formData.password,
        fullName: fullName || undefined,
        candidateSource,
      });

      if (result.status === "otp_required") {
        setPendingEmail(formData.email);
        return;
      }

      handlePostRegistrationRouting();
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
      handlePostRegistrationRouting();
    } catch (error) {
      console.error("OTP verification error:", error);
      setError(error instanceof Error ? error.message : "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-0 md:p-4 lg:p-8 w-full">
      {displayError && (
        <div className="p-4">
          <Alert className="max-w-md mx-auto border-destructive/30 bg-destructive/10">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {displayError}
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
          <Button type="submit" className="w-full h-10 flex items-center justify-center gap-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify and continue"
            )}
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

function AuthUnavailable({ title, message }: { title: string; message: string }) {
  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center text-card-foreground shadow-sm">
      <MailCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
