import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePromo } from "@/components/home/home-promo";
import { PromoCarousel } from "@/components/home/promo-carousel";
import { homeService } from "@/lib/services/home";
import type { HomeContent } from "@/types/home";

vi.mock("@/lib/services/home", () => ({ homeService: { getHomeContent: vi.fn() } }));
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
  useReducedMotion: () => false,
}));

const slides = [
  { tag: "First", title: "First slide", body: "First body", image: null, image_alt: null, artwork_key: "learners" as const },
  { tag: "Second", title: "Second slide", body: "Second body", image: null, image_alt: null, artwork_key: "teachers" as const },
];

function renderPromo(content: HomeContent) {
  vi.mocked(homeService.getHomeContent).mockResolvedValue(content);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HomePromo />
    </QueryClientProvider>,
  );
}

const disabledContent: HomeContent = {
  hero: { enabled: false, eyebrow: "", heading: "", body: "", image: null, image_alt: null, artwork_key: null, stats: [] },
  carousel: { enabled: false, interval: 0, slides: [] },
  values: { enabled: false, heading: "", subheading: "", cards: [] },
};

beforeEach(() => vi.clearAllMocks());

describe("PromoCarousel", () => {
  it("advances with next and wraps back to the first slide", () => {
    render(<PromoCarousel carousel={{ enabled: true, interval: 0, slides }} />);
    expect(screen.getByText("First slide")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText("Second slide")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText("First slide")).toBeInTheDocument();
  });

  it("steps backwards from the first slide to the last", () => {
    render(<PromoCarousel carousel={{ enabled: true, interval: 0, slides }} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByText("Second slide")).toBeInTheDocument();
  });

  it("omits navigation for a single slide", () => {
    render(<PromoCarousel carousel={{ enabled: true, interval: 4500, slides: slides.slice(0, 1) }} />);
    expect(screen.queryByRole("button", { name: "Next slide" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go to slide 1" })).not.toBeInTheDocument();
  });
});

describe("HomePromo", () => {
  it("renders nothing when every section is disabled", async () => {
    const { container } = renderPromo(disabledContent);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing when the content request fails", async () => {
    vi.mocked(homeService.getHomeContent).mockRejectedValue(new Error("guest api down"));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={client}>
        <HomePromo />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders only the sections that are enabled", async () => {
    const { container } = renderPromo({
      ...disabledContent,
      hero: {
        enabled: true,
        eyebrow: "Why work with us",
        heading: "Build at scale",
        body: "Ship weekly.",
        image: null,
        image_alt: null,
        artwork_key: "learners",
        stats: [{ value: "10 Cr+", label: "Learners reached" }],
      },
    });

    await waitFor(() => expect(screen.getByText("Build at scale")).toBeInTheDocument());
    expect(screen.getByText("Why work with us")).toBeInTheDocument();
    expect(screen.getByText("10 Cr+")).toBeInTheDocument();
    expect(screen.getByText("Learners reached")).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Company highlights"]')).toBeNull();
  });

  it("renders the carousel and value cards when those sections are enabled", async () => {
    renderPromo({
      ...disabledContent,
      carousel: { enabled: true, interval: 0, slides },
      values: {
        enabled: true,
        heading: "What it's like to build here",
        subheading: "What every team optimises for.",
        cards: [{ title: "Ownership", description: "You own what you ship.", icon: "rocket" }],
      },
    });

    await waitFor(() => expect(screen.getByText("First slide")).toBeInTheDocument());
    expect(screen.getByRole("region", { name: "Company highlights" })).toBeInTheDocument();
    expect(screen.getByText("What it's like to build here")).toBeInTheDocument();
    expect(screen.getByText("Ownership")).toBeInTheDocument();
  });
});
