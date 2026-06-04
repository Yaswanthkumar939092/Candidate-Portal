"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  auth,
  getProfile,
  profileFromFrappeUser,
  type FrappeAuthUser,
} from "@/lib/auth";
import type { Profile } from "@/types/database";

export interface AuthContextType {
  user: FrappeAuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provides candidate authentication state from the linked Frappe site.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FrappeAuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const showToast = sessionStorage.getItem("showLoginToast");
      if (showToast === "true") {
        toast.success("Successfully logged in!");
        sessionStorage.removeItem("showLoginToast");
      }
    }
  }, [pathname]);

  const hydrateFromSession = useCallback(async () => {
    const session = await auth.getSession();
    const currentUser = session?.user || null;
    setUser(currentUser);
    setProfile(currentUser ? profileFromFrappeUser(currentUser) : null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await hydrateFromSession();
  }, [hydrateFromSession]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const session = await auth.getSession();
        if (!isMounted) return;
        const currentUser = session?.user || null;
        setUser(currentUser);
        setProfile(currentUser ? profileFromFrappeUser(currentUser) : null);
      } catch (err) {
        console.error("Unexpected error initializing auth:", err);
        if (!isMounted) return;
        setUser(null);
        setProfile(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const isOnboardingComplete = Boolean(
    profile && profile.lifecycle_stage !== "candidate",
  );

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, isOnboardingComplete, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
