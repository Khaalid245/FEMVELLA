import { useEffect, useRef } from "react";
import { useRecordView } from "@/api/recommendations";

/**
 * Call this on any product detail page.
 * Fires once per product per page load — debounced 800ms to avoid
 * double-fires from React StrictMode double-invocation.
 */
export function useTrackProductView(productId: number | undefined) {
  const { mutate } = useRecordView();
  const firedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!productId || firedRef.current === productId) return;

    const timer = setTimeout(() => {
      mutate({ productId, pageUrl: window.location.href });
      firedRef.current = productId;
    }, 800);

    return () => clearTimeout(timer);
  }, [productId, mutate]);
}
