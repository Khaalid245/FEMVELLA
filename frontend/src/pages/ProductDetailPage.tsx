import { useState, useCallback, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { useProduct } from "@/api/products";
import { useCartStore } from "@/store/cartStore";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function PDPSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-10 lg:gap-16 animate-pulse">
      <div className="flex gap-3">
        <div className="flex flex-col gap-2 w-16">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-square rounded" style={{ background: "#EDE8E3" }} />
          ))}
        </div>
        <div className="flex-1 aspect-[3/4] rounded" style={{ background: "#EDE8E3" }} />
      </div>
      <div className="flex flex-col gap-4 pt-2">
        <div className="h-3 w-20 rounded" style={{ background: "#EDE8E3" }} />
        <div className="h-8 w-3/4 rounded" style={{ background: "#E5DDD8" }} />
        <div className="h-6 w-1/3 rounded" style={{ background: "#EDE8E3" }} />
        <div className="h-px w-full" style={{ background: "#EDE8E3" }} />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="w-8 h-8 rounded-full" style={{ background: "#EDE8E3" }} />)}
        </div>
        <div className="flex gap-2">
          {SIZES.map((s) => <div key={s} className="w-10 h-10 rounded" style={{ background: "#EDE8E3" }} />)}
        </div>
        <div className="h-12 w-full rounded" style={{ background: "#EDE8E3" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Thumbnail strip
// ─────────────────────────────────────────────
const ThumbnailStrip = memo(function ThumbnailStrip({
  images,
  activeId,
  onSelect,
}: {
  images: { id: number; image: string; is_primary: boolean }[];
  activeId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 w-16 flex-shrink-0">
      {images.map((img) => (
        <button
          key={img.id}
          onClick={() => onSelect(img.id)}
          className="relative aspect-square overflow-hidden transition-all duration-200"
          style={{
            border: activeId === img.id ? "1.5px solid #C4985A" : "1.5px solid transparent",
            outline: "none",
          }}
        >
          <img
            src={img.image}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
        </button>
      ))}
    </div>
  );
});

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProduct(slug!);
  const addItem = useCartStore((s) => s.addItem);

  const [activeImageId, setActiveImageId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [descOpen, setDescOpen] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [cartFeedback, setCartFeedback] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    // Validate size if sizes exist
    if (product.sizes.length > 0 && !selectedSize) {
      setValidationError("Please select a size.");
      return;
    }
    if (product.stock === 0) return;

    setValidationError(null);
    const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];

    addItem({
      id: product.id,
      name: product.name,
      price: product.sale_price ?? product.price,
      quantity,
      image: primaryImage?.image ?? "",
      slug: product.slug,
    });

    setCartFeedback(true);
    setTimeout(() => setCartFeedback(false), 2000);
  }, [product, selectedSize, quantity, addItem]);

  // ── Loading ──
  if (isLoading) {
    return (
      <Layout>
        <PDPSkeleton />
      </Layout>
    );
  }

  // ── Error / Not found ──
  if (isError || !product) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "28px",
              fontWeight: 400,
              color: "#2C2420",
            }}
          >
            Product not found
          </p>
          <Link
            to="/products"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#fff",
              background: "#2C2420",
              padding: "14px 32px",
              textDecoration: "none",
            }}
          >
            Back to Shop
          </Link>
        </div>
      </Layout>
    );
  }

  const images = product.images;
  const activeImage =
    images.find((i) => i.id === activeImageId) ??
    images.find((i) => i.is_primary) ??
    images[0];

  const isOutOfStock = product.stock === 0;
  const isOnSale = !!product.sale_price;

  return (
    <Layout>
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">

        {/* ══════════════════════════
            LEFT — Images
        ══════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex gap-3"
        >
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <ThumbnailStrip
              images={images}
              activeId={activeImage?.id ?? -1}
              onSelect={setActiveImageId}
            />
          )}

          {/* Main image */}
          <div className="flex-1 relative aspect-[3/4] overflow-hidden group" style={{ background: "#F5F0EB" }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage?.id}
                src={activeImage?.image}
                alt={product.name}
                loading="lazy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </AnimatePresence>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.is_new && <PDPBadge label="New" bg="#2C2420" />}
              {isOnSale && product.discount_percent && (
                <PDPBadge label={`-${product.discount_percent}%`} bg="#C4985A" />
              )}
              {product.is_bestseller && <PDPBadge label="Bestseller" bg="#6B5B55" />}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════
            RIGHT — Info
        ══════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col pt-2"
        >
          {/* Category */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C4985A",
              marginBottom: "12px",
            }}
          >
            {product.category?.name}
          </p>

          {/* Name */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 400,
              color: "#2C2420",
              lineHeight: 1.1,
              marginBottom: "20px",
              letterSpacing: "-0.01em",
            }}
          >
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-3 mb-5">
            {isOnSale ? (
              <>
                <span style={{ fontSize: "24px", fontWeight: 600, color: "#C4985A" }}>
                  ${product.sale_price}
                </span>
                <span style={{ fontSize: "16px", color: "#9E8E88", textDecoration: "line-through" }}>
                  ${product.price}
                </span>
                {product.discount_percent && (
                  <span
                    style={{
                      fontSize: "11px",
                      background: "#C4985A",
                      color: "#fff",
                      padding: "3px 8px",
                      letterSpacing: "0.08em",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    -{product.discount_percent}%
                  </span>
                )}
              </>
            ) : (
              <span style={{ fontSize: "24px", fontWeight: 500, color: "#2C2420" }}>
                ${product.price}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          <div className="flex items-center gap-2 mb-6">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: isOutOfStock ? "#E57373" : "#81C784" }}
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                color: isOutOfStock ? "#E57373" : "#6B5B55",
                letterSpacing: "0.04em",
              }}
            >
              {isOutOfStock ? "Out of stock" : `${product.stock} in stock`}
            </span>
          </div>

          <div className="h-px mb-6" style={{ background: "#EDE8E3" }} />

          {/* Color selector */}
          {product.colors.length > 0 && (
            <div className="mb-6">
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#6B5B55",
                  marginBottom: "10px",
                }}
              >
                Color
                {selectedColor !== null && (
                  <span style={{ color: "#2C2420", marginLeft: "8px", textTransform: "none", letterSpacing: 0 }}>
                    — {product.colors.find((c) => c.id === selectedColor)?.name}
                  </span>
                )}
              </p>
              <div className="flex gap-2.5 flex-wrap">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    title={color.name}
                    className="w-8 h-8 rounded-full transition-all duration-200"
                    style={{
                      background: color.hex_code,
                      border: selectedColor === color.id
                        ? "2px solid #2C2420"
                        : "2px solid transparent",
                      outline: selectedColor === color.id ? "1px solid #C4985A" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {product.sizes.length > 0 && (
            <div className="mb-6">
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#6B5B55",
                  marginBottom: "10px",
                }}
              >
                Size
              </p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map(({ id, size, in_stock }) => (
                  <button
                    key={id}
                    onClick={() => in_stock && setSelectedSize(size)}
                    disabled={!in_stock}
                    style={{
                      width: "44px",
                      height: "44px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.06em",
                      border: "1px solid",
                      borderColor: selectedSize === size ? "#2C2420" : "#DDD5CE",
                      background: selectedSize === size ? "#2C2420" : "transparent",
                      color: selectedSize === size ? "#fff" : in_stock ? "#2C2420" : "#C8BDB8",
                      cursor: in_stock ? "pointer" : "not-allowed",
                      textDecoration: !in_stock ? "line-through" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#6B5B55",
                marginBottom: "10px",
              }}
            >
              Quantity
            </p>
            <div className="flex items-center" style={{ border: "1px solid #DDD5CE", width: "fit-content" }}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center transition-colors duration-150 hover:bg-gray-50"
                style={{ color: "#2C2420", fontSize: "18px", fontWeight: 300 }}
              >
                −
              </button>
              <span
                className="w-10 h-10 flex items-center justify-center"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  color: "#2C2420",
                  borderLeft: "1px solid #DDD5CE",
                  borderRight: "1px solid #DDD5CE",
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="w-10 h-10 flex items-center justify-center transition-colors duration-150 hover:bg-gray-50 disabled:opacity-40"
                style={{ color: "#2C2420", fontSize: "18px", fontWeight: 300 }}
              >
                +
              </button>
            </div>
          </div>

          {/* Validation error */}
          <AnimatePresence>
            {validationError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  color: "#E57373",
                  marginBottom: "10px",
                }}
              >
                {validationError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* CTAs */}
          <div className="flex gap-3 mb-6">
            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 h-12 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isOutOfStock ? "#9E8E88" : "#2C2420",
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 500,
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                if (!isOutOfStock)
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {isOutOfStock
                ? "Out of Stock"
                : cartFeedback
                ? "Added ✓"
                : "Add to Cart"}
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setWishlisted((w) => !w)}
              className="w-12 h-12 flex items-center justify-center transition-all duration-200"
              style={{
                border: "1px solid #DDD5CE",
                background: wishlisted ? "#FDF4F7" : "transparent",
              }}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24"
                fill={wishlisted ? "#C4985A" : "none"}
                stroke={wishlisted ? "#C4985A" : "#6B5B55"}
                strokeWidth={1.6}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          {/* Description — collapsible */}
          <div style={{ borderTop: "1px solid #EDE8E3" }}>
            <button
              onClick={() => setDescOpen((o) => !o)}
              className="w-full flex items-center justify-between py-4 transition-colors duration-150"
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
                Description
              </span>
              <span
                style={{
                  color: "#9E8E88",
                  fontSize: "18px",
                  fontWeight: 300,
                  lineHeight: 1,
                  transform: descOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  display: "inline-block",
                }}
              >
                +
              </span>
            </button>

            <AnimatePresence initial={false}>
              {descOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <p
                    className="pb-5"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      lineHeight: 1.85,
                      color: "#6B5B55",
                    }}
                  >
                    {product.description || "No description available."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

function PDPBadge({ label, bg }: { label: string; bg: string }) {
  return (
    <span
      style={{
        background: bg,
        color: "#fff",
        fontSize: "9px",
        letterSpacing: "0.14em",
        padding: "3px 8px",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}
