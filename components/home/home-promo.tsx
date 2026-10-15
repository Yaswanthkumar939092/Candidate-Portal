"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeContent } from "@/lib/hooks/useHomeContent";
import { PromoHero } from "./promo-hero";
import { ValueGrid } from "./value-grid";

// `motion` is ~50 kB and only the carousel needs it, so keep it out of the
// dashboard's initial bundle; the section is below the fold and gated on a
// settings toggle that is often off.
const PromoCarousel = dynamic(
  () => import("./promo-carousel").then((m) => m.PromoCarousel),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[320px] w-full rounded-3xl" />,
  },
);

function HomePromoSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading company highlights">
      <div className="grid items-center gap-8 rounded-3xl border bg-card p-8 min-[900px]:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-7 w-36 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-12 w-1/2" />
        </div>
        <Skeleton className="mx-auto aspect-[340/300] w-full max-w-[340px] rounded-2xl" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-7 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface HomePromoProps {
  /** Rendered in place of the promo block when every section is off or unavailable. */
  fallback?: ReactNode;
}

/**
 * Company promotion for the candidate dashboard, driven by the
 * `Candidate Portal Home Settings` single in the recruitment app.
 *
 * Each section is gated on its own `enabled` toggle. When the content cannot be
 * fetched or every section is off, `fallback` renders instead (nothing by default).
 */
export function HomePromo({ fallback = null }: HomePromoProps) {
  const { data, isLoading, isError } = useHomeContent();

  if (isLoading) return <HomePromoSkeleton />;
  if (
    isError ||
    !data ||
    (!data.hero.enabled && !data.carousel.enabled && !data.values.enabled)
  )
    return <>{fallback}</>;

  return (
    <div className="space-y-6">
      {data.hero.enabled && <PromoHero hero={data.hero} />}
      {data.carousel.enabled && <PromoCarousel carousel={data.carousel} />}
      {data.values.enabled && <ValueGrid values={data.values} />}
    </div>
  );
}
