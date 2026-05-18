"use client";

import { CalendarDays, MapPin, Building2, AlertCircle, Inbox } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { OnboardingSnapshot } from "@/components/dashboard/onboarding-snapshot";
import { InfoCard } from "@/components/dashboard/info-card";
import { KeyContacts } from "@/components/dashboard/key-contacts";
import { JourneyCountdown } from "@/components/dashboard/journey-countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/hooks/useDashboard";
import type { DashboardData, DashboardKeyContact } from "@/types/dashboard";

const TOTAL_STEPS = 8;

function formatDisplayDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

function getCompletedSteps(data: DashboardData) {
  return data?.date_of_joining ? TOTAL_STEPS : 0;
}

function getOfficeAddress(data: DashboardData) {
  const details = data?.work_location_details;

  if (!details) return "Address not available";

  return (
    details.custom_address ||
    [details.custom_office_city, details.custom_state, details.custom_country]
      .filter(Boolean)
      .join(", ") ||
    "Address not available"
  );
}

function mapContacts(contacts: DashboardKeyContact[]) {
  return contacts.map((contact) => ({
    name: contact.employee_name || contact.name || contact.role || contact.email,
    role: contact.role,
    email: contact.email || undefined,
    phone: contact.phone_number || undefined,
  }));
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="rounded-3xl border bg-card p-2 shadow-sm">
        <div className="rounded-xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-7 w-44 rounded-full" />
              <Skeleton className="h-10 w-full max-w-xl" />
              <Skeleton className="h-5 w-full max-w-2xl" />
              <Skeleton className="h-5 w-3/4 max-w-xl" />
              <Skeleton className="h-11 w-44 rounded-xl" />
            </div>
            <Skeleton className="h-40 w-40 rounded-full self-center" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="rounded-xl border bg-card shadow-sm">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-4 sm:px-5"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
      <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Unable to load dashboard
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function DashboardEmptyState() {
  return (
    <div className="w-full rounded-3xl border bg-card p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Inbox className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">
        No Data Available
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Currently there is no data to display.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboard(user?.email);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user?.email) {
    return (
      <DashboardErrorState
        message="We couldn't identify your account email for this dashboard yet."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isError || !dashboardData) {
    return (
      <DashboardErrorState
        message={
          error instanceof Error
            ? error.message
            : "Something went wrong while fetching your dashboard data."
        }
        onRetry={() => void refetch()}
      />
    );
  }



  const completedSteps = getCompletedSteps(dashboardData);
  const officeAddress = getOfficeAddress(dashboardData);
  const contacts = mapContacts(dashboardData?.key_contacts || []);
  const googleMapLink =
    dashboardData?.work_location_details?.custom_google_map_link;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <WelcomeHeader
        name={profile?.full_name || dashboardData?.name || "User"}
        greeting="Welcome back"
      />

      {dashboardData?.onboarding_status === false ? (
        <DashboardEmptyState />
      ) : (
        <>
          <OnboardingSnapshot
            completedSteps={completedSteps}
            totalSteps={TOTAL_STEPS}
            joiningDate={dashboardData?.date_of_joining}
            dashboardPayload={dashboardData}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <InfoCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Joining Date"
              value={formatDisplayDate(dashboardData?.date_of_joining)}
              tag={<JourneyCountdown joiningDate={dashboardData?.date_of_joining} />}
              tagVariant="green"
            />

            <InfoCard
              icon={<MapPin className="h-5 w-5" />}
              label="Office Location"
              value={dashboardData?.work_location || "Not available"}
              subtitle={officeAddress}
              tag={
                googleMapLink ? (
                  <a href={googleMapLink} target="_blank" rel="noreferrer">
                    View on Map
                  </a>
                ) : undefined
              }
              tagVariant="link"
            />

            <InfoCard
              icon={<Building2 className="h-5 w-5" />}
              label="Role & Department"
              value={dashboardData?.designation || "Not assigned"}
              subtitle={dashboardData?.department || "Department not available"}
            />
          </div>

          <KeyContacts contacts={contacts} />
        </>
      )}
    </div>
  );
}
