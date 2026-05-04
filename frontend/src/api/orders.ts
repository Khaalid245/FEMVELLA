import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./client";

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: number;
}

export interface Order {
  id: number;
  status: "pending" | "paid" | "failed" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total_price: string;
  shipping_address: string;
  notes: string;
  idempotency_key: string;
  items: OrderItem[];
  created_at: string;
}

export interface CreateOrderPayload {
  items: { product_id: number; variant_id?: number; quantity: number; customization_text?: string }[];
  shipping_address: string;
  notes?: string;
  idempotency_key: string;
}

export const useCreateOrder = () =>
  useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      api.post<Order>("/orders/checkout/", payload).then((r) => r.data),
  });

export const useGetOrder = (orderId: number | null, enabled: boolean) =>
  useQuery({
    queryKey: ["order", orderId],
    queryFn: () => api.get<Order>(`/orders/${orderId}/`).then((r) => r.data),
    enabled: enabled && orderId !== null,
    // Polling is controlled externally via refetchInterval
    refetchOnWindowFocus: false,
  });
