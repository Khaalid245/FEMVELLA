import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  {
    label: "Overview",
    to: "/admin",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Orders",
    to: "/admin/orders",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: "Products",
    to: "/admin/products",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(232,213,180,0.08)" }}>
        <Link to="/" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", color: "#E8D5B4", textDecoration: "none", letterSpacing: "0.06em" }}>
          Femvelle
        </Link>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C4985A", marginTop: "4px" }}>
          Admin Panel
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" as const }}>
        {NAV.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "6px",
                marginBottom: "2px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                letterSpacing: "0.06em",
                textDecoration: "none",
                background: active ? "rgba(196,152,90,0.12)" : "transparent",
                color: active ? "#C4985A" : "rgba(232,213,180,0.5)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#E8D5B4"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(232,213,180,0.5)"; }}
            >
              <span style={{ color: active ? "#C4985A" : "inherit" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(232,213,180,0.08)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#E8D5B4", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.email ?? "Admin"}
        </p>
        <button
          onClick={handleLogout}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(232,213,180,0.5)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#E57373")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(232,213,180,0.5)")}
        >
          Sign out
        </button>
      </div>
    </>
  );

  const currentLabel = NAV.find((n) => n.to === location.pathname)?.label ?? "Admin";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAF7F4" }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col"
        style={{ width: "220px", flexShrink: 0, background: "#2C2420", position: "sticky", top: 0, height: "100vh" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={() => setMobileOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
          <aside style={{ position: "relative", width: "220px", background: "#2C2420", display: "flex", flexDirection: "column", height: "100vh" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <header style={{ height: "56px", background: "#fff", borderBottom: "1px solid #EDE8E3", display: "flex", alignItems: "center", padding: "0 24px", gap: "12px", position: "sticky", top: 0, zIndex: 30 }}>
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#2C2420", padding: "4px", display: "flex" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#2C2420", fontWeight: 500, flex: 1 }}>
            {currentLabel}
          </span>

          <Link
            to="/"
            target="_blank"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E8E88", textDecoration: "none" }}
          >
            View Store ↗
          </Link>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
