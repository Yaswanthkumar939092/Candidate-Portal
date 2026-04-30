import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FeatureFlagProvider } from "@/lib/contexts/feature-flags";
import { AuthProvider } from "@/lib/contexts/auth-context";

import { Toaster } from "sonner";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Physics Wallah - Candidate Portal",
    template: "%s | Physics Wallah",
  },
  description:
    "Physics Wallah Candidate Portal — onboarding, job applications, and employee lifecycle management.",
  keywords: [
    "physics wallah",
    "candidate portal",
    "onboarding",
    "jobs",
    "careers",
  ],
  authors: [{ name: "Physics Wallah" }],
  creator: "Physics Wallah",
  publisher: "Physics Wallah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
        <AuthProvider>
          <FeatureFlagProvider>
            {children}
            <Toaster position="top-right" richColors />
          </FeatureFlagProvider>
        </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
