// Example listing for the landing page demo. Every address, figure and agency here is invented for illustration:
// it is shaped like a real backend response so the real panel components render it, but it is not Microburbs data.
// Dates are relative to today so the example never looks stale.
import type { Alternative, PropertyResponse } from "@/lib/api";

const DAY = 864e5;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString().slice(0, 10);
const today = ago(0);

export const GNAF = "GANSW000000001";
export const ADDRESS = "Unit 1204, 9 Saltwater Lane, Pyrmont";
const SEARCH = "https://www.domain.com.au/sale/pyrmont-nsw-2009/?ptype=apartment-unit-flat&bedrooms=2-2";

const alt = (a: Omit<Alternative, "suburb" | "reasons" | "links" | "source" | "asOf" | "savingPct" | "saving"> & { saving?: number }): Alternative => ({
  suburb: "Pyrmont",
  saving: 1_275_000 - a.price,
  savingPct: Math.round(((1_275_000 - a.price) / 1_275_000) * 1000) / 10,
  reasons: [],
  links: { domainProfile: SEARCH, reaSearch: SEARCH },
  source: "Microburbs listings, example",
  asOf: today,
  ...a,
});

export const ALTERNATIVES: Alternative[] = [
  alt({ gnafId: "GANSW000000011", address: "Unit 503, 22 Mill Row", price: 1_180_000, bedrooms: 2, bathrooms: 2, parking: 1, buildingSize: 90, pricePerSqm: 13_111, vsMedianPct: -10, distanceM: 420 }),
  alt({ gnafId: "GANSW000000012", address: "Unit 306, 14 Bay Terrace", price: 1_225_000, bedrooms: 2, bathrooms: 2, parking: 1, buildingSize: 94, pricePerSqm: 13_032, vsMedianPct: -11, distanceM: 280 }),
  alt({ gnafId: "GANSW000000013", address: "Unit 1101, 5 Ferry Walk", price: 1_240_000, bedrooms: 2, bathrooms: 2, parking: 1, buildingSize: 88, pricePerSqm: 14_091, vsMedianPct: -3, distanceM: 650 }),
];

const COMPARABLES = [
  { address: "UNIT 902, 11 SALTWATER LANE", price: 1_265_000, days: 34, dist_km: 0.04 },
  { address: "UNIT 405, 30 HARBOUR WALK", price: 1_190_000, days: 61, dist_km: 0.21 },
  { address: "UNIT 1508, 2 DRAWBRIDGE PLACE", price: 1_365_000, days: 48, dist_km: 0.32 },
].map((c, i) => ({
  address: c.address,
  property_type: "unit",
  gnaf_pid: `GANSW00000002${i}`,
  price: c.price,
  date_sold: ago(c.days),
  dist_km: c.dist_km,
  bedrooms: 2,
  bathrooms: 2,
  garage_spaces: 1,
}));

export const PROPERTY = {
  match: { input: ADDRESS, normalized: ADDRESS, gnafId: GNAF, suburb: "Pyrmont", matchedAddress: ADDRESS, candidates: [], status: "exact-unit" },
  mode: "sale",
  modeSource: "listing",
  facts: {
    listing: {
      available: true,
      value: {
        mode: "sale",
        listedFor: "sale",
        price: 1_275_000,
        listingDate: ago(26),
        bedrooms: 2,
        bathrooms: 2,
        parking: 1,
        buildingSize: 92,
        propertyType: "Unit",
        address: "Unit 1204, 9 Saltwater Lane",
        priceLow: 1_250_000,
        priceHigh: 1_300_000,
        priceFrom: "rea",
        microburbsPrice: 1_350_000,
      },
      source: "Asking price shown on realestate.com.au",
      asOf: today,
    },
    agentQuoting: {
      available: true,
      value: {
        agency_name: "Harbourside Realty",
        cohort: "Typical quoter",
        total_sales: 46,
        underquote_rate_pct: 39,
        median_deviation_pct: 3.8,
        recent_sales: [
          { address: "Unit 402, 3 Quayside Street", sold_date: ago(40), guide_price: 1_150_000, sold_price: 1_205_000, diff_pct: 4.8 },
          { address: "Unit 1702, 2 Drawbridge Place", sold_date: ago(72), guide_price: 1_600_000, sold_price: 1_580_000, diff_pct: -1.3 },
          { address: "Unit 88, 30 Harbour Walk", sold_date: ago(103), guide_price: 950_000, sold_price: 990_000, diff_pct: 4.2 },
        ],
      },
      source: "/v1/properties/{gnaf}/valuation/agent-quoting",
      asOf: ago(40),
    },
    avm: { available: false, value: null, source: "/v1/properties/{gnaf}/valuation/avm", asOf: null, reason: "no_data" },
    cma: {
      available: true,
      value: { street: "UNIT 902, 11 SALTWATER LANE", sal: "Pyrmont", bedrooms: 2, bathrooms: 2, garage_spaces: 1, price: 1_265_000, date_sold: ago(34), distance_m: 40, same_building: false },
      source: "/v1/properties/{gnaf}/comparables/cma-single-comp",
      asOf: ago(34),
    },
    comparables: { available: true, value: COMPARABLES, source: "/v1/properties/{gnaf}/comparables/recent-sales-nearby", asOf: ago(34) },
    rentHistory: { available: false, value: null, source: "/v1/properties/{gnaf}/rent-history", asOf: null, reason: "not_for_sale" },
    basics: { available: false, value: null, source: "/v1/properties/{gnaf}/basics/all", asOf: null, reason: "listing_has_attributes" },
  },
  verdict: {
    asking: 1_275_000,
    askingSource: "Asking price shown on realestate.com.au",
    low: 1_190_000,
    high: 1_365_000,
    sources: ["/v1/properties/{gnaf}/comparables/recent-sales-nearby: median of 3 similar recent sales"],
    basis: "3 similar sales within 320 m, latest " + new Date(Date.now() - 34 * DAY).toLocaleDateString("en-AU", { month: "short", year: "numeric" }),
    weak: null,
    label: "in-line",
    estimate: 1_265_000,
    method: "comparables",
    diffPct: 0.8,
    confidence: "medium",
    note: "Asking is within 5% of the median of similar nearby sales.",
  },
  rent: {
    available: true,
    source: "Listing Lens rent model (trained on leases up to 2026-07-31)",
    asOf: "2026-08-31",
    value: { gnafId: GNAF, rentWithCarSpace: 1_080, rentWithoutCarSpace: 985, support: "unit", modelVersion: "example" },
  },
  alternatives: {
    target: { gnafId: GNAF, suburb: "Pyrmont", mode: "sale", price: 1_275_000, bedrooms: 2, bathrooms: 2, parking: 1, buildingSize: 92, propertyType: "Unit" },
    items: ALTERNATIVES,
    compare: "cheaper",
    searched: { suburbs: ["Pyrmont"], listings: 97, fetchedAt: new Date().toISOString() },
    targetValue: { medianPerSqm: 14_600, sample: 18, label: "2-bed units in Pyrmont", pricePerSqm: 13_859, vsMedianPct: -5 },
    seeAllUrl: SEARCH,
  },
  insights: {
    street: {
      street: "Saltwater Lane",
      label: "2-bed units sold in the last 3 years",
      thisStreet: { median: 1_240_000, sales: 7 },
      suburb: { median: 1_295_000, sales: 112 },
      diffPct: -4.2,
      nearby: [
        { street: "Harbour Walk", median: 1_210_000, sales: 9, distanceM: 210, diffPct: -6.6 },
        { street: "Drawbridge Place", median: 1_410_000, sales: 6, distanceM: 320, diffPct: 8.9 },
        { street: "Mill Row", median: 1_255_000, sales: 5, distanceM: 380, diffPct: -3.1 },
      ],
      source: "/v1/suburbs/{suburb}/sales/recent",
      asOf: ago(3),
    },
    yield: null,
    costs: {
      strata: { annual: 9_800, sample: 101, source: "/v1/suburbs/{suburb}/market/strata-levies", asOf: today },
      trend: { kind: "unit", tenYearsPct: 18, fiveYearsPct: 4, source: "/v1/suburbs/{suburb}/market/median-sale-price-series", asOf: ago(16) },
    },
  },
  generatedAt: new Date().toISOString(),
} as unknown as PropertyResponse;

const SALE_HISTORY = {
  available: true,
  value: [
    { date: ago(26), price: 1_300_000, type: "For Sale", address: "1204/9 Saltwater Lane" },
    { date: ago(85), price: 1_350_000, type: "For Sale", address: "1204/9 Saltwater Lane" },
    { date: ago(148), price: 1_395_000, type: "For Sale", address: "1204/9 Saltwater Lane" },
    { date: "2016-05-14", price: 980_000, type: "Sold", address: "1204/9 Saltwater Lane" },
  ],
  source: "/v1/properties/{gnaf}/sale-history",
  asOf: ago(26),
};

/** Section endpoints, keyed by name, in the same shape the backend returns. */
export const SECTIONS: Record<string, unknown> = {
  sales: { saleHistory: SALE_HISTORY },
  history: {
    saleHistory: SALE_HISTORY,
    rentHistory: {
      available: true,
      value: [
        { date: "2023-02-11", price: 920, type: "For Rent", address: "1204/9 Saltwater Lane" },
        { date: "2020-03-02", price: 780, type: "For Rent", address: "1204/9 Saltwater Lane" },
      ],
      source: "/v1/properties/{gnaf}/rent-history",
      asOf: "2023-02-11",
    },
  },
  transport: {
    transport: {
      available: true,
      value: {
        nearest: {
          train: { label: "Light rail stop", distance_m: 180 },
          tram: null,
          bus: { label: "Bus stop", distance_m: 95 },
          ferry: { name: "Pyrmont Bay Wharf", label: "Ferry terminal", distance_m: 410 },
        },
      },
      source: "/v1/properties/{gnaf}/transport/nearby",
      asOf: today,
    },
  },
  schools: {
    schools: {
      available: true,
      value: [
        { name: "Harbourview Public School", sector: "public", school_level_type: "Primary", distance_m: 380 },
        { name: "Bayside Secondary College", sector: "public", school_level_type: "Secondary", distance_m: 760 },
        { name: "St Mary's of the Bay", sector: "private", school_level_type: "Combined", distance_m: 910 },
      ],
      source: "/v1/properties/{gnaf}/schools/nearby",
      asOf: today,
    },
  },
  risks: {
    risks: {
      available: true,
      value: {
        bushfire: null,
        flood: null,
        historical_flood: null,
        heritage: [{ name: "Heritage", value: "Nearby", on_property: false, nearest_distance_m: 140 }],
        public_housing: [
          { name: "Public Housing", value: "2.1%", on_property: false },
          { name: "Public Housing", value: "4.8%", on_property: false },
          { name: "Public Housing", value: "3.5%", on_property: false },
        ],
      },
      source: "/v1/properties/{gnaf}/risks/all",
      asOf: today,
    },
  },
  block: {
    block: {
      available: true,
      value: {
        meshBlock: "10000000000",
        street: "Saltwater",
        homes: 132,
        rentedPct: 58,
        investorPct: 55,
        growthPctPerYear: 4.2,
        medianSoldPrice: null,
        area: { blocks: 139, rentedPct: 52, investorPct: 50, growthPctPerYear: 3.9 },
      },
      source: "/v1/properties/{gnaf}/context/mesh-blocks",
      asOf: today,
    },
  },
};

export const DEVELOPMENTS = {
  suburb: "Pyrmont",
  source: "/v1/suburbs/{suburb}/development/da-list",
  total: 27,
  lastTwelveMonths: 4,
  note: "These are applications for the whole suburb; Microburbs does not give their exact location.",
  recent: [
    { date: ago(45), category: "New Dwelling", description: "Construction of an eight storey residential building with 48 apartments and ground floor retail." },
    { date: ago(120), category: "Renovation", description: "Change of use of a commercial building to shop-top housing with four apartments on the top floor." },
    { date: ago(210), category: "Renovation", description: "Alterations to an existing residential apartment, including a new kitchen and bathroom." },
  ],
};

export const PULSE = {
  suburb: "Pyrmont",
  mode: "sale",
  indicators: {
    "days-on-market": { available: true, value: { house: 33, unit: 45 }, source: "/v1/suburbs/{suburb}/market/days-on-market", asOf: ago(16) },
    "stock-on-market": { available: true, value: { stock_on_market: 84, house: 3, unit: 81, rank: 88, areas: 714 }, source: "/v1/suburbs/{suburb}/market/stock-on-market", asOf: ago(16) },
    "months-of-supply": { available: true, value: { months_of_supply: 4.4, rank: 38, areas: 482 }, source: "/v1/suburbs/{suburb}/market/months-of-supply", asOf: today },
    "strata-levies": { available: true, value: { median_levy_annual: 9_800, n_properties: 101 }, source: "/v1/suburbs/{suburb}/market/strata-levies", asOf: today },
    summary: { available: true, value: { verdict: "Above average", vs_national_pct: 42 }, source: "/v1/suburbs/{suburb}/crime/summary", asOf: today },
  },
};

/** Scripted assistant replies for the suggested questions. The demo never calls the AI. */
export const ANSWERS: { match: RegExp; answer: string; alternatives?: boolean }[] = [
  {
    match: /fair/i,
    answer:
      "Fair, but not a bargain. The middle of the asking range, **$1,275,000**, is in line with the **$1,265,000** median of 3 similar 2-bed sales within 320 m [recent-sales-nearby].\n- Those sales range from $1.19M to $1.37M.\n- At $13,859/m² it asks 5% less per square metre than similar listed units [listings].",
  },
  {
    match: /cheaper/i,
    alternatives: true,
    answer: "I found **3 cheaper 2-bed, 2-bath units with parking** in Pyrmont, out of 97 listings checked [listings]. The biggest saving is **$95,000** at Mill Row, 420 m away.",
  },
  {
    match: /suburb/i,
    answer:
      "Pyrmont has the most choice of the three right now, which helps a buyer [months-of-supply].\n- **Pyrmont:** units usually sell in 45 days, median strata about $9,800 a year [days-on-market] [strata-levies].\n- **Ultimo:** fewer 2-bed units for sale, so less room to compare [stock-on-market].\n- **Surry Hills:** more terraces than units, so fewer like-for-like options [stock-on-market].",
  },
  {
    match: /compare/i,
    answer:
      "Mill Row is cheaper for nearly the same space. This one has been on the market longer, which can close part of the gap. Against Unit 503, 22 Mill Row [listings]:\n- **Price:** $1,180,000 vs $1,275,000, a saving of $95,000.\n- **Size:** 90 m² vs 92 m², almost the same.\n- **Per m²:** $13,111 vs $13,859.\n- **Distance:** 420 m apart, same suburb.",
  },
  {
    match: /negotiat/i,
    answer:
      "You have leverage. I can't suggest an offer amount, but these are strong points to raise with the agent:\n- It was **first listed about 5 months ago at $1.395M** and has been relisted twice since [sale-history].\n- Pyrmont units usually sell in **45 days** [days-on-market].\n- Supply is **4.4 months**, higher than most suburbs [months-of-supply].\n- The guide has already been **cut by $50k to $100k** [listings].",
  },
  {
    match: /catch/i,
    answer:
      "Nothing serious in the data, and no flood overlay on the property [risks]. Worth knowing:\n- **Long campaign:** it has been for sale for about 5 months, so ask the agent why [sale-history].\n- **Strata:** the Pyrmont median is **$9,800 a year** [strata-levies]. Ask for this building's levies.\n- **Heritage item nearby**, 140 m away, which can limit what gets built around you [risks].",
  },
  {
    match: /trend|changed/i,
    answer: "Pyrmont unit prices are **up 18% over 10 years** and **up 4% over 5 years** [median-sale-price-series]. Steady growth, without the big swings.",
  },
  {
    match: /develop|construction/i,
    answer:
      "There are **27 development applications** on record in Pyrmont, **4 in the last 12 months** [da-list]. The largest recent one is an eight storey building with 48 apartments. Microburbs gives these for the whole suburb, not their exact location.",
  },
  {
    match: /agency|quote/i,
    answer:
      "Harbourside Realty sold **39% of its last 46 sales above the guide**, with a median gap of **3.8%** [agent-quoting]. That is typical, so expect the final price to land near or a little above the guide.",
  },
  {
    match: /block/i,
    answer:
      "This census block has **132 homes**. **58% are rented**, against 52% for the blocks around it, and values grew **4.2% a year** against 3.9% nearby [mesh-blocks].",
  },
];

export const FALLBACK =
  "In this example I answer the suggested questions. Install Listing Lens to ask anything about a real listing, with every number cited.";
