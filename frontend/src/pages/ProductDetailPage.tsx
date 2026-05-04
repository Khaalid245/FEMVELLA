import { useState, useCallback, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { useProduct } from "@/api/products";
import type { ProductVariant } from "@/api/products";
import { useCartStore } from "@/store/cartStore";

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function PDPSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-10 lg:gap-16 animate-pulse">
      <div className="flex gap-3">
        <div className="flex flex-col gap-2 w-16">
          {[0,1,2].map((i) => <div key={i} className="aspect-square rounded" style={{ background: "#EDE8E3" }} />)}
        </div>
        <div className="flex-1 aspect-[3/4] rounded" style={{ background: "#EDE8E3" }} />
      </div>
      <div className="flex flex-col gap-4 pt-2">
        <div className="h-3 w-20 rounded" style={{ background: "#EDE8E3" }} />
        <div className="h-8 w-3/4 rounded" style={{ background: "#E5DDD8" }} />
        <div className="h-6 w-1/3 rounded" style={{ background: "#EDE8E3" }} />
        <div className="h-px w-full" style={{ background: "#EDE8E3" }} />
        <div className="flex gap-2">
          {["XS","S","M","L","XL"].map((s) => <div key={s} className="w-12 h-12 rounded" style={{ background: "#EDE8E3" }} />)}
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
  images, activeId, onSelect,
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
          style={{ border: activeId === img.id ? "1.5px solid #C4985A" : "1.5px solid transparent", outline: "none" }}
        >
          <img src={img.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" />
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

  const [activeImageId, setActiveImageId]   = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [customizationText, setCustomizationText] = useState("");
  const [quantity, setQuantity]             = useState(1);
  const [descOpen, setDescOpen]             = useState(true);
  const [wishlisted, setWishlisted]         = useState(false);
  const [cartFeedback, setCartFeedback]     = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    const hasVariants = product.variants.length > 0;

    // For products with variants: require both size and color
    // For products without variants but with sizes/colors: require selection only if they exist
    const requiresSize = (hasVariants && sizes.length > 0) || (!hasVariants && sizes.length > 0);
    const requiresColor = (hasVariants && colors.length > 0) || (!hasVariants && colors.length > 0);
    
    if (requiresSize && !selectedSize) {
      setValidationError("Please select a size.");
      return;
    }
    
    if (requiresColor && !selectedColor) {
      setValidationError("Please select a color.");
      return;
    }

    // Find matching variant
    let selectedVariant: ProductVariant | null = null;
    if (hasVariants && selectedSize && selectedColor) {
      selectedVariant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor) || null;
      if (!selectedVariant) {
        setValidationError("Selected size and color combination is not available.");
        return;
      }
      if (selectedVariant.stock === 0) {
        setValidationError("This size and color combination is out of stock.");
        return;
      }
    }

    // Check general stock for products without variants
    if (!hasVariants && product.stock === 0) {
      setValidationError("This item is out of stock.");
      return;
    }

    setValidationError(null);
    const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];
    const price = selectedVariant
      ? selectedVariant.effective_price
      : (product.sale_price ?? product.price);

    addItem({
      id:         product.id,
      variant_id: selectedVariant?.id,
      name:       product.name,
      size:       selectedSize,
      color:      selectedVariant?.color || undefined,
      price,
      quantity,
      image:      primaryImage?.image ?? "",
      slug:       product.slug,
      customization_text: customizationText || undefined,
    });

    setCartFeedback(true);
    setTimeout(() => setCartFeedback(false), 2000);
  }, [product, selectedSize, selectedColor, quantity, customizationText, addItem]);

  if (isLoading) return <Layout><PDPSkeleton /></Layout>;

  if (isError || !product) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: 400, color: "#2C2420" }}>
            Product not found
          </p>
          <Link to="/products" style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", background: "#2C2420", padding: "14px 32px", textDecoration: "none" }}>
            Back to Shop
          </Link>
        </div>
      </Layout>
    );
  }

  const images = product.images;
  const activeImage = images.find((i) => i.id === activeImageId) ?? images.find((i) => i.is_primary) ?? images[0];
  
  // Define hasVariants first
  const hasVariants = product.variants.length > 0;
  
  // Extract unique sizes and colors from variants OR use product.sizes/colors as fallback
  // For testing: add some default sizes if none exist
  const sizes = hasVariants 
    ? [...new Set(product.variants.map(v => v.size))] 
    : product.sizes?.map(s => s.size) || ['XS', 'S', 'M', 'L', 'XL'];
  const colors = hasVariants 
    ? [...new Set(product.variants.map(v => v.color).filter(Boolean))] 
    : product.colors?.map(c => c.name) || ['Black', 'Navy', 'Brown'];
  
  // Find available colors for selected size
  const availableColorsForSize = selectedSize 
    ? [...new Set(product.variants.filter(v => v.size === selectedSize).map(v => v.color).filter(Boolean))]
    : colors;
  
  // Find available sizes for selected color
  const availableSizesForColor = selectedColor
    ? [...new Set(product.variants.filter(v => v.color === selectedColor).map(v => v.size))]
    : sizes;
  
  const selectedVariant = hasVariants && selectedSize && selectedColor 
    ? product.variants.find(v => v.size === selectedSize && v.color === selectedColor) 
    : null;
  const availableStock = selectedVariant ? selectedVariant.stock : product.total_stock;
  const isOutOfStock = availableStock === 0;
  const canAddToCart = (() => {
    if (hasVariants) {
      return !!selectedSize && !!selectedColor && !!selectedVariant && selectedVariant.stock > 0;
    } else {
      const needsSize = sizes.length > 0;
      const needsColor = colors.length > 0;
      const hasRequiredSelections = (!needsSize || selectedSize) && (!needsColor || selectedColor);
      return hasRequiredSelections && !isOutOfStock;
    }
  })();
  const isOnSale = !!product.sale_price;
  const displayPrice = selectedVariant?.effective_price ?? (product.sale_price ?? product.price);
  const maxQty = selectedVariant ? selectedVariant.stock : product.stock;

  // Group variants by size for display
  const variantsBySize = product.variants.reduce<Record<string, ProductVariant[]>>((acc, v) => {
    if (!acc[v.size]) acc[v.size] = [];
    acc[v.size].push(v);
    return acc;
  }, {});

  return (
    <Layout>
      <div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 py-8"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}
      >

        {/* LEFT — Images */}
        <motion.div
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center items-center"
        >
          <div className="flex gap-3" style={{ width: "100%", maxWidth: "520px" }}>
            {images.length > 1 && (
              <ThumbnailStrip images={images} activeId={activeImage?.id ?? -1} onSelect={setActiveImageId} />
            )}
            <div 
              className="flex-1 relative aspect-[3/4] overflow-hidden group" 
              style={{ 
                background: "#F5F0EB", 
                width: "100%",
                maxWidth: images.length > 1 ? "calc(520px - 76px)" : "520px",
                borderRadius: "4px"
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage?.id}
                  src={activeImage?.image}
                  alt={product.name}
                  loading="lazy"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </AnimatePresence>
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.is_new && <PDPBadge label="New" bg="#2C2420" />}
                {isOnSale && product.discount_percent && <PDPBadge label={`-${product.discount_percent}%`} bg="#C4985A" />}
                {product.is_bestseller && <PDPBadge label="Bestseller" bg="#6B5B55" />}
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT — Info */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center"
          style={{ padding: "32px 0" }}
        >
          {/* Category */}
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C4985A", marginBottom: "12px" }}>
            {product.category?.name}
          </p>

          {/* Name */}
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 400, color: "#2C2420", lineHeight: 1.1, marginBottom: "20px", letterSpacing: "-0.01em" }}>
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-3 mb-5">
            <span style={{ fontSize: "24px", fontWeight: 600, color: isOnSale ? "#C4985A" : "#2C2420" }}>
              ${displayPrice}
            </span>
            {isOnSale && !selectedVariant?.price_override && (
              <span style={{ fontSize: "16px", color: "#9E8E88", textDecoration: "line-through" }}>${product.price}</span>
            )}
            {isOnSale && product.discount_percent && !selectedVariant?.price_override && (
              <span style={{ fontSize: "11px", background: "#C4985A", color: "#fff", padding: "3px 8px", letterSpacing: "0.08em", fontFamily: "'Inter', sans-serif" }}>
                -{product.discount_percent}%
              </span>
            )}
          </div>

          {/* Stock indicator */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full" style={{ background: isOutOfStock ? "#E57373" : "#81C784" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: isOutOfStock ? "#E57373" : "#6B5B55", letterSpacing: "0.04em" }}>
              {isOutOfStock
                ? "Out of stock"
                : selectedVariant
                  ? `${selectedVariant.stock} in stock`
                  : `${product.total_stock} in stock`}
            </span>
          </div>

          {/* Size Selection */}
          {(hasVariants && sizes.length > 0) || (!hasVariants && sizes.length > 0) ? (
            <div className="mb-6">
              <label className="block mb-3" style={{ 
                fontFamily: "'Inter', sans-serif", 
                fontSize: "10px", 
                letterSpacing: "0.1em", 
                textTransform: "uppercase", 
                color: "#6B5B55" 
              }}>
                SIZE
              </label>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const isDisabled = hasVariants && selectedColor ? !availableSizesForColor.includes(size) : false;
                  
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        if (isDisabled) return;
                        setSelectedSize(size);
                        // Reset color if current color not available for this size (only for variants)
                        if (hasVariants && selectedColor && !product.variants.some(v => v.size === size && v.color === selectedColor)) {
                          setSelectedColor(null);
                        }
                      }}
                      disabled={isDisabled}
                      className="w-11 h-11 flex items-center justify-center transition-all duration-200"
                      style={{
                        border: isSelected ? "1px solid #2C2420" : "1px solid #DDD5CE",
                        background: isSelected ? "#2C2420" : "transparent",
                        color: isSelected ? "#fff" : isDisabled ? "#C8BDB8" : "#2C2420",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? 0.5 : 1
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Color Selection */}
          {(hasVariants && colors.length > 0) || (!hasVariants && colors.length > 0) ? (
            <div className="mb-6">
              <label className="block mb-3" style={{ 
                fontFamily: "'Inter', sans-serif", 
                fontSize: "10px", 
                letterSpacing: "0.1em", 
                textTransform: "uppercase", 
                color: "#6B5B55" 
              }}>
                COLOR
              </label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => {
                  const isSelected = selectedColor === color;
                  const isDisabled = hasVariants && selectedSize ? !availableColorsForSize.includes(color) : false;
                  
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        if (isDisabled) return;
                        setSelectedColor(color);
                        // Reset size if current size not available for this color (only for variants)
                        if (hasVariants && selectedSize && !product.variants.some(v => v.color === color && v.size === selectedSize)) {
                          setSelectedSize(null);
                        }
                      }}
                      disabled={isDisabled}
                      className="w-8 h-8 rounded-full border-2 transition-all duration-200 relative"
                      style={{
                        backgroundColor: color?.toLowerCase() || "#f0f0f0",
                        borderColor: isSelected ? "#2C2420" : isDisabled ? "#E5E5E5" : "#DDD5CE",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? 0.5 : 1,
                        transform: isSelected ? "scale(1.1)" : "scale(1)"
                      }}
                      title={color}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 rounded-full border-2 border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedColor && (
                <p style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: "11px", 
                  color: "#6B5B55",
                  marginTop: "8px",
                  textTransform: "capitalize"
                }}>
                  Selected: {selectedColor}
                </p>
              )}
            </div>
          ) : null}

          {/* Customization */}
          {product.is_customizable && (
            <div className="mb-4">
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B5B55", marginBottom: "8px" }}>
                Add customization (optional)
              </p>
              <textarea
                value={customizationText}
                onChange={(e) => setCustomizationText(e.target.value)}
                placeholder="Enter your customization details..."
                rows={2}
                className="w-full p-2 resize-none"
                style={{
                  border: "1px solid #DDD5CE",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  color: "#2C2420",
                  background: "#FEFEFE",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  borderRadius: "2px"
                }}
                onFocus={(e) => e.target.style.borderColor = "#C4985A"}
                onBlur={(e) => e.target.style.borderColor = "#DDD5CE"}
              />
            </div>
          )}

          {/* Quantity */}
          <div className="mb-4">
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B5B55", marginBottom: "8px" }}>
              Quantity
            </p>
            <div className="flex items-center" style={{ border: "1px solid #DDD5CE", width: "fit-content", borderRadius: "2px" }}>
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50" style={{ color: "#2C2420", fontSize: "16px", fontWeight: 300 }}>−</button>
              <span className="w-8 h-8 flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", borderLeft: "1px solid #DDD5CE", borderRight: "1px solid #DDD5CE" }}>{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40" style={{ color: "#2C2420", fontSize: "16px", fontWeight: 300 }}>+</button>
            </div>
          </div>

          {/* Validation error */}
          <AnimatePresence>
            {validationError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#E57373", marginBottom: "10px" }}>
                {validationError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* CTAs */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="flex-1 h-12 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: !canAddToCart ? "#9E8E88" : "#2C2420", 
                color: "#fff", 
                fontFamily: "'Inter', sans-serif", 
                fontSize: "11px", 
                letterSpacing: "0.18em", 
                textTransform: "uppercase", 
                fontWeight: 500 
              }}
              onMouseEnter={(e) => { if (canAddToCart) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              {!canAddToCart 
                ? (() => {
                    if (hasVariants && (!selectedSize || !selectedColor)) return "Select Options";
                    if (!hasVariants && ((sizes.length > 0 && !selectedSize) || (colors.length > 0 && !selectedColor))) return "Select Options";
                    return "Out of Stock";
                  })()
                : cartFeedback 
                  ? "Added ✓" 
                  : "Add to Cart"
              }
            </button>
            <button
              onClick={() => setWishlisted((w) => !w)}
              className="w-12 h-12 flex items-center justify-center transition-all duration-200"
              style={{ border: "1px solid #DDD5CE", background: wishlisted ? "#FDF4F7" : "transparent" }}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? "#C4985A" : "none"} stroke={wishlisted ? "#C4985A" : "#6B5B55"} strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <div style={{ borderTop: "1px solid #EDE8E3" }}>
            <button onClick={() => setDescOpen((o) => !o)} className="w-full flex items-center justify-between py-4" style={{ background: "none", border: "none", cursor: "pointer" }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#2C2420", fontWeight: 500 }}>Description</span>
              <span style={{ color: "#9E8E88", fontSize: "18px", fontWeight: 300, lineHeight: 1, transform: descOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s ease", display: "inline-block" }}>+</span>
            </button>
            <AnimatePresence initial={false}>
              {descOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
                  <p className="pb-5" style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", lineHeight: 1.85, color: "#6B5B55" }}>
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
    <span style={{ background: bg, color: "#fff", fontSize: "9px", letterSpacing: "0.14em", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontWeight: 500, textTransform: "uppercase" }}>
      {label}
    </span>
  );
}
