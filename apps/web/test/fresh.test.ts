import { describe, expect, it } from "vitest";
import { isFresh } from "../lib/alternatives";

describe("isFresh", () => {
  const now = Date.parse("2026-11-17T00:00:00Z");
  it("keeps recent rentals and drops ones listed long ago", () => {
    expect(isFresh("2026-10-29", "rent", now)).toBe(true);
    expect(isFresh("2024-10-14", "rent", now)).toBe(false);
  });
  it("gives sales a longer window", () => {
    expect(isFresh("2026-03-01", "sale", now)).toBe(true);
    expect(isFresh("2026-03-01", "rent", now)).toBe(false);
    expect(isFresh("2025-06-01", "sale", now)).toBe(false);
  });
  it("keeps rows with no date", () => {
    expect(isFresh(null, "rent", now)).toBe(true);
  });
});
