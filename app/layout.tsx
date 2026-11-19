import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/auth-context";

import { Toaster } from "sonner";
import Providers from "./providers";

import { candidateBrandingService } from "@/lib/services/candidate-branding";
import { BRAND_NAME } from "@/lib/branding";

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
  let titlePrefix = BRAND_NAME;
  // Always the bundled Hybrowlabs mark: Operate's app_logo is a wide wordmark,
  // and its /files path is not served through the /backend proxy.
  const faviconUrl = "/favicon.svg";

  try {
    const branding = await candidateBrandingService.getCandidateBranding();
    if (branding?.title_prefix) {
      titlePrefix = branding.title_prefix;
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
            __html: `(function(){try{var d=document.documentElement;var m=localStorage.getItem('candidate-portal-theme');if(m==='dark'){d.setAttribute('data-theme','nova-dark');d.classList.add('dark');}var b=localStorage.getItem('candidate-portal-brand');if(b){d.setAttribute('data-brand',b);}}catch(e){}})();`,
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
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
