import { useToastStore } from "@/store/toastStore";

const COLORS = { success: "#10B981", error: "#EF4444", info: "#3B82F6" };
const ICONS  = { success: "✓", error: "✕", info: "i" };

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "#fff", border: `1px solid ${COLORS[t.type]}30`,
            borderLeft: `3px solid ${COLORS[t.type]}`,
            borderRadius: "6px", padding: "12px 16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
            fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#2C2420",
            pointerEvents: "all", minWidth: "260px", maxWidth: "360px",
            animation: "slideIn 0.2s ease",
          }}
        >
          <span style={{ color: COLORS[t.type], fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
            {ICONS[t.type]}
          </span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9E8E88", fontSize: "16px", lineHeight: 1, padding: 0, flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:translateX(0) } }`}</style>
    </div>
  );
}
