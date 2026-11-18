// Public landing page: what Listing Lens does for buyers, how to install it, who powers the data and who built it.
import { FeatureTabs } from "@/components/FeatureTabs";
import { PromoVideo } from "@/components/PromoVideo";

import { DOWNLOAD_URL } from "@/lib/site";
const REPO_URL = "https://github.com/cryptotweezer/listing-lens";
const MICROBURBS_URL = "https://www.microburbs.com.au/";
const CV_URL = "https://cv.andreshenao.com.au";
const LINKEDIN_URL = "https://www.linkedin.com/in/andreshenao/";

// Real for-sale listings checked on 16 Nov 2026 with Microburbs data (asking price vs estimated value). Addresses withheld.
const examples = [
  { title: "2-bed flat, Forest Lodge", specs: "2 bed · 2 bath · 1 car · 99 m²", asking: "$1,490,000", value: "$1,275,600", gap: "+16.8%", over: true },
  { title: "2-bed flat, Sydney CBD", specs: "2 bed · 2 bath · 98 m²", asking: "$1,825,000", value: "$2,046,750", gap: "−10.8%", over: false },
  { title: "1-bed flat, Sydney CBD", specs: "1 bed · 1 bath · 64 m²", asking: "$740,000", value: "$801,500", gap: "−7.7%", over: false },
];

// What the example listing in the feature panel shows each kind of user (same invented figures).
const buyer = [
  { q: "Is the price fair?", a: "In line with 3 similar sales nearby, median $1,265,000" },
  { q: "Can I negotiate?", a: "5 months on the market, guide already cut by $50k to $100k" },
  { q: "What is the catch?", a: "Strata around $9,800 a year, heritage item 140 m away" },
  { q: "Is there better nearby?", a: "A similar flat 420 m away for $95,000 less" },
];
const investor = [
  { q: "Cash needed upfront", a: "$307k, including $51,562 stamp duty" },
  { q: "Rent it could earn", a: "$1,080 a week, a 4.4% gross yield" },
  { q: "Weekly cash flow", a: "$520 a week out of pocket after repayments and strata" },
  { q: "Suburb price trend", a: "Pyrmont units up 18% over 10 years" },
];
const trust = [
  { title: "The exact flat", body: "Matched to the unit, not a suburb average. If unsure, it asks." },
  { title: "Source and date on every number", body: "Check any figure yourself" },
  { title: "No account, no tracking", body: "It reads only the address and price of the listing you open" },
];

// The 29 suburbs of the City of Sydney council area: the area the Microburbs hackathon data covers.
const suburbs = [
  "Alexandria", "Barangaroo", "Beaconsfield", "Camperdown", "Centennial Park", "Chippendale", "Darlinghurst", "Darlington",
  "Dawes Point", "Elizabeth Bay", "Erskineville", "Eveleigh", "Forest Lodge", "Glebe", "Haymarket", "Millers Point",
  "Moore Park", "Potts Point", "Pyrmont", "Redfern", "Rosebery", "Rushcutters Bay", "Surry Hills", "Sydney CBD",
  "The Rocks", "Ultimo", "Waterloo", "Woolloomooloo", "Zetland",
];

// What the panel shows on a rental listing.
const renting = [
  { title: "A fair rent for that flat", body: "Our rent model estimates the weekly rent with and without a car space, so you also see what the parking is worth." },
  { title: "Room to negotiate", body: "How long it has been listed and how many homes sit empty in the suburb, to know if you can ask for less." },
  { title: "What it last leased for", body: "The previous rent on the same flat, when Microburbs has it." },
  { title: "Cheaper rentals nearby", body: "Similar flats close by asking less each week, with the saving and the distance." },
  { title: "Your weekly budget", body: "Type what you can pay and see if it fits, plus what a year of rent adds up to." },
  { title: "Ask about the area", body: "Transport, risks, development and suburbs to compare, answered with cited data." },
];

const install = [
  { title: "Download", body: "Grab the zip file and unzip it into a folder you plan to keep." },
  { title: "Open Chrome extensions", body: "Go to chrome://extensions and switch on Developer mode in the top right corner." },
  { title: "Add Listing Lens", body: "Click Load unpacked, pick the unzipped folder, then pin Listing Lens to your toolbar. Done." },
];

// Each button takes the pastel palette of the section it sits in.
type Tone = "sky" | "mint" | "peach" | "lilac";

function DownloadButton({ tone = "sky" }: { tone?: Tone }) {
  return (
    <a className={`btn btn-${tone}`} href={DOWNLOAD_URL}>
      Download for Chrome
      <span aria-hidden className="btn-arrow">
        ↓
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero" id="top">
        <nav className="pill-nav">
          <a href="#features">Features</a>
          <a href="#coverage">Coverage</a>
          <a href={CV_URL} className="pill-logo" aria-label="Andres Henao" target="_blank" rel="noopener noreferrer">
            <img src="/logo-white.png" alt="" width={26} height={26} />
          </a>
          <a href="#microburbs">Microburbs</a>
          <a href="#about">About</a>
        </nav>

        <div className="hero-copy">
          <h1>
            Know what that flat is <em>really worth</em>
          </h1>
          <p>
            Before you make an offer, get the numbers the agent won&apos;t lead with. Listing Lens puts the asking price next to what
            similar homes nearby actually sold for, shows how much room there is to negotiate, works out if it pays as an
            investment and finds better value nearby. Right beside the listing, free for Chrome, for flats in the City of Sydney.
          </p>
          <DownloadButton />
        </div>
      </section>

      <main>
        <PromoVideo />

        <section className="section wrap" id="features">
          <div className="split-head">
            <div>
              <h2 className="two-lines">
                <span>Everything the</span>
                <span>
                  ad <em>leaves out</em>
                </span>
              </h2>
            </div>
            <p className="lead">
              Listings are written to sell. Listing Lens is on your side. It sits beside realestate.com.au and domain.com.au and
              shows independent Microburbs data for the exact flat on your screen, so you walk into the inspection knowing what to
              ask and what to offer.
            </p>
          </div>
          <FeatureTabs />
        </section>

        <section className="section wrap" id="renting">
          <div className="rent-card">
            <div className="rent-head">
              <h2 className="two-lines">
                <span>Renting?</span>
                <span>
                  <em>It works there too</em>
                </span>
              </h2>
              <p className="lead">
                Open a rental on realestate.com.au or domain.com.au and the same panel switches to renter mode. It tells you if the
                weekly rent is fair, how much room there is to ask for less and what else is available nearby.
              </p>
            </div>
            <ul className="rent-list">
              {renting.map((r) => (
                <li key={r.title}>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section wrap center" id="examples">
          <h2>
            Same market, <em>very different deals</em>
          </h2>
          <p className="lead narrow">
            Three real flats for sale in the City of Sydney, each checked with Microburbs data. One asks well above its estimated
            value. Two ask less. Could you tell which from the photos?
          </p>
          <div className="examples">
            {examples.map((e) => (
              <article key={e.title} className="example">
                <div className={`example-visual ${e.over ? "is-over" : "is-under"}`}>
                  <span className={`tag ${e.over ? "tag-pink" : "tag-green"}`}>{e.over ? "Above value" : "Below value"}</span>
                  <div className="example-gap">{e.gap}</div>
                  <div className="example-gap-label">asking price vs estimated value</div>
                </div>
                <div className="example-body">
                  <h3>{e.title}</h3>
                  <p className="muted">{e.specs}</p>
                  <div className="example-prices">
                    <div>
                      <span>Asking</span>
                      <strong>{e.asking}</strong>
                    </div>
                    <div>
                      <span>Estimated</span>
                      <strong>{e.value}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="fine">Real listings, checked on 16 November 2026. Addresses withheld. Estimates are a guide, not financial advice.</p>
        </section>

        <section className="section wrap center" id="how">
          <h2>
            Made for buyers <em>and investors</em>
          </h2>
          <p className="lead narrow">
            Whether you will live in it or rent it out, the answers you need are on screen the moment the listing opens. From the
            Pyrmont example listing:
          </p>

          <div className="bento">
            <article className="bento-card bento-light audience">
              <h3>Pay the right price</h3>
              <ul className="audience-list">
                {buyer.map((r) => (
                  <li key={r.q}>
                    <span>{r.q}</span>
                    <strong>{r.a}</strong>
                  </li>
                ))}
              </ul>
            </article>

            <article className="bento-card bento-privacy audience">
              <h3>See if the numbers work</h3>
              <ul className="audience-list">
                {investor.map((r) => (
                  <li key={r.q}>
                    <span>{r.q}</span>
                    <strong>{r.a}</strong>
                  </li>
                ))}
              </ul>
            </article>

            <article className="bento-card bento-wide trust">
              <div className="wide-copy">
                <h3>Numbers you can check</h3>
                <p>Listing Lens is on your side, not the seller&apos;s. Every figure is for that exact flat and tells you where it came from.</p>
                <DownloadButton tone="peach" />
              </div>
              <ul className="trust-list">
                {trust.map((r) => (
                  <li key={r.title}>
                    <span className="check" aria-hidden>
                      ✓
                    </span>
                    <div>
                      <strong>{r.title}</strong>
                      <span>{r.body}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <p className="fine">Example listing. The address and figures are illustrative. A guide, not financial advice.</p>
        </section>

        <section className="section wrap" id="coverage">
          <div className="coverage-card">
            <div className="install-head">
              <h2>
                29 suburbs, <em>one council area</em>
              </h2>
              <p className="lead">
                Listing Lens covers every flat in the City of Sydney council area, from the CBD to Zetland. Open a listing anywhere
                else and the panel tells you it is outside coverage, instead of guessing.
              </p>
            </div>
            <ul className="suburb-list">
              {suburbs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="coverage-cta">
              <div>
                <h3>Looking beyond the City of Sydney?</h3>
                <p>
                  Microburbs has data for every suburb in Australia. If you want this kind of insight for your area, or for your
                  agency, team or app, talk to Microburbs.
                </p>
              </div>
              <a className="btn btn-mint" href={MICROBURBS_URL} target="_blank" rel="noopener noreferrer">
                Contact Microburbs
              </a>
            </div>
          </div>
        </section>

        <section className="section wrap" id="microburbs">
          <div className="partner-card">
            <div className="install-head">
              <h2>
                Powered by <em>Microburbs</em>
              </h2>
              <p className="lead">
                Every sale, valuation, market figure and risk in Listing Lens comes from Microburbs, the Sydney property data
                company founded in 2014. It gathers its own data and helps buyers, investors and buyers&apos; agents see past the suburb average, down to
                the street and the single property. Only the asking price comes from the listing itself, and fair rent from our own model.
              </p>
              <a className="btn btn-mint" href={MICROBURBS_URL} target="_blank" rel="noopener noreferrer">
                Visit microburbs.com.au
              </a>
            </div>
            <ul className="partner-facts">
              <li>
                <strong>90M+</strong>
                <h3>Property records</h3>
                <p>Collected first-hand rather than bought in, across every Australian suburb.</p>
              </li>
              <li>
                <strong>Street level</strong>
                <h3>Forecast, valuation and risk</h3>
                <p>Growth forecasts street by street, plus a valuation and risk check for any address.</p>
              </li>
              <li className="partner-quote">
                <p>&ldquo;Find the bargains everyone else missed.&rdquo;</p>
                <span>Microburbs</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="section wrap" id="install">
          <div className="install-card">
            <div className="install-head">
              <h2>
                Up and running in <em>about a minute</em>
              </h2>
              <p className="lead">
                Listing Lens is not on the Chrome Web Store yet, so you add it to Chrome yourself. Three quick steps, on Chrome for
                desktop.
              </p>
              <DownloadButton />
            </div>
            <ol className="install-steps">
              {install.map((s, i) => (
                <li key={s.title}>
                  <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section wrap" id="about">
          <div className="about-card">
            <img src="/logo-black.png" alt="" width={72} height={72} className="about-logo" />
            <div>
              <h2>
                Built by <em>Andres Henao</em>
              </h2>
              <p>
                I am a cyber security specialist in Sydney. I secure cloud environments, networks and production applications, and
                I build AI systems with security designed in from the first line. Listing Lens started at the Microburbs hackathon
                in Sydney in November 2026, built on their property data API. I designed and built all of it: the extension, the
                data backend, the price comparison, the rent model and the assistant. That security habit is in every part: the smallest
                set of browser permissions, no secret inside the extension, and a backend that caps its own spending.
              </p>
              <div className="about-links">
                <a className="btn btn-lilac" href={CV_URL} target="_blank" rel="noopener noreferrer">
                  More about me
                </a>
                <a className="btn btn-sky" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer wrap">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <img src="/logo-black.png" alt="" width={28} height={28} />
              Listing Lens
            </div>
            <p className="muted">The real numbers, right beside the listing.</p>
            <div className="footer-social">
              <a href={CV_URL} target="_blank" rel="noopener noreferrer" aria-label="CV">
                CV
              </a>
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                in
              </a>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#examples">Examples</a>
            <a href="#coverage">Coverage</a>
            <a href="#install">Install</a>
            <a href={DOWNLOAD_URL}>Download</a>
          </div>
          <div>
            <h4>Data</h4>
            <a href={MICROBURBS_URL} target="_blank" rel="noopener noreferrer">
              Microburbs
            </a>
            <span>G-NAF address file</span>
            <span>Australian Bureau of Statistics</span>
          </div>
          <div>
            <h4>Author</h4>
            <a href={CV_URL} target="_blank" rel="noopener noreferrer">
              CV
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Independent project, not affiliated with realestate.com.au, Domain or Microburbs. City of Sydney flats only.</span>
          <span>Estimates are a guide, not financial advice. Photo by Webaliser on Unsplash.</span>
        </div>
      </footer>
    </>
  );
}
