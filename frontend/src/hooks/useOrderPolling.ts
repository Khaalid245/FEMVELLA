import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/api/client";
import type { Order } from "@/api/orders";
import axios from "axios";

export type PollingStatus = "polling" | "paid" | "failed" | "timeout";

const INITIAL_INTERVAL_MS = 2000;
const MAX_INTERVAL_MS = 8000;
const MAX_POLLS = 10;

function nextInterval(current: number): number {
  return Math.min(current * 2, MAX_INTERVAL_MS);
}

export function useOrderPolling(orderId: number | null): {
  status: PollingStatus;
  order: Order | null;
  retry: () => void;
} {
  const [status, setStatus] = useState<PollingStatus>("polling");
  const [order, setOrder] = useState<Order | null>(null);
  // Incrementing this triggers the useEffect to restart polling from scratch
  const [retryCount, setRetryCount] = useState(0);

  const pollCount = useRef(0);
  const intervalRef = useRef(INITIAL_INTERVAL_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const retry = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (orderId === null) return;

    // Reset state for this polling session (initial mount or retry)
    pollCount.current = 0;
    intervalRef.current = INITIAL_INTERVAL_MS;
    setStatus("polling");

    const poll = async () => {
      if (pollCount.current >= MAX_POLLS) {
        setStatus("timeout");
        return;
      }

      pollCount.current += 1;

      try {
        const { data } = await api.get<Order>(`/orders/${orderId}/`);
        setOrder(data);

        if (data.status === "paid") { setStatus("paid"); return; }
        if (data.status === "failed") { setStatus("failed"); return; }
      } catch (err: unknown) {
        const httpStatus = axios.isAxiosError(err) ? err.response?.status : undefined;

        if (httpStatus === 404) {
          // Order does not exist — stop immediately, no point retrying
          setStatus("failed");
          return;
        }

        if (httpStatus === 401 || httpStatus === 403) {
          // Auth error — the axios interceptor handles token refresh / logout.
          // Stop polling; the interceptor will redirect if needed.
          setStatus("failed");
          return;
        }

        // Network error or 5xx — fall through and retry with backoff
      }

      timerRef.current = setTimeout(poll, intervalRef.current);
      intervalRef.current = nextInterval(intervalRef.current);
    };

    poll();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orderId, retryCount]); // retryCount in deps restarts the effect on retry()

  return { status, order, retry };
}
