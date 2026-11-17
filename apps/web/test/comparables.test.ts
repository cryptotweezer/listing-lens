// Unit tests for like-for-like comparables and the price factors shown under the estimate.
import { describe, expect, it } from "vitest";
import { likeForLike } from "../lib/facts";
import { applyPagePrice, parsePagePrice } from "../lib/facts";
import { priceVerdict } from "../lib/verdict";

const sale = (o: Record<string, unknown>) => ({ property_type: "unit", bedrooms: 3, dist_km: 0.2, latitude: -33.87, longitude: 151.19, ...o }) as never;

describe("likeForLike", () => {
  it("counts one sale once when Microburbs repeats it under several ids", () => {
    const rows = [
      sale({ gnaf_pid: "A", address: "UNIT 2, 2 WATTLE CRESCENT", price: 1180000, date_sold: "2026-10-29" }),
      sale({ gnaf_pid: "B", address: "UNIT 2, 2-26 WATTLE CRESCENT", price: 1180000, date_sold: "2026-10-29", garage_spaces: 1 }),
      sale({ gnaf_pid: "C", price: 1555000, date_sold: "2026-10-21", latitude: -33.88 }),
    ];
    const out = likeForLike(rows, "SELF", 3, "unit");
    expect(out.map((c) => (c as { gnaf_pid: string }).gnaf_pid)).toEqual(["B", "C"]);
  });

  it("judges outliers against the other sales, not the asking price", () => {
    const rows = [1.0, 1.1, 1.2, 3.5].map((m, i) => sale({ gnaf_pid: `P${i}`, price: m * 1e6, date_sold: `2026-0${i + 1}-01`, latitude: i }));
    expect(likeForLike(rows, "SELF", 3, "unit")).toHaveLength(3);
  });
});

describe("likeForLike rings", () => {
  it("uses the closest ring with three sales and keeps far sales out", () => {
    const at = (id: string, km: number) => sale({ gnaf_pid: id, price: 1e6 + km * 1e5, date_sold: "2026-10-01", dist_km: km, latitude: km });
    const out = likeForLike([at("far", 1.4), at("a", 0.1), at("b", 0.3), at("c", 0.45), at("mid", 0.8)], "SELF", 3, "unit");
    expect(out.map((c) => (c as { gnaf_pid: string }).gnaf_pid)).toEqual(["a", "b", "c"]);
  });
});

describe("price verdict from comparables", () => {
  it("gives a range and the page price wins over a stale Microburbs price", () => {
    const f = {
      listing: { available: true, value: { listedFor: "sale", price: 1400000, parking: 2, bathrooms: 2, address: "Unit 210, 28 Example Street", buildingSize: 125 } },
      avm: { available: false, value: null },
      basics: { available: false, value: null },
      cma: { available: false, value: null },
      agentQuoting: { available: false, value: null },
      comparables: {
        available: true,
        source: "/v1/properties/{gnaf}/comparables/recent-sales-nearby",
        value: [
          { price: 1180000, date_sold: "2026-10-29", bathrooms: 2, garage_spaces: 1, dist_km: 0.163, address: "UNIT 2, 2-26 WATTLE CRESCENT" },
          { price: 1555000, date_sold: "2026-10-21", bathrooms: 3, garage_spaces: 2, dist_km: 0.223, address: "UNIT 601, 320 HARRIS STREET" },
        ],
      },
    } as never;
    const v = priceVerdict("sale", f);
    expect(v).toMatchObject({ estimate: 1367500, low: 1180000, high: 1555000, label: "in-line" });
    expect(v.weak).toMatch(/Only 2 similar sales/);
    expect(v.basis).toMatch(/^2 similar sales within 300 m, latest Oct 2026$/);
    const page = parsePagePrice("1300000", "1350000", "rea", "sale");
    const withPage = applyPagePrice(f, "sale", page);
    expect(withPage.listing.value).toMatchObject({ price: 1325000, priceLow: 1300000, priceHigh: 1350000, priceFrom: "rea", microburbsPrice: 1400000 });
    expect(priceVerdict("sale", withPage)).toMatchObject({ asking: 1325000, label: "in-line" });
    expect(parsePagePrice("1300000", "9000000", "rea", "sale")).toBeNull();
    expect(parsePagePrice("1300000", null, "evil", "sale")).toBeNull();
  });
});
