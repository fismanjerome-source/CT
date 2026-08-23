import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function logoTicks(cx, cy, scale) {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const rExt = 71 * scale;
    const rInt = 62 * scale;
    const x1 = cx + rInt * Math.sin(angle);
    const y1 = cy - rInt * Math.cos(angle);
    const x2 = cx + rExt * Math.sin(angle);
    const y2 = cy - rExt * Math.cos(angle);
    lines.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C8952A" strokeWidth={3 * scale} strokeLinecap="round" opacity={0.9} />
    );
  }
  return lines;
}

export default async function OpengraphImage() {
  const s = 1.35;
  const cx = 100;
  const cy = 100;
  const off = cx - 80 * s;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          padding: "0 90px",
          background: "linear-gradient(135deg, #1B3A5C 0%, #2E5077 100%)",
        }}
      >
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx={cx} cy={cy} r={76 * s} fill="#1B3A5C" />
          <circle cx={cx} cy={cy} r={76 * s} fill="none" stroke="#C8952A" strokeWidth={3 * s} />
          {logoTicks(cx, cy, s)}
          <circle cx={cx} cy={cy} r={48 * s} fill="#1B3A5C" stroke="#C8952A" strokeWidth={1.5 * s} />
          <path
            d={`M ${116 * s + off},${52 * s + off} A ${48 * s},${48 * s} 0 1 0 ${116 * s + off},${108 * s + off}`}
            fill="none"
            stroke="#C8952A"
            strokeWidth={7 * s}
            strokeLinecap="round"
          />
          <line x1={44 * s + off} y1={80 * s + off} x2={112 * s + off} y2={80 * s + off} stroke="#F4F1E8" strokeWidth={7 * s} strokeLinecap="round" />
          <line x1={80 * s + off} y1={80 * s + off} x2={80 * s + off} y2={116 * s + off} stroke="#C8952A" strokeWidth={7 * s} strokeLinecap="round" />
          <circle cx={80 * s + off} cy={80 * s + off} r={4 * s} fill="#F4F1E8" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: "white", fontSize: 66, fontWeight: 700, letterSpacing: -1 }}>
            Créneau CT
          </div>
          <div style={{ display: "flex", color: "#C8952A", fontSize: 30, marginTop: 18, fontWeight: 600 }}>
            Réservez votre contrôle technique en ligne
          </div>
          <div style={{ display: "flex", color: "rgba(255,255,255,0.75)", fontSize: 26, marginTop: 6 }}>
            Comparez les centres, réservez en 2 minutes
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
