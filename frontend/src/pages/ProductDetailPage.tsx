import { useState, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import ProductImageGallery from "@/components/ProductImageGallery";
import DynamicSizeSelector from "@/components/DynamicSizeSelector";
import ColorSwatch from "@/components/ColorSwatch";
import { useProduct } from "@/api/products";
import type { ProductVariant } from "@/api/products";
import { useCartStore } from "@/store/cartStore";
import { useQueryClient } from "@tanstack/react-query";
import { useVariantSelection } from "@/hooks/useVariantSelection";

export { type ProductImage } from "@/api/products";

function PDPSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-10 lg:gap-16 animate-pulse">
      <div className="flex-1 aspect-[3/4] rounded" style={{ background: "#EDE8E3" }} />
      <div className="flex flex-col gap-4 pt-2">
        <div className="h-3 w-20 rounded" style={{ background: "#EDE8E3" }} />
        <div className="h-8 w-3/4 rounded" style={{ background: "#E5DDD8" }} />
        <div className="h-6 w-1/3 rounded" style={{ background: "#EDE8E3" }} />
        <div className="h-px w-full" style={{ background: "#EDE8E3" }} />
        <div className="flex gap-2">
          {[1,2,3,4].map((i) => <div key={i} className="w-12 h-12 rounded" style={{ background: "#EDE8E3" }} />)}
        </div>
        <div className="h-12 w-full rounded" style={{ background: "#EDE8E3" }} />
      </div>
    </div>
  );
}

function PDPBadge({ label, bg }: { label: string; bg: string }) {
  return (
    <span style={{ background: bg, color: "#fff", fontSize: "9px", letterSpacing: "0.14em", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontWeight: 500, textTransform: "uppercase" }}>
      {label}
    </span>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!slug) navigate("/products", { replace: true });
  }, [slug, navigate]);

  const { data: product, isLoading, isError } = useProduct(slug!);
  const addItem = useCartStore((s) => s.addItem);

  // Use variant selection hook
  const variantSelection = useVariantSelection({
    variants: product?.variants || [],
    colors: product?.colors || []
  });

  const {
    selectedSize,
    selectedColor,
    selectedVariant,
    availableSizes,
    availableColors,
    sizesForColor,
    colorsForSize,
    validation,
    isSelectionComplete,
    handleSizeSelect,
    handleColorSelect,
    reset: resetSelection,
    hasVariants
  } = variantSelection;

  useEffect(() => {
    if (isError) {
      queryClient.removeQueries({ queryKey: ["product", slug] });
      navigate("/products", { replace: true });
    }
  }, [isError, navigate, queryClient, slug]);

  const [customizationText, setCustomizationText] = useState("");
  const [quantity, setQuantity]           = useState(1);
  const [descOpen, setDescOpen]           = useState(true);
  const [wishlisted, setWishlisted]       = useState(false);
  const [cartFeedback, setCartFeedback]   = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset selections when product changes
  useEffect(() => {
    resetSelection();
    setQuantity(1);
    setValidationError(null);
  }, [product?.id, resetSelection]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    // Check if size selection is required and missing
    if (hasVariants && availableSizes.length > 0 && !selectedSize) {
      setValidationError("Please select a size.");
      return;
    }
    
    // Check if color selection is required and missing
    if (hasVariants && availableColors.length > 0 && !selectedColor) {
      setValidationError("Please select a color.");
      return;
    }

    // Validate selection for products with variants
    if (hasVariants && !validation.isValid) {
      setValidationError("This combination is not available.");
      return;
    }
    
    if (hasVariants && !validation.inStock) {
      setValidationError("This combination is out of stock.");
      return;
    }

    // Check general stock for products without variants
    if (!hasVariants && product.stock === 0) {
      setValidationError("This item is out of stock.");
      return;
    }

    setValidationError(null);
    const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];
    const price = selectedVariant?.effective_price ?? product.sale_price ?? product.price;

    addItem({
      id:         product.id,
      variant_id: selectedVariant?.id,
      name:       product.name,
      size:       selectedSize,
      color:      selectedVariant?.color || selectedColor || undefined,
      price,
      quantity,
      image:      primaryImage?.image ?? "",
      slug:       product.slug,
      customization_text: customizationText || undefined,
    });

    setCartFeedback(true);
    setTimeout(() => setCartFeedback(false), 2000);
  }, [product, selectedSize, selectedColor, quantity, customizationText, addItem, hasVariants, availableSizes, availableColors, selectedVariant, validation]);

  if (!slug) return null;
  if (isLoading) return <Layout><div className="py-16"><PDPSkeleton /></div></Layout>;
  if (isError || !product) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: 400, color: "#2C2420" }}>Product not found</p>
        <Link to="/products" style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", background: "#2C2420", padding: "14px 32px", textDecoration: "none" }}>
          Back to Shop
        </Link>
      </div>
    </Layout>
  );

  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : product.total_stock === 0;
  const canAddToCart = hasVariants
    ? isSelectionComplete && validation.inStock
    : !isOutOfStock;

  const isOnSale    = !!product.sale_price;
  const displayPrice = selectedVariant?.effective_price ?? product.sale_price ?? product.price;
  const maxQty      = selectedVariant ? selectedVariant.stock : product.stock;

  const btnStyle = {
    border: "1px solid #DDD5CE",
    background: "transparent",
    color: "#2C2420",
    fontFamily: "'Inter', sans-serif",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
  } as const;

  const selectedBtnStyle = {
    ...btnStyle,
    border: "1.5px solid #2C2420",
    background: "#2C2420",
    color: "#fff",
  } as const;

  const disabledBtnStyle = {
    ...btnStyle,
    opacity: 0.35,
    cursor: "not-allowed",
    color: "#C8BDB8",
  } as const;

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
          className="flex justify-center items-start"
        >
          <div className="relative" style={{ width: "100%", maxWidth: "520px" }}>
            <ProductImageGallery 
              images={product.images} 
              productName={product.name}
            />
            
            {/* Product Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              {product.is_new && <PDPBadge label="New" bg="#2C2420" />}
              {isOnSale && product.discount_percent && <PDPBadge label={`-${product.discount_percent}%`} bg="#C4985A" />}
              {product.is_bestseller && <PDPBadge label="Bestseller" bg="#6B5B55" />}
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
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 400, color: "#2C2420", lineHeight: 1.1, marginBottom: "20px" }}>
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
              <span style={{ fontSize: "11px", background: "#C4985A", color: "#fff", padding: "3px 8px", fontFamily: "'Inter', sans-serif" }}>
                -{product.discount_percent}%
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full" style={{ background: isOutOfStock ? "#E57373" : "#81C784" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: isOutOfStock ? "#E57373" : "#6B5B55" }}>
              {isOutOfStock
                ? "Out of stock"
                : selectedVariant
                  ? `${selectedVariant.stock} in stock`
                  : `${product.total_stock} in stock`}
            </span>
          </div>

          {/* Dynamic Size Selection */}
          {hasVariants && availableSizes.length > 0 && (
            <DynamicSizeSelector
              variants={product.variants}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              onSizeSelect={handleSizeSelect}
              showError={validationError === "Please select a size."}
            />
          )}

          {/* Luxury Color Selection */}
          {product?.colors && product.colors.length > 0 && (
            <ColorSwatch
              colors={product.colors.map(c => ({
                color_name: c.name,
                color_hex: c.hex_code
              }))}
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
              disabledColors={hasVariants && selectedSize ? 
                product.colors
                  .filter(c => !colorsForSize.includes(c.name))
                  .map(c => c.name) : 
                []
              }
              showError={validationError === "Please select a color."}
            />
          )}

          {/* Customization */}
          {product.is_customizable && (
            <div className="mb-4">
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B5B55", marginBottom: "8px" }}>
                Customization (optional)
              </p>
              <textarea
                value={customizationText}
                onChange={(e) => setCustomizationText(e.target.value)}
                placeholder="Enter your customization details..."
                rows={2}
                className="w-full p-2 resize-none"
                style={{ border: "1px solid #DDD5CE", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", background: "#FEFEFE", outline: "none", borderRadius: "2px" }}
                onFocus={(e) => (e.target.style.borderColor = "#C4985A")}
                onBlur={(e)  => (e.target.style.borderColor = "#DDD5CE")}
              />
            </div>
          )}

          {/* Quantity */}
          <div className="mb-4">
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B5B55", marginBottom: "8px" }}>
              Quantity
            </p>
            <div className="flex items-center" style={{ border: "1px solid #DDD5CE", width: "fit-content", borderRadius: "2px" }}>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50" style={{ color: "#2C2420", fontSize: "16px" }}>−</button>
              <span className="w-8 h-8 flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", borderLeft: "1px solid #DDD5CE", borderRight: "1px solid #DDD5CE" }}>{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40" style={{ color: "#2C2420", fontSize: "16px" }}>+</button>
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
              style={{ background: canAddToCart ? "#2C2420" : "#9E8E88", color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 }}
              onMouseEnter={(e) => { if (canAddToCart) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              {cartFeedback
                ? "Added ✓"
                : !canAddToCart
                  ? (isOutOfStock ? "Out of Stock" : "Select Options")
                  : "Add to Cart"}
            </button>
            <button
              onClick={() => setWishlisted(w => !w)}
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
            <button onClick={() => setDescOpen(o => !o)} className="w-full flex items-center justify-between py-4" style={{ background: "none", border: "none", cursor: "pointer" }}>
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
