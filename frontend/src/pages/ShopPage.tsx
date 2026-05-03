import { useState } from "react";
import Layout from "@/components/Layout";
import FilterSidebar from "@/components/FilterSidebar";
import SortBar from "@/components/SortBar";
import ProductGrid from "@/components/ProductGrid";
import Pagination from "@/components/Pagination";
import { useShopFilters, useShopProducts } from "@/hooks/useShopFilters";

export default function ShopPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { filters, setFilter, toggleSize, clearAll, hasActiveFilters } = useShopFilters();
  const { data, isLoading, isError, refetch } = useShopProducts(filters);

  const products = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const currentPage = parseInt(filters.page || "1", 10);

  return (
    <Layout>
      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
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
            Collection
          </p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 400,
              color: "#2C2420",
              lineHeight: 1.1,
            }}
          >
            All Products
          </h1>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="lg:hidden flex items-center gap-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#2C2420",
            background: "none",
            border: "1px solid #DDD5CE",
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
            <path d="M0 1h14M3 6h8M5 11h4" stroke="#2C2420" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Filters {hasActiveFilters && <span style={{ color: "#C4985A" }}>•</span>}
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "#2C2420",
            border: "1px solid #DDD5CE",
            borderBottom: "1px solid #2C2420",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            padding: "8px 0",
            background: "transparent",
            outline: "none",
          }}
        />
      </div>

      <div className="flex gap-10">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "block" : "hidden"} lg:block`}>
          <FilterSidebar
            filters={filters}
            onToggleSize={toggleSize}
            onPriceChange={(min, max) => {
              setFilter("min_price", min);
              setFilter("max_price", max);
            }}
            onClearAll={clearAll}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <SortBar
            filters={filters}
            totalCount={totalCount}
            onCategoryChange={(slug) => setFilter("category", slug)}
            onSortChange={(val) => setFilter("ordering", val)}
          />

          <ProductGrid
            products={products}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onClearFilters={clearAll}
            hasActiveFilters={hasActiveFilters}
          />

          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            onPageChange={(page) => setFilter("page", String(page))}
          />
        </div>
      </div>
    </Layout>
  );
}
