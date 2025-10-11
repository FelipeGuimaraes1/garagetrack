import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)",
        }}
      >
        <div
          style={{
            width: 1040,
            height: 430,
            borderRadius: 24,
            background: "rgba(12,18,32,0.75)",
            display: "flex",
            padding: 48,
            color: "white",
            boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "white",
              // grid -> flex (compatível com next/og)
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 36,
            }}
          >
            <span style={{ color: "#0ea5e9", fontSize: 72, fontWeight: 800 }}>
              GT
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1 }}>
              GarageTrack
            </div>
            <div style={{ fontSize: 28, opacity: 0.9, marginTop: 10 }}>
              Controle de veículos, despesas e lembretes por quilometragem.
            </div>
            <div style={{ fontSize: 22, opacity: 0.8, marginTop: 18 }}>
              garagetrack.vercel.app
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
