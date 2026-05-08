import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useSearchContext } from "@/contexts/SearchContext";
import CurrencySwitcher from "@/components/CurrencySwitcher";

const ease = [0.22, 1, 0.36, 1] as const;

const NAV_LINKS = [
  { label: "Shop", to: "/products" },
  { label: "Lookbook", to: "/products?is_featured=true" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const location = useLocation();
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const { accessToken, user, logout } = useAuthStore();
  const { open: openSearch } = useSearchContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to.split("?")[0]);

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: scrolled ? "1px solid #EDE8E3" : "1px solid transparent",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          boxShadow: scrolled ? "0 1px 20px rgba(44,36,32,0.06)" : "none",
        }}
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "22px",
              fontWeight: 400,
              color: "#2C2420",
              letterSpacing: "0.08em",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Femvelle
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="hover-underline"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isActive(to) ? "#C4985A" : "#2C2420",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                  fontWeight: isActive(to) ? 500 : 400,
                }}
                onMouseEnter={(e) => { if (!isActive(to)) (e.currentTarget as HTMLElement).style.color = "#C4985A"; }}
                onMouseLeave={(e) => { if (!isActive(to)) (e.currentTarget as HTMLElement).style.color = "#2C2420"; }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

            {/* Auth — desktop only */}
            <div className="hidden md:flex items-center gap-5">
              {accessToken ? (
                <>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9E8E88", letterSpacing: "0.04em" }}>
                    {user?.first_name}
                  </span>
                  <button
                    onClick={logout}
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9E8E88", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s ease" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9E8E88")}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#2C2420", textDecoration: "none", transition: "color 0.2s ease" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C4985A")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
                >
                  Sign in
                </Link>
              )}
            </div>

            {/* Currency Switcher — desktop */}
            <div className="hidden md:block">
              <CurrencySwitcher />
            </div>

            {/* Search — desktop pill */}
            <button
              onClick={openSearch}
              aria-label="Search (Ctrl+K)"
              className="hidden md:flex"
              style={{
                background: "none",
                border: "1px solid #EDE8E3",
                cursor: "pointer",
                color: "#9E8E88",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#C4985A";
                (e.currentTarget as HTMLElement).style.color = "#C4985A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#EDE8E3";
                (e.currentTarget as HTMLElement).style.color = "#9E8E88";
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.06em" }}>Search</span>
              <kbd style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", color: "#C4C0BC", border: "1px solid #EDE8E3", borderRadius: "2px", padding: "1px 4px" }}>
                ⌘K
              </kbd>
            </button>

            {/* Search — mobile icon */}
            <button
              onClick={openSearch}
              aria-label="Search"
              className="md:hidden"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#2C2420", display: "flex", padding: "4px", transition: "color 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C4985A")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              aria-label={`Cart — ${itemCount} items`}
              style={{ position: "relative", color: "#2C2420", textDecoration: "none", display: "flex", transition: "color 0.2s ease" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C4985A")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2, ease }}
                    style={{
                      position: "absolute", top: "-6px", right: "-8px",
                      background: "#C4985A", color: "#fff",
                      fontSize: "9px", fontFamily: "'Inter', sans-serif", fontWeight: 600,
                      borderRadius: "50%", width: "16px", height: "16px",
                      display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: 0,
                    }}
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#2C2420", display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <motion.span animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.25, ease }} style={{ display: "block", width: "20px", height: "1.5px", background: "currentColor", transformOrigin: "center" }} />
              <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.2 }} style={{ display: "block", width: "20px", height: "1.5px", background: "currentColor" }} />
              <motion.span animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.25, ease }} style={{ display: "block", width: "20px", height: "1.5px", background: "currentColor", transformOrigin: "center" }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            style={{ position: "fixed", top: "64px", left: 0, right: 0, bottom: 0, background: "#fff", zIndex: 39, display: "flex", flexDirection: "column", padding: "40px 24px" }}
          >
            {NAV_LINKS.map(({ label, to }, i) => (
              <motion.div key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.06, ease }}>
                <Link
                  to={to}
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: 400, color: isActive(to) ? "#C4985A" : "#2C2420", textDecoration: "none", display: "block", paddingBottom: "20px", marginBottom: "20px", borderBottom: "1px solid #EDE8E3", transition: "color 0.2s ease" }}
                >
                  {label}
                </Link>
              </motion.div>
            ))}

            {/* Mobile search */}
            <motion.button
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: NAV_LINKS.length * 0.06, ease }}
              onClick={() => { setMobileOpen(false); openSearch(); }}
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: 400, color: "#2C2420", background: "none", border: "none", cursor: "pointer", textAlign: "left", paddingBottom: "20px", marginBottom: "20px", borderBottom: "1px solid #EDE8E3", display: "flex", alignItems: "center", gap: "12px" }}
            >
              Search
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </motion.button>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.3, ease }} style={{ marginTop: "auto" }}>
              {accessToken ? (
                <button onClick={logout} style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E8E88", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Sign out
                </button>
              ) : (
                <Link to="/login" style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#2C2420", textDecoration: "none" }}>
                  Sign in
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
