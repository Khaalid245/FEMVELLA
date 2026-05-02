import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.85, delay, ease },
});

const fadeIn = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.9, delay, ease },
});

export default function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "88vh",
        // Layered gradient — spec exact
        background:
          "linear-gradient(135deg, #FBF8F5 0%, #F0E8E0 40%, #E8D5C8 100%)",
      }}
    >
      {/* Radial glow — top right, very subtle */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          right: "-5%",
          width: "55%",
          height: "70%",
          background:
            "radial-gradient(ellipse at top right, rgba(196,152,90,0.13) 0%, transparent 65%)",
        }}
      />

      {/* Grain texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.022,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── 55 / 45 grid ── */}
      <div
        className="relative w-full flex items-center"
        style={{
          minHeight: "88vh",
          display: "grid",
          gridTemplateColumns: "55fr 45fr",
          paddingLeft: "clamp(32px, 7vw, 120px)",
          paddingRight: "clamp(32px, 5vw, 80px)",
          paddingTop: "100px",
          paddingBottom: "100px",
          gap: "0",
        }}
      >
        {/* ════════════════════════════
            LEFT — Text
        ════════════════════════════ */}
        <div
          className="flex flex-col justify-center"
          style={{ paddingRight: "clamp(24px, 4vw, 72px)" }}
        >
          {/* Badge */}
          <motion.div {...fadeIn(0.1)} style={{ marginBottom: "40px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 18px",
                fontSize: "10px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                color: "#C4985A",
                border: "1px solid rgba(196,152,90,0.45)",
                background: "rgba(196,152,90,0.05)",
                borderRadius: "2px",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#C4985A",
                  flexShrink: 0,
                }}
              />
              New Season · 2026
            </span>
          </motion.div>

          {/* Headline */}
          <div style={{ marginBottom: "36px" }}>
            {/* Line 1 — dark brown */}
            <motion.div {...fadeUp(0.2)}>
              <span
                style={{
                  display: "block",
                  fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
                  fontSize: "clamp(52px, 5.8vw, 78px)",
                  fontWeight: 300,
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  color: "#2C2420",
                  marginBottom: "10px", // large spacing between lines
                }}
              >
                Where Modesty
              </span>
            </motion.div>

            {/* Line 2 — gold + italic */}
            <motion.div {...fadeUp(0.32)}>
              <span
                style={{
                  display: "block",
                  fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
                  fontSize: "clamp(52px, 5.8vw, 78px)",
                  fontWeight: 300,
                  fontStyle: "italic",
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  color: "#C4985A", // gold — spec exact
                }}
              >
                Meets Elegance
              </span>
            </motion.div>
          </div>

          {/* Gold rule */}
          <motion.div
            {...fadeIn(0.48)}
            aria-hidden
            style={{
              width: "48px",
              height: "1px",
              background: "#C4985A",
              marginBottom: "28px",
            }}
          />

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.52)}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "15px",
              lineHeight: 1.9,
              color: "#6B5B55",
              maxWidth: "420px",
              marginBottom: "52px",
            }}
          >
            Curated modest fashion for the refined woman — abayas, evening wear
            and tailored sets crafted in our atelier.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.68)}
            style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}
          >
            {/* Primary */}
            <Link
              to="/products"
              className="group"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 36px",
                background: "#2C2420",
                color: "#fff",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                textDecoration: "none",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 28px rgba(44,36,32,0.22)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              Discover Collection
              <span
                aria-hidden
                style={{ transition: "transform 0.25s ease" }}
                className="group-hover:translate-x-1 inline-block"
              >
                →
              </span>
            </Link>

            {/* Secondary */}
            <Link
              to="/products?is_featured=true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px 36px",
                border: "1px solid #2C2420",
                color: "#2C2420",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                textDecoration: "none",
                background: "transparent",
                transition: "transform 0.25s ease, background 0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(44,36,32,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              View Lookbook
            </Link>
          </motion.div>
        </div>

        {/* ════════════════════════════
            RIGHT — Image
        ════════════════════════════ */}
        <div
          className="hidden lg:flex items-center justify-center"
          style={{ position: "relative" }}
        >
          <motion.div
            {...fadeIn(0.28)}
            className="animate-float"
            style={{ position: "relative", width: "370px", flexShrink: 0 }}
          >
            {/* Gold outline — offset behind */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "185px 185px 12px 12px",
                border: "1px solid rgba(196,152,90,0.38)",
                transform: "translate(11px, 11px)",
                pointerEvents: "none",
              }}
            />

            {/* Arch frame */}
            <div
              style={{
                width: "370px",
                height: "480px",
                borderRadius: "185px 185px 12px 12px",
                overflow: "hidden",
                background: "#E8D5C8",
                position: "relative",
                boxShadow: "0 24px 64px rgba(44,36,32,0.14)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=740&q=88&auto=format&fit=crop&crop=top"
                alt="Femvelle editorial — modest fashion"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top center",
                  filter: "saturate(0.7) contrast(1.04) brightness(1.02)",
                }}
              />
              {/* Inner vignette */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(44,36,32,0.15) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 14, x: 10 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.75, delay: 1.0, ease }}
              style={{
                position: "absolute",
                bottom: "-18px",
                right: "-32px",
                background: "#fff",
                padding: "18px 24px",
                borderRadius: "3px",
                boxShadow: "0 10px 44px rgba(44,36,32,0.11)",
                minWidth: "128px",
              }}
            >
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "9px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#C4985A",
                  marginBottom: "6px",
                }}
              >
                New Season
              </p>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "26px",
                  fontWeight: 300,
                  lineHeight: 1,
                  color: "#2C2420",
                }}
              >
                / 2026
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
