// Root layout: the public landing page lives at "/", the extension's API under /api.
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans", weight: ["300", "400", "500", "700"] });

export const metadata: Metadata = {
  title: "Listing Lens · Independent data beside Sydney property listings",
  description:
    "A free Chrome extension that shows independent Microburbs data for the exact flat you are looking at on realestate.com.au and domain.com.au: whether the price is fair, how much room there is to negotiate, whether it pays as an investment and better value nearby.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
