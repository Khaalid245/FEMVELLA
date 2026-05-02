import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LuxuryProductCard from "./LuxuryProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import {
  useNewArrivals,
  useBestsellers,
  useOnSale,
  useFeatured,
} from "@/api/products";

const TABS = [
  { key: "new",        label: "New Arrivals" },
  { key: "bestseller", label: "Bestsellers"  },
  { key: "sale",       label: "On Sale"      },
  { key: "featured",   label: "Featured"     },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function useTabData(tab: TabKey) {
  const newArrivals  = useNewArrivals();
  const bestsellers  = useBestsellers();
  const onSale       = useOnSale();
  const featured     = useFeatured();

  const map = {
    new:        newArrivals,
    bestseller: bestsellers,
    sale:       onSale,
    featured:   featured,
  };

  return map[tab];
}

export default function ProductsSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("new");
  const { data, isLoading, isError } = useTabData(activeTab);

  const products = data?.results ?? [];

  return (
    <section className="mb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p
            className="text-[10px] tracking-[0.22em] uppercase mb-2"
            style={{ color: "#C4985A", fontFamily: "'Inter', sans-serif" }}
          >
            Our Collection
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 400,
              color: "#2C2420",
              lineHeight: 1.1,
            }}
          >
            Curated for You
          </h2>
        </div>

        <Link
          to="/products"
          className="text-sm transition-colors duration-200 whitespace-nowrap self-end sm:self-auto"
          style={{
            color: "#6B5B55",
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            letterSpacing: "0.08em",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#2C2420")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6B5B55")}
        >
          View All →
        </Link>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-0 mb-8 overflow-x-auto scrollbar-none"
        style={{ borderBottom: "1px solid #EDE8E3" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="relative pb-3 px-5 text-[11px] tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-200 flex-shrink-0"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: activeTab === tab.key ? 500 : 400,
              color: activeTab === tab.key ? "#2C2420" : "#9E8E88",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {tab.label}
            {/* Gold underline */}
            {activeTab === tab.key && (
              <motion.span
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: "#C4985A" }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {isError ? (
            <div
              className="py-16 text-center"
              style={{ color: "#9E8E88", fontFamily: "'Inter', sans-serif", fontSize: "13px" }}
            >
              Unable to load products. Please try again.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))
                : products.length === 0
                ? (
                    <div
                      className="col-span-4 py-16 text-center"
                      style={{ color: "#9E8E88", fontFamily: "'Inter', sans-serif", fontSize: "13px" }}
                    >
                      No products found in this category.
                    </div>
                  )
                : products.slice(0, 8).map((product) => (
                    <LuxuryProductCard key={product.id} product={product} />
                  ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
