import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/auth-context";

import { Toaster } from "sonner";
import Providers from "./providers";

import { candidateBrandingService } from "@/lib/services/candidate-branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  let titlePrefix = "ERP";
  let faviconUrl = "/favicon.svg";

  try {
    const branding = await candidateBrandingService.getCandidateBranding();
    if (branding?.title_prefix) {
      titlePrefix = branding.title_prefix;
    }
    if (branding?.app_logo) {
      faviconUrl = branding.app_logo.startsWith("http")
        ? branding.app_logo
        : `${(process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "")}${branding.app_logo.startsWith("/") ? branding.app_logo : `/${branding.app_logo}`}`;
    }
  } catch (error) {
    // Graceful fallback if branding endpoint fails or is unavailable
  }

  return {
    title: {
      default: `${titlePrefix} - Candidate Portal`,
      template: `%s | ${titlePrefix}`,
    },
    description: `${titlePrefix} Candidate Portal — onboarding, job applications, and employee lifecycle management.`,
    keywords: [
      titlePrefix.toLowerCase(),
      "candidate portal",
      "onboarding",
      "jobs",
      "careers",
    ],
    authors: [{ name: titlePrefix }],
    creator: titlePrefix,
    publisher: titlePrefix,
    icons: {
      icon: faviconUrl,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs synchronously before first paint — prevents dark→light flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('candidate-portal-theme');if(m==='dark'){document.documentElement.setAttribute('data-theme','nova-dark');document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
