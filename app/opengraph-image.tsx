import { ImageResponse } from "next/og";

export const alt =
  "Paidly — Invoices, contracts & earnings for African freelancers";
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
          backgroundColor: "#0a0a0b",
          padding: 72,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 9999,
              backgroundColor: "#2563eb",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 9999,
                backgroundColor: "#ffffff",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -1,
            }}
          >
            Paidly
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: -3,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Take control of</span>
            <span>
              your{" "}
              <span style={{ color: "#3b82f6" }}>freelance money</span>
            </span>
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#a1a1aa",
              display: "flex",
            }}
          >
            Invoices · E-sign contracts · Earnings · Tax export
          </div>
        </div>

        {/* Footer chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {["Nigeria", "Ghana", "Kenya", "South Africa", "Free to start"].map(
            (chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  padding: "10px 24px",
                  borderRadius: 9999,
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#ffffff",
                  backgroundColor: "#2563eb",
                }}
              >
                {chip}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    size,
  );
}
