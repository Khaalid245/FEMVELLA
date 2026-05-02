import { FormEvent, useRef } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { Stripe, StripeCardElement } from "@stripe/stripe-js";
import Button from "@/components/Button";

interface PaymentFormProps {
  onSubmit: (stripe: Stripe, cardElement: StripeCardElement) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#111827",
      fontFamily: "Inter, sans-serif",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444" },
  },
};

export default function PaymentForm({ onSubmit, isSubmitting, error }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const submittedRef = useRef(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions — Stripe.js confirmCardPayment is not idempotent
    if (!stripe || !elements || submittedRef.current) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    submittedRef.current = true;
    await onSubmit(stripe, cardElement);
    // Reset only on error so the user can retry
    submittedRef.current = false;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
        <div className="border border-gray-200 rounded-lg px-4 py-3.5 focus-within:ring-2 focus-within:ring-brand-500">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Test card: 4242 4242 4242 4242 · Any future date · Any CVC
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      <Button
        size="lg"
        className="w-full"
        type="submit"
        disabled={!stripe || isSubmitting}
      >
        {isSubmitting ? "Processing…" : "Pay Now"}
      </Button>

      <p className="text-center text-xs text-gray-400">
        Secured by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}
