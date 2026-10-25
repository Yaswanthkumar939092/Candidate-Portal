import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePromo } from "@/components/home/home-promo";
import { FrappeAPI } from "@/lib/frappe-api";

vi.mock("@/lib/frappe-api", () => ({ FrappeAPI: { get: vi.fn(), post: vi.fn() } }));

function renderPromo() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HomePromo fallback={<p>why-fallback</p>} />
    </QueryClientProvider>,
  );
}

describe("HomePromo in milestone 1", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the fallback and never calls the denied candidate_home method", async () => {
    renderPromo();
    await waitFor(() => expect(screen.getByText("why-fallback")).toBeTruthy());
    await new Promise((r) => setTimeout(r, 50));
    const methods = vi.mocked(FrappeAPI.get).mock.calls.map((c) => String(c[0]));
    expect(methods.filter((m) => m.includes("candidate_home"))).toEqual([]);
  });
});
