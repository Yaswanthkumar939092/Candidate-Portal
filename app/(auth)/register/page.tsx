"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { auth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (formData: any) => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      await auth.signUp({
        email: formData.email,
        password: formData.password,
        fullName: fullName || undefined,
      });

      // Redirect to dashboard on successful registration
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center p-0 md:p-8">
      {error && (
        <div className="p-4">
          <Alert className="border-red-200 bg-red-50 max-w-md mx-auto">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}
      <AuthForm
        type="register"
        onSubmit={handleRegister}
        isLoading={isLoading}
      />
    </div>
  );
}