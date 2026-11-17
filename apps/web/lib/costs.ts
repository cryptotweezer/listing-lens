// Inputs for the "does the money work?" calculator: the suburb's median strata levy and its price trend.
// Both are suburb-level Microburbs figures, cached for a day; the arithmetic itself runs in the panel.
import type { Sal } from "@mb/contracts";
import { priceTrend } from "./agent-tools";
import type { Cache } from "./cache";
import { typeClass } from "./facts";
import type { MicroburbsClient } from "./microburbs";
import { indicator } from "./suburb";

export interface OwnershipInputs {
  strata: { annual: number; sample: number | null; source: string; asOf: string | null } | null;
  trend: { kind: "unit" | "house"; tenYearsPct: number | null; fiveYearsPct: number | null; source: string; asOf: string } | null;
}

export async function ownershipInputs(deps: { mb: MicroburbsClient; cache: Cache }, suburb: Sal, propertyType: string | null): Promise<OwnershipInputs> {
  const kind = typeClass(propertyType) ?? "unit";
  const [strata, trend] = await Promise.all([
    // Strata only applies to units and townhouses in a scheme.
    kind === "unit" ? indicator(deps, suburb, "market/strata-levies") : Promise.resolve(null),
    priceTrend(deps, suburb, kind).catch(() => null),
  ]);
  const levy = Number(strata?.value?.median_levy_annual);
  return {
    strata:
      strata?.available && levy > 0
        ? { annual: Math.round(levy), sample: Number(strata.value?.n_properties) || null, source: strata.source, asOf: strata.asOf }
        : null,
    trend:
      trend?.changePct && trend.latest && trend.source
        ? { kind, tenYearsPct: trend.changePct.tenYears, fiveYearsPct: trend.changePct.fiveYears, source: trend.source, asOf: trend.latest.date }
        : null,
  };
}
