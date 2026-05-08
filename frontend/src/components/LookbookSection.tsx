import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useHomepageContent } from "@/api/cms";

export default function LookbookSection() {
  const { data: cms } = useHomepageContent();
  const entries = cms?.lookbook ?? [];

  if (entries.length === 0) return null;

  return (
    <section style={{ padding: "80px clamp(24px, 6vw, 100px)" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <p style={{
          fontSize: "10px", letterSpacing: "0.24em", textTransform: "uppercase",
          color: "#C4985A", fontFamily: "'Inter', sans-serif", marginBottom: "12px",
        }}>
          Lookbook
        </p>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 300, color: "#2C2420",
        }}>
          The Edit
        </h2>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px",
      }}>
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            style={{ position: "relative", overflow: "hidden", borderRadius: "4px", background: "#F5EDE6" }}
          >
            <img
              src={entry.image}
              alt={entry.image_alt || entry.title}
              style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute", inset: 0, opacity: 0,
              background: "rgba(44,36,32,0.55)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              transition: "opacity 0.3s ease",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}
            >
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "22px", fontWeight: 300, color: "#fff",
                textAlign: "center", padding: "0 24px", marginBottom: "16px",
              }}>
                {entry.title}
              </p>
              {entry.product_url && (
                <Link
                  to={entry.product_url}
                  style={{
                    fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
                    color: "#C4985A", fontFamily: "'Inter', sans-serif", textDecoration: "none",
                  }}
                >
                  Shop This Look →
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
