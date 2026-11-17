// Root layout: the public landing page lives at "/", the extension's API under /api.
import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { DOWNLOAD_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans", weight: ["300", "400", "500", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Andres Henao", url: "https://cv.andreshenao.com.au" }],
  creator: "Andres Henao",
  keywords: [
    "Sydney property",
    "apartment price check",
    "is the asking price fair",
    "property negotiation",
    "comparable sales Sydney",
    "fair rent Sydney",
    "stamp duty NSW calculator",
    "property investment cash flow",
    "realestate.com.au extension",
    "Domain extension",
    "Chrome extension real estate",
    "City of Sydney flats",
    "Pyrmont",
    "Surry Hills",
    "Zetland",
    "Microburbs",
  ],
  category: "real estate",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_AU",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false, address: false },
};

export const viewport: Viewport = { themeColor: "#f4f7fb", width: "device-width", initialScale: 1 };

// Structured data so search engines understand this is a free browser extension and who made it.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "en-AU",
      publisher: { "@id": `${SITE_URL}/#author` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      applicationCategory: "BrowserApplication",
      applicationSubCategory: "Real estate",
      operatingSystem: "Google Chrome",
      downloadUrl: DOWNLOAD_URL,
      softwareVersion: "1.2.1",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
      areaServed: { "@type": "City", name: "Sydney", containedInPlace: { "@type": "State", name: "New South Wales" } },
      author: { "@id": `${SITE_URL}/#author` },
      image: `${SITE_URL}/opengraph-image`,
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: "Andres Henao",
      url: "https://cv.andreshenao.com.au",
      sameAs: ["https://github.com/cryptotweezer", "https://www.linkedin.com/in/andreshenao/"],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={roboto.variable}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
