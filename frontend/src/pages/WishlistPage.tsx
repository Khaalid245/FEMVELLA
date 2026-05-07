import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useWishlist, useRemoveFromWishlist, useClearWishlist } from "@/api/wishlist";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

const ease = [0.22, 1, 0.36, 1] as const;

export function WishlistPage() {
  const { data: wishlist, isLoading, isError } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const clearWishlist = useClearWishlist();

  const isEmpty = !wishlist?.items?.length;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "48px",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C4985A",
              marginBottom: "8px",
            }}>
              Saved Items
            </p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 400,
              color: "#2C2420",
              lineHeight: 1.1,
            }}>
              My Wishlist
              {!isEmpty && (
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#9E8E88",
                  marginLeft: "12px",
                }}>
                  ({wishlist.item_count} {wishlist.item_count === 1 ? "item" : "items"})
                </span>
              )}
            </h1>
          </div>

          {!isEmpty && (
            <button
              onClick={() => {
                if (window.confirm("Clear your entire wishlist?")) clearWishlist.mutate();
              }}
              disabled={clearWishlist.isPending}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#9E8E88",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.2s ease",
                padding: 0,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9E8E88")}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center" style={{ padding: "80px 0", gap: "20px" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#F8F6F3",
              border: "1px solid #EDE8E3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4985A" strokeWidth="1.4">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", color: "#2C2420" }}>
              Unable to load wishlist
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#9E8E88" }}>
              Please try again later.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: "80px 24px" }}
          >
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#F8F6F3",
              border: "1px solid #EDE8E3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "28px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C4985A" strokeWidth="1.4">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>

            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "32px",
              fontWeight: 400,
              color: "#2C2420",
              marginBottom: "12px",
            }}>
              Your wishlist is empty
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              lineHeight: 1.7,
              color: "#9E8E88",
              maxWidth: "320px",
              marginBottom: "36px",
            }}>
              Save pieces you love and return to them whenever you're ready.
            </p>

            <Link
              to="/products"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#fff",
                background: "#2C2420",
                textDecoration: "none",
                padding: "14px 36px",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3D3330")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#2C2420")}
            >
              Explore Collection
              <span style={{ fontSize: "14px" }}>→</span>
            </Link>
          </motion.div>
        )}

        {/* Items Grid */}
        {!isLoading && !isError && !isEmpty && (
          <>
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {wishlist.items.map((item: any) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease }}
                    className="group"
                    style={{ background: "#fff", position: "relative" }}
                  >
                    {/* Image */}
                    <Link
                      to={`/products/${item.product.slug}`}
                      style={{ display: "block", position: "relative", overflow: "hidden" }}
                    >
                      <div style={{ aspectRatio: "3/4", background: "#F5F0EB", overflow: "hidden" }}>
                        <img
                          src={item.product.image_url || "/placeholder-product.jpg"}
                          alt={item.product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.6s ease",
                          }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.04)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
                        />
                      </div>
                    </Link>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromWishlist.mutate(item.product.id)}
                      disabled={removeFromWishlist.isPending}
                      aria-label="Remove from wishlist"
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: "32px",
                        height: "32px",
                        background: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(4px)",
                        border: "none",
                        borderRadius: "2px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9E8E88",
                        opacity: 0,
                        transition: "opacity 0.2s ease, color 0.2s ease",
                      }}
                      className="group-hover:opacity-100"
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9E8E88")}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>

                    {/* Info */}
                    <div style={{ paddingTop: "12px", paddingBottom: "4px" }}>
                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "10px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#C4985A",
                        marginBottom: "4px",
                      }}>
                        {item.product.category}
                      </p>

                      <Link to={`/products/${item.product.slug}`} style={{ textDecoration: "none" }}>
                        <h3
                          className="hover-underline"
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: "16px",
                            fontWeight: 500,
                            color: "#2C2420",
                            marginBottom: "6px",
                            display: "inline-block",
                          }}
                        >
                          {item.product.name}
                        </h3>
                      </Link>

                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#2C2420",
                      }}>
                        ${Number(item.product.price).toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {/* Continue shopping */}
            <div style={{ textAlign: "center", marginTop: "64px" }}>
              <Link
                to="/products"
                className="hover-underline"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#2C2420",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C4985A")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
              >
                Continue Shopping
                <span style={{ fontSize: "14px" }}>→</span>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  );
}