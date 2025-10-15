"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { auth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (formData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      await auth.signIn({
        email: formData.email,
        password: formData.password,
      });

      // Redirect to dashboard on successful login
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
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
        type="login"
        onSubmit={handleLogin}
        isLoading={isLoading}
      />
    </div>
  );
}