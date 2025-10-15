import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { FeatureFlagProvider } from "@/lib/contexts/feature-flags";
import "./globals.css";

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
    default: "JobPortal - Find Your Dream Job",
    template: "%s | JobPortal",
  },
  description: "Discover amazing job opportunities from top companies. Search, apply, and track your applications all in one place.",
  keywords: ["jobs", "careers", "employment", "job search", "hiring", "recruitment"],
  authors: [{ name: "JobPortal Team" }],
  creator: "JobPortal",
  publisher: "JobPortal",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jobportal.com",
    title: "JobPortal - Find Your Dream Job",
    description: "Discover amazing job opportunities from top companies. Search, apply, and track your applications all in one place.",
    siteName: "JobPortal",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobPortal - Find Your Dream Job",
    description: "Discover amazing job opportunities from top companies. Search, apply, and track your applications all in one place.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FeatureFlagProvider>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
        </FeatureFlagProvider>
        <footer className="border-t bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#1993e5] rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">J</span>
                  </div>
                  <span className="font-bold text-lg">JobPortal</span>
                </div>
                <p className="text-sm text-gray-600">
                  Find your dream job with the best companies. We connect talent with opportunity.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">For Job Seekers</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="/jobs" className="hover:text-[#1993e5]">Browse Jobs</a></li>
                  <li><a href="/register" className="hover:text-[#1993e5]">Create Account</a></li>
                  <li><a href="/applications" className="hover:text-[#1993e5]">Track Applications</a></li>
                  <li><a href="/profile" className="hover:text-[#1993e5]">Profile</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">For Employers</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="/employers" className="hover:text-[#1993e5]">Post Jobs</a></li>
                  <li><a href="/employers/pricing" className="hover:text-[#1993e5]">Pricing</a></li>
                  <li><a href="/employers/solutions" className="hover:text-[#1993e5]">Solutions</a></li>
                  <li><a href="/contact" className="hover:text-[#1993e5]">Contact Sales</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="/about" className="hover:text-[#1993e5]">About Us</a></li>
                  <li><a href="/careers" className="hover:text-[#1993e5]">Careers</a></li>
                  <li><a href="/privacy" className="hover:text-[#1993e5]">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-[#1993e5]">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t pt-6 mt-8 text-center text-sm text-gray-600">
              <p>&copy; 2024 JobPortal. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
