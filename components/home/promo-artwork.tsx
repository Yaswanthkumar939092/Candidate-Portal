"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ArtworkKey } from "@/types/home";

type PromoArtworkProps = {
  artworkKey: ArtworkKey | null;
  image: string | null;
  imageAlt: string | null;
  className?: string;
};

const svgClass = "h-full w-full text-primary";

function LearnersArtwork() {
  return (
    <svg viewBox="0 0 340 300" fill="none" className={svgClass} aria-hidden="true">
      <ellipse cx="170" cy="268" rx="126" ry="13" className="fill-primary/10" />
      <rect x="55" y="149" width="230" height="92" rx="12" className="fill-secondary stroke-primary" strokeWidth="3" />
      <path d="M65 168h210M76 187h158M76 207h115" className="stroke-primary/50" strokeWidth="5" strokeLinecap="round" />
      <circle cx="249" cy="92" r="43" className="fill-accent stroke-primary" strokeWidth="3" />
      <path d="M249 68v27l21 14" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M96 127c0-29 23-51 53-51s53 22 53 51" className="stroke-accent-foreground" strokeWidth="6" strokeLinecap="round" />
      <circle cx="96" cy="127" r="7" className="fill-primary" />
      <circle cx="202" cy="127" r="7" className="fill-primary" />
      <path d="m113 102 18-34 18 34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TeachersArtwork() {
  return (
    <svg viewBox="0 0 340 300" fill="none" className={svgClass} aria-hidden="true">
      <ellipse cx="170" cy="267" rx="125" ry="12" className="fill-primary/10" />
      <rect x="63" y="53" width="214" height="172" rx="16" className="fill-secondary stroke-primary" strokeWidth="3" />
      <path d="M82 82h176" className="stroke-accent-foreground" strokeWidth="6" strokeLinecap="round" />
      <circle cx="130" cy="135" r="21" className="fill-primary/20 stroke-primary" strokeWidth="3" />
      <path d="M96 194c4-23 17-36 34-36s30 13 34 36" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M185 122h61m-61 19h61m-61 19h43" className="stroke-primary/60" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function CentresArtwork() {
  return (
    <svg viewBox="0 0 340 300" fill="none" className={svgClass} aria-hidden="true">
      <ellipse cx="170" cy="267" rx="130" ry="12" className="fill-primary/10" />
      <rect x="35" y="139" width="79" height="104" rx="8" className="fill-secondary stroke-primary" strokeWidth="3" />
      <rect x="129" y="95" width="82" height="148" rx="8" className="fill-accent stroke-primary" strokeWidth="3" />
      <rect x="226" y="159" width="79" height="84" rx="8" className="fill-secondary stroke-primary" strokeWidth="3" />
      <path d="M143 117h54M49 163h50m141 19h50M49 185h50m44-45h54m-54 22h54m-54 22h38" className="stroke-primary/65" strokeWidth="5" strokeLinecap="round" />
      <path d="M165 243v-33h19v33" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

function TechArtwork() {
  return (
    <svg viewBox="0 0 340 300" fill="none" className={svgClass} aria-hidden="true">
      <ellipse cx="170" cy="268" rx="120" ry="12" className="fill-primary/10" />
      <rect x="69" y="52" width="202" height="151" rx="14" className="fill-secondary stroke-primary" strokeWidth="4" />
      <rect x="84" y="68" width="172" height="113" rx="7" className="fill-accent" />
      <path d="m97 156 36-42 29 29 33-49 48 62" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="133" cy="114" r="6" className="fill-accent-foreground" />
      <circle cx="195" cy="94" r="6" className="fill-accent-foreground" />
      <path d="M152 204v21m36-21v21m-58 2h80" className="stroke-primary" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function OutcomesArtwork() {
  return (
    <svg viewBox="0 0 340 300" fill="none" className={svgClass} aria-hidden="true">
      <ellipse cx="170" cy="269" rx="124" ry="12" className="fill-primary/10" />
      <circle cx="170" cy="119" r="68" className="fill-secondary stroke-primary" strokeWidth="4" />
      <circle cx="170" cy="119" r="47" className="stroke-primary/35" strokeWidth="3" />
      <path d="M170 86v33l26 18" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m64 234 52-45 34 23 42-52 40 32 44-46" className="stroke-accent-foreground" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="116" cy="189" r="6" className="fill-primary" />
      <circle cx="192" cy="160" r="6" className="fill-primary" />
      <circle cx="276" cy="146" r="6" className="fill-primary" />
    </svg>
  );
}

/**
 * Promotion illustration for a hero or carousel slide.
 *
 * Renders the configured image when one is attached, otherwise the preset
 * illustration named by `artworkKey`.
 *
 * @param artworkKey - Preset illustration to use when no image is configured.
 * @param image - Absolute URL of the configured image, or null.
 * @param imageAlt - Alt text for the configured image.
 */
export function PromoArtwork({ artworkKey, image, imageAlt, className }: PromoArtworkProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  const artwork = {
    learners: <LearnersArtwork />,
    teachers: <TeachersArtwork />,
    centres: <CentresArtwork />,
    tech: <TechArtwork />,
    outcomes: <OutcomesArtwork />,
  };

  return (
    <div className={cn("relative mx-auto aspect-[340/300] w-full max-w-[340px]", className)}>
      {image && !imageFailed ? (
        <Image
          src={image}
          alt={imageAlt || "Company illustration"}
          fill
          sizes="(max-width: 900px) 80vw, 340px"
          className="object-contain"
          // Promotion artwork is decorative: an upload whose host is missing
          // from next.config remotePatterns must not take the dashboard down,
          // so skip the optimizer and fall back to the preset if it still fails.
          unoptimized
          onError={() => setImageFailed(true)}
        />
      ) : (
        artwork[artworkKey ?? "learners"] ?? artwork.learners
      )}
    </div>
  );
}
