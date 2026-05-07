import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LuxuryProductCard from "@/components/LuxuryProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import type { Product } from "@/api/products";

const ease = [0.22, 1, 0.36, 1] as const;

interface ProductShelfProps {
  /** Section eyebrow label (gold uppercase) */
  eyebrow: string;
  /** Section heading */
  title: string;
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
  /** "grid" = responsive grid, "scroll" = horizontal scroll row */
  layout?: "grid" | "scroll";
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
  /** Optional "View all" link */
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Columns on desktop for grid layout */
  columns?: 2 | 3 | 4;
  className?: string;
}

export default function ProductShelf({
  eyebrow,
  title,
  products,
  isLoading = false,
  isError = false,
  layout = "grid",
  skeletonCount = 4,
  viewAllHref,
  viewAllLabel = "View All",
  columns = 4,
  className = "",
}: ProductShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const colClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  }[columns];

  if (isError) return null;

  return (
    <section className={`mb-16 ${className}`}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
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
            {eyebrow}
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
            {title}
          </h2>
        </div>

        {viewAllHref && (
          <Link
            to={viewAllHref}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6B5B55",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6B5B55")}
          >
            {viewAllLabel}
            <span style={{ fontSize: "14px" }}>→</span>
          </Link>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={layout === "grid" ? `grid ${colClass} gap-4 md:gap-6` : "flex gap-4 overflow-x-auto scrollbar-none pb-2"}
          >
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                style={layout === "scroll" ? { minWidth: "200px", flexShrink: 0 } : undefined}
              >
                <ProductCardSkeleton />
              </div>
            ))}
          </motion.div>
        ) : products.length === 0 ? null : (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            {layout === "grid" ? (
              <div className={`grid ${colClass} gap-4 md:gap-6`}>
                {products.map((p) => (
                  <LuxuryProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-none pb-2"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {products.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      minWidth: "clamp(160px, 22vw, 220px)",
                      flexShrink: 0,
                      scrollSnapAlign: "start",
                    }}
                  >
                    <LuxuryProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
