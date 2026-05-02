import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Stripe, StripeCardElement } from "@stripe/stripe-js";
import { useCartStore } from "@/store/cartStore";
import { useCreateOrder } from "@/api/orders";
import { useCreatePaymentIntent } from "@/api/payments";
import type { Order } from "@/api/orders";

export type CheckoutStep = "address" | "payment" | "polling";

export interface CheckoutState {
  step: CheckoutStep;
  order: Order | null;
  error: string | null;
  isSubmitting: boolean;
  // Stable idempotency key for the lifetime of this checkout session.
  // Generated once on mount — survives re-renders, prevents duplicate orders.
  idempotencyKey: string;
  submitAddress: (address: string, notes: string) => Promise<void>;
  submitPayment: (stripe: Stripe, cardElement: StripeCardElement) => Promise<void>;
}

/**
 * Orchestrates the full checkout flow.
 * Components call submitAddress / submitPayment — all logic lives here.
 */
export function useCheckout(): CheckoutState {
  const [step, setStep] = useState<CheckoutStep>("address");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientSecretRef = useRef<string | null>(null);

  // Stable per-session idempotency key — generated once, never changes
  const idempotencyKey = useRef(uuidv4()).current;

  const cartItems = useCartStore((s) => s.items);
  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: createPaymentIntent } = useCreatePaymentIntent();

  const submitAddress = async (address: string, notes: string) => {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        items: cartItems.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        shipping_address: address,
        notes,
        idempotency_key: idempotencyKey,
      };

      const createdOrder = await createOrder(payload);
      setOrder(createdOrder);

      const clientSecret = await createPaymentIntent(createdOrder.id);
      clientSecretRef.current = clientSecret;

      setStep("payment");
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPayment = async (stripe: Stripe, cardElement: StripeCardElement) => {
    if (isSubmitting || !clientSecretRef.current) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: stripeError } = await stripe.confirmCardPayment(
        clientSecretRef.current,
        { payment_method: { card: cardElement } }
      );

      if (stripeError) {
        // Stripe.js errors are user-facing (declined, invalid card, etc.)
        setError(stripeError.message ?? "Payment failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Stripe.js confirmed — move to polling.
      // We do NOT trust this result. The backend webhook is the source of truth.
      setStep("polling");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return {
    step,
    order,
    error,
    isSubmitting,
    idempotencyKey,
    submitAddress,
    submitPayment,
  };
}

function extractErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response
  ) {
    const data = (err.response as { data: unknown }).data;
    if (typeof data === "object" && data !== null && "detail" in data) {
      return String((data as { detail: unknown }).detail);
    }
  }
  return "Something went wrong. Please try again.";
}
