import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePromo } from "@/components/home/home-promo";
import { FrappeAPI } from "@/lib/frappe-api";

vi.mock("@/lib/frappe-api", () => ({ FrappeAPI: { get: vi.fn(), post: vi.fn() } }));

const allOff = {
  hero: { enabled: false, eyebrow: "", heading: "", body: "", image: null, image_alt: null, artwork_key: null, stats: [] },
  carousel: { enabled: false, interval: 0, slides: [] },
  values: { enabled: false, heading: "", subheading: "", cards: [] },
};

function renderPromo() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HomePromo fallback={<p>why-fallback</p>} />
    </QueryClientProvider>,
  );
}

// OPS-507: the home promo gate is open; its one method is on the proxy allowlist.
describe("HomePromo with its gate open", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks only the reviewed candidate_home method and shows the fallback while HR has every section off", async () => {
    vi.mocked(FrappeAPI.get).mockResolvedValue(allOff);
    renderPromo();
    await waitFor(() => expect(screen.getByText("why-fallback")).toBeTruthy());
    const methods = vi.mocked(FrappeAPI.get).mock.calls.map((c) => String(c[0]));
    expect(methods).toEqual(["recruitment.api.candidate_home.get_home_content"]);
  });

  it("keeps the fallback when the request fails", async () => {
    vi.mocked(FrappeAPI.get).mockRejectedValue(new Error("Not found"));
    renderPromo();
    await waitFor(() => expect(screen.getByText("why-fallback")).toBeTruthy());
  });
});
