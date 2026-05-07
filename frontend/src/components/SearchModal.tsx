import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useSearchContext } from "@/contexts/SearchContext";
import { highlightMatch } from "@/utils/highlight";
import type { AutocompleteSuggestion, RecentlyViewedProduct, TrendingQuery } from "@/api/search";

const ease = [0.22, 1, 0.36, 1] as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "10px",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#9E8E88",
        padding: "16px 20px 8px",
      }}
    >
      {children}
    </p>
  );
}

function SuggestionRow({
  suggestion,
  query,
  index,
  activeIndex,
  onSelect,
  onHover,
}: {
  suggestion: AutocompleteSuggestion;
  query: string;
  index: number;
  activeIndex: number;
  onSelect: (s: AutocompleteSuggestion, i: number) => void;
  onHover: (i: number) => void;
}) {
  const isActive = index === activeIndex;

  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(suggestion, index);
      }}
      onMouseEnter={() => onHover(index)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "10px 20px",
        background: isActive ? "#F8F6F3" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s ease",
      }}
    >
      {/* Thumbnail or icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          flexShrink: 0,
          background: "#F0EBE5",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {suggestion.image ? (
          <img
            src={suggestion.image}
            alt={suggestion.text}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4985A" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: suggestion.type === "product" ? "'Cormorant Garamond', Georgia, serif" : "'Inter', sans-serif",
            fontSize: suggestion.type === "product" ? "15px" : "13px",
            color: "#2C2420",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {highlightMatch(suggestion.text, query)}
        </p>
        {suggestion.category && (
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              color: "#9E8E88",
              margin: "2px 0 0",
            }}
          >
            {suggestion.category}
          </p>
        )}
      </div>

      {/* Price */}
      {suggestion.price && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            color: "#C4985A",
            flexShrink: 0,
          }}
        >
          ${suggestion.price}
        </span>
      )}

      {/* Arrow */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C4C0BC"
        strokeWidth="1.8"
        style={{ flexShrink: 0, opacity: isActive ? 1 : 0, transition: "opacity 0.15s" }}
      >
        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function TrendingChip({
  item,
  onSelect,
}: {
  item: TrendingQuery;
  onSelect: (q: string) => void;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(item.query);
      }}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "12px",
        color: "#2C2420",
        background: "#F8F6F3",
        border: "1px solid #EDE8E3",
        padding: "6px 14px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#C4985A";
        (e.currentTarget as HTMLElement).style.color = "#C4985A";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#EDE8E3";
        (e.currentTarget as HTMLElement).style.color = "#2C2420";
      }}
    >
      {item.query}
    </button>
  );
}

function RecentCard({
  product,
  onClose,
}: {
  product: RecentlyViewedProduct;
  onClose: () => void;
}) {
  return (
    <Link
      to={`/products/${product.slug}`}
      onMouseDown={onClose}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
      >
        <div
          style={{
            aspectRatio: "3/4",
            background: "#F0EBE5",
            overflow: "hidden",
          }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#EDE8E3" }} />
          )}
        </div>
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "13px",
            color: "#2C2420",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.name}
        </p>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "#C4985A",
            margin: 0,
            fontWeight: 500,
          }}
        >
          ${product.price}
        </p>
      </div>
    </Link>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function SearchModal() {
  const {
    isOpen,
    close,
    query,
    setQuery,
    suggestions,
    trending,
    recentlyViewed,
    loading,
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    submit,
    selectSuggestion,
    inputRef,
  } = useSearch();

  const showSuggestions = query.length >= 2;
  const showDefault = !showSuggestions;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(44,36,32,0.45)",
              backdropFilter: "blur(4px)",
              zIndex: 50,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.28, ease }}
            style={{
              position: "fixed",
              top: "72px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(680px, calc(100vw - 32px))",
              background: "#fff",
              zIndex: 51,
              boxShadow: "0 24px 80px rgba(44,36,32,0.18)",
              maxHeight: "calc(100vh - 120px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Input row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                borderBottom: "1px solid #EDE8E3",
              }}
            >
              {/* Search icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9E8E88" strokeWidth="1.8" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, categories…"
                autoComplete="off"
                spellCheck={false}
                style={{
                  flex: 1,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  color: "#2C2420",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                }}
              />

              {/* Loading spinner */}
              {loading && (
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid #EDE8E3",
                    borderTopColor: "#C4985A",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    flexShrink: 0,
                  }}
                />
              )}

              {/* Clear */}
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9E8E88",
                    padding: "2px",
                    display: "flex",
                    flexShrink: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9E8E88")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}

              {/* Kbd hint */}
              <kbd
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "10px",
                  color: "#9E8E88",
                  border: "1px solid #EDE8E3",
                  borderRadius: "3px",
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", flex: 1 }}>

              {/* ── Autocomplete results ── */}
              {showSuggestions && (
                <>
                  {suggestions.length > 0 ? (
                    <>
                      <SectionLabel>Suggestions</SectionLabel>
                      {suggestions.map((s, i) => (
                        <SuggestionRow
                          key={`${s.type}-${s.text}-${i}`}
                          suggestion={s}
                          query={query}
                          index={i}
                          activeIndex={activeIndex}
                          onSelect={selectSuggestion}
                          onHover={setActiveIndex}
                        />
                      ))}
                    </>
                  ) : !loading ? (
                    <div
                      style={{
                        padding: "48px 20px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: "22px",
                          color: "#2C2420",
                          marginBottom: "8px",
                        }}
                      >
                        No results for "{query}"
                      </p>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "13px",
                          color: "#9E8E88",
                        }}
                      >
                        Try a different term or browse our collection.
                      </p>
                    </div>
                  ) : null}

                  {/* Search all link */}
                  {suggestions.length > 0 && (
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        submit();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "12px 20px",
                        borderTop: "1px solid #EDE8E3",
                        background: "transparent",
                        border: "none",
                        borderTop: "1px solid #EDE8E3",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#F8F6F3")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "12px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#2C2420",
                        }}
                      >
                        See all results for "{query}"
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4985A" strokeWidth="1.8">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </>
              )}

              {/* ── Default state: trending + recently viewed ── */}
              {showDefault && (
                <>
                  {/* Trending */}
                  {trending.length > 0 && (
                    <div style={{ padding: "0 0 8px" }}>
                      <SectionLabel>Trending</SectionLabel>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          padding: "4px 20px 16px",
                        }}
                      >
                        {trending.map((t) => (
                          <TrendingChip
                            key={t.query}
                            item={t}
                            onSelect={(q) => {
                              setQuery(q);
                              submit(q);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recently Viewed */}
                  {recentlyViewed.length > 0 && (
                    <div style={{ borderTop: trending.length > 0 ? "1px solid #EDE8E3" : "none" }}>
                      <SectionLabel>Recently Viewed</SectionLabel>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${Math.min(recentlyViewed.length, 4)}, 1fr)`,
                          gap: "12px",
                          padding: "4px 20px 20px",
                        }}
                      >
                        {recentlyViewed.slice(0, 4).map((p) => (
                          <RecentCard key={p.id} product={p} onClose={close} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty default state */}
                  {trending.length === 0 && recentlyViewed.length === 0 && (
                    <div style={{ padding: "40px 20px", textAlign: "center" }}>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "13px",
                          color: "#9E8E88",
                        }}
                      >
                        Start typing to search our collection
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div
              style={{
                borderTop: "1px solid #EDE8E3",
                padding: "10px 20px",
                display: "flex",
                gap: "16px",
                alignItems: "center",
              }}
            >
              {[
                { key: "↑↓", label: "navigate" },
                { key: "↵", label: "select" },
                { key: "ESC", label: "close" },
              ].map(({ key, label }) => (
                <span
                  key={key}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    color: "#9E8E88",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <kbd
                    style={{
                      border: "1px solid #EDE8E3",
                      borderRadius: "3px",
                      padding: "1px 5px",
                      fontSize: "10px",
                      color: "#6B5B55",
                    }}
                  >
                    {key}
                  </kbd>
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Spinner keyframe */}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}
