// "Do the numbers work?": what this home costs to buy and hold, in dollars, for an investor or an owner-occupier.
// Inputs come from the panel (price, rent, suburb strata and trend) plus three numbers the user can change.
// The user's settings stay in this browser (extension storage); nothing is sent to the server.
import type React from "react";
import { useEffect, useState } from "react";
import type { Mode, PropertyResponse } from "@/lib/api";
import { DUTY_SOURCE, moneyFigures, parseAmount, perYear } from "@/lib/money";
import { money, short } from "./ui";

type Goal = "invest" | "live";
interface Settings {
  goal: Goal;
  budget: number | null;
  depositPct: number;
  ratePct: number;
}
const KEY = "money:v1";
const DEFAULTS: Settings = { goal: "invest", budget: null, depositPct: 20, ratePct: 6 };
const week = (n: number) => `${n < 0 ? "-" : ""}${money(Math.abs(n))}/wk`;
const pct = (n: number, digits = 1) => `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;

function Row({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-700" : "text-slate-900";
  return (
    <li className="py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-slate-600">{label}</span>
        <span className={`text-right font-bold ${color}`}>{value}</span>
      </div>
      {sub ? <p className="text-[10.5px] leading-snug text-slate-500">{sub}</p> : null}
    </li>
  );
}

function Field({ label, value, onChange, placeholder, suffix }: { label: string; value: string; onChange: (s: string) => void; placeholder?: string; suffix?: string }) {
  return (
    <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-600">
      {label}
      <span className="flex items-center rounded-md border border-slate-300 bg-white px-1.5 focus-within:border-brand-500">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent py-0.5 text-xs text-slate-900 outline-none"
        />
        {suffix ? <span className="text-slate-400">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function MoneyCard({ data, mode }: { data: PropertyResponse; mode: Mode }) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [raw, setRaw] = useState({ budget: "", deposit: "20", rate: "6", strata: "" });

  useEffect(() => {
    browser.storage.local
      .get(KEY)
      .then((r) => {
        const saved = r[KEY] as Settings | undefined;
        if (!saved) return;
        setS({ ...DEFAULTS, ...saved });
        setRaw((x) => ({ ...x, budget: saved.budget ? short(saved.budget).replace("$", "") : "", deposit: String(saved.depositPct ?? 20), rate: String(saved.ratePct ?? 6) }));
      })
      .catch(() => {});
  }, []);
  const save = (next: Settings) => {
    setS(next);
    void browser.storage.local.set({ [KEY]: next }).catch(() => {});
  };

  const v = data.verdict;
  const l = data.facts?.listing.value;
  const costs = data.insights?.costs;
  const suburb = (data.match.suburb ?? "the suburb").replace(/\s*\(.*\)$/, "");

  if (mode === "rent") return <RentBudget data={data} />;

  const price = v?.asking ?? v?.estimate ?? null;
  if (!price) return null;
  const strataDefault = costs?.strata?.annual ?? 0;
  const strata = raw.strata.trim() ? (parseAmount(raw.strata) ?? 0) : strataDefault;
  const r = data.rent?.available ? data.rent.value : null;
  const modelRent = r ? ((l?.parking ?? 0) > 0 ? r.rentWithCarSpace : r.rentWithoutCarSpace) : null;
  const rentWeekly = modelRent ?? data.insights?.yield?.marketRent ?? null;
  const rentFrom = modelRent ? "our rent model for this home" : data.insights?.yield ? `median of ${data.insights.yield.rentSample} similar listings` : null;
  const m = moneyFigures({ price, depositPct: s.depositPct, ratePct: s.ratePct, strataAnnual: strata, rentWeekly });
  const t = costs?.trend;
  const invest = s.goal === "invest";
  const over = s.budget ? price - s.budget : null;

  return (
    <div className="rounded-xl border border-brand-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-brand-800">Do the numbers work?</p>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px]">
          {(["invest", "live"] as const).map((g) => (
            <button
              key={g}
              onClick={() => save({ ...s, goal: g })}
              className={`rounded-md px-2 py-0.5 font-medium ${s.goal === g ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {g === "invest" ? "To invest" : "To live in"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-50 p-2 min-[340px]:grid-cols-4">
        <Field
          label="Budget"
          value={raw.budget}
          placeholder="e.g. 1.5m"
          onChange={(x) => {
            setRaw({ ...raw, budget: x });
            save({ ...s, budget: parseAmount(x) });
          }}
        />
        <Field
          label="Deposit"
          value={raw.deposit}
          suffix="%"
          onChange={(x) => {
            setRaw({ ...raw, deposit: x });
            const n = Number(x);
            if (n >= 0 && n <= 100) save({ ...s, depositPct: n });
          }}
        />
        <Field
          label="Rate"
          value={raw.rate}
          suffix="%"
          onChange={(x) => {
            setRaw({ ...raw, rate: x });
            const n = Number(x);
            if (n >= 0 && n <= 20) save({ ...s, ratePct: n });
          }}
        />
        <Field label="Strata/yr" value={raw.strata} placeholder={strataDefault ? short(strataDefault).replace("$", "") : "0"} onChange={(x) => setRaw({ ...raw, strata: x })} />
      </div>

      <ul className="mt-1 divide-y divide-slate-100 text-xs">
        <Row label="Cash needed upfront" value={short(m.upfront)} sub={`${short(m.deposit)} deposit + ${money(m.duty)} NSW transfer duty`} />
        <Row label="Repayments" value={week(m.repay)} sub={`${short(m.loan)} loan over 30 years at ${s.ratePct}%`} />
        {invest ? (
          <>
            <Row label="Rent it could earn" value={rentWeekly ? week(rentWeekly) : "No data"} sub={rentFrom ? `From ${rentFrom}` : undefined} />
            {m.grossYieldPct !== null ? (
              <Row
                label="Gross yield"
                value={`${m.grossYieldPct.toFixed(1)}%`}
                sub={data.insights?.yield?.suburbYieldPct ? `${suburb} average ${data.insights.yield.suburbYieldPct}%` : undefined}
              />
            ) : null}
            {m.cashFlow !== null ? (
              <Row
                label="Weekly cash flow"
                value={week(m.cashFlow)}
                tone={m.cashFlow >= 0 ? "good" : "bad"}
                sub={`${m.cashFlow >= 0 ? "Pays for itself" : "Out of your pocket each week"}: rent minus repayments and ${money(m.strata)}/wk strata. Before council rates, insurance, management, vacancy and tax.`}
              />
            ) : null}
          </>
        ) : (
          <>
            <Row label="Cost to own" value={week(m.own)} sub={`Repayments plus ${money(m.strata)}/wk strata, before council rates and insurance`} />
            {rentWeekly ? (
              <Row
                label="Renting it instead"
                value={week(rentWeekly)}
                tone={m.own > rentWeekly ? "bad" : "good"}
                sub={`Owning costs ${money(Math.abs(m.own - rentWeekly))}/wk ${m.own > rentWeekly ? "more" : "less"} than renting this home (${rentFrom})`}
              />
            ) : null}
          </>
        )}
        {t?.tenYearsPct !== null && t?.tenYearsPct !== undefined ? (
          <Row
            label={`${suburb} ${t.kind} prices`}
            value={`${pct(perYear(t.tenYearsPct, 10))}/yr`}
            tone={t.tenYearsPct < 0 ? "bad" : undefined}
            sub={`${pct(t.tenYearsPct)} over 10 years${t.fiveYearsPct !== null ? `, ${pct(t.fiveYearsPct)} over 5` : ""}. Suburb median, not this home`}
          />
        ) : null}
        {over !== null ? (
          <Row
            label="Your budget"
            value={over > 0 ? `${short(over)} over` : "Within budget"}
            tone={over > 0 ? "bad" : "good"}
            sub={over > 0 ? undefined : `${short(-over)} to spare, before the ${short(m.duty)} duty`}
          />
        ) : null}
      </ul>
      <p className="mt-1 text-[10px] leading-snug text-slate-400">
        A guide, not financial advice. Price is the asking price{v?.asking ? "" : " estimate"}. Duty: {DUTY_SOURCE}, no first home buyer concessions or foreign buyer surcharge.
        {costs?.strata && !raw.strata.trim() ? ` Strata: ${suburb} median of ${costs.strata.sample ?? "several"} properties.` : ""} Your settings stay in this browser.
      </p>
    </div>
  );
}

/** Renters: the asking rent against their weekly budget, and what a year costs. */
function RentBudget({ data }: { data: PropertyResponse }) {
  const [raw, setRaw] = useState("");
  const rent = data.verdict?.asking ?? null;
  if (!rent) return null;
  const budget = parseAmount(raw);
  const over = budget ? rent - budget : null;
  return (
    <div className="rounded-xl border border-brand-200 bg-white p-3">
      <p className="text-xs font-semibold text-brand-800">Does it fit your budget?</p>
      <div className="mt-2 w-32">
        <Field label="Weekly budget" value={raw} placeholder="e.g. 900" onChange={setRaw} />
      </div>
      <ul className="mt-1 divide-y divide-slate-100 text-xs">
        <Row label="A year of rent" value={money(rent * 52)} sub={`${money(rent)}/wk asking`} />
        {over !== null ? <Row label="Your budget" value={over > 0 ? `${money(over)}/wk over` : "Within budget"} tone={over > 0 ? "bad" : "good"} /> : null}
      </ul>
    </div>
  );
}
