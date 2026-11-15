import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLogoWithFallback } from "@/lib/hooks/useLogoWithFallback";

describe("useLogoWithFallback", () => {
  it("uses the configured logo when it is set", () => {
    const { result } = renderHook(() => useLogoWithFallback("/files/acme.svg", "/fallback.svg"));
    expect(result.current.src).toBe("/files/acme.svg");
  });

  it("uses the fallback when no logo is configured", () => {
    const { result } = renderHook(() => useLogoWithFallback(null, "/fallback.svg"));
    expect(result.current.src).toBe("/fallback.svg");
  });

  it("switches to the fallback after a load error and stays there on further errors", () => {
    const { result } = renderHook(() => useLogoWithFallback("/files/acme.svg", "/fallback.svg"));
    act(() => result.current.onError());
    expect(result.current.src).toBe("/fallback.svg");
    act(() => result.current.onError());
    expect(result.current.src).toBe("/fallback.svg");
  });

  it("tries a newly configured logo again after an earlier one failed", () => {
    const { result, rerender } = renderHook(
      ({ src }) => useLogoWithFallback(src, "/fallback.svg"),
      { initialProps: { src: "/files/old.svg" } },
    );
    act(() => result.current.onError());
    expect(result.current.src).toBe("/fallback.svg");
    rerender({ src: "/files/new.svg" });
    expect(result.current.src).toBe("/files/new.svg");
  });
});
