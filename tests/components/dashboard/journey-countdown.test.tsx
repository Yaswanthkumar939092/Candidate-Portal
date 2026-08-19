import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { JourneyCountdown } from "@/components/dashboard/journey-countdown";

describe("JourneyCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders correctly for a future date", () => {
    // Set "now" to 2026-04-12
    const date = new Date(2026, 3, 12);
    vi.setSystemTime(date);

    // Test with date 3 days in future: 2026-04-15
    render(<JourneyCountdown joiningDate="2026-04-15" />);
    
    expect(screen.getByText("In 3 Days")).toBeTruthy();
  });

  it("renders '1 Day' for tomorrow", () => {
    const date = new Date(2026, 3, 12);
    vi.setSystemTime(date);

    render(<JourneyCountdown joiningDate="2026-04-13" />);
    
    expect(screen.getByText("In 1 Day")).toBeTruthy();
  });

  it("renders '0 Days' for today or past date", () => {
    const date = new Date(2026, 3, 12);
    vi.setSystemTime(date);

    render(<JourneyCountdown joiningDate="2026-04-12" />);
    expect(screen.getByText("In 0 Days")).toBeTruthy();

    render(<JourneyCountdown joiningDate="2026-04-10" />);
    expect(screen.getAllByText("In 0 Days")).toHaveLength(2);
  });

  it("returns null and renders nothing if joiningDate is falsy", () => {
    const { container } = render(<JourneyCountdown joiningDate={"" as any} />);
    expect(container.firstChild).toBeNull();
  });
});
