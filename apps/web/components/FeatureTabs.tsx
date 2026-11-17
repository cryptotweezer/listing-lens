"use client";
// Interactive feature list: picking an item on the left shows that part of the real panel on the right.
// The panel is the extension's own components (built from apps/extension/demo into /panel) with an invented example listing.
import { useEffect, useState } from "react";

const items = [
  {
    id: "price",
    title: "Is the price right?",
    body: "The asking price from the ad, next to what similar homes nearby actually sold for. See the sales it is compared with, the price per square metre, what it last sold for and how the agency usually quotes.",
  },
  {
    id: "leverage",
    title: "Who has the upper hand?",
    body: "How long it has been for sale, counting earlier listings, against how fast homes usually sell in the suburb. Plus how much choice buyers have and whether the guide has been cut. Know if you can push before you make an offer.",
  },
  {
    id: "money",
    title: "Do the numbers work?",
    body: "To live in or to invest. Cash needed upfront with stamp duty, weekly repayments, the rent it could earn, cash flow and the suburb's price trend. Type your own budget, deposit and rate, and it stays in your browser.",
  },
  {
    id: "chat",
    title: "Just ask",
    body: "Ask in plain English: is it fair, how much room is there to negotiate, what is the catch. Every answer is built on Microburbs data and shows where each number came from. Three free questions a day.",
  },
  {
    id: "local",
    title: "What is around it",
    body: "Planning applications in the suburb, public housing, flood and heritage overlays, and the nearest train, light rail, ferry or bus stop. The things you find out after you buy, shown before.",
  },
  {
    id: "alternatives",
    title: "Better value nearby",
    body: "Similar homes close by listed for less, with the saving, size, price per square metre and distance. Find out if this is the one, or just the first one you saw.",
  },
  {
    id: "report",
    title: "Dig deeper",
    body: "The full report, one tap away: comparable sales, street prices, the suburb's market, your census block, development, schools, past sales and rents, transport and risks.",
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});

  // Each panel frame reports its height, so it shows in full without an inner scrollbar.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin) return;
      const d = e.data as { type?: string; section?: string; height?: number };
      if (d?.type === "panel-height" && d.section && typeof d.height === "number" && d.height > 80) setHeights((h) => (h[d.section!] === d.height ? h : { ...h, [d.section!]: d.height! }));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <div className="tabs-card">
      <div className="tabs-list">
        <div className="tabs-intro">
          <h3>See it on a listing</h3>
          <p>A 2-bed flat in Pyrmont, asking $1.25M to $1.3M. Pick a section to see what Listing Lens puts beside the ad. Try it: the panel works.</p>
        </div>
        <div className="tabs-buttons" role="tablist">
          {items.map((it, i) => (
            <button key={it.id} role="tab" aria-selected={i === active} className={`tab${i === active ? " tab-active" : ""}`} onClick={() => setActive(i)}>
              <span className="tab-head">
                <span className="tab-title">{it.title}</span>
              </span>
              <span className="tab-body">{it.body}</span>
            </button>
          ))}
        </div>
        {/* Phones and tablets: the buttons turn into chips, so the open section's text is shown here, just above the panel. */}
        <p className="tabs-mobile-body">{items[active]!.body}</p>
      </div>
      <div className="tabs-visual" role="tabpanel">
        <div className="panel-frame">
          {/* All sections load once; switching only changes which one is visible, so it is instant. */}
          {items.map((it, i) => (
            <iframe
              key={it.id}
              title={`Listing Lens panel: ${it.title}`}
              src={`/panel/index.html?s=${it.id}`}
              className={i === active ? "" : "panel-hidden"}
              style={{ height: heights[it.id] ?? 640 }}
            />
          ))}
        </div>
        <p className="panel-note">Example listing. The address, figures and agency are illustrative.</p>
      </div>
    </div>
  );
}
