export type ArtworkKey = "learners" | "teachers" | "centres" | "tech" | "outcomes";
export type ValueIconKey = "layers" | "shield-check" | "bar-chart" | "users" | "sparkles" | "rocket";

export type HomeStat = {
  value: string;
  label: string;
};

export type HomeHero = {
  enabled: boolean;
  eyebrow: string;
  heading: string;
  body: string;
  image: string | null;
  image_alt: string | null;
  artwork_key: ArtworkKey | null;
  stats: HomeStat[];
};

export type HomeSlide = {
  tag: string;
  title: string;
  body: string;
  image: string | null;
  image_alt: string | null;
  artwork_key: ArtworkKey | null;
};

export type HomeCarousel = {
  enabled: boolean;
  interval: number;
  slides: HomeSlide[];
};

export type HomeValueCard = {
  title: string;
  description: string;
  icon: ValueIconKey | null;
};

export type HomeValues = {
  enabled: boolean;
  heading: string;
  subheading: string;
  cards: HomeValueCard[];
};

export type HomeContent = {
  hero: HomeHero;
  carousel: HomeCarousel;
  values: HomeValues;
};
