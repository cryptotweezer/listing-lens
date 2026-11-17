// Social preview card (1200x630) for links shared on LinkedIn, X, Slack and messaging apps.
import { ImageResponse } from "next/og";

export const alt = "Listing Lens: independent data beside Sydney property listings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #b9d5fb 0%, #d6d0ff 50%, #f9c9e6 100%)",
          color: "#0b1530",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>Listing Lens</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>Know what that flat is really worth</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#2a3657", maxWidth: 980 }}>
            Fair price, room to negotiate and better value nearby, right beside listings on realestate.com.au and Domain.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#2a3657" }}>
          <span>Free Chrome extension · City of Sydney</span>
          <span>Data by Microburbs</span>
        </div>
      </div>
    ),
    size,
  );
}
