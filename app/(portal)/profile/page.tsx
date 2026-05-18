"use client"

import { useState } from "react"
import { Loader2, LogOut, UserCircle2 } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileDetails } from "@/components/profile/profile-details"

export default function ProfilePage() {
    const { profile, isLoading } = useAuth()
    const [isSigningOut, setIsSigningOut] = useState(false)

    const handleSignOut = async () => {
        setIsSigningOut(true)
        try {
            await auth.signOut()
            window.location.assign("/login")
        } catch {
            setIsSigningOut(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <UserCircle2 className="h-12 w-12 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No profile found. Please sign in.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            {/* Page title */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <UserCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        My Profile
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your personal information and preferences.
                    </p>
                </div>
            </div>

            {/* Header card */}
            <ProfileHeader profile={profile} />

            {/* Details cards */}
            <ProfileDetails profile={profile} />

            {/* Logout */}
            <div className="flex justify-end border-t pt-6">
                <Button
                    variant="outline"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                    {isSigningOut
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <LogOut className="h-4 w-4" />
                    }
                    {isSigningOut ? "Signing out…" : "Sign Out"}
                </Button>
            </div>
        </div>
    )
}
