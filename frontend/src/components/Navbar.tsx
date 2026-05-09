import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useSearchContext } from "@/contexts/SearchContext";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { useWishlist } from "@/api/wishlist";

const ease = [0.22, 1, 0.36, 1] as const;

const NAV_LINKS = [
  { label: "Shop",     to: "/products" },
  { label: "Lookbook", to: "/lookbook"  },
  { label: "Contact",  to: "/contact"   },
] as const;

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconHeart({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#C4985A" : "none"} stroke={filled ? "#C4985A" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ── Badge wrapper ─────────────────────────────────────────────────────────────

function IconButton({
  onClick,
  href,
  label,
  badge,
  children,
  className = "",
}: {
  onClick?: () => void;
  href?: string;
  label: string;
  badge?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const style: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    color: "#2C2420",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 0.2s ease",
    flexShrink: 0,
  };

  const badgeEl = badge && badge > 0 ? (
    <motion.span
      key={badge}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        position: "absolute", top: "0px", right: "0px",
        background: "#C4985A", color: "#fff",
        fontSize: "8px", fontFamily: "'Inter', sans-serif", fontWeight: 700,
        borderRadius: "50%", width: "15px", height: "15px",
        display: "flex", alignItems: "center", justifyContent: "center",
        letterSpacing: 0, lineHeight: 1,
      }}
    >
      {badge > 9 ? "9+" : badge}
    </motion.span>
  ) : null;

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.color = "#C4985A"; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.color = "#2C2420"; },
  };

  if (href) {
    return (
      <Link to={href} aria-label={label} style={style} className={className} {...hoverHandlers}>
        {children}
        <AnimatePresence>{badgeEl}</AnimatePresence>
      </Link>
    );
  }

  return (
    <button onClick={onClick} aria-label={label} style={style} className={className} {...hoverHandlers}>
      {children}
      <AnimatePresence>{badgeEl}</AnimatePresence>
    </button>
  );
}

// ── User dropdown ─────────────────────────────────────────────────────────────

function UserMenu() {
  const { accessToken, user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const menuItem: React.CSSProperties = {
    display: "block", width: "100%", textAlign: "left",
    padding: "10px 20px", fontSize: "12px",
    fontFamily: "'Inter', sans-serif", letterSpacing: "0.06em",
    color: "#2C2420", background: "none", border: "none",
    cursor: "pointer", textDecoration: "none",
    transition: "background 0.15s ease",
    whiteSpace: "nowrap",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account"
        style={{
          position: "relative", display: "flex", alignItems: "center",
          justifyContent: "center", width: "36px", height: "36px",
          color: open ? "#C4985A" : "#2C2420",
          background: "none", border: "none", cursor: "pointer",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLElement).style.color = "#C4985A"; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLElement).style.color = "#2C2420"; }}
      >
        <IconUser />
        {/* Green dot when logged in */}
        {accessToken && (
          <span style={{
            position: "absolute", bottom: "4px", right: "4px",
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#81C784", border: "1.5px solid #fff",
          }} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "#fff", border: "1px solid #EDE8E3",
              boxShadow: "0 8px 32px rgba(44,36,32,0.10)",
              minWidth: "180px", zIndex: 50,
            }}
          >
            {accessToken ? (
              <>
                {/* Greeting */}
                <div style={{
                  padding: "12px 20px 10px",
                  borderBottom: "1px solid #EDE8E3",
                }}>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontSize: "10px",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "#C4985A", marginBottom: "2px",
                  }}>
                    Welcome back
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "16px", color: "#2C2420", fontWeight: 400,
                  }}>
                    {user?.username || user?.email?.split("@")[0] || "Guest"}
                  </p>
                </div>

                <Link
                  to="/wishlist"
                  style={menuItem}
                  onClick={() => setOpen(false)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAF7F4"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                >
                  My Wishlist
                </Link>

                {user?.is_staff && (
                  <Link
                    to="/admin"
                    style={menuItem}
                    onClick={() => setOpen(false)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAF7F4"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                  >
                    Admin Dashboard
                  </Link>
                )}

                <div style={{ borderTop: "1px solid #EDE8E3" }}>
                  <button
                    onClick={() => { logout(); setOpen(false); }}
                    style={{ ...menuItem, color: "#9E8E88" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAF7F4"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={menuItem}
                  onClick={() => setOpen(false)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAF7F4"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  style={{ ...menuItem, color: "#C4985A" }}
                  onClick={() => setOpen(false)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAF7F4"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                >
                  Create account
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────

export default function Navbar() {
  const location = useLocation();
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const { accessToken } = useAuthStore();
  const { open: openSearch } = useSearchContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Wishlist count — only fetch when logged in, never when logged out
  const { data: wishlist } = useWishlist();
  const wishlistCount = (accessToken && wishlist?.item_count) ? wishlist.item_count : 0;

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
    to === "/" ? location.pathname === "/" : location.pathname === to.split("?")[0];

  return (
    <>
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 40,
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
          {/* ── Logo ── */}
          <Link
            to="/"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "22px", fontWeight: 400, color: "#2C2420",
              letterSpacing: "0.08em", textDecoration: "none", flexShrink: 0,
            }}
          >
            Femvelle
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase",
                  color: isActive(to) ? "#C4985A" : "#2C2420",
                  textDecoration: "none", transition: "color 0.2s ease",
                  fontWeight: isActive(to) ? 500 : 400,
                }}
                onMouseEnter={(e) => { if (!isActive(to)) (e.currentTarget as HTMLElement).style.color = "#C4985A"; }}
                onMouseLeave={(e) => { if (!isActive(to)) (e.currentTarget as HTMLElement).style.color = "#2C2420"; }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* ── Right actions ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>

            {/* Currency — desktop */}
            <div className="hidden md:block" style={{ marginRight: "8px" }}>
              <CurrencySwitcher />
            </div>

            {/* Search — desktop pill */}
            <button
              onClick={openSearch}
              aria-label="Search"
              className="hidden md:flex"
              style={{
                alignItems: "center", gap: "6px",
                padding: "6px 12px", marginRight: "4px",
                background: "none", border: "1px solid #EDE8E3",
                cursor: "pointer", color: "#9E8E88",
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
              <IconSearch />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.06em" }}>
                Search
              </span>
              <kbd style={{
                fontFamily: "'Inter', sans-serif", fontSize: "9px",
                color: "#C4C0BC", border: "1px solid #EDE8E3",
                borderRadius: "2px", padding: "1px 4px",
              }}>
                ⌘K
              </kbd>
            </button>

            {/* Search — mobile icon */}
            <IconButton onClick={openSearch} label="Search" className="md:hidden">
              <IconSearch />
            </IconButton>

            {/* Wishlist */}
            <IconButton
              href={accessToken ? "/wishlist" : "/login"}
              label={`Wishlist${wishlistCount > 0 ? ` — ${wishlistCount} items` : ""}`}
              badge={wishlistCount}
            >
              <IconHeart filled={wishlistCount > 0} />
            </IconButton>

            {/* Cart */}
            <IconButton href="/cart" label={`Cart — ${cartCount} items`} badge={cartCount}>
              <IconBag />
            </IconButton>

            {/* User — desktop */}
            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "4px", color: "#2C2420",
                display: "flex", flexDirection: "column", gap: "5px",
                marginLeft: "4px",
              }}
            >
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25, ease }}
                style={{ display: "block", width: "20px", height: "1.5px", background: "currentColor", transformOrigin: "center" }}
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{ display: "block", width: "20px", height: "1.5px", background: "currentColor" }}
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25, ease }}
                style={{ display: "block", width: "20px", height: "1.5px", background: "currentColor", transformOrigin: "center" }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            style={{
              position: "fixed", top: "64px", left: 0, right: 0, bottom: 0,
              background: "#fff", zIndex: 39,
              display: "flex", flexDirection: "column", padding: "40px 24px",
              overflowY: "auto",
            }}
          >
            {/* Nav links */}
            {NAV_LINKS.map(({ label, to }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease }}
              >
                <Link
                  to={to}
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "32px", fontWeight: 400,
                    color: isActive(to) ? "#C4985A" : "#2C2420",
                    textDecoration: "none", display: "block",
                    paddingBottom: "20px", marginBottom: "20px",
                    borderBottom: "1px solid #EDE8E3",
                    transition: "color 0.2s ease",
                  }}
                >
                  {label}
                </Link>
              </motion.div>
            ))}

            {/* Search */}
            <motion.button
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: NAV_LINKS.length * 0.06, ease }}
              onClick={() => { setMobileOpen(false); openSearch(); }}
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "32px", fontWeight: 400, color: "#2C2420",
                background: "none", border: "none", cursor: "pointer",
                textAlign: "left", paddingBottom: "20px", marginBottom: "20px",
                borderBottom: "1px solid #EDE8E3",
                display: "flex", alignItems: "center", gap: "12px",
              }}
            >
              Search
              <IconSearch />
            </motion.button>

            {/* Bottom auth + currency */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3, ease }}
              style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <CurrencySwitcher />
              <UserMenu />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
