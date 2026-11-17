// Compares the asking price with an independent value estimate and says below / in line / above.
import type { PropertyFacts } from "./facts";
import type { Mode } from "@mb/contracts";

export interface Verdict {
  label: "below" | "in-line" | "above" | "unknown";
  asking: number | null;
  askingSource: string | null;
  estimate: number | null;
  low: number | null;
  high: number | null;
  method: "avm" | "cma" | "comparables" | "agent-quoting" | "rent-model" | "market-rent" | null;
  diffPct: number | null;
  /** "low" when the estimate comes from a handful of nearby sales rather than a model. */
  confidence: "model" | "low" | null;
  sources: string[];
  note: string;
  /** What the estimate rests on, in plain words ("2 similar sales within 1 km, latest Oct 2026"). */
  basis?: string | null;
  /** Set when the comparison is too thin to call the price high or low; the panel then shows it without colour. */
  weak?: string | null;
}

/** Few sales, or sales far away, make a weak comparison: say why instead of calling the price high or low. */
function weakness(method: Verdict["method"], f: PropertyFacts): string | null {
  if (method === "cma" && !f.cma.value?.same_building) return "Based on a single sale, not in the same building.";
  if (method !== "comparables") return null;
  const comps = f.comparables.value ?? [];
  const far = Math.max(0, ...comps.map((c) => c.dist_km ?? 0));
  if (comps.length < 3) return `Only ${comps.length} similar sales nearby, so this is a rough guide.`;
  if (far > 1) {
    const near = comps.filter((c) => (c.dist_km ?? 0) <= 1).length;
    const rest = comps.length - near;
    const head = near ? `Only ${near} similar sale${near > 1 ? "s" : ""} within 1 km.` : "No similar sales within 1 km.";
    const tail = !near ? `These are up to ${one(far)} km away.` : rest === 1 ? `The other one is ${one(far)} km away.` : `The other ${rest} are up to ${one(far)} km away.`;
    return `${head} ${tail}`;
  }
  return null;
}

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (d: string) => `${MONTH[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const one = (x: number) => Math.round(x * 10) / 10;
function comparablesBasis(f: PropertyFacts): string | null {
  const comps = f.comparables.value ?? [];
  if (!comps.length) return null;
  const far = Math.max(...comps.map((c) => c.dist_km ?? 0));
  const newest = comps.map((c) => c.date_sold).filter((d): d is string => !!d).sort().at(-1);
  const within = far < 1 ? `${Math.max(100, Math.ceil((far * 1000) / 100) * 100)} m` : `${one(far)} km`;
  return `${comps.length} similar sale${comps.length > 1 ? "s" : ""} within ${within}${newest ? `, latest ${monthYear(newest)}` : ""}`;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length ? (s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2) : null;
};

const BAND = 0.05;
const threeYearsAgo = () => new Date(Date.now() - 3 * 365 * 864e5).toISOString().slice(0, 10);

export interface MarketRent {
  value: number;
  sample: number;
  low: number;
  high: number;
  label: string;
}

export function priceVerdict(mode: Mode, f: PropertyFacts, fairRent: number | null = null, market: MarketRent | null = null): Verdict {
  const asking = f.listing.value?.price ?? null;
  const base = { asking, askingSource: asking ? f.listing.source : null, low: null, high: null, sources: [] as string[] };

  let estimate: number | null = null;
  let method: Verdict["method"] = null;
  let low: number | null = null;
  let high: number | null = null;
  const sources: string[] = [];

  if (mode === "rent") {
    if (fairRent) {
      estimate = fairRent;
      method = "rent-model";
      sources.push("Our rent model (Task 4), trained on leases up to 2026-07-31");
    } else if (market) {
      estimate = market.value;
      low = market.low;
      high = market.high;
      method = "market-rent";
      sources.push(`/v1/suburbs/{suburb}/listings/for-rent: median of ${market.sample} active ${market.label}`);
    }
  } else if (f.avm.available && f.avm.value) {
    estimate = f.avm.value.predicted_price;
    low = f.avm.value.predicted_price_low ?? null;
    high = f.avm.value.predicted_price_high ?? null;
    method = "avm";
    sources.push(`${f.avm.source} (${f.avm.asOf})`);
  } else if (f.cma.available && f.cma.value?.price && f.cma.value.date_sold && f.cma.value.date_sold >= threeYearsAgo()) {
    // Microburbs' best comparable sale (often a unit in the same building).
    estimate = f.cma.value.price;
    method = "cma";
    const c = f.cma.value;
    sources.push(`${f.cma.source}: ${c.street ?? "comparable"}${c.same_building ? " (same building)" : ""}, sold ${c.date_sold}`);
  } else if (f.comparables.value && f.comparables.value.length >= 2) {
    const prices = f.comparables.value.map((c) => c.price!).filter(Boolean);
    estimate = median(prices);
    low = Math.min(...prices);
    high = Math.max(...prices);
    method = "comparables";
    sources.push(`${f.comparables.source}: median of ${f.comparables.value.length} similar recent sales`);
  }
  const basisPart =
    method === "comparables"
      ? { basis: comparablesBasis(f) }
      : method === "avm"
        ? { basis: `Microburbs valuation model${f.avm.asOf ? `, ${f.avm.asOf}` : ""}` }
        : method === "cma"
          ? { basis: `one comparable sale${f.cma.value?.same_building ? " in the same building" : ""}, ${f.cma.value?.date_sold}` }
          : method === "market-rent"
            ? { basis: `asking rents of ${market?.sample} similar listings` }
            : method === "rent-model"
              ? { basis: "our rent model, trained on leases up to Jul 2026" }
              : { basis: null };
  const extra = { ...basisPart, weak: weakness(method, f) };

  if (!asking && mode === "sale" && f.agentQuoting.value?.likely_sale_price) {
    return {
      ...base,
      ...extra,
      label: "unknown",
      estimate: estimate ?? f.agentQuoting.value.likely_sale_price,
      low,
      high,
      method: method ?? "agent-quoting",
      diffPct: null,
      confidence: "model",
      sources: [...sources, f.agentQuoting.source],
      note: "Microburbs has no asking price for this listing. The estimate is the likely sale price from this agency's track record.",
    };
  }
  if (!asking || !estimate) {
    return { ...base, ...extra, label: "unknown", estimate, low, high, method, diffPct: null, confidence: null, sources, note: !asking
        ? f.listing.value && f.listing.value.listedFor !== mode
          ? `This property is listed ${f.listing.value.listedFor === "sale" ? "for sale" : "for rent"}, so there is no asking ${mode === "rent" ? "rent" : "price"} to check.`
          : f.listing.reason === "not_in_active_listings"
          ? "This listing is not in Microburbs' current listings yet, so there is no asking price in the data to check."
          : "Microburbs has no asking price for this listing (the agency may hide it, or the data lags the portal)."
        : "Not enough data for an independent estimate." };
  }
  // A single comparable sold a while ago, or a median of a few nearby sales, is a rough guide only.
  const confidence = method === "comparables" || method === "cma" || method === "market-rent" ? "low" : method ? "model" : null;
  const diffPct = Math.round(((asking - estimate) / estimate) * 1000) / 10;
  const label = diffPct > BAND * 100 ? "above" : diffPct < -BAND * 100 ? "below" : "in-line";
  const what = mode === "rent" ? "fair rent" : method === "comparables" ? "median of similar nearby sales" : method === "avm" ? "Microburbs estimate" : "estimated value";
  const note =
    label === "in-line"
      ? `Asking is within 5% of the ${what}.`
      : `Asking is ${Math.abs(diffPct)}% ${label === "above" ? "above" : "below"} the ${what}.`;
  return { ...base, ...extra, label, estimate, low, high, method, diffPct, confidence, sources, note:
      extra.weak
        ? `Weak comparison: ${extra.weak} ${note}`
        : confidence === "low"
        ? `${note} Rough guide: ${
            method === "cma"
              ? `based on one comparable sale (${f.cma.value?.date_sold}), not adjusted for time.`
              : method === "market-rent"
                ? `asking rents of ${market?.sample} similar listings, not signed leases.`
                : "based on a few nearby sales."
          }`
        : note };
}
