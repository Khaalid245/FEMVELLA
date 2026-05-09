import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import PaymentForm from "@/components/PaymentForm";
import { useCartStore } from "@/store/cartStore";
import { useCheckout } from "@/hooks/useCheckout";
import { useOrderPolling } from "@/hooks/useOrderPolling";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);

  const { step, order, error, isSubmitting, submitAddress, submitPayment } = useCheckout();

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Polling — only active once we reach the polling step
  const { status: pollStatus, retry: retryPolling } = useOrderPolling(
    step === "polling" ? (order?.id ?? null) : null
  );

  // Navigate only on terminal states — timeout stays on this page
  useEffect(() => {
    if (pollStatus === "paid") {
      sessionStorage.removeItem("checkout_idempotency_key");
      clearCart();
      navigate(`/order-success/${order!.id}`, { replace: true });
    } else if (pollStatus === "failed") {
      navigate(`/order-failed/${order!.id}`, { replace: true });
    }
    // timeout is handled inline — no navigation, cart preserved
  }, [pollStatus, order, clearCart, navigate]);

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0 && step === "address") {
      navigate("/cart", { replace: true });
    }
  }, [items.length, step, navigate]);

  const handleAddressSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitAddress(address, notes);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10 text-sm font-medium">
          {(["address", "payment", "polling"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              {i > 0 && <div className="w-8 h-px bg-gray-200" />}
              <span className={step === s ? "text-brand-600" : "text-gray-400"}>
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
          ))}
        </div>

        {/* ── Step 1: Address ── */}
        {step === "address" && (
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8">Shipping Details</h1>

            {/* Cart summary */}
            <div className="bg-gray-50 rounded-xl p-5 mb-8 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-700">
                  <span>{item.name} × {item.quantity}</span>
                  <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  minLength={10}
                  rows={3}
                  placeholder="Street, City, Country"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Notes <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Leave at door, ring bell, etc."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</p>
              )}

              <Button size="lg" className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Preparing order…" : "Continue to Payment"}
              </Button>
            </form>
          </div>
        )}

        {/* ── Step 2: Payment ── */}
        {step === "payment" && order && (
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Payment</h1>
            <p className="text-gray-500 text-sm mb-8">
              Order #{order.id} · Total ${order.total_price}
            </p>

            <Elements stripe={stripePromise}>
              <PaymentForm
                onSubmit={submitPayment}
                isSubmitting={isSubmitting}
                error={error}
              />
            </Elements>
          </div>
        )}

        {/* ── Step 3: Polling ── */}
        {step === "polling" && (
          <div className="text-center py-24">
            {pollStatus === "timeout" ? (
              <>
                <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-3">
                  Payment is still processing
                </h2>
                <p className="text-gray-500 text-sm mb-2">
                  This is taking longer than expected. Your payment may still go through.
                </p>
                <p className="text-gray-400 text-sm mb-8">
                  Do not place a new order — you will not be charged twice.
                </p>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <Button size="lg" className="w-full" onClick={retryPolling}>
                    Check Again
                  </Button>
                  <Button size="lg" variant="outline" className="w-full"
                    onClick={() => navigate(`/order-failed/${order!.id}`)}>
                    I’ll check my email
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <p className="text-gray-600 font-medium">Confirming your payment…</p>
                <p className="text-gray-400 text-sm mt-2">Please do not close this page.</p>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
