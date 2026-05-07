import type { Product } from "@/api/products";
import LuxuryProductCard from "./LuxuryProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

interface Props {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function ProductGrid({
  products,
  isLoading,
  isError,
  onRetry,
  onClearFilters,
  hasActiveFilters,
}: Props) {
  const gridClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6";

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        {/* Icon */}
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#F8F6F3",
          border: "1px solid #EDE8E3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4985A" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", color: "#2C2420", marginBottom: "8px" }}>
            Something went wrong
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#9E8E88", lineHeight: 1.6 }}>
            We couldn't load the products. Please try again.
          </p>
        </div>
        <button
          onClick={onRetry}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#fff",
            background: "#2C2420",
            border: "none",
            padding: "13px 32px",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3D3330")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#2C2420")}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        {/* Icon */}
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "#F8F6F3",
          border: "1px solid #EDE8E3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4985A" strokeWidth="1.4">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "26px", fontWeight: 400, color: "#2C2420", marginBottom: "10px" }}>
            No products found
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "#9E8E88", lineHeight: 1.7, maxWidth: "320px" }}>
            {hasActiveFilters
              ? "No items match your current filters. Try broadening your search."
              : "Our collection is being updated. Check back soon."}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#2C2420",
              background: "transparent",
              border: "1px solid #2C2420",
              padding: "13px 32px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#2C2420";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#2C2420";
            }}
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {products.map((product) => (
        <LuxuryProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
