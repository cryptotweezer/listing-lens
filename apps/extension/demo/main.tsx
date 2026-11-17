// Landing page demo: renders the real side panel components with an invented example listing.
// The backend and the extension APIs are replaced in the browser, so nothing here calls Microburbs or the AI.
// ?s= picks the section: price, leverage, money, chat, local, alternatives, report.
import { type ReactNode, StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ADDRESS, ANSWERS, ALTERNATIVES, DEVELOPMENTS, FALLBACK, GNAF, PROPERTY, PULSE, SECTIONS } from "./fixture";
import "./style.css";

// ?avm=1 (promo video only): the same example listing, valued by a Microburbs estimate instead of nearby sales.
if (new URLSearchParams(location.search).get("avm") === "1") {
  const today = new Date().toISOString().slice(0, 10);
  const f = PROPERTY.facts as unknown as Record<string, unknown>;
  f.avm = {
    available: true,
    value: { predicted_price: 1_350_000, predicted_price_low: 1_290_000, predicted_price_high: 1_420_000, prediction_date: today, confidence_score: 78 },
    source: "Microburbs AVM",
    asOf: today,
  };
  Object.assign(PROPERTY.verdict!, {
    low: 1_290_000,
    high: 1_420_000,
    sources: [`Microburbs AVM (${today})`],
    basis: null,
    label: "below",
    estimate: 1_350_000,
    method: "avm",
    diffPct: -5.6,
    confidence: "high",
    note: "Asking is 5.6% below the Microburbs estimate.",
  });
  ANSWERS[0]!.answer =
    "Good value on paper. The middle of the asking range, **$1,275,000**, is **5.6% below** the **$1,350,000** Microburbs estimate [Microburbs AVM].\n- The estimate range is $1.29M to $1.42M.\n- 3 similar 2-bed sales within 320 m have a median of $1,265,000 [recent-sales-nearby].\n- At $13,859/m² it asks 5% less per square metre than similar listed units [listings].";
}

/* ---------- stand-ins for the extension APIs and the backend ---------- */

const memory = new Map<string, unknown>();
const area = {
  get: async (k: string) => (memory.has(k) ? { [k]: memory.get(k) } : {}),
  set: async (o: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(o)) memory.set(k, v);
  },
};
(globalThis as unknown as { browser: unknown }).browser = {
  storage: { local: area, session: area },
  runtime: { sendMessage: async () => Promise.reject(new Error("demo")) },
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const reply = (body: unknown) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  await wait(250);
  switch (url.pathname) {
    case "/api/section":
      return reply(SECTIONS[url.searchParams.get("name") ?? ""] ?? {});
    case "/api/developments":
      return reply(DEVELOPMENTS);
    case "/api/suburb":
      return reply(PULSE);
    case "/api/chat": {
      const { messages } = JSON.parse(String(init?.body ?? "{}")) as { messages: { role: string; content: string }[] };
      const q = messages.at(-1)?.content ?? "";
      const hit = ANSWERS.find((a) => a.match.test(q));
      await wait(900);
      return reply({ answer: hit?.answer ?? FALLBACK, alternatives: hit?.alternatives ? { items: ALTERNATIVES, seeAllUrl: "" } : null });
    }
    default:
      return reply(PROPERTY);
  }
};

/* ---------- the panel ---------- */

// Imported after the stand-ins are in place.
const { Chat } = await import("@/entrypoints/sidepanel/Chat");
const { Hero, Leverage, OverviewFooter, PropertyHead, useSaleHistory } = await import("@/entrypoints/sidepanel/overview");
const { MoneyCard } = await import("@/entrypoints/sidepanel/money-card");
const S = await import("@/entrypoints/sidepanel/sections");

/** Same header as the extension, with the example address in the box. */
function Header() {
  return (
    <header className="bg-gradient-to-r from-brand-900 via-brand-800 to-violet-brand px-3 py-2 text-white shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="./logo-white.png" alt="" className="h-7 w-7" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">Listing Lens</h1>
            <p className="text-[10px] leading-tight text-brand-100/80">Data by Microburbs · City of Sydney</p>
            <p className="text-[10px] leading-tight text-brand-100/80">Built by Andres Henao for the Microburbs Hackathon</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
            Address matched
          </span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-semibold">For sale</span>
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        <input readOnly value={ADDRESS} className="min-w-0 flex-1 rounded-md border border-white/20 bg-white px-2 py-1 text-sm text-slate-900 outline-none" />
        <span className="rounded-md bg-white/20 px-3 py-1 text-sm font-medium text-white">Check</span>
      </div>
    </header>
  );
}

const Box = ({ children }: { children: ReactNode }) => <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">{children}</section>;

function Price() {
  const sales = useSaleHistory(GNAF, true);
  return (
    <Box>
      <PropertyHead data={PROPERTY} />
      <Hero data={PROPERTY} mode="sale" sales={sales} />
    </Box>
  );
}

function Upper() {
  const sales = useSaleHistory(GNAF, true);
  return (
    <Box>
      <Leverage data={PROPERTY} mode="sale" history={sales.data?.saleHistory.value ?? null} />
    </Box>
  );
}

function Report() {
  const f = PROPERTY.facts!;
  return (
    <>
      <p className="px-1 pt-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Full property report</p>
      <div className="space-y-2">
        <S.AgencyCard f={f} />
        <S.ComparablesCard f={f} />
        <S.StreetCard data={PROPERTY} />
        <S.SuburbPulseCard suburb="Pyrmont" mode="sale" />
        <S.BlockCard gnaf={GNAF} />
        <S.DevelopmentCard suburb="Pyrmont" />
        <S.SchoolsCard gnaf={GNAF} />
        <S.HistoryCard gnaf={GNAF} />
        <S.TransportCard gnaf={GNAF} />
        <S.RisksCard gnaf={GNAF} />
      </div>
    </>
  );
}

const SECTION: Record<string, () => ReactNode> = {
  price: () => <Price />,
  leverage: () => <Upper />,
  money: () => (
    <Box>
      <MoneyCard data={PROPERTY} mode="sale" />
    </Box>
  ),
  chat: () => <Chat data={PROPERTY} mode="sale" />,
  local: () => <OverviewFooter data={PROPERTY} onShowDetails={() => {}} />,
  alternatives: () => <S.AlternativesCard alt={PROPERTY.alternatives} mode="sale" onOpen={() => {}} />,
  report: () => <Report />,
};

/** Tells the landing page how tall the panel is, so the frame fits it without a scrollbar. */
function useReportHeight() {
  useEffect(() => {
    const send = () => parent.postMessage({ type: "panel-height", section, height: Math.ceil(document.getElementById("root")!.getBoundingClientRect().height) }, "*");
    const ro = new ResizeObserver(send);
    ro.observe(document.getElementById("root")!);
    // Also repeat for a few seconds: the landing page may start listening after this frame has loaded.
    const timer = setInterval(send, 400);
    const stop = setTimeout(() => clearInterval(timer), 6000);
    send();
    return () => {
      ro.disconnect();
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, []);
}

const section = new URLSearchParams(location.search).get("s") ?? "price";

function Demo() {
  useReportHeight();
  return (
    <div className="bg-slate-50 text-slate-900">
      <Header />
      <main className="space-y-3 p-3">{(SECTION[section] ?? SECTION.price!)()}</main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
