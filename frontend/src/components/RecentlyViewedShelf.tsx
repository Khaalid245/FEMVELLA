import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useRecentlyViewed } from "@/api/recommendations";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

const ease = [0.22, 1, 0.36, 1] as const;

export default function RecentlyViewedShelf() {
  const { data: products = [], isLoading } = useRecentlyViewed(6);

  if (!isLoading && products.length === 0) return null;

  return (
    <section style={{ marginBottom: "64px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C4985A",
            marginBottom: "6px",
          }}
        >
          Your Journey
        </p>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 400,
            color: "#2C2420",
            lineHeight: 1.1,
          }}
        >
          Recently Viewed
        </h2>
      </div>

      {/* Scroll row */}
      <div
        className="flex gap-4 overflow-x-auto scrollbar-none pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ minWidth: "clamp(140px, 18vw, 180px)", flexShrink: 0 }}>
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((product, i) => {
              const primary = product.images?.find((img) => img.is_primary) ?? product.images?.[0];
              const path = `/products/${product.slug}`;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease }}
                  style={{
                    minWidth: "clamp(140px, 18vw, 180px)",
                    flexShrink: 0,
                    scrollSnapAlign: "start",
                  }}
                >
                  <Link to={path} style={{ textDecoration: "none", display: "block" }}>
                    {/* Image */}
                    <div
                      className="group"
                      style={{
                        aspectRatio: "3/4",
                        background: "#F5F0EB",
                        overflow: "hidden",
                        marginBottom: "10px",
                      }}
                    >
                      {primary ? (
                        <img
                          src={primary.image}
                          alt={product.name}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.6s ease",
                          }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.transform = "scale(1.04)")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.transform = "scale(1)")
                          }
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "#EDE8E3" }} />
                      )}
                    </div>

                    {/* Info */}
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "9px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#C4985A",
                        marginBottom: "3px",
                      }}
                    >
                      {product.category?.name}
                    </p>
                    <p
                      className="hover-underline"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: "14px",
                        color: "#2C2420",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                        maxWidth: "100%",
                      }}
                    >
                      {product.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: product.sale_price ? "#C4985A" : "#2C2420",
                        marginTop: "4px",
                      }}
                    >
                      ${product.sale_price ?? product.price}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
      </div>
    </section>
  );
}
