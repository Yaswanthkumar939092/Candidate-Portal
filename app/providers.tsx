"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { DynamicFavicon } from "@/components/dynamic-favicon";
import { DynamicTitle } from "@/components/dynamic-title";
import "./globals.css";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <DynamicFavicon />
        <DynamicTitle />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}