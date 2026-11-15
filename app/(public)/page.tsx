"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Sparkles } from "lucide-react";
import { HomePromo } from "@/components/home/home-promo";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicOpenings } from "@/lib/hooks/usePublicOpenings";
import { BRAND_NAME } from "@/lib/branding";

// Copy taken from hybrowlabs.com (/careers and /about).
const WHY_FALLBACK = [
  { title: "Meaningful work", body: "Work on ERPNext and HRMS implementations for clients across India and global markets." },
  { title: "Room to grow", body: "Continuous learning and development programs to help you advance your career." },
  { title: "Flexible and collaborative", body: "Flexible working hours and remote work options, in a team that values collaboration and innovation." },
];

function WhyFallback() {
  return (
    <section aria-label={`Why ${BRAND_NAME}`}>
      <h2 className="text-xl font-bold text-foreground">Why {BRAND_NAME}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Hybrowlabs Technologies, founded in 2016, is a certified Frappe partner (Best Frappe Partner 2024) with
        350+ ERPNext implementations across manufacturing, retail, healthcare and education.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {WHY_FALLBACK.map((item) => (
          <Card key={item.title} className="rounded-2xl">
            <CardContent className="px-5 py-5">
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function CareersHomePage() {
  const { data: openings } = usePublicOpenings();
  const evergreenCount = openings?.filter((o) => o.evergreen).length ?? 0;

  return (
    <div className="space-y-12">
      <HomePromo fallback={<WhyFallback />} />

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/ai-match" className="group">
          <Card className="h-full rounded-2xl transition-shadow group-hover:shadow-md">
            <CardContent className="flex items-start gap-4 px-5 py-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">AI Resume / Job Match</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drop your resume and we match it to suitable open jobs.
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/jobs" className="group">
          <Card className="h-full rounded-2xl transition-shadow group-hover:shadow-md">
            <CardContent className="flex items-start gap-4 px-5 py-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <BriefcaseBusiness className="size-5" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">All Open Jobs</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {openings
                    ? `${openings.length} open ${openings.length === 1 ? "role" : "roles"}, ${evergreenCount} always hiring.`
                    : "Browse every role that is open right now."}
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
