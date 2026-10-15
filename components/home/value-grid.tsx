import { BarChart3, Layers, Rocket, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { HomeValues, ValueIconKey } from "@/types/home";

const icons = {
  layers: Layers,
  "shield-check": ShieldCheck,
  "bar-chart": BarChart3,
  users: Users,
  sparkles: Sparkles,
  rocket: Rocket,
} satisfies Record<ValueIconKey, typeof Layers>;

/**
 * Grid of "what it's like to work here" value cards.
 *
 * @param values - Values content from Candidate Portal Home Settings.
 */
export function ValueGrid({ values }: { values: HomeValues }) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">{values.heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{values.subheading}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {values.cards.map((card, index) => {
          const Icon = icons[card.icon ?? "sparkles"] ?? Sparkles;
          return (
            <Card key={index} className="gap-0 rounded-2xl py-5">
              <CardContent className="px-5">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-card-foreground">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
