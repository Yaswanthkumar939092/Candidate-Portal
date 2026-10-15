"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HomeCarousel, HomeSlide } from "@/types/home";
import { PromoArtwork } from "./promo-artwork";

function Slide({ slide }: { slide: HomeSlide }) {
  return (
    <div className="grid h-full items-center gap-3 pb-12 pt-5 min-[700px]:grid-cols-2 min-[700px]:gap-6 min-[700px]:py-6">
      <PromoArtwork
        artworkKey={slide.artwork_key}
        image={slide.image}
        imageAlt={slide.image_alt}
        className="max-h-[200px] min-[700px]:max-h-[275px]"
      />
      <div className="px-7 text-center min-[700px]:pr-12 min-[700px]:text-left">
        {slide.tag && (
          <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 text-accent-foreground">
            {slide.tag}
          </Badge>
        )}
        <h3 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">{slide.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{slide.body}</p>
      </div>
    </div>
  );
}

/**
 * Autoplaying company-highlights carousel.
 *
 * Autoplay pauses on hover and while focus is inside the carousel, and is
 * skipped entirely for a zero interval, a single slide, or a reduced-motion
 * preference.
 *
 * @param carousel - Carousel content from Candidate Portal Home Settings.
 */
export function PromoCarousel({ carousel }: { carousel: HomeCarousel }) {
  const { slides, interval } = carousel;
  const [activeIndex, setActiveIndex] = useState(0);
  const [timerRevision, setTimerRevision] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const slideCount = slides.length;
  const index = activeIndex % (slideCount || 1);

  useEffect(() => {
    if (slideCount < 2 || interval <= 0 || hovered || focused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, interval);
    return () => window.clearInterval(timer);
  }, [index, timerRevision, slideCount, interval, hovered, focused, reducedMotion]);

  function navigate(target: number) {
    setActiveIndex((target + slideCount) % slideCount);
    setTimerRevision((revision) => revision + 1);
  }

  if (slideCount === 0) return null;

  return (
    <section
      aria-label="Company highlights"
      aria-roledescription="carousel"
      className="relative overflow-hidden rounded-3xl border bg-card shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="relative h-[430px] min-[700px]:h-[320px]" aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reducedMotion ? 1 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.45 }}
          >
            <Slide slide={slides[index]} />
          </motion.div>
        </AnimatePresence>
      </div>
      {slideCount > 1 && (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous slide"
            onClick={() => navigate(index - 1)}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 shadow-sm"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next slide"
            onClick={() => navigate(index + 1)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 shadow-sm"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
            {slides.map((_, dotIndex) => (
              <button
                type="button"
                key={dotIndex}
                aria-label={`Go to slide ${dotIndex + 1}`}
                aria-current={index === dotIndex ? "true" : undefined}
                onClick={() => navigate(dotIndex)}
                className="flex size-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span
                  className={`h-2 rounded-full transition-all ${index === dotIndex ? "w-5 bg-primary" : "w-2 bg-border"}`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
