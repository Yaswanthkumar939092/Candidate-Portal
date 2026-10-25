"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Sparkles } from "lucide-react";
import { HomePromo } from "@/components/home/home-promo";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicOpenings } from "@/lib/hooks/usePublicOpenings";

const WHY_FALLBACK = [
  { title: "Mission-first culture", body: "Work on products and programmes that make quality education reachable for every learner." },
  { title: "Room to grow", body: "Clear levels, mentorship and internal moves across teams, so your role can grow with you." },
  { title: "Benefits that care", body: "Health cover, leave and wellness support for you and your family." },
];

function WhyFallback() {
  return (
    <section aria-label="Why PhysicsWallah">
      <h2 className="text-xl font-bold text-foreground">Why PhysicsWallah</h2>
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
