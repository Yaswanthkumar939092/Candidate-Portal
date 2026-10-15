import { Badge } from "@/components/ui/badge";
import type { HomeHero } from "@/types/home";
import { PromoArtwork } from "./promo-artwork";

/**
 * Hero band of the company promotion: eyebrow, heading, body, optional stats.
 *
 * @param hero - Hero content from Candidate Portal Home Settings.
 */
export function PromoHero({ hero }: { hero: HomeHero }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/20 via-accent to-card p-6 text-foreground shadow-sm sm:p-10 lg:p-12">
      <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative grid items-center gap-6 min-[900px]:grid-cols-[1.1fr_0.9fr] min-[900px]:gap-8">
        <div className="order-2 min-[900px]:order-1">
          {hero.eyebrow && (
            <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-accent-foreground">
              {hero.eyebrow}
            </Badge>
          )}
          <h2 className="max-w-xl font-(family-name:--font-space-grotesk) text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {hero.heading}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{hero.body}</p>
          {hero.stats.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-4">
              {hero.stats.map((stat, index) => (
                <div key={index}>
                  <div className="font-(family-name:--font-space-grotesk) text-2xl font-bold">{stat.value}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <PromoArtwork
          artworkKey={hero.artwork_key}
          image={hero.image}
          imageAlt={hero.image_alt}
          className="order-1 min-[900px]:order-2"
        />
      </div>
    </section>
  );
}
