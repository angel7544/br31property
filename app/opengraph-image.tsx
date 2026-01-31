import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoUrl = "https://www.hotelsakura.in/logo.png";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "60px 100px",
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          }}
        >
          <img src={logoUrl} width={200} height={200} />

          <h1 style={{ fontSize: 64, color: "#db2777", marginTop: 24 }}>
            Hotel Sakura
          </h1>

          <p style={{ fontSize: 28, color: "#374151", marginTop: 12 }}>
            Best Hotels & Hospitality in Gangtok, Sikkim, India
          </p>
        </div>
      </div>
    ),
    size
  );
}
