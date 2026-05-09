import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { useCartStore } from "@/store/cartStore";
import { useCurrencyStore } from "@/store/currencyStore";

const ease = [0.22, 1, 0.36, 1] as const;

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
  const symbol = useCurrencyStore((s) => s.getSymbol());

  // ── Empty State ──────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="flex flex-col items-center justify-center text-center"
          style={{ padding: "100px 24px" }}
        >
          {/* Icon */}
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
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>

          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "32px",
            fontWeight: 400,
            color: "#2C2420",
            marginBottom: "12px",
          }}>
            Your cart is empty
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            lineHeight: 1.7,
            color: "#9E8E88",
            maxWidth: "320px",
            marginBottom: "36px",
          }}>
            Discover our curated collection of modest fashion pieces crafted for the refined woman.
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
      </Layout>
    );
  }

  // ── Cart with items ──────────────────────────────────────────
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C4985A",
            marginBottom: "8px",
          }}>
            Shopping Bag
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 400,
            color: "#2C2420",
            lineHeight: 1.1,
          }}>
            Your Cart
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 400,
              color: "#9E8E88",
              marginLeft: "12px",
            }}>
              ({items.reduce((n, i) => n + i.quantity, 0)} items)
            </span>
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
          {/* ── Items ── */}
          <div className="md:col-span-2">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={`${item.id}-${item.variant_id}`}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.35, ease }}
                  style={{
                    display: "flex",
                    gap: "20px",
                    paddingBottom: "28px",
                    marginBottom: "28px",
                    borderBottom: "1px solid #EDE8E3",
                  }}
                >
                  {/* Image */}
                  <Link
                    to={`/products/${item.slug}`}
                    style={{
                      flexShrink: 0,
                      width: "96px",
                      height: "120px",
                      background: "#F5F0EB",
                      overflow: "hidden",
                      display: "block",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.05)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
                    />
                  </Link>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      to={`/products/${item.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      <h3
                        className="hover-underline"
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: "18px",
                          fontWeight: 500,
                          color: "#2C2420",
                          marginBottom: "4px",
                          display: "inline-block",
                        }}
                      >
                        {item.name}
                      </h3>
                    </Link>

                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#C4985A",
                      marginBottom: "16px",
                    }}>
                      {symbol}{Number(item.price).toFixed(2)}
                    </p>

                    {/* Quantity */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variant_id, item.customization_text)}
                        style={{
                          width: "32px",
                          height: "32px",
                          border: "1px solid #DDD5CE",
                          background: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "16px",
                          color: "#2C2420",
                          transition: "border-color 0.2s ease, background 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#2C2420";
                          (e.currentTarget as HTMLElement).style.background = "#F8F6F3";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#DDD5CE";
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        −
                      </button>
                      <span style={{
                        width: "40px",
                        textAlign: "center",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "13px",
                        color: "#2C2420",
                        borderTop: "1px solid #DDD5CE",
                        borderBottom: "1px solid #DDD5CE",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant_id, item.customization_text)}
                        style={{
                          width: "32px",
                          height: "32px",
                          border: "1px solid #DDD5CE",
                          background: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "16px",
                          color: "#2C2420",
                          transition: "border-color 0.2s ease, background 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#2C2420";
                          (e.currentTarget as HTMLElement).style.background = "#F8F6F3";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#DDD5CE";
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id, item.variant_id, item.customization_text)}
                    aria-label="Remove item"
                    style={{
                      alignSelf: "flex-start",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: "#C4C0BC",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#9E8E88")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#C4C0BC")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear cart */}
            <button
              onClick={clearCart}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#9E8E88",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C2420")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9E8E88")}
            >
              Clear cart
            </button>
          </div>

          {/* ── Order Summary ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            style={{
              background: "#F8F6F3",
              border: "1px solid #EDE8E3",
              padding: "32px",
              height: "fit-content",
              position: "sticky",
              top: "100px",
            }}
          >
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#9E8E88",
              marginBottom: "24px",
            }}>
              Order Summary
            </p>

            {/* Line items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#6B5B55" }}>
                  Subtotal
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#2C2420", fontWeight: 500 }}>
                  {symbol}{total().toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#6B5B55" }}>
                  Shipping
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#9E8E88" }}>
                  Calculated at checkout
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #EDE8E3", paddingTop: "20px", marginBottom: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "18px",
                  color: "#2C2420",
                }}>
                  Total
                </span>
                <span style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "22px",
                  color: "#2C2420",
                  fontWeight: 500,
                }}>
                  {symbol}{total().toFixed(2)}
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate("/checkout")}
              style={{
                width: "100%",
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#fff",
                background: "#2C2420",
                border: "none",
                padding: "16px",
                cursor: "pointer",
                transition: "background 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3D3330")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#2C2420")}
            >
              Proceed to Checkout
              <span style={{ fontSize: "14px" }}>→</span>
            </button>

            {/* Trust note */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              color: "#9E8E88",
              textAlign: "center",
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Secure checkout · SSL encrypted
            </p>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}