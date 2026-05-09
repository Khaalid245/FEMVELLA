import { useState, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ProductImageGallery from "@/components/ProductImageGallery";
import { useProductDetail } from "@/api/products";
import { useCartStore } from "@/store/cartStore";
import { useCurrencyStore } from "@/store/currencyStore";
import ProductShelf from "@/components/ProductShelf";
import { useSimilarProducts, useCompleteTheLook } from "@/api/recommendations";
import { useTrackProductView } from "@/hooks/useTrackProductView";

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

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProductDetail(slug!);
  const addItem = useCartStore((s) => s.addItem);
  const symbol = useCurrencyStore((s) => s.getSymbol());

  // Track product view for recommendations
  useTrackProductView(product?.id);

  // Recommendation data
  const { data: similarProducts = [], isLoading: similarLoading } = useSimilarProducts(
    product?.id ?? 0, 4
  );
  const { data: lookProducts = [], isLoading: lookLoading } = useCompleteTheLook(
    product?.id ?? 0, 4
  );

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!slug) navigate("/products", { replace: true });
    if (isError) navigate("/products", { replace: true });
  }, [slug, isError, navigate]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    const primaryImage = product.images?.find(i => i.is_primary) || product.images?.[0];
    const price = product.sale_price || product.price;

    addItem({
      id: product.id,
      name: product.name,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      price,
      quantity,
      image: primaryImage?.image || "",
      slug: product.slug,
    });
  }, [product, selectedSize, selectedColor, quantity, addItem]);

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

  const isOnSale = !!product.sale_price;
  const displayPrice = product.sale_price || product.price;
  const isOutOfStock = product.total_stock === 0;

  return (
    <Layout>
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 py-8"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}
      >
        {/* LEFT — Images */}
        <div className="flex justify-center items-start">
          <div className="relative" style={{ width: "100%", maxWidth: "520px" }}>
            <ProductImageGallery 
              images={product.images || []} 
              productName={product.name}
            />
          </div>
        </div>

        {/* RIGHT — Info */}
        <div className="flex flex-col justify-center" style={{ padding: "32px 0" }}>
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
              {symbol}{displayPrice}
            </span>
            {isOnSale && (
              <span style={{ fontSize: "16px", color: "#9E8E88", textDecoration: "line-through" }}>{symbol}{product.price}</span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full" style={{ background: isOutOfStock ? "#E57373" : "#81C784" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: isOutOfStock ? "#E57373" : "#6B5B55" }}>
              {isOutOfStock ? "Out of stock" : `${product.total_stock} in stock`}
            </span>
          </div>

          {/* Size Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-4">
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B5B55", marginBottom: "8px" }}>
                Size
              </p>
              <div className="flex gap-2 flex-wrap">
                {[...new Set(product.variants.map(v => v.size))].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className="px-4 py-2 border transition-all duration-200"
                    style={{
                      border: selectedSize === size ? "1.5px solid #2C2420" : "1px solid #DDD5CE",
                      background: selectedSize === size ? "#2C2420" : "transparent",
                      color: selectedSize === size ? "#fff" : "#2C2420",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "12px",
                      fontWeight: 500
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
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
              <button onClick={() => setQuantity(q => Math.min(product.total_stock, q + 1))} disabled={quantity >= product.total_stock} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40" style={{ color: "#2C2420", fontSize: "16px" }}>+</button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full h-12 mb-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: isOutOfStock ? "#9E8E88" : "#2C2420", 
              color: "#fff", 
              fontFamily: "'Inter', sans-serif", 
              fontSize: "11px", 
              letterSpacing: "0.18em", 
              textTransform: "uppercase", 
              fontWeight: 500 
            }}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>

          {/* Description */}
          <div style={{ borderTop: "1px solid #EDE8E3", paddingTop: "16px" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", lineHeight: 1.6, color: "#6B5B55" }}>
              {product.description || "No description available."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Recommendation Shelves ── */}
      <div style={{ marginTop: "64px", borderTop: "1px solid #EDE8E3", paddingTop: "64px" }}>
        {/* Complete the Look */}
        {(lookLoading || lookProducts.length > 0) && (
          <ProductShelf
            eyebrow="Style It With"
            title="Complete the Look"
            products={lookProducts}
            isLoading={lookLoading}
            layout="scroll"
            skeletonCount={4}
            columns={4}
          />
        )}

        {/* Similar Products */}
        {(similarLoading || similarProducts.length > 0) && (
          <ProductShelf
            eyebrow="You May Also Like"
            title="Similar Products"
            products={similarProducts}
            isLoading={similarLoading}
            layout="grid"
            skeletonCount={4}
            columns={4}
            viewAllHref={product.category ? `/products?category=${product.category.slug}` : "/products"}
            viewAllLabel="View Category"
          />
        )}
      </div>
    </Layout>
  );
}