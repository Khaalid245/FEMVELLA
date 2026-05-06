import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "@/api/products";
import { useCartStore } from "@/store/cartStore";

interface Props {
  product: Product;
}

function LuxuryProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const primaryImage =
    product.images.find((i) => i.is_primary) ?? product.images[0];

  const isOnSale = !!product.sale_price;
  const isOutOfStock = product.total_stock === 0;
  // Guard: if slug is missing or looks like a bare number, use id-based path
  const productPath = product.slug && !/^\d+$/.test(product.slug)
    ? `/products/${product.slug}`
    : `/products/${product.id}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.sale_price ?? product.price,
      quantity: 1,
      image: primaryImage?.image ?? "",
      slug: product.slug,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1600);
  };

  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative bg-white flex flex-col"
      style={{ boxShadow: "0 1px 3px rgba(44,36,32,0.06)" }}
    >
      {/* ── Image ── */}
      <Link to={productPath} className="relative block aspect-[3/4] overflow-hidden bg-[#F5F0EB]">
        {primaryImage ? (
          <img
            src={primaryImage.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ color: "#C4985A", fontSize: "11px", letterSpacing: "0.1em" }}>
              NO IMAGE
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new && <Badge label="New" color="#2C2420" />}
          {isOnSale && <Badge label="Sale" color="#C4985A" />}
          {product.is_bestseller && <Badge label="Bestseller" color="#6B5B55" />}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted((w) => !w); }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
          style={{ borderRadius: "2px" }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill={wishlisted ? "#C4985A" : "none"}
            stroke={wishlisted ? "#C4985A" : "#6B5B55"}
            strokeWidth={1.8}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Add to Cart — hover reveal (outside Link click area via pointer-events) */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="absolute bottom-0 left-0 right-0 py-3 text-white text-[11px] tracking-[0.18em] uppercase font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:cursor-not-allowed"
          style={{ background: isOutOfStock ? "rgba(107,91,85,0.85)" : "rgba(44,36,32,0.92)" }}
        >
          {isOutOfStock ? "Out of Stock" : addedFeedback ? "Added ✓" : "Add to Cart"}
        </button>
      </Link>

      {/* ── Info ── */}
      <div className="pt-3 pb-4 px-1 flex flex-col gap-1">
        <p
          className="text-[10px] tracking-[0.12em] uppercase truncate"
          style={{ color: "#C4985A", fontFamily: "'Inter', sans-serif" }}
        >
          {product.category?.name}
        </p>

        <Link to={productPath}>
          <h3
            className="text-sm font-medium truncate hover:underline underline-offset-2"
            style={{
              color: "#2C2420",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-0.5">
          {isOnSale ? (
            <>
              <span style={{ color: "#C4985A", fontSize: "14px", fontWeight: 600 }}>
                ${product.sale_price}
              </span>
              <span
                className="line-through"
                style={{ color: "#9E8E88", fontSize: "12px" }}
              >
                ${product.price}
              </span>
            </>
          ) : (
            <span style={{ color: "#2C2420", fontSize: "14px", fontWeight: 500 }}>
              ${product.price}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        fontSize: "9px",
        letterSpacing: "0.14em",
        padding: "3px 8px",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        textTransform: "uppercase",
        borderRadius: "1px",
      }}
    >
      {label}
    </span>
  );
}

export default memo(LuxuryProductCard);
