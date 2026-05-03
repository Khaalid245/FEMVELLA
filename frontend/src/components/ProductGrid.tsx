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
      <div className="flex flex-col items-center justify-center py-32 gap-5">
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", color: "#2C2420" }}>
          Something went wrong
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#9E8E88" }}>
          We couldn't load the products. Please try again.
        </p>
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
            padding: "12px 28px",
            cursor: "pointer",
          }}
        >
          Retry
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
      <div className="flex flex-col items-center justify-center py-32 gap-5">
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", color: "#2C2420" }}>
          No products found
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#9E8E88" }}>
          Try adjusting your filters or search term.
        </p>
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
              padding: "12px 28px",
              cursor: "pointer",
            }}
          >
            Clear Filters
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
