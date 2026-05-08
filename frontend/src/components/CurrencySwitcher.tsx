import { useEffect, useRef, useState } from "react";
import { useCurrencyStore } from "@/store/currencyStore";

export default function CurrencySwitcher() {
  const { active, currencies, setCurrency, loadCurrencies } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (currencies.length <= 1) return null;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "11px",
          letterSpacing: "0.12em",
          fontFamily: "'Inter', sans-serif",
          color: "#6B5B55",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
        }}
        aria-label="Switch currency"
      >
        {active}
        <span aria-hidden style={{ fontSize: "8px" }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: "#fff",
            border: "1px solid rgba(44,36,32,0.1)",
            borderRadius: "3px",
            boxShadow: "0 8px 24px rgba(44,36,32,0.1)",
            minWidth: "120px",
            zIndex: 100,
          }}
        >
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                fontSize: "12px",
                fontFamily: "'Inter', sans-serif",
                color: c.code === active ? "#C4985A" : "#2C2420",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: c.code === active ? 600 : 400,
              }}
            >
              {c.symbol} {c.code} — {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
