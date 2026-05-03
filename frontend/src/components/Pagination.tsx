import { PAGE_SIZE } from "@/hooks/useShopFilters";

interface Props {
  currentPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalCount, onPageChange }: Props) {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Show max 5 page numbers with ellipsis
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    if (currentPage <= 3) return [...pages.slice(0, 5), -1, totalPages];
    if (currentPage >= totalPages - 2) return [1, -1, ...pages.slice(totalPages - 5)];
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  };

  const visible = getVisiblePages();

  const btnStyle = (active: boolean, disabled = false) => ({
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    fontSize: "12px",
    border: "1px solid",
    borderColor: active ? "#2C2420" : "#DDD5CE",
    background: active ? "#2C2420" : "transparent",
    color: active ? "#fff" : disabled ? "#C8BDB8" : "#2C2420",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s ease",
  });

  return (
    <div className="flex items-center justify-center gap-1.5 mt-12">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={btnStyle(false, currentPage === 1)}
      >
        ←
      </button>

      {visible.map((page, i) =>
        page === -1 ? (
          <span
            key={`ellipsis-${i}`}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9E8E88", padding: "0 4px" }}
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={btnStyle(page === currentPage)}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={btnStyle(false, currentPage === totalPages)}
      >
        →
      </button>
    </div>
  );
}
