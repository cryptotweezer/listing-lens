// Unit tests for reading the asking price shown on a portal listing.
import { describe, expect, it } from "vitest";
import { parsePrice } from "../lib/extract";

describe("parsePrice", () => {
  it("reads ranges, single prices and short forms", () => {
    expect(parsePrice("$1,300,000 - $1,350,000")).toMatchObject({ low: 1300000, high: 1350000 });
    expect(parsePrice("Auction guide $2,300,000")).toMatchObject({ low: 2300000, high: 2300000 });
    expect(parsePrice("$1.2m")).toMatchObject({ low: 1200000 });
    expect(parsePrice("$850k - $900k")).toMatchObject({ low: 850000, high: 900000 });
    expect(parsePrice("$850 per week")).toMatchObject({ low: 850 });
  });
  it("returns null when there is no price", () => {
    expect(parsePrice("Contact agent")).toBeNull();
    expect(parsePrice("Auction")).toBeNull();
  });
});
