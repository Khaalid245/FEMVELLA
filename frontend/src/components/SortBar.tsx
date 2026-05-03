import type { ShopFilters } from "@/hooks/useShopFilters";

const CATEGORIES = [
  { label: "All",         slug: "" },
  { label: "Abaya",       slug: "abayas" },
  { label: "Dresses",     slug: "dresses" },
  { label: "Evening Wear",slug: "evening-wear" },
  { label: "Scarves",     slug: "scarves-hijabs" },
];

const SORT_OPTIONS = [
  { label: "Newest",            value: "-created_at" },
  { label: "Price: Low → High", value: "price" },
  { label: "Price: High → Low", value: "-price" },
];

interface Props {
  filters: ShopFilters;
  totalCount: number;
  onCategoryChange: (slug: string) => void;
  onSortChange: (value: string) => void;
}

export default function SortBar({
  filters,
  totalCount,
  onCategoryChange,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {CATEGORIES.map((cat) => {
          const active = filters.category === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(cat.slug)}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "7px 16px",
                border: "1px solid",
                borderColor: active ? "#2C2420" : "#DDD5CE",
                background: active ? "#2C2420" : "transparent",
                color: active ? "#fff" : "#6B5B55",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Right side: count + sort */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "#9E8E88",
            whiteSpace: "nowrap",
          }}
        >
          {totalCount} {totalCount === 1 ? "product" : "products"}
        </span>

        <select
          value={filters.ordering}
          onChange={(e) => onSortChange(e.target.value)}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: "#2C2420",
            border: "1px solid #DDD5CE",
            background: "transparent",
            padding: "7px 12px",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
