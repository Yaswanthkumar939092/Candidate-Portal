"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { DynamicPrimaryColor } from "@/components/dynamic-primary-color";
import "./globals.css";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <DynamicPrimaryColor />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
