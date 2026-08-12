import { forwardRef } from "react";
import {
  DJ_PROFILE,
  currency,
  formatDate,
  formatTime,
  grandTotal,
  subtotal,
  type Bill,
} from "@/lib/bills";

/**
 * Exact digital recreation of the printed DJ NATIONAL bill book page.
 * Pure HTML + CSS (inline styles only) so the on-screen preview and the
 * exported A4 PDF are pixel-identical and the text stays selectable.
 */

const PURPLE_DEEP = "#1b0533";
const PURPLE = "#2b0a52";
const PURPLE_MID = "#4c1d95";
const INK = "#111111";
const LINE = "#4b4b4b";
const GOLD = "#f5a524";
const RED = "#e11d1d";
const SANS = "'Arial', 'Helvetica Neue', Helvetica, sans-serif";

function Underline({ value, flex, width }: { value: string; flex?: number; width?: string }) {
  return (
    <span
      style={{
        flex: width ? "none" : (flex ?? 1),
        width,
        minWidth: 0,
        borderBottom: `1px solid ${LINE}`,
        fontSize: 13,
        fontWeight: 700,
        lineHeight: "18px",
        minHeight: 19,
        paddingLeft: 6,
        whiteSpace: "nowrap",
        overflow: "hidden",
        color: INK,
      }}
    >
      {value}
    </span>
  );
}

function Row({
  label,
  value,
  labelWidth = 118,
  flex,
  width,
}: {
  label: string;
  value: string;
  labelWidth?: number;
  flex?: number;
  width?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, flex: width ? "none" : 1 }}>
      <span
        style={{
          width: labelWidth,
          fontSize: 12.5,
          fontWeight: 800,
          letterSpacing: "0.02em",
          color: PURPLE,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: PURPLE }}>:</span>
      <Underline value={value} flex={flex} width={width} />
    </div>
  );
}

function SpeakerStack({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="150"
      height="150"
      viewBox="0 0 150 150"
      aria-hidden
      style={{ display: "block", transform: flip ? "scaleX(-1)" : undefined }}
    >
      <defs>
        <linearGradient id={`beam-${flip ? "r" : "l"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`box-${flip ? "r" : "l"}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b1163" />
          <stop offset="100%" stopColor="#120327" />
        </linearGradient>
      </defs>
      {/* stage beams */}
      <polygon points="30,0 12,150 44,150" fill={`url(#beam-${flip ? "r" : "l"})`} />
      <polygon points="70,0 66,150 102,150" fill={`url(#beam-${flip ? "r" : "l"})`} />
      <polygon points="110,0 112,150 140,150" fill={`url(#beam-${flip ? "r" : "l"})`} />
      {/* speaker cabinets */}
      {[
        { x: 18, y: 26 },
        { x: 84, y: 40 },
      ].map((s, i) => (
        <g key={i}>
          <rect
            x={s.x}
            y={s.y}
            width="48"
            height="104"
            rx="5"
            fill={`url(#box-${flip ? "r" : "l"})`}
            stroke="#a855f7"
            strokeWidth="1.6"
          />
          <circle
            cx={s.x + 24}
            cy={s.y + 30}
            r="17"
            fill="#0d0119"
            stroke="#c084fc"
            strokeWidth="1.6"
          />
          <circle cx={s.x + 24} cy={s.y + 30} r="5" fill="#a855f7" />
          <circle
            cx={s.x + 24}
            cy={s.y + 76}
            r="12"
            fill="#0d0119"
            stroke="#c084fc"
            strokeWidth="1.4"
          />
          <circle cx={s.x + 24} cy={s.y + 76} r="3.5" fill="#a855f7" />
          <rect
            x={s.x + 10}
            y={s.y + 52}
            width="28"
            height="7"
            rx="2"
            fill="none"
            stroke="#7e22ce"
            strokeWidth="1.2"
          />
        </g>
      ))}
    </svg>
  );
}

function Waveform({ bars = 26 }: { bars?: number }) {
  const heights = Array.from({ length: bars }, (_, i) => 4 + Math.abs(Math.sin(i * 1.1)) * 16);
  return (
    <svg width={bars * 4} height="22" viewBox={`0 0 ${bars * 4} 22`} aria-hidden>
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 4}
          y={(22 - h) / 2}
          width="2"
          height={h}
          rx="1"
          fill={i % 3 === 0 ? "#e879f9" : "#a855f7"}
        />
      ))}
    </svg>
  );
}

export const PrintedBill = forwardRef<HTMLDivElement, { bill: Bill }>(function PrintedBill(
  { bill },
  ref,
) {
  const sub = subtotal(bill);
  const total = grandTotal(bill);

  const card: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 10,
    padding: "12px 16px",
    boxSizing: "border-box",
  };

  const th: React.CSSProperties = {
    padding: "7px 8px",
    fontSize: 12.5,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "0.04em",
    borderRight: "1px solid rgba(255,255,255,0.35)",
  };
  const td: React.CSSProperties = {
    borderTop: `1px solid #cbd5e1`,
    borderRight: `1px solid #cbd5e1`,
    padding: "6px 8px",
    fontSize: 13,
    fontWeight: 700,
    height: 34,
    color: INK,
  };

  const totalLabel: React.CSSProperties = {
    border: `1px solid ${PURPLE}`,
    padding: "3px 8px",
    fontSize: 11.5,
    fontWeight: 800,
    color: PURPLE,
    whiteSpace: "nowrap",
  };
  const totalValue: React.CSSProperties = {
    border: `1px solid ${PURPLE}`,
    padding: "3px 8px",
    fontSize: 12.5,
    fontWeight: 800,
    textAlign: "right",
    color: INK,
    width: 150,
  };

  return (
    <div
      ref={ref}
      style={{
        width: 794,
        minHeight: 1123,
        background: "#ffffff",
        fontFamily: SANS,
        padding: 18,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: `linear-gradient(150deg, ${PURPLE_DEEP} 0%, ${PURPLE} 55%, #12022a 100%)`,
          borderRadius: 12,
          padding: 10,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 9,
        }}
      >
        {/* ---------- HEADER ---------- */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 8 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <SpeakerStack />
            <SpeakerStack flip />
          </div>
          <div
            style={{
              position: "absolute",
              top: 4,
              left: 8,
              fontSize: 12.5,
              fontWeight: 800,
              color: GOLD,
            }}
          >
            ॥ શ્રી ગણેશાય નમઃ ॥
          </div>
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 8,
              fontSize: 12.5,
              fontWeight: 800,
              color: GOLD,
            }}
          >
            ॥ જય ભવાની ॥
          </div>

          <div
            style={{
              position: "relative",
              margin: "0 118px",
              background: "#ffffff",
              padding: "10px 14px 12px",
              textAlign: "center",
              clipPath:
                "polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)",
            }}
          >
            <div
              style={{
                fontSize: 21,
                fontWeight: 800,
                letterSpacing: "0.02em",
                color: PURPLE_MID,
                textTransform: "uppercase",
              }}
            >
              {DJ_PROFILE.ownerName}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                marginTop: 2,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="12" fill={INK} />
                <path
                  d="M8 7.5c0-.6.5-1 1-1h1.4c.4 0 .8.3.9.7l.5 1.7c.1.4 0 .8-.4 1l-.8.5c.6 1.4 1.6 2.4 3 3l.5-.8c.2-.3.6-.5 1-.4l1.7.5c.4.1.7.5.7.9V16c0 .6-.4 1-1 1-4.7 0-9.5-4.5-9.5-9.5z"
                  fill="#fff"
                />
              </svg>
              <span style={{ fontSize: 19, fontWeight: 800, color: INK }}>{DJ_PROFILE.mobile}</span>
            </div>

            {/* DJ NATIONAL wordmark */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  fontSize: 58,
                  lineHeight: "62px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#c1121f",
                  fontFamily: "'Arial Black', Arial, sans-serif",
                }}
              >
                DJ
              </span>
              <span
                style={{
                  fontSize: 58,
                  lineHeight: "62px",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  color: INK,
                  fontFamily: "'Arial Black', Arial, sans-serif",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                NATI
                <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden style={{ margin: "0 1px" }}>
                  <circle cx="23" cy="23" r="22" fill="#111" />
                  <circle cx="23" cy="23" r="17" fill="none" stroke="#555" strokeWidth="1.5" />
                  <circle cx="23" cy="23" r="12" fill="none" stroke="#777" strokeWidth="1.5" />
                  <circle cx="23" cy="23" r="7" fill="#e5e5e5" />
                  <circle cx="23" cy="23" r="2.4" fill="#111" />
                </svg>
                NAL
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginTop: 2,
              }}
            >
              <span style={{ width: 34, height: 2, background: PURPLE_MID }} />
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 800,
                  color: INK,
                  textTransform: "uppercase",
                }}
              >
                {DJ_PROFILE.tagline}
              </span>
              <span style={{ width: 34, height: 2, background: PURPLE_MID }} />
            </div>

            <div
              style={{
                marginTop: 6,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <svg width="17" height="21" viewBox="0 0 17 21" aria-hidden style={{ marginTop: 1 }}>
                <path
                  d="M8.5 0C3.8 0 0 3.8 0 8.5 0 14.6 8.5 21 8.5 21S17 14.6 17 8.5C17 3.8 13.2 0 8.5 0z"
                  fill={PURPLE_MID}
                />
                <circle cx="8.5" cy="8" r="3.1" fill="#fff" />
              </svg>
              <div style={{ fontSize: 14, fontWeight: 800, color: INK, lineHeight: "20px" }}>
                {DJ_PROFILE.addressLine1}
                <br />
                {DJ_PROFILE.addressLine2}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- PARTY DETAILS ---------- */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 9 }}>
          <Row label="PARTY NAME" value={bill.partyName} />
          <div style={{ display: "flex", gap: 26 }}>
            <Row label="ADDRESS" value={bill.address} flex={1.5} />
            <Row label="MOBILE NO." value={bill.mobile} labelWidth={96} flex={1} />
          </div>
        </div>

        {/* ---------- EVENT + BILL DETAILS ---------- */}
        <div style={{ display: "flex", gap: 9 }}>
          <div style={{ ...card, flex: 1 }}>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  background: PURPLE_MID,
                  color: "#fff",
                  fontSize: 12.5,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  padding: "4px 14px",
                  borderRadius: 4,
                }}
              >
                EVENT DETAILS
              </span>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
              <Row label="EVENT DATE" value={formatDate(bill.eventDate)} labelWidth={104} />
              <Row label="EVENT TIME" value={formatTime(bill.eventTime)} labelWidth={104} />
            </div>
          </div>
          <div style={{ ...card, flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  background: PURPLE_MID,
                  color: "#fff",
                  fontSize: 12.5,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  padding: "4px 14px",
                  borderRadius: 4,
                }}
              >
                BILL DETAILS
              </span>
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: 1,
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 800, color: PURPLE }}>BILL NO.</span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: PURPLE, marginLeft: 22 }}>
                :
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  marginRight: 26,
                  fontSize: 30,
                  lineHeight: "32px",
                  fontWeight: 800,
                  color: RED,
                }}
              >
                {bill.billNo}
              </span>
            </div>
          </div>
        </div>

        {/* ---------- ITEM TABLE ---------- */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: `linear-gradient(180deg, #3b1163, ${PURPLE})` }}>
                <th style={{ ...th, width: 90, textAlign: "center" }}>SR. NO.</th>
                <th style={{ ...th, textAlign: "center" }}>ITEM NAME</th>
                <th style={{ ...th, width: 220, textAlign: "center", borderRight: "none" }}>
                  QTY.
                </th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ ...td, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ ...td, textTransform: "uppercase" }}>{item.name}</td>
                  <td
                    style={{
                      ...td,
                      textAlign: "center",
                      borderRight: "none",
                      textTransform: "uppercase",
                      wordBreak: "break-word",
                    }}
                  >
                    {item.qty || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


          {/* totals block, right aligned as in the printed book */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 8px 10px" }}>
            <table style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={totalLabel}>SUB TOTAL</td>
                  <td style={totalValue}>₹ {currency(sub)}</td>
                </tr>
                <tr>
                  <td style={totalLabel}>DISCOUNT</td>
                  <td style={totalValue}>₹ {currency(bill.discount)}</td>
                </tr>
                <tr>
                  <td style={totalLabel}>ADVANCE</td>
                  <td style={totalValue}>₹ {currency(bill.advance)}</td>
                </tr>
                <tr>
                  <td
                    style={{
                      ...totalLabel,
                      background: "#0a0a0a",
                      color: "#ffd400",
                      fontSize: 13,
                      border: "1px solid #0a0a0a",
                    }}
                  >
                    GRAND TOTAL
                  </td>
                  <td style={{ ...totalValue, fontSize: 14, border: `2px solid ${PURPLE_MID}` }}>
                    ₹ {currency(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------- FOOTER ---------- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "6px 10px 2px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="12" fill="#e879f9" />
              <path
                d="M8 7.5c0-.6.5-1 1-1h1.4c.4 0 .8.3.9.7l.5 1.7c.1.4 0 .8-.4 1l-.8.5c.6 1.4 1.6 2.4 3 3l.5-.8c.2-.3.6-.5 1-.4l1.7.5c.4.1.7.5.7.9V16c0 .6-.4 1-1 1-4.7 0-9.5-4.5-9.5-9.5z"
                fill="#1b0533"
              />
            </svg>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}>
              {DJ_PROFILE.mobile}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="46" height="34" viewBox="0 0 46 34" aria-hidden>
              <rect
                x="1"
                y="1"
                width="44"
                height="32"
                rx="4"
                fill="#1b0533"
                stroke="#a855f7"
                strokeWidth="1.5"
              />
              <circle cx="15" cy="17" r="9" fill="none" stroke="#c084fc" strokeWidth="1.5" />
              <circle cx="15" cy="17" r="3" fill="#a855f7" />
              <circle cx="33" cy="12" r="5" fill="none" stroke="#c084fc" strokeWidth="1.4" />
              <circle cx="33" cy="24" r="5" fill="none" stroke="#c084fc" strokeWidth="1.4" />
            </svg>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "0.03em",
                }}
              >
                {DJ_PROFILE.tagline1}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "0.03em",
                }}
              >
                {DJ_PROFILE.tagline2}
              </div>
            </div>
            <Waveform bars={16} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="30" height="26" viewBox="0 0 30 26" aria-hidden>
              <path
                d="M3 17v-4a12 12 0 0124 0v4"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect x="1" y="15" width="7" height="11" rx="3" fill="#ffffff" />
              <rect x="22" y="15" width="7" height="11" rx="3" fill="#ffffff" />
            </svg>
            <Waveform bars={18} />
          </div>
        </div>
      </div>
    </div>
  );
});
