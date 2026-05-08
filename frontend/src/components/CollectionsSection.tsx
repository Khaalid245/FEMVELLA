import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useHomepageContent } from "@/api/cms";

export default function CollectionsSection() {
  const { data: cms } = useHomepageContent();
  const collections = cms?.collections ?? [];

  if (collections.length === 0) return null;

  return (
    <section style={{ padding: "80px clamp(24px, 6vw, 100px)" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <p style={{
          fontSize: "10px", letterSpacing: "0.24em", textTransform: "uppercase",
          color: "#C4985A", fontFamily: "'Inter', sans-serif", marginBottom: "12px",
        }}>
          Collections
        </p>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 300, color: "#2C2420",
        }}>
          Shop by Season
        </h2>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(collections.length, 3)}, 1fr)`,
        gap: "24px",
      }}>
        {collections.map((col, i) => (
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            style={{ position: "relative", overflow: "hidden", borderRadius: "4px" }}
          >
            {col.image && (
              <img
                src={col.image}
                alt={col.image_alt || col.title}
                style={{ width: "100%", height: "360px", objectFit: "cover", display: "block" }}
              />
            )}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(44,36,32,0.7) 0%, transparent 50%)",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              padding: "32px",
            }}>
              <h3 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "28px", fontWeight: 300, color: "#fff", marginBottom: "8px",
              }}>
                {col.title}
              </h3>
              {col.subtitle && (
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", marginBottom: "20px" }}>
                  {col.subtitle}
                </p>
              )}
              <Link
                to={col.cta_url}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "#C4985A", fontFamily: "'Inter', sans-serif", textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                {col.cta_label} →
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
