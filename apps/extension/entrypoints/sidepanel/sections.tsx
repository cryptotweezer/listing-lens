// Panel sections. Each one renders a fact block with its source and date, or says there is no data.
// Core cards are always open; secondary ones are folds that fetch their data only when opened.
import type React from "react";
import { useState } from "react";
import { type Alternative, type AlternativesResult, fetchDevelopments, fetchSection, fetchSuburbPulse, type Match, type Mode, type PropertyResponse } from "@/lib/api";
import { Badge, Card, Fold, LazyBody, money, NoData, short, Source, Stat, useLazy } from "./ui";

type Facts = NonNullable<PropertyResponse["facts"]>;

export function MatchReceipt({ match, onPick }: { match: Match; onPick: (gnaf: string) => void }) {
  const tone = { "exact-unit": "green", "exact-building": "amber", ambiguous: "amber", withheld: "slate", unsupported: "slate" } as const;
  const label = {
    "exact-unit": "Exact property match",
    "exact-building": "Building only",
    ambiguous: "Needs your help",
    withheld: "Address withheld",
    unsupported: "Outside coverage",
  } as const;
  return (
    <Card title="Address match" right={<Badge tone={tone[match.status]}>{label[match.status]}</Badge>}>
      <p className="text-sm font-medium text-slate-900">{match.matchedAddress ?? match.normalized}</p>
      {match.gnafId ? <p className="text-[11px] text-slate-400">G-NAF {match.gnafId}</p> : null}
      {match.note ? <p className="mt-1 text-xs text-slate-500">{match.note}</p> : null}
      {match.status === "unsupported" ? <p className="mt-1 text-xs text-slate-500">This panel covers the 29 suburbs of the City of Sydney.</p> : null}
      {match.status === "ambiguous" && match.candidates.length ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-slate-500">Is it one of these?</p>
          {match.candidates.map((c) => (
            <button key={c.id} onClick={() => onPick(c.id)} className="block w-full rounded-md border border-slate-200 px-2 py-1 text-left text-xs hover:border-brand-500 hover:bg-brand-50">
              {c.name}
            </button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

/** Lets the user type the asking price shown on the portal when Microburbs has none. */
export function AskingPriceInput({ mode, onPrice }: { mode: Mode; onPrice: (n: number) => void }) {
  const [raw, setRaw] = useState("");
  const [bad, setBad] = useState(false);
  const submit = () => {
    const n = Number(raw.replace(/[^0-9.]/g, "")) * (/k$/i.test(raw.trim()) ? 1000 : /m$/i.test(raw.trim()) ? 1_000_000 : 1);
    const ok = mode === "sale" ? n >= 100_000 && n <= 60_000_000 : n >= 100 && n <= 30_000;
    setBad(!ok);
    if (ok) onPrice(Math.round(n));
  };
  return (
    <form
      className="mt-2 rounded-lg border border-dashed border-brand-200 bg-brand-50 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="text-xs font-medium text-brand-800">See the price on the listing? Enter it to check it.</label>
      <div className="mt-1 flex gap-1">
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          inputMode="numeric"
          placeholder={mode === "sale" ? "e.g. 1,800,000" : "e.g. 950 per week"}
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-brand-500"
        />
        <button className="rounded-md bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700">Check price</button>
      </div>
      {bad ? <p className="mt-1 text-[11px] text-rose-700">{mode === "sale" ? "Enter a sale price, e.g. 1,800,000." : "Enter a weekly rent, e.g. 950."}</p> : null}
    </form>
  );
}

export function AgencyCard({ f }: { f: Facts }) {
  const a = f.agentQuoting;
  if (a.reason === "not_for_sale") return null;
  const v = a.value;
  const n = v?.total_sales ?? 0;
  return (
    <Fold title="How this agency quotes" hint={v?.agency_name ? `${v.agency_name}: guide vs final price` : undefined}>
      {a.available && v ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Sold above guide" value={`${v.underquote_rate_pct ?? 0}%`} />
            <Stat label="Median gap" value={`${v.median_deviation_pct ?? 0}%`} />
            <Stat label="Sales" value={n} />
          </div>
          {v.cohort ? <p className="mt-2 text-xs text-slate-600">Microburbs classes this agency as a {v.cohort.toLowerCase()}.</p> : null}
          {n < 10 ? <p className="mt-1 text-xs text-amber-700">Small sample ({n} sales): treat as a weak signal.</p> : null}
          {v.recent_sales?.length ? (
            <ul className="mt-2 divide-y divide-slate-100 text-xs">
              {v.recent_sales.slice(0, 5).map((r, i) => (
                <li key={i} className="flex justify-between gap-2 py-1">
                  <span className="text-slate-600">
                    {r.address ?? "Sale"} <span className="text-slate-400">{r.sold_date ?? ""}</span>
                  </span>
                  <span className="whitespace-nowrap text-slate-900">
                    {r.guide_price ? short(r.guide_price) : "?"} to {r.sold_price ? short(r.sold_price) : "?"}
                    {r.diff_pct !== null && r.diff_pct !== undefined ? (
                      <span className={r.diff_pct > 0 ? "text-rose-700" : "text-emerald-700"}>
                        {" "}
                        ({r.diff_pct > 0 ? "+" : ""}
                        {r.diff_pct}%)
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <NoData>No quoting history for this agency.</NoData>
      )}
      <Source source={a.source} asOf={a.asOf} />
    </Fold>
  );
}

export function ComparablesCard({ f }: { f: Facts }) {
  if (!f.cma || f.cma.reason === "not_for_sale") return null;
  const cma = f.cma.value;
  const rows = f.comparables?.value ?? [];
  return (
    <Fold
      title="Comparable sales"
      hint={cma?.price ? `Best match sold for ${short(cma.price)}${cma.same_building ? " in the same building" : ""}` : rows.length ? `${rows.length} similar sales nearby` : undefined}
    >
      {cma?.date_sold ? (
        <div className="rounded-lg bg-slate-50 p-2 text-xs">
          <p className="font-medium text-slate-900">
            {cma.street ? titleCase(cma.street) : "Comparable"}
            {cma.street && !/^unit\b|\//i.test(cma.street) ? <span className="font-normal text-slate-400"> (unit not published)</span> : null}{" "}
            {cma.same_building ? <Badge tone="blue">Same building</Badge> : null}
          </p>
          <p className="text-slate-600">
            Sold {cma.price ? money(cma.price) : "(price not published)"} on {cma.date_sold} · {cma.bedrooms ?? "?"} bed · {cma.bathrooms ?? "?"} bath · {cma.garage_spaces ?? 0} car
            {cma.distance_m !== null && cma.distance_m !== undefined ? ` · ${cma.distance_m} m away` : ""}
          </p>
          <Source source={f.cma.source} asOf={f.cma.asOf} />
        </div>
      ) : (
        <NoData>No best comparable from Microburbs.</NoData>
      )}
      {rows.length ? (
        <ul className="mt-2 divide-y divide-slate-100 text-xs">
          <li className="pb-1 text-[11px] text-slate-500">Similar sales behind the median in the overview, closest first</li>
          {rows.map((c, i) => (
            <li key={i} className="flex justify-between gap-2 py-1">
              <span className="text-slate-600">
                {titleCase(c.address ?? "Sale")}{" "}
                <span className="text-slate-400">
                  {c.date_sold ?? ""}
                  {c.dist_km !== null && c.dist_km !== undefined ? ` · ${Math.round(c.dist_km * 1000)} m` : ""}
                </span>
              </span>
              <span className="whitespace-nowrap font-medium text-slate-900">{c.price ? money(c.price) : "?"}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {rows.length ? <Source source={f.comparables.source} asOf={f.comparables.asOf} /> : null}
    </Fold>
  );
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

function num(x: unknown): number | null {
  return typeof x === "number" && Number.isFinite(x) ? Math.round(x * 100) / 100 : null;
}
function firstNum(v: Record<string, unknown>, keys: string[]) {
  for (const k of keys) if (num(v[k]) !== null) return num(v[k]);
  return null;
}
function firstText(v: Record<string, unknown>, keys: string[]) {
  for (const k of keys) if (typeof v[k] === "string" && v[k]) return v[k] as string;
  return null;
}
const nested = (x: unknown) => (x && typeof x === "object" ? num((x as Record<string, unknown>).value) : num(x));
const fraction = (n: number | null) => (n === null ? null : `${Math.round(n * 1000) / 10}%`);

const PULSE: Record<string, { label: string; show: (v: Record<string, unknown>) => string | null }> = {
  "days-on-market": { label: "Days on market (units)", show: (v) => (firstNum(v, ["unit", "house"]) !== null ? `${firstNum(v, ["unit", "house"])} days` : null) },
  "stock-on-market": { label: "Units for sale", show: (v) => (firstNum(v, ["unit", "stock_on_market"]) !== null ? String(firstNum(v, ["unit", "stock_on_market"])) : null) },
  "months-of-supply": { label: "Months of supply", show: (v) => (num(v.months_of_supply) !== null ? String(num(v.months_of_supply)) : null) },
  "strata-levies": { label: "Median strata levy", show: (v) => (num(v.median_levy_annual) !== null ? `${money(num(v.median_levy_annual))}/yr` : null) },
  // Vacancy and yield come as fractions (0.0369 = 3.7%), vacancy nested per dwelling type.
  "vacancy-rate": { label: "Rental vacancy (units)", show: (v) => fraction(nested(v.unit) ?? nested(v.house)) },
  "yield-pct": { label: "Gross yield (units)", show: (v) => fraction(num(v.unit) ?? num(v.house)) },
  summary: {
    label: "Crime vs national",
    show: (v) => {
      const verdict = firstText(v, ["verdict"]);
      const p = num(v.vs_national_pct);
      return verdict ? `${verdict}${p !== null ? ` (${p > 0 ? "+" : ""}${p}%)` : ""}` : null;
    },
  },
};

export function SuburbPulseCard({ suburb, mode }: { suburb: string; mode: Mode }) {
  const lazy = useLazy(() => fetchSuburbPulse(suburb, mode));
  return (
    <Fold title={`${suburb.replace(/ \(NSW\)$/, "")} market pulse`} hint={mode === "rent" ? "Vacancy, yield, strata levies, crime" : "Days on market, supply, strata levies, crime"} onOpen={lazy.start}>
      <LazyBody lazy={lazy}>
        {(d) => {
          const rows = Object.entries(d.indicators).map(([k, f]) => {
            const def = PULSE[k];
            return { k, label: def?.label ?? k, value: f.value && def ? def.show(f.value) : null, asOf: f.asOf };
          });
          return (
            <>
              <div className="grid grid-cols-2 gap-2">
                {rows.map((r) => (
                  <Stat key={r.k} label={r.label} value={r.value ?? <span className="text-sm font-normal text-slate-400">No data</span>} />
                ))}
              </div>
              <Source source="Microburbs suburb market and crime" asOf={rows.find((r) => r.asOf)?.asOf ?? null} />
            </>
          );
        }}
      </LazyBody>
    </Fold>
  );
}

export function SchoolsCard({ gnaf }: { gnaf: string }) {
  const lazy = useLazy(() => fetchSection(gnaf, "schools"));
  return (
    <Fold title="Schools nearby" hint="Closest public and private schools" onOpen={lazy.start}>
      <LazyBody lazy={lazy}>
        {({ schools }) =>
          schools.value?.length ? (
            <>
              <ul className="divide-y divide-slate-100 text-xs">
                {schools.value.map((sc, i) => (
                  <li key={i} className="flex justify-between gap-2 py-1">
                    <span className="text-slate-700">
                      {sc.name} <span className="text-slate-400">{[sc.sector, sc.school_level_type].filter(Boolean).join(", ")}</span>
                    </span>
                    <span className="whitespace-nowrap text-slate-500">{sc.distance_m !== null && sc.distance_m !== undefined ? `${sc.distance_m} m` : ""}</span>
                  </li>
                ))}
              </ul>
              <Source source={schools.source} asOf={schools.asOf} />
            </>
          ) : (
            <NoData>No schools data.</NoData>
          )
        }
      </LazyBody>
    </Fold>
  );
}

const NotPublished = () => <span className="text-slate-400">Not published</span>;

function VsMedian({ pct }: { pct: number }) {
  if (Math.abs(pct) < 1) return <span className="font-medium text-slate-700">In line with the median</span>;
  return (
    <span className={pct < 0 ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
      {Math.abs(pct)}% {pct < 0 ? "below" : "above"}
    </span>
  );
}

/** Tags the strongest alternative on each dimension among the ones shown. */
function tagsFor(items: Alternative[]): Map<string, string[]> {
  const tags = new Map<string, string[]>(items.map((a) => [a.gnafId, []]));
  const best = (fn: (a: Alternative) => number | null | undefined, label: string) => {
    const ranked = items.filter((a) => fn(a) !== null && fn(a) !== undefined).sort((x, y) => fn(x)! - fn(y)!);
    if (ranked[0]) tags.get(ranked[0].gnafId)!.push(label);
  };
  if (items[0]) tags.get(items[0].gnafId)!.push("Best value");
  best((a) => -a.saving, "Biggest saving");
  best((a) => a.distanceM, "Closest");
  return tags;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-[10.5px] uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-[11.5px] text-slate-700">{children}</dd>
    </>
  );
}

export function AltItem({
  a,
  mode,
  onOpen,
  targetSize,
  medianLabel,
  tags = [],
}: {
  a: Alternative;
  mode: Mode;
  onOpen: (address: string) => void;
  targetSize?: number | null;
  medianLabel?: string;
  tags?: string[];
}) {
  const unit = mode === "rent" ? "/wk" : "";
  return (
    <li className="rounded-lg border border-slate-200 p-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          {tags.length ? (
            <div className="mb-1 flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge key={t} tone={t === "Best value" ? "green" : "blue"}>
                  {t}
                </Badge>
              ))}
            </div>
          ) : null}
          <p className="text-sm font-medium text-slate-900">{a.address}</p>
          <p className="text-[11px] text-slate-500">{a.suburb}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">{money(a.price, mode === "rent")}</p>
          {a.saving > 0 ? <p className="text-[11px] font-medium text-emerald-700">{money(a.saving, mode === "rent")} less</p> : null}
        </div>
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        <Detail label="Layout">
          {a.bedrooms ?? "?"} bed · {a.bathrooms ?? "?"} bath · {a.parking ?? 0} car
        </Detail>
        <Detail label="Size">
          {a.buildingSize ? `${a.buildingSize} m²` : <NotPublished />}
          {targetSize ? <span className="text-slate-400"> (this one {targetSize} m²)</span> : null}
        </Detail>
        {/* Price per m² needs a published size; without it these two rows would only say "Not published". */}
        {a.pricePerSqm ? <Detail label="Per m²">{`${money(a.pricePerSqm)}${unit ? " per week" : ""}`}</Detail> : null}
        {a.vsMedianPct !== null && a.vsMedianPct !== undefined ? (
          <Detail label="Vs median">
            <VsMedian pct={a.vsMedianPct} />
            {medianLabel ? <span className="text-slate-400"> {medianLabel}</span> : null}
          </Detail>
        ) : null}
        <Detail label="Distance">
          {a.distanceM !== null && a.distanceM !== undefined ? (a.distanceM < 30 ? "Same building" : a.distanceM < 1000 ? `${a.distanceM} m away` : `${(a.distanceM / 1000).toFixed(1)} km away`) : <NotPublished />}
        </Detail>
      </dl>
      <div className="mt-2 flex gap-2">
        <a
          href={a.links.domainProfile}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            // Open through the background so the new tab keeps the exact unit address.
            e.preventDefault();
            void browser.runtime
              .sendMessage({ type: "open-pinned", url: a.links.domainProfile, address: `${a.address}, ${a.suburb}`, mode })
              .catch(() => window.open(a.links.domainProfile, "_blank"));
          }}
          className="rounded-md bg-brand-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-brand-700"
        >
          Open on Domain
        </a>
        <button onClick={() => onOpen(`${a.address}, ${a.suburb}`)} className="rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50">
          Check in panel
        </button>
      </div>
      <Source source={a.source} asOf={a.asOf} />
    </li>
  );
}

export function AlternativesCard({ alt, mode, onOpen }: { alt: AlternativesResult | null | undefined; mode: Mode; onOpen: (address: string) => void }) {
  if (!alt) return null;
  const tv = alt.targetValue;
  const unit = mode === "rent" ? "/wk" : "";
  const top = alt.items.slice(0, 3);
  const cheaper = alt.compare !== "similar";
  const tags = cheaper ? tagsFor(top) : new Map<string, string[]>();
  return (
    <Card title={cheaper ? "Better-value alternatives" : "Similar listings nearby"} right={<span className="text-[11px] text-slate-400">{alt.searched.listings} listings checked</span>}>
      {!cheaper ? <p className="mb-2 text-xs text-slate-500">No asking price for this listing, so we show the closest similar ones instead of cheaper ones.</p> : null}
      {tv?.pricePerSqm && tv.medianPerSqm && tv.vsMedianPct !== null ? (
        <div className="mb-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
          This listing asks <strong>{money(tv.pricePerSqm)} per m²{unit ? " per week" : ""}</strong>,{" "}
          {Math.abs(tv.vsMedianPct) < 1 ? (
            <span className="font-medium">in line with</span>
          ) : (
            <span className={tv.vsMedianPct < 0 ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
              {Math.abs(tv.vsMedianPct)}% {tv.vsMedianPct < 0 ? "below" : "above"}
            </span>
          )}{" "}
          the median of {money(tv.medianPerSqm)} for {tv.label} ({tv.sample} listings).
        </div>
      ) : null}
      {top.length ? (
        <ul className="space-y-2">
          {top.map((a) => (
            <AltItem key={a.gnafId} a={a} mode={mode} onOpen={onOpen} targetSize={alt.target.buildingSize} medianLabel={tv ? `for ${tv.label}` : undefined} tags={tags.get(a.gnafId)} />
          ))}
        </ul>
      ) : (
        <NoData>
          No {cheaper ? "cheaper " : ""}like-for-like listings in {alt.searched.suburbs.map((x) => x.replace(/ \(.*\)$/, "")).join(", ")} right now. Try the chat, for example
          "include Ultimo and Glebe" or "allow 1 bathroom".
        </NoData>
      )}
      <a href={alt.seeAllUrl} target="_blank" rel="noreferrer" className="mt-2 block text-center text-xs font-medium text-brand-700 hover:underline">
        See all similar on Domain
      </a>
    </Card>
  );
}

export function HistoryCard({ gnaf }: { gnaf: string }) {
  const lazy = useLazy(() => fetchSection(gnaf, "history"));
  return (
    <Fold title="History of this property" hint="Past sales and listings" onOpen={lazy.start}>
      <LazyBody lazy={lazy}>
        {(d) => {
          const rows = [...(d.saleHistory.value ?? []), ...(d.rentHistory.value ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
          return rows.length ? (
            <>
              <ul className="divide-y divide-slate-100 text-sm">
                {rows.map((h, i) => (
                  <li key={i} className="flex justify-between py-1">
                    <span className="text-slate-600">
                      {h.date} · {h.type}
                    </span>
                    <span className="font-medium text-slate-900">{h.price ? money(h.price, h.type.includes("Rent")) : "price not published"}</span>
                  </li>
                ))}
              </ul>
              <Source source="Microburbs sale-history and rent-history" asOf={d.saleHistory.asOf ?? d.rentHistory.asOf} />
            </>
          ) : (
            <NoData>No sale or rental history.</NoData>
          );
        }}
      </LazyBody>
    </Fold>
  );
}

// Microburbs counts light rail stops as "train" in the City of Sydney.
const MODE_LABEL: Record<string, string> = { train: "Train or light rail", tram: "Tram", bus: "Bus", ferry: "Ferry" };

export function TransportCard({ gnaf }: { gnaf: string }) {
  const lazy = useLazy(() => fetchSection(gnaf, "transport"));
  return (
    <Fold title="Getting around" hint="Nearest train, bus and ferry" onOpen={lazy.start}>
      <LazyBody lazy={lazy}>
        {({ transport }) => {
          const n = transport.value?.nearest;
          const modes = n ? (["train", "tram", "bus", "ferry"] as const).filter((m) => n[m]) : [];
          return (
            <>
              {modes.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {modes.map((m) => (
                    <Stat key={m} label={MODE_LABEL[m] ?? m} value={`${n![m]!.distance_m} m`} sub={n![m]!.name ?? "Nearest stop"} />
                  ))}
                </div>
              ) : (
                <NoData />
              )}
              <Source source={transport.source} asOf={transport.asOf} />
            </>
          );
        }}
      </LazyBody>
    </Fold>
  );
}

type RiskLayers = Record<string, { name?: string | null; value?: string | null; on_property?: boolean | null }[] | null>;

/** One row per overlay. Layers reported per nearby area (public housing) become a single summary row. */
function groupRisks(value: RiskLayers) {
  const rows: { name: string; text: string; on: boolean }[] = [];
  for (const layers of Object.values(value)) {
    const list = layers ?? [];
    if (!list.length) continue;
    const name = list[0]!.name ?? "Risk";
    const on = list.some((l) => !!l.on_property);
    const shares = list.map((l) => /^([\d.]+)%$/.exec(l.value ?? "")?.[1]).filter(Boolean).map(Number);
    if (list.length > 1 && shares.length === list.length) {
      const sorted = [...shares].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)]!;
      rows.push({ name, text: `median ${median}% of homes across ${list.length} nearby areas (range ${sorted[0]}% to ${sorted[sorted.length - 1]}%)`, on });
    } else {
      for (const l of list) rows.push({ name: l.name ?? name, text: l.on_property ? "On property" : (l.value ?? ""), on: !!l.on_property });
    }
  }
  return rows.sort((a, b) => Number(b.on) - Number(a.on));
}

export function RisksCard({ gnaf }: { gnaf: string }) {
  const lazy = useLazy(() => fetchSection(gnaf, "risks"));
  return (
    <Fold title="Risks and overlays" hint="Flood, heritage and other overlays" onOpen={lazy.start}>
      <LazyBody lazy={lazy}>
        {({ risks }) => {
          const rows = groupRisks(risks.value ?? {});
          return (
            <>
              {rows.length ? (
                <ul className="space-y-1 text-xs">
                  {rows.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <Badge tone={r.on ? "amber" : "slate"}>{r.on ? "On property" : "Nearby"}</Badge>
                      <span className="text-slate-700">
                        {r.name}
                        {r.text && r.text !== "On property" ? `: ${r.text}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <NoData>No flagged overlays.</NoData>
              )}
              <Source source={risks.source} asOf={risks.asOf} />
            </>
          );
        }}
      </LazyBody>
    </Fold>
  );
}

const pctText = (p: number) => (Math.abs(p) < 1 ? "in line with" : `${Math.abs(p)}% ${p < 0 ? "below" : "above"}`);
const pctTone = (p: number) => (Math.abs(p) < 1 ? "text-slate-700" : p < 0 ? "text-emerald-700" : "text-rose-700");

export function StreetCard({ data }: { data: PropertyResponse }) {
  const s = data.insights?.street;
  if (!s) return null;
  return (
    <Fold title="Street prices nearby" hint={s.thisStreet && s.diffPct !== null ? `${s.street}: ${pctText(s.diffPct)} the suburb median` : "Cheaper and dearer streets around you"}>
      <p className="mb-2 text-xs text-slate-600">Median sold price of {s.label}. Nearby streets can differ a lot within a few hundred metres.</p>
      <ul className="divide-y divide-slate-100 text-xs">
        <li className="flex justify-between gap-2 py-1 font-medium">
          <span className="text-slate-900">
            {s.street} <span className="font-normal text-slate-400">(this street, {s.thisStreet?.sales ?? 0} sales)</span>
          </span>
          <span className="whitespace-nowrap">{s.thisStreet ? money(s.thisStreet.median) : "Too few sales"}</span>
        </li>
        {s.nearby.map((n) => (
          <li key={n.street} className="flex justify-between gap-2 py-1">
            <span className="text-slate-700">
              {n.street} <span className="text-slate-400">{n.distanceM} m, {n.sales} sales</span>
            </span>
            <span className="whitespace-nowrap">
              {money(n.median)} <span className={pctTone(n.diffPct)}>({n.diffPct > 0 ? "+" : ""}{n.diffPct}%)</span>
            </span>
          </li>
        ))}
        <li className="flex justify-between gap-2 py-1 text-slate-500">
          <span>Whole suburb ({s.suburb.sales} sales)</span>
          <span>{money(s.suburb.median)}</span>
        </li>
      </ul>
      <Source source={s.source} asOf={s.asOf} />
    </Fold>
  );
}

export function BlockCard({ gnaf }: { gnaf: string }) {
  const lazy = useLazy(() => fetchSection(gnaf, "block"));
  return (
    <Fold title="Your block" hint="Census mesh block vs the blocks around it" onOpen={lazy.start}>
      <LazyBody lazy={lazy}>
        {({ block }) => {
          const b = block.value;
          if (!b) return <NoData>No mesh block data for this property.</NoData>;
          const row = (label: string, mine: number | null, area: number | null, unit = "%") => (
            <li className="flex justify-between gap-2 py-1">
              <span className="text-slate-600">{label}</span>
              <span className="whitespace-nowrap text-slate-900">
                {mine === null ? "No data" : `${mine}${unit}`} <span className="text-slate-400">vs {area === null ? "no data" : `${area}${unit}`} nearby</span>
              </span>
            </li>
          );
          return (
            <>
              <p className="text-xs text-slate-600">
                Mesh block <strong>{b.meshBlock}</strong>
                {b.street ? ` (mostly along ${b.street})` : ""}, {b.homes ?? "?"} homes. Compared with the median of {b.area.blocks} blocks within 1 km.
              </p>
              <ul className="mt-1 divide-y divide-slate-100 text-xs">
                {row("Homes rented", b.rentedPct, b.area.rentedPct)}
                {row("Owned by investors", b.investorPct, b.area.investorPct)}
                {row("Average growth per year", b.growthPctPerYear, b.area.growthPctPerYear)}
              </ul>
              <Source source={block.source} asOf={block.asOf} />
            </>
          );
        }}
      </LazyBody>
    </Fold>
  );
}

export function DevelopmentCard({ suburb }: { suburb: string }) {
  const lazy = useLazy(() => fetchDevelopments(suburb));
  return (
    <Fold title="Development nearby" hint="Recent development applications in the suburb" onOpen={lazy.start}>
      <LazyBody lazy={lazy}>
        {(d) =>
          d.recent?.length ? (
            <>
              <p className="text-xs text-slate-600">
                {d.total} applications on record, {d.lastTwelveMonths} in the last 12 months. {d.note}
              </p>
              <ul className="mt-1 space-y-1.5 text-xs">
                {d.recent.map((r, i) => (
                  <li key={i}>
                    <span className="text-slate-400">
                      {r.date} · {r.category}
                    </span>
                    <p className="text-slate-700">{r.description}</p>
                  </li>
                ))}
              </ul>
              <Source source={d.source ?? "development/da-list"} asOf={d.recent[0]?.date ?? null} />
            </>
          ) : (
            <NoData>No development applications on record.</NoData>
          )
        }
      </LazyBody>
    </Fold>
  );
}
