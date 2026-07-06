"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 p-6 border rounded-2xl shadow-sm">
        <div className="text-5xl">🎉</div>

        <h1 className="text-2xl font-bold">Application Submitted!</h1>

        <p className="text-muted-foreground">
          Thank you for applying. We’ll review your application and get back to
          you soon.
        </p>

        <Button className="w-full" onClick={() => router.push(`/open-jobs`)}>
          Back to Jobs
        </Button>
      </div>
    </div>
  );
}
