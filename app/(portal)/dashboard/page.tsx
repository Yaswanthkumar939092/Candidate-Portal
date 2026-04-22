"use client"

import { useEffect, useState } from "react"
import { CalendarDays, MapPin, Building2, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { WelcomeHeader } from "@/components/dashboard/welcome-header"
import { OnboardingSnapshot } from "@/components/dashboard/onboarding-snapshot"
import { InfoCard } from "@/components/dashboard/info-card"
import { KeyContacts } from "@/components/dashboard/key-contacts"
import { JourneyCountdown } from "@/components/dashboard/journey-countdown"
import { useDashboard } from "@/lib/hooks/useDashboard"
import type { OnboardingData } from "@/types/database"


/** Shape of the dashboard data fetched or mocked. */
interface DashboardData {
  completedSteps: number
  totalSteps: number
  joiningDate: string
  officeLocation: string
  officeAddress: string
  designation: string
  department: string
  jobType: string
  contacts: {
    name: string
    role: string
    email?: string
    phone?: string
    avatar?: string
  }[]
}

/** Default mock data matching the PW Candidate Portal screenshot values. */
const MOCK_DASHBOARD_DATA: DashboardData = {
  completedSteps: 8,
  totalSteps: 8,
  joiningDate: "2025-09-08",
  officeLocation: "Noida, Sector 62",
  officeAddress: "KLJ Noida One, First Floor",
  designation: "Trainee",
  department: "Innovation Team",
  jobType: "Full Time",
  contacts: [
    {
      name: "Pallavi Mahar",
      role: "HR Buddy",
      email: "pallavi.mahar@pw.live",
      phone: "+91-9876543210",
    },
    {
      name: "Rajesh Kumar",
      role: "Reporting Manager",
      email: "rajesh.kumar@pw.live",
    },
    {
      name: "IT Helpdesk",
      role: "IT Support",
      email: "it.support@pw.live",
      phone: "+91-1800-123-4567",
    },
  ],
}

/**
 * Formats an ISO date string into "Mon, 8 Sep 2025" style.
 */
function formatDisplayDate(iso: string): string {
  const date = new Date(iso)
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" })
  const day = date.getDate()
  const month = date.toLocaleDateString("en-US", { month: "short" })
  const year = date.getFullYear()
  return `${weekday}, ${day} ${month} ${year}`
}

/**
 * Candidate portal dashboard page.
 *
 * Displays a personalised welcome header, onboarding progress snapshot,
 * quick-reference info cards (joining date, office, role), and key contacts.
 * Data is loaded from the `onboarding_data` table with a fallback to mock
 * data when no record exists yet.
 */
export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { data: dynamicDashboardData, isLoading: isDashboardLoading } = useDashboard(user?.email || "")

  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)



  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) {
        setData(MOCK_DASHBOARD_DATA)
        setIsLoading(false)
        return
      }

      try {
        const { data: onboarding, error } = await supabase
          .from("onboarding_data")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (error || !onboarding) {
          setData(MOCK_DASHBOARD_DATA)
        } else {
          const ob = onboarding as OnboardingData
          setData({
            completedSteps: ob.completed_steps?.length ?? 0,
            totalSteps: 8,
            joiningDate: MOCK_DASHBOARD_DATA.joiningDate,
            officeLocation: MOCK_DASHBOARD_DATA.officeLocation,
            officeAddress: MOCK_DASHBOARD_DATA.officeAddress,
            designation: MOCK_DASHBOARD_DATA.designation,
            department: MOCK_DASHBOARD_DATA.department,
            jobType: MOCK_DASHBOARD_DATA.jobType,
            contacts: MOCK_DASHBOARD_DATA.contacts,
          })
        }
      } catch {
        setData(MOCK_DASHBOARD_DATA)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const dashboardData = data ?? MOCK_DASHBOARD_DATA

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* Welcome header with Profile Active badge */}
      <WelcomeHeader
        name={profile?.full_name || "User"}
        greeting="Welcome back"
      />

      {/* Onboarding snapshot card */}
      <OnboardingSnapshot
        completedSteps={dashboardData.completedSteps}
        totalSteps={dashboardData.totalSteps}
        joiningDate={dashboardData.joiningDate}
        dynamicDashboardData={dynamicDashboardData?.data}
      />

      {/* Info cards row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Joining Date card */}
        <InfoCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Joining Date"
          value={formatDisplayDate(dashboardData.joiningDate)}
          tag={<JourneyCountdown joiningDate={dashboardData.joiningDate} />}
          tagVariant="green"
        />

        {/* Office Location card */}
        <InfoCard
          icon={<MapPin className="h-5 w-5" />}
          label="Office Location"
          value={dashboardData.officeLocation}
          subtitle={dashboardData.officeAddress}
          tag="View on Map"
          tagVariant="link"
        />

        {/* Role & Department card */}
        <InfoCard
          icon={<Building2 className="h-5 w-5" />}
          label="Role & Department"
          // value={dashboardData.designation}
          value={dynamicDashboardData?.data?.designation as string}
          subtitle={dynamicDashboardData?.data?.department as string}
          tag={dynamicDashboardData?.data?.job_type as string}
          tagVariant="default"
        />
      </div>

      {/* Key contacts section */}
      <KeyContacts contacts={dashboardData.contacts} />
    </div>
  )
}
