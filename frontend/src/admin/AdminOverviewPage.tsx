import { useAdminStats } from "@/api/admin";
import { useAuthStore } from "@/store/authStore";

const STATUS_COLORS: Record<string, string> = {
  pending:   "#F59E0B",
  paid:      "#10B981",
  confirmed: "#3B82F6",
  shipped:   "#8B5CF6",
  delivered: "#059669",
  cancelled: "#EF4444",
  failed:    "#DC2626",
};

function KpiCard({ label, value, sub, loading }: { label: string; value: string | number; sub?: string; loading: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: "8px", padding: "20px 24px" }}>
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div style={{ height: "12px", width: "60%", background: "#EDE8E3", borderRadius: "4px" }} />
          <div style={{ height: "28px", width: "40%", background: "#EDE8E3", borderRadius: "4px" }} />
        </div>
      ) : (
        <>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E8E88", marginBottom: "8px" }}>{label}</p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "30px", fontWeight: 500, color: "#2C2420", lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#C4985A", marginTop: "6px" }}>{sub}</p>}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: "10px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      padding: "3px 8px",
      borderRadius: "3px",
      background: `${STATUS_COLORS[status] ?? "#9E8E88"}18`,
      color: STATUS_COLORS[status] ?? "#9E8E88",
      fontWeight: 500,
    }}>
      {status}
    </span>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminStats();
  const { user } = useAuthStore();
  const kpis = data?.kpis;

  // Block render until role is confirmed
  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div className="animate-pulse" style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9E8E88" }}>Verifying access…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4985A", marginBottom: "6px" }}>Dashboard</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: 400, color: "#2C2420" }}>Overview</h1>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Revenue"  value={kpis ? `$${kpis.total_revenue.toLocaleString()}` : "—"} sub={kpis ? `$${kpis.revenue_today.toLocaleString()} today` : undefined} loading={isLoading} />
        <KpiCard label="Total Orders"   value={kpis?.total_orders ?? "—"} sub={kpis ? `${kpis.orders_today} today` : undefined} loading={isLoading} />
        <KpiCard label="Active Products" value={kpis?.total_products ?? "—"} sub={kpis && kpis.low_stock > 0 ? `${kpis.low_stock} low stock ⚠` : undefined} loading={isLoading} />
        <KpiCard label="Customers"      value={kpis?.total_customers ?? "—"} sub={kpis ? `$${kpis.revenue_7d.toLocaleString()} this week` : undefined} loading={isLoading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart — simple bar chart */}
        <div className="lg:col-span-2" style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E8E88", marginBottom: "20px" }}>Revenue — Last 30 Days</p>
          {isLoading ? (
            <div className="animate-pulse flex items-end gap-1 h-32">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{ flex: 1, background: "#EDE8E3", borderRadius: "2px", height: `${20 + Math.random() * 80}%` }} />
              ))}
            </div>
          ) : data?.revenue_chart.length === 0 ? (
            <div style={{ height: "128px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9E8E88" }}>No revenue data yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "128px" }}>
              {(() => {
                const chart = data?.revenue_chart ?? [];
                const max = Math.max(...chart.map((d) => d.revenue), 1);
                return chart.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: $${d.revenue}`}
                    style={{
                      flex: 1,
                      background: "#C4985A",
                      borderRadius: "2px 2px 0 0",
                      height: `${(d.revenue / max) * 100}%`,
                      minHeight: "4px",
                      opacity: 0.75,
                      transition: "opacity 0.15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}
                  />
                ));
              })()}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E8E88", marginBottom: "20px" }}>Order Status</p>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: "20px", background: "#EDE8E3", borderRadius: "4px" }} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.status_breakdown ?? []).map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <StatusBadge status={s.status} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#2C2420", fontWeight: 500 }}>{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: "8px", padding: "24px", marginTop: "24px" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E8E88", marginBottom: "20px" }}>Recent Orders</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #EDE8E3" }}>
                {["Order", "Customer", "Status", "Total", "Date"].map((h) => (
                  <th key={h} style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E8E88", textAlign: "left", padding: "0 12px 12px 0", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} style={{ padding: "12px 12px 12px 0" }}>
                          <div className="animate-pulse" style={{ height: "14px", background: "#EDE8E3", borderRadius: "4px", width: "80%" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : (data?.recent_orders ?? []).map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid #F5F0EB" }}>
                      <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", padding: "12px 12px 12px 0", fontWeight: 500 }}>#{o.id}</td>
                      <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#6B5B55", padding: "12px 12px 12px 0" }}>{o.user_email}</td>
                      <td style={{ padding: "12px 12px 12px 0" }}><StatusBadge status={o.status} /></td>
                      <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", padding: "12px 12px 12px 0" }}>${o.total_price}</td>
                      <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#9E8E88", padding: "12px 0 12px 0" }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
