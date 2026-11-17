// Overview: the first screen of the panel. Asking price beside the estimate, the sales behind it, four key tiles and a
// short local context list. Every value comes from data the panel already loads, or says there is none.
import type React from "react";
import { useEffect } from "react";
import { fetchDevelopments, fetchSection, fetchSuburbPulse, type Mode, type PropertyResponse } from "@/lib/api";
import { MoneyCard } from "./money-card";
import { AskingPriceInput } from "./sections";
import { money, short, Source, useLazy } from "./ui";

/** What the estimate is, in words a buyer uses. */
const ESTIMATE_WHAT: Record<string, string> = {
  avm: "Microburbs' estimate",
  cma: "a comparable sale",
  comparables: "what similar homes nearby sold for",
  "agent-quoting": "the likely sale price",
  "rent-model": "our fair rent",
  "market-rent": "the market rent",
};

const PORTAL = { rea: "realestate.com.au", domain: "domain.com.au" } as const;
/** Heading of the value column: says plainly where the number comes from. */
const VALUE_LABEL: Record<string, string> = {
  avm: "Microburbs estimate",
  comparables: "Median of similar sales",
  cma: "Comparable sale",
  "agent-quoting": "Likely sale price",
};
const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
const monthYear = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
  });

/**
 * The asking price (dot, labelled above) against the estimate (line, labelled below) and the range of
 * sales or rents it comes from (shaded). Labels sit on opposite sides so they never collide.
 */
function RangeBar(props: {
  low: number;
  high: number;
  estimate: number;
  estimateLabel: string;
  asking: number | null;
  rent: boolean;
  tone: string;
  rangeOf: string;
}) {
  const { low, high, estimate, estimateLabel, asking, rent, tone, rangeOf } = props;
  const lo = Math.min(low, estimate, asking ?? Infinity);
  const hi = Math.max(high, estimate, asking ?? -Infinity);
  const pad = (hi - lo || hi * 0.1) * 0.12;
  const at = (x: number) => `${((x - (lo - pad)) / (hi - lo + 2 * pad)) * 100}%`;
  const width = (a: number, b: number) => `max(6px, calc(${at(b)} - ${at(a)}))`;
  const tag = (x: number) => ({ left: `clamp(18%, ${at(x)}, 82%)` });
  const dot =
    {
      red: "bg-rose-500",
      green: "bg-emerald-500",
      blue: "bg-brand-600",
      slate: "bg-slate-500",
    }[tone] ?? "bg-slate-500";
  const ink =
    {
      red: "text-rose-700",
      green: "text-emerald-700",
      blue: "text-brand-700",
      slate: "text-slate-700",
    }[tone] ?? "text-slate-700";
  return (
    <div className="mt-3">
      <div className="relative h-5">
        {asking ? (
          <span className={`absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-bold ${ink}`} style={tag(asking)}>
            Asking {short(asking)}
          </span>
        ) : null}
      </div>
      <div className="relative h-2.5 rounded-full bg-slate-200" aria-hidden>
        <div className="absolute inset-y-0 rounded-full bg-brand-200" style={{ left: at(low), width: width(low, high) }} />
        <div className="absolute -top-1.5 h-5 w-[3px] -translate-x-1/2 rounded bg-brand-900" style={{ left: at(estimate) }} />
        {asking ? (
          <div className={`absolute -top-1 h-[18px] w-[18px] -translate-x-1/2 rounded-full border-2 border-white shadow ${dot}`} style={{ left: at(asking) }} />
        ) : null}
      </div>
      <div className="relative mt-1 h-5">
        <span className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-brand-900" style={tag(estimate)}>
          {estimateLabel} {short(estimate)}
        </span>
      </div>
      <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-slate-500">
        <span className="inline-block h-2 w-4 rounded-full bg-brand-200" aria-hidden />
        {rangeOf} from {money(low, rent)} to {money(high, rent)}
      </p>
    </div>
  );
}

function SalesList({ data }: { data: PropertyResponse }) {
  const comps = data.facts?.comparables.value ?? [];
  if (data.verdict?.method !== "comparables" || !comps.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold text-brand-800">The sales it is compared with</p>
      <ul className="mt-1 divide-y divide-brand-100 text-xs">
        {comps.map((c) => (
          <li key={c.gnaf_pid ?? c.address} className="flex items-start justify-between gap-2 py-1.5">
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate font-medium text-slate-900">{titleCase(c.address ?? "Nearby sale")}</span>
                {(c.dist_km ?? 1) <= 0.03 ? (
                  <span className="shrink-0 rounded-full bg-brand-100 px-1.5 text-[10px] font-semibold text-brand-800">Same building</span>
                ) : null}
              </span>
              <span className="text-[11px] text-slate-500">
                {[
                  c.bedrooms !== null && c.bedrooms !== undefined ? `${c.bedrooms} bd` : null,
                  c.bathrooms !== null && c.bathrooms !== undefined ? `${c.bathrooms} ba` : null,
                  c.garage_spaces !== null && c.garage_spaces !== undefined ? `${c.garage_spaces} car` : null,
                  c.dist_km !== null && c.dist_km !== undefined && c.dist_km > 0.03 ? `${Math.round(c.dist_km * 1000)} m away` : null,
                  c.date_sold ? `sold ${monthYear(c.date_sold)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className="shrink-0 font-bold text-slate-900">{c.price ? short(c.price) : "?"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DAY = 864e5;
const daysSince = (d: string) => Math.max(0, Math.floor((Date.now() - Date.parse(`${d}T00:00:00`)) / DAY));

type SaleRow = { date: string; price?: number | null; type: string };
type SalesState = ReturnType<typeof useSaleHistory>;
/** Past sales and listings of this home, loaded once for the price block (sale mode only). */
export function useSaleHistory(gnaf: string, on: boolean) {
  const sales = useLazy(() => fetchSection(gnaf, "sales"));
  useEffect(() => {
    if (gnaf && on) sales.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gnaf, on]);
  return sales;
}

/** The current run of "For Sale" records after the last sale: when it started and the first price asked. */
function campaignStart(rows: SaleRow[]): { date: string; price: number | null } | null {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const lastSold = sorted.filter((h) => /sold/i.test(h.type)).at(-1)?.date ?? "";
  const listed = sorted.filter((h) => /for sale/i.test(h.type) && h.date > lastSold);
  if (!listed.length) return null;
  const first = listed[0]!.date;
  // Agency prices parsed from listing text can be junk ("$50,000" for a $2M flat).
  const prices = listed.filter((h) => h.date === first && (h.price ?? 0) >= 150_000).map((h) => h.price!);
  return { date: first, price: prices.length ? Math.max(...prices) : null };
}

/** Days on the market (counting earlier listings of the same campaign) and any move in the guide. */
function listingTiming(data: PropertyResponse, history: SaleRow[] | null, rent: boolean) {
  const l = data.facts?.listing.value;
  if (!l) return null;
  const start = history ? campaignStart(history) : null;
  const since = start && l.listingDate && daysSince(start.date) - daysSince(l.listingDate) > 30 ? start : null;
  const days = since ? daysSince(since.date) : l.listingDate ? daysSince(l.listingDate) : null;
  const mb = l.priceFrom ? l.microburbsPrice : null;
  const lo = l.priceLow ?? l.price;
  const hi = l.priceHigh ?? l.price;
  let move: { cut: boolean; text: string } | null = null;
  if (mb && lo && hi && (hi < mb || lo > mb)) {
    const a = hi < mb ? mb - hi : lo - mb;
    const b = hi < mb ? mb - lo : hi - mb;
    const amount = a === b ? short(a) : `${short(a)} to ${short(b)}`;
    move = {
      cut: hi < mb,
      text: `${rent ? "Rent" : "Guide"} ${hi < mb ? "cut" : "raised"} by ${amount}`,
    };
  }
  return { days, since, move, mb };
}

/** How long it has been on the market, and whether the guide moved. */
function ListingSignals({ data, rent, history }: { data: PropertyResponse; rent: boolean; history: SaleRow[] | null }) {
  const timing = listingTiming(data, history, rent);
  if (!timing) return null;
  const { days, since, move, mb } = timing;
  return (
    <div className="mt-1 space-y-0.5">
      {move ? (
        <p
          className={`inline-flex rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold ${move.cut ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
        >
          {move.text}
        </p>
      ) : null}
      {move ? <p className="text-[10.5px] text-slate-500">Microburbs recorded {short(mb!)} when listed</p> : null}
      {since ? (
        <p className="text-[10.5px] font-semibold leading-snug text-amber-800">
          On the market since {monthYear(since.date)}
          {since.price ? `, first asked ${short(since.price)}` : ""}
        </p>
      ) : days !== null ? (
        <p className="text-[10.5px] text-slate-500">
          Listed {days === 0 ? "today" : `${days} day${days > 1 ? "s" : ""} ago`}
          {days >= 45 ? ", longer than most" : ""}
        </p>
      ) : null}
    </div>
  );
}

function CheckRow({ icon, label, value, sub }: { icon: string; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 py-1.5">
      <span className="mt-0.5 text-brand-600">
        <Icon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-slate-600">{label}</span>
          <span className="text-right font-bold text-slate-900">{value}</span>
        </span>
        {sub ? <span className="block text-[10.5px] leading-snug text-slate-500">{sub}</span> : null}
      </span>
    </li>
  );
}

/** Three more ways to judge the asking price: by size, against this home's own last sale, and by how the agency quotes. */
function ValueChecks({
  data,
  sales,
}: {
  data: PropertyResponse;
  sales: {
    status: string;
    data: { saleHistory: { value: SaleRow[] | null } } | null;
  };
}) {
  const t = data.alternatives?.targetValue;
  const asking = data.verdict?.asking ?? null;
  const listed = data.facts?.listing.value?.listingDate ?? "9999";
  const last = (sales.data?.saleHistory.value ?? [])
    .filter((h) => h.price && /sold/i.test(h.type) && h.date < listed)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const years = last ? (Date.now() - Date.parse(`${last.date}T00:00:00`)) / (365.25 * DAY) : 0;
  const growth = last && asking && years >= 1 ? (Math.pow(asking / last.price!, 1 / years) - 1) * 100 : null;
  const q = data.facts?.agentQuoting.value;
  const n = q?.total_sales ?? 0;

  return (
    <ul className="mt-3 divide-y divide-brand-100 border-y border-brand-100 text-xs">
      {t?.pricePerSqm ? (
        <CheckRow
          icon="area"
          label="Price per m²"
          value={`${money(t.pricePerSqm)}/m²`}
          sub={
            t.medianPerSqm && t.vsMedianPct !== null
              ? `${Math.abs(t.vsMedianPct)}% ${t.vsMedianPct > 0 ? "above" : "below"} the ${money(t.medianPerSqm)}/m² median of ${t.sample} listed ${t.label}`
              : `Not enough listed ${t.label} to compare`
          }
        />
      ) : null}
      <CheckRow
        icon="calendar"
        label="Last sold"
        value={
          last ? (
            short(last.price!)
          ) : sales.status === "done" || sales.status === "error" ? (
            <span className="font-medium text-slate-400">No record</span>
          ) : (
            "..."
          )
        }
        sub={
          last
            ? `${monthYear(last.date)}${growth !== null ? `. The asking price implies ${growth >= 0 ? "+" : ""}${Math.round(growth * 10) / 10}% a year since` : ""}`
            : undefined
        }
      />
      {q?.agency_name && n ? (
        <CheckRow
          icon="key"
          label={q.agency_name}
          value={`${q.underquote_rate_pct ?? 0}% sold above guide`}
          sub={`Median gap ${q.median_deviation_pct ?? 0}% over ${n} sale${n > 1 ? "s" : ""}${n < 10 ? " (small sample)" : ""}${
            q.likely_sale_price ? `. Likely to sell for about ${short(q.likely_sale_price)}` : ""
          }`}
        />
      ) : null}
    </ul>
  );
}

export function Hero({ data, mode, sales }: { data: PropertyResponse; mode: Mode; sales: SalesState }) {
  const v = data.verdict;
  const l = data.facts?.listing.value;
  const rent = mode === "rent";
  const tone = {
    below: "green",
    "in-line": "blue",
    above: "red",
    unknown: "slate",
  } as const;
  const text = {
    below: "text-emerald-700",
    "in-line": "text-brand-800",
    above: "text-rose-700",
    unknown: "text-slate-700",
  } as const;
  const what = (v?.method && ESTIMATE_WHAT[v.method]) || "the estimate";
  const compared = !!(v?.asking && v.estimate && v.label !== "unknown" && v.diffPct !== null);
  const gap = compared ? Math.abs(v!.asking! - v!.estimate!) : 0;
  const range = l?.priceLow && l.priceHigh && l.priceHigh !== l.priceLow;
  const fromMicroburbs = v?.method === "avm";
  const weak = v?.weak ?? null;
  const valueLabel = rent ? "Fair rent" : (v?.estimate && v.method && VALUE_LABEL[v.method]) || "Microburbs estimate";
  const askingFrom = l?.priceFrom
    ? `On ${PORTAL[l.priceFrom]}`
    : data.facts?.listing.userPrice
      ? "Entered by you"
      : v?.asking
        ? `Microburbs listings${data.facts?.listing.asOf ? `, ${data.facts.listing.asOf}` : ""}`
        : null;
  return (
    <div className="rounded-xl bg-brand-50 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-brand-800">Asking {rent ? "rent" : "price"}</p>
          {v?.asking ? (
            <p className="text-xl font-extrabold leading-tight tracking-tight text-brand-900">
              {range ? `${short(l!.priceLow!)} to ${short(l!.priceHigh!)}` : money(v.asking, rent)}
            </p>
          ) : (
            <p className="mt-0.5 text-sm font-medium text-slate-500">Not published</p>
          )}
          {askingFrom ? <p className="text-[10.5px] text-slate-500">{askingFrom}</p> : null}
          <ListingSignals data={data} rent={rent} history={sales.data?.saleHistory.value ?? null} />
        </div>
        <div className="min-w-0 border-l border-brand-100 pl-3">
          <p className="text-[11px] font-semibold text-brand-800">{valueLabel}</p>
          {v?.estimate ? (
            <p className="text-xl font-extrabold leading-tight tracking-tight text-brand-900">{money(v.estimate, rent)}</p>
          ) : (
            <p className="mt-0.5 text-sm font-medium text-slate-500">No estimate yet</p>
          )}
          {v?.basis && !fromMicroburbs ? <p className="text-[10.5px] leading-snug text-slate-500">From {v.basis}</p> : null}
          {!rent && !fromMicroburbs ? <p className="text-[10.5px] leading-snug text-slate-500">No Microburbs valuation for this property</p> : null}
        </div>
      </div>
      {compared ? (
        <p className={`mt-3 text-sm font-semibold leading-snug ${weak ? "text-slate-700" : text[v!.label]}`}>
          {range ? "The middle of the asking range is " : "Asking is "}
          {v!.label === "in-line" ? `in line with ${what}` : `${money(gap, rent)} (${Math.abs(v!.diffPct!)}%) ${v!.label} ${what}`}.
        </p>
      ) : null}
      {weak ? (
        <p className="mt-1 flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-900">
          <span aria-hidden>⚠</span>
          <span>
            <strong>Weak comparison.</strong> {weak}
          </span>
        </p>
      ) : null}
      {v?.estimate && v.low && v.high ? (
        <RangeBar
          low={v.low}
          high={v.high}
          estimate={v.estimate}
          estimateLabel={v.method === "comparables" ? "Median" : rent ? "Fair rent" : "Estimate"}
          asking={v.asking}
          rent={rent}
          tone={v.label === "unknown" || weak ? "slate" : tone[v.label]}
          rangeOf={v.method === "avm" ? "Microburbs range" : rent ? "Similar rents range" : "Similar sales range"}
        />
      ) : null}
      {rent ? null : <ValueChecks data={data} sales={sales} />}
      <SalesList data={data} />
    </div>
  );
}

/* Small line icons (24px grid), drawn inline so there is no icon dependency. */
const ICON: Record<string, string> = {
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  bars: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  scale: "M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8",
  car: "M5 17h14M6 17v2M18 17v2M3 13l2-6h14l2 6v4H3zM7 13h.01M17 13h.01",
  key: "M15 7a4 4 0 1 1-3.9 4.9L3 20v-3h3v-3h3l1.1-1.1A4 4 0 0 1 15 7z",
  doc: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5",
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  pillar: "M4 21h16M6 18V9M10 18V9M14 18V9M18 18V9M3 9l9-6 9 6z",
  bed: "M3 18V7M3 13h18v5M21 18v-3a3 3 0 0 0-3-3h-7v1M7 11a1.5 1.5 0 1 0 0-.01",
  bath: "M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V5a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2",
  area: "M4 4h16v16H4zM4 9h5M15 4v5M20 15h-5M9 20v-5",
  train: "M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 11h16M8 21l2-3M16 21l-2-3M8 15h.01M16 15h.01",
};
function Spec({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-brand-600">
        <Icon name={icon} />
      </span>
      {text}
    </span>
  );
}
function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={ICON[name]} />
    </svg>
  );
}

function Tile({ icon, label, value, sub }: { icon: string; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
      <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <span className="text-brand-600">
          <Icon name={icon} />
        </span>
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold leading-tight text-slate-900">{value}</p>
      {sub ? <p className="text-[11px] leading-snug text-slate-500">{sub}</p> : null}
    </div>
  );
}
const Missing = () => <span className="text-sm font-medium text-slate-400">No data</span>;

const numOf = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
const ordinal = (n: number) => `${n}${[11, 12, 13].includes(n % 100) ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
const duration = (days: number) => (days >= 60 ? `${Math.round(days / 30.44)} months` : `${days} day${days === 1 ? "" : "s"}`);
type Side = "buyer" | "seller" | null;

/**
 * Who has the upper hand: how long this home has been listed against the suburb's typical days on market,
 * how much choice there is (months of supply, or rental vacancy) and whether the guide was cut.
 * Suburb figures are Microburbs' market pulse; rank 1 is the suburb with the highest value.
 */
export function Leverage({ data, mode, history }: { data: PropertyResponse; mode: Mode; history: SaleRow[] | null }) {
  const suburb = data.match.suburb;
  const pulse = useLazy(() => (suburb ? fetchSuburbPulse(suburb, mode) : Promise.reject(new Error("no suburb"))));
  useEffect(() => {
    pulse.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rent = mode === "rent";
  const place = (suburb ?? "the suburb").replace(/\s*\(.*\)$/, "");
  const kind = /house|townhouse|terrace|villa|semi/i.test(data.facts?.listing.value?.propertyType ?? "") ? "house" : "unit";
  const ind = pulse.data?.indicators ?? {};
  const val = (k: string) => (ind[k]?.value ?? null) as Record<string, unknown> | null;
  const timing = listingTiming(data, history, rent);

  const rows: { label: string; value: string; sub: string; side: Side }[] = [];
  const reasons: string[] = [];

  const typical = numOf(val("days-on-market")?.[kind]);
  const days = timing?.days ?? null;
  if (days !== null) {
    const ratio = typical ? days / typical : null;
    const side: Side = ratio !== null && ratio >= 1.5 ? "buyer" : ratio !== null && ratio <= 0.5 ? "seller" : null;
    rows.push({
      label: "On the market",
      value: duration(days),
      sub: typical ? `${place} ${kind}s usually take ${typical} days` : timing?.since ? "Includes earlier listings of this home" : "",
      side,
    });
    if (side === "buyer") reasons.push(`it has been listed ${ratio! >= 3 ? `${Math.round(ratio!)}x` : "much"} longer than usual`);
    if (side === "seller") reasons.push("it was listed recently");
  }

  if (rent) {
    const vac = val("vacancy-rate")?.[kind] as Record<string, unknown> | undefined;
    const rate = numOf(vac?.value);
    const rank = numOf(vac?.rank);
    const areas = numOf(vac?.areas);
    if (rate !== null) {
      const share = rank && areas ? rank / areas : null;
      const side: Side = share !== null && share <= 0.25 ? "buyer" : share !== null && share >= 0.75 ? "seller" : null;
      rows.push({
        label: "Vacancy",
        value: `${(rate * 100).toFixed(1)}%`,
        sub: rank && areas ? `${ordinal(rank)} highest of ${areas} suburbs for ${kind}s` : `${place} ${kind}s`,
        side,
      });
      if (side === "buyer") reasons.push(`more ${kind}s sit empty in ${place} than in most suburbs`);
      if (side === "seller") reasons.push(`few ${kind}s sit empty in ${place}`);
    }
  } else {
    const ms = val("months-of-supply");
    const months = numOf(ms?.months_of_supply);
    const rank = numOf(ms?.rank);
    const areas = numOf(ms?.areas);
    if (months !== null) {
      const share = rank && areas ? rank / areas : null;
      const side: Side = share !== null && share <= 0.25 ? "buyer" : share !== null && share >= 0.75 ? "seller" : null;
      rows.push({
        label: "Supply",
        value: `${months.toFixed(1)} months`,
        sub: rank && areas ? `${ordinal(rank)} highest of ${areas} suburbs` : "Time to sell all homes listed now",
        side,
      });
      if (side === "buyer") reasons.push(`there is plenty of choice in ${place}`);
      if (side === "seller") reasons.push(`there is little choice in ${place}`);
    }
    const stock = numOf(val("stock-on-market")?.[kind]);
    if (stock !== null)
      rows.push({
        label: "For sale now",
        value: `${stock} ${kind}s`,
        sub: `In ${place}`,
        side: null,
      });
  }
  if (timing?.move?.cut) reasons.push(`the ${rent ? "rent" : "guide"} was cut`);

  if (!rows.length) return pulse.status === "loading" || pulse.status === "idle" ? <p className="text-xs text-slate-400">Checking the market...</p> : null;
  const buyer = rows.filter((r) => r.side === "buyer").length + (timing?.move?.cut ? 1 : 0);
  const seller = rows.filter((r) => r.side === "seller").length;
  const verdict =
    buyer >= 2 && !seller
      ? { title: "Room to negotiate", cls: "bg-emerald-100 text-emerald-800" }
      : seller >= 2 && !buyer
        ? { title: "Competitive market", cls: "bg-rose-100 text-rose-800" }
        : buyer > seller
          ? {
              title: "Some room to negotiate",
              cls: "bg-emerald-50 text-emerald-800",
            }
          : { title: "Balanced market", cls: "bg-slate-100 text-slate-700" };
  const mark = { buyer: "text-emerald-700", seller: "text-rose-700" } as const;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-brand-800">Who has the upper hand?</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${verdict.cls}`}>{verdict.title}</span>
      </div>
      <ul className="mt-1 divide-y divide-slate-100 text-xs">
        {rows.map((r) => (
          <li key={r.label} className="py-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-slate-600">{r.label}</span>
              <span className={`font-bold ${r.side ? mark[r.side] : "text-slate-900"}`}>{r.value}</span>
            </div>
            {r.sub ? <p className="text-[10.5px] leading-snug text-slate-500">{r.sub}</p> : null}
          </li>
        ))}
      </ul>
      {reasons.length ? (
        <p className="mt-1 text-[11px] leading-snug text-slate-700">
          {buyer > seller ? "You have leverage: " : seller > buyer ? "Expect competition: " : "Mixed signals: "}
          {reasons.join(", ").replace(/, ([^,]*)$/, " and $1")}.
        </p>
      ) : null}
      <Source source="Microburbs suburb market (days on market, supply, vacancy)" asOf={Object.values(ind).find((x) => x.asOf)?.asOf ?? null} />
    </div>
  );
}

function RentTiles({ data }: { data: PropertyResponse }) {
  const r = data.rent?.available ? data.rent.value : null;
  const lease = (data.facts?.rentHistory.value ?? []).filter((h) => h.price).at(-1);
  const asking = data.facts?.listing.value?.price;
  return (
    <div className="grid grid-cols-2 gap-2">
      <Tile icon="car" label="Fair rent with car space" value={r ? money(r.rentWithCarSpace, true) : <Missing />} />
      <Tile
        icon="key"
        label="Fair rent without car"
        value={r ? money(r.rentWithoutCarSpace, true) : <Missing />}
        sub={r ? `Car space worth ${money(r.rentWithCarSpace - r.rentWithoutCarSpace, true)}` : undefined}
      />
      <Tile icon="calendar" label="Last leased" value={lease?.price ? money(lease.price, true) : <Missing />} sub={lease?.date} />
      <Tile
        icon="bars"
        label="Asking rent"
        value={asking ? money(asking, true) : <Missing />}
        sub={data.facts?.listing.value?.listingDate ? `Listed ${data.facts.listing.value.listingDate}` : undefined}
      />
    </div>
  );
}

type RiskRow = {
  name?: string | null;
  value?: string | null;
  on_property?: boolean | null;
  nearest_distance_m?: number | null;
};
function overlay(rows: RiskRow[] | null | undefined) {
  if (!rows?.length) return "None recorded";
  if (rows.some((r) => r.on_property)) return "On property";
  const d = Math.min(...rows.map((r) => r.nearest_distance_m ?? Infinity));
  return Number.isFinite(d) ? `Nearest ${d} m` : "Nearby";
}

function ContextRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-2 py-1.5">
      <span className="flex items-center gap-2 text-slate-700">
        <span className="text-slate-500">
          <Icon name={icon} />
        </span>
        {label}
      </span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </li>
  );
}

/** Loads risks, transport and development applications as soon as the overview shows (shared by the match card). */
function useLocalData(gnaf: string, suburb: string | null) {
  const risks = useLazy(() => fetchSection(gnaf, "risks"));
  const transport = useLazy(() => fetchSection(gnaf, "transport"));
  const das = useLazy(() => (suburb ? fetchDevelopments(suburb) : Promise.reject(new Error("no suburb"))));
  useEffect(() => {
    risks.start();
    transport.start();
    das.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { risks, transport, das };
}
export type LocalData = ReturnType<typeof useLocalData>;

function LocalContext({ local }: { local: LocalData }) {
  const { risks, transport, das } = local;
  const wait = (s: string) => (s === "loading" || s === "idle" ? <span className="text-slate-400">...</span> : <span className="text-slate-400">No data</span>);
  const r = risks.data?.risks.value as Record<string, RiskRow[] | null> | null | undefined;
  const n = transport.data?.transport.value?.nearest;
  const stop = n ? (["train", "tram", "ferry", "bus"] as const).map((m) => ({ m, s: n[m] })).find((x) => x.s) : undefined;
  const stopLabel = {
    train: "Train or light rail",
    tram: "Light rail",
    ferry: "Ferry",
    bus: "Bus stop",
  } as const;
  return (
    <div>
      <p className="mb-1 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Local context <span className="h-px flex-1 bg-slate-200" />
      </p>
      <ul className="divide-y divide-slate-100 text-xs">
        <ContextRow
          icon="doc"
          label="Planning applications"
          value={das.data?.lastTwelveMonths !== undefined ? `${das.data.lastTwelveMonths} in suburb, 12 months` : wait(das.status)}
        />
        <ContextRow icon="home" label="Public housing" value={r ? overlay(r.public_housing) : wait(risks.status)} />
        <ContextRow icon="shield" label="Flood overlay" value={r ? overlay(r.flood) : wait(risks.status)} />
        <ContextRow icon="pillar" label="Heritage overlay" value={r ? overlay(r.heritage) : wait(risks.status)} />
        <ContextRow
          icon="train"
          label="Nearest transport"
          value={stop?.s ? `${stopLabel[stop.m]}, ${stop.s.distance_m} m` : transport.status === "done" ? "None within 1 km" : wait(transport.status)}
        />
      </ul>
    </div>
  );
}

/** The matched address, layout and G-NAF id at the top of the overview. */
export function PropertyHead({ data }: { data: PropertyResponse }) {
  const l = data.facts?.listing.value;
  return (
    <div>
      <p className="text-sm font-semibold leading-snug text-slate-900">{data.match.matchedAddress ?? data.match.normalized}</p>
      {l ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-700">
          <Spec icon="bed" text={`${l.bedrooms ?? "?"} bed`} />
          <Spec icon="bath" text={`${l.bathrooms ?? "?"} bath`} />
          <Spec icon="car" text={`${l.parking ?? 0} car`} />
          {l.buildingSize ? <Spec icon="area" text={`${l.buildingSize} m²`} /> : null}
        </p>
      ) : null}
      <p className="mt-0.5 text-[10.5px] text-slate-400">G-NAF {data.match.gnafId}</p>
      {data.match.note ? <p className="mt-0.5 text-[11px] text-slate-500">{data.match.note}</p> : null}
    </div>
  );
}

export function Overview({ data, mode, onPrice }: { data: PropertyResponse; mode: Mode; onPrice: (n: number) => void }) {
  const f = data.facts!;
  const l = f.listing.value;
  const sales = useSaleHistory(data.match.gnafId ?? "", mode === "sale");
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <PropertyHead data={data} />
      <Hero data={data} mode={mode} sales={sales} />
      {!l?.price && (!l?.listedFor || l.listedFor === mode) ? <AskingPriceInput mode={mode} onPrice={onPrice} /> : null}
      {f.listing.userPrice ? <p className="-mt-2 text-[11px] text-slate-500">Asking price entered by you, not from Microburbs.</p> : null}
      <Leverage data={data} mode={mode} history={sales.data?.saleHistory.value ?? null} />
      <MoneyCard data={data} mode={mode} />
      {mode === "rent" ? <RentTiles data={data} /> : null}
    </section>
  );
}

/** Shown after the chat: local context, the full report button and where every number came from. */
export function OverviewFooter({ data, onShowDetails }: { data: PropertyResponse; onShowDetails: () => void }) {
  const refreshed = (data.generatedAt ?? "").slice(0, 10);
  const local = useLocalData(data.match.gnafId ?? "", data.match.suburb);
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <LocalContext local={local} />
      <div className="flex items-center justify-between gap-2 pt-1">
        <button onClick={onShowDetails} className="rounded-lg bg-brand-900 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800">
          View full property report →
        </button>
        {refreshed ? <span className="text-[10.5px] text-slate-400">Data refreshed {refreshed}</span> : null}
      </div>
      <div>
        <Source source={data.facts!.listing.source} asOf={data.facts!.listing.asOf} />
        {data.verdict?.sources.map((s) => (
          <Source key={s} source={s} />
        ))}
        {data.rent?.available ? <Source source={data.rent.source} asOf={data.rent.asOf} /> : null}
      </div>
    </section>
  );
}
