import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import LuxuryProductCard from "@/components/LuxuryProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { useHomepageContent } from "@/api/cms";
import { useFeatured } from "@/api/products";

export default function LookbookPage() {
  const { data: cms } = useHomepageContent();
  const { data: productsData, isLoading: productsLoading } = useFeatured();

  const lookbookEntries = cms?.lookbook ?? [];
  const featuredProducts = productsData?.results ?? [];

  return (
    <Layout>
      {/* ── Hero ── */}
      <div
        style={{
          textAlign: "center",
          padding: "64px 24px 48px",
          borderBottom: "1px solid #EDE8E3",
          marginBottom: "64px",
        }}
      >
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "10px",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "#C4985A",
          marginBottom: "16px",
        }}>
          The Edit
        </p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(36px, 5vw, 64px)",
          fontWeight: 300,
          color: "#2C2420",
          lineHeight: 1.05,
          marginBottom: "20px",
        }}>
          Lookbook
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          color: "#6B5B55",
          lineHeight: 1.8,
          maxWidth: "480px",
          margin: "0 auto",
        }}>
          Curated editorial looks from our latest collection — modest fashion crafted for the refined woman.
        </p>
      </div>

      {/* ── CMS Lookbook Entries ── */}
      {lookbookEntries.length > 0 && (
        <section style={{ padding: "0 clamp(24px, 6vw, 100px)", marginBottom: "80px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}>
            {lookbookEntries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                style={{ position: "relative", overflow: "hidden", borderRadius: "2px", background: "#F5EDE6" }}
              >
                <img
                  src={entry.image}
                  alt={entry.image_alt || entry.title}
                  style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                />
                <div
                  style={{
                    position: "absolute", inset: 0, opacity: 0,
                    background: "rgba(44,36,32,0.6)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    transition: "opacity 0.3s ease",
                    padding: "24px",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}
                >
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "24px", fontWeight: 300, color: "#fff",
                    textAlign: "center", marginBottom: "16px",
                  }}>
                    {entry.title}
                  </p>
                  {entry.description && (
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "12px", color: "rgba(255,255,255,0.8)",
                      textAlign: "center", marginBottom: "20px", lineHeight: 1.6,
                    }}>
                      {entry.description}
                    </p>
                  )}
                  {entry.product_url && (
                    <Link
                      to={entry.product_url}
                      style={{
                        fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
                        color: "#C4985A", fontFamily: "'Inter', sans-serif",
                        textDecoration: "none", fontWeight: 500,
                        border: "1px solid #C4985A", padding: "10px 24px",
                      }}
                    >
                      Shop This Look
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section style={{ padding: "0 clamp(24px, 6vw, 100px)", marginBottom: "80px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "10px", letterSpacing: "0.24em", textTransform: "uppercase",
            color: "#C4985A", marginBottom: "10px",
          }}>
            Featured Pieces
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 300, color: "#2C2420",
          }}>
            Shop the Look
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "24px",
        }}>
          {productsLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts.length === 0
            ? (
              <div style={{
                gridColumn: "1 / -1", textAlign: "center", padding: "64px 0",
                fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#9E8E88",
              }}>
                No featured products yet. Check back soon.
              </div>
            )
            : featuredProducts.map((product) => (
              <LuxuryProductCard key={product.id} product={product} />
            ))
          }
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link
            to="/products"
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              fontFamily: "'Inter', sans-serif", fontSize: "11px",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#fff", background: "#2C2420",
              padding: "14px 40px", textDecoration: "none",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#3D3330"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#2C2420"; }}
          >
            View Full Collection →
          </Link>
        </div>
      </section>
    </Layout>
  );
}
