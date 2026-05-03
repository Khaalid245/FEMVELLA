import { useState, useEffect, useRef } from "react";
import type { ShopFilters } from "@/hooks/useShopFilters";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const MAX_PRICE = 2000;

interface Props {
  filters: ShopFilters;
  onToggleSize: (size: string) => void;
  onPriceChange: (min: string, max: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export default function FilterSidebar({
  filters,
  onToggleSize,
  onPriceChange,
  onClearAll,
  hasActiveFilters,
}: Props) {
  const selectedSizes = filters.size ? filters.size.split(",") : [];

  // Local price state — debounced before hitting URL
  const [localMin, setLocalMin] = useState(filters.min_price || "0");
  const [localMax, setLocalMax] = useState(filters.max_price || String(MAX_PRICE));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when URL changes externally (e.g. clear all)
  useEffect(() => {
    setLocalMin(filters.min_price || "0");
    setLocalMax(filters.max_price || String(MAX_PRICE));
  }, [filters.min_price, filters.max_price]);

  const handlePriceChange = (min: string, max: string) => {
    setLocalMin(min);
    setLocalMax(max);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onPriceChange(
        min === "0" ? "" : min,
        max === String(MAX_PRICE) ? "" : max
      );
    }, 350);
  };

  return (
    <aside style={{ width: "220px", flexShrink: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#2C2420",
            fontWeight: 500,
          }}
        >
          Filters
        </span>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.1em",
              color: "#C4985A",
              background: "none",
              border: "none",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onToggleSize(size)}
              style={{
                width: "40px",
                height: "40px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.04em",
                border: "1px solid",
                borderColor: selectedSizes.includes(size) ? "#2C2420" : "#DDD5CE",
                background: selectedSizes.includes(size) ? "#2C2420" : "transparent",
                color: selectedSizes.includes(size) ? "#fff" : "#2C2420",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#6B5B55" }}>
              ${localMin}
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#6B5B55" }}>
              ${localMax}
            </span>
          </div>

          {/* Min slider */}
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={10}
            value={localMin}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), Number(localMax) - 10);
              handlePriceChange(String(val), localMax);
            }}
            className="w-full accent-[#C4985A]"
          />

          {/* Max slider */}
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={10}
            value={localMax}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), Number(localMin) + 10);
              handlePriceChange(localMin, String(val));
            }}
            className="w-full accent-[#C4985A]"
          />
        </div>
      </FilterSection>
    </aside>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ borderTop: "1px solid #EDE8E3", paddingTop: "16px", marginBottom: "16px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between mb-3"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#2C2420",
            fontWeight: 500,
          }}
        >
          {title}
        </span>
        <span
          style={{
            color: "#9E8E88",
            fontSize: "16px",
            fontWeight: 300,
            lineHeight: 1,
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            display: "inline-block",
          }}
        >
          +
        </span>
      </button>
      {open && children}
    </div>
  );
}
