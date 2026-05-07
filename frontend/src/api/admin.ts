import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import { useToastStore } from "@/store/toastStore";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface AdminStats {
  kpis: {
    total_revenue: number;
    revenue_7d: number;
    revenue_today: number;
    total_orders: number;
    orders_7d: number;
    orders_today: number;
    total_products: number;
    low_stock: number;
    total_customers: number;
  };
  revenue_chart: { date: string; revenue: number; orders: number }[];
  recent_orders: {
    id: number;
    user_email: string;
    status: string;
    total_price: string;
    created_at: string;
  }[];
  status_breakdown: { status: string; count: number }[];
}

export interface AdminOrder {
  id: number;
  order_number: string;
  user_email: string;
  status: string;
  total_price: string;
  refunded_amount: string;
  balance_due: string;
  shipping_address: string;
  tracking_number: string;
  carrier: string;
  tracking_url: string;
  shipped_at: string | null;
  delivered_at: string | null;
  items: {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    fulfilled_quantity: number;
    refunded_quantity: number;
    size: string;
    color: string;
  }[];
  created_at: string;
}

export interface OrderHistoryEntry {
  id: number;
  old_status: string;
  new_status: string;
  changed_by_email: string | null;
  note: string;
  timestamp: string;
}

export interface Refund {
  id: number;
  order: number;
  amount: string;
  reason: string;
  status: string;
  requested_by_email: string | null;
  processed_by_email: string | null;
  admin_note: string;
  stripe_refund_id: string;
  processed_at: string | null;
  created_at: string;
}

export interface ReturnRequest {
  id: number;
  order: number;
  status: string;
  reason: string;
  description: string;
  items: { order_item_id: number; quantity: number }[];
  requested_by_email: string | null;
  admin_note: string;
  return_tracking_number: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface ExchangeRequest {
  id: number;
  order: number;
  status: string;
  reason: string;
  return_items: { order_item_id: number; quantity: number }[];
  exchange_items: { product_id: number; variant_id?: number; quantity: number }[];
  requested_by_email: string | null;
  admin_note: string;
  new_order: number | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface OrdersPage {
  count: number;
  results: AdminOrder[];
}

// ─────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────
export const useAdminStats = () =>
  useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<AdminStats>("/analytics/admin-stats/").then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

// ─────────────────────────────────────────────
// Orders list
// ─────────────────────────────────────────────
export interface OrderFilters {
  page: number;
  status: string;
  search: string;
  date_from: string;
  date_to: string;
}

export const useAdminOrders = (filters: OrderFilters) =>
  useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => {
      const params: Record<string, string | number> = { page: filters.page, page_size: 15 };
      if (filters.status)    params.status    = filters.status;
      if (filters.search)    params.search    = filters.search;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to)   params.date_to   = filters.date_to;
      return api.get<OrdersPage>("/orders/", { params }).then((r) => r.data);
    },
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });

// ─────────────────────────────────────────────
// Single status update — optimistic
// ─────────────────────────────────────────────
export const useUpdateOrderStatus = (filters: OrderFilters) => {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/orders/${id}/update-status/`, { status }).then((r) => r.data),

    // Optimistic update
    onMutate: async ({ id, status: newStatus }) => {
      await qc.cancelQueries({ queryKey: ["admin-orders", filters] });
      const previous = qc.getQueryData<OrdersPage>(["admin-orders", filters]);

      qc.setQueryData<OrdersPage>(["admin-orders", filters], (old) => {
        if (!old) return old;
        return {
          ...old,
          results: old.results.map((o) =>
            o.id === id ? { ...o, status: newStatus } : o
          ),
        };
      });

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      // Rollback
      if (ctx?.previous) {
        qc.setQueryData(["admin-orders", filters], ctx.previous);
      }
      toast("Failed to update order status.", "error");
    },

    onSuccess: () => {
      toast("Order status updated.");
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders", filters] });
    },
  });
};

// ─────────────────────────────────────────────
// Bulk status update
// ─────────────────────────────────────────────
export const useBulkUpdateStatus = () => {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);

  return useMutation({
    mutationFn: ({ order_ids, status }: { order_ids: number[]; status: string }) =>
      api.post("/orders/bulk-update-status/", { order_ids, status }).then((r) => r.data),
    onSuccess: (data) => {
      toast(`${data.updated} orders marked as ${data.status}.`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast("Bulk update failed.", "error"),
  });
};

// ─────────────────────────────────────────────
// Order history (audit log)
// ─────────────────────────────────────────────
export const useOrderHistory = (orderId: number | null) =>
  useQuery({
    queryKey: ["order-history", orderId],
    queryFn: () =>
      api.get<OrderHistoryEntry[]>(`/orders/${orderId}/history/`).then((r) => r.data),
    enabled: orderId !== null,
    staleTime: 0,
  });

// ─────────────────────────────────────────────
// Refunds
// ─────────────────────────────────────────────
export const useOrderRefunds = (orderId: number | null) =>
  useQuery({
    queryKey: ["order-refunds", orderId],
    queryFn: () =>
      api.get<Refund[]>(`/orders/${orderId}/refunds/`).then((r) => r.data),
    enabled: orderId !== null,
    staleTime: 0,
  });

export const useRequestRefund = (orderId: number) => {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  return useMutation({
    mutationFn: (data: { amount: string; reason: string }) =>
      api.post(`/orders/${orderId}/refunds/request/`, data).then((r) => r.data),
    onSuccess: () => {
      toast("Refund request submitted.");
      qc.invalidateQueries({ queryKey: ["order-refunds", orderId] });
    },
    onError: () => toast("Failed to submit refund request.", "error"),
  });
};

export const useReviewRefund = (orderId: number) => {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  return useMutation({
    mutationFn: ({ refundId, approved, admin_note }: { refundId: number; approved: boolean; admin_note?: string }) =>
      api.post(`/orders/${orderId}/refunds/${refundId}/review/`, { approved, admin_note }).then((r) => r.data),
    onSuccess: (_, vars) => {
      toast(vars.approved ? "Refund approved and processed." : "Refund rejected.");
      qc.invalidateQueries({ queryKey: ["order-refunds", orderId] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast("Failed to process refund.", "error"),
  });
};

// ─────────────────────────────────────────────
// Returns
// ─────────────────────────────────────────────
export const useOrderReturns = (orderId: number | null) =>
  useQuery({
    queryKey: ["order-returns", orderId],
    queryFn: () =>
      api.get<ReturnRequest[]>(`/orders/${orderId}/returns/`).then((r) => r.data),
    enabled: orderId !== null,
    staleTime: 0,
  });

export const useReviewReturn = (orderId: number) => {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  return useMutation({
    mutationFn: ({ returnId, approved, admin_note }: { returnId: number; approved: boolean; admin_note?: string }) =>
      api.post(`/orders/${orderId}/returns/${returnId}/review/`, { approved, admin_note }).then((r) => r.data),
    onSuccess: (_, vars) => {
      toast(vars.approved ? "Return approved." : "Return rejected.");
      qc.invalidateQueries({ queryKey: ["order-returns", orderId] });
    },
    onError: () => toast("Failed to review return.", "error"),
  });
};

// ─────────────────────────────────────────────
// Exchanges
// ─────────────────────────────────────────────
export const useOrderExchanges = (orderId: number | null) =>
  useQuery({
    queryKey: ["order-exchanges", orderId],
    queryFn: () =>
      api.get<ExchangeRequest[]>(`/orders/${orderId}/exchanges/`).then((r) => r.data),
    enabled: orderId !== null,
    staleTime: 0,
  });

export const useReviewExchange = (orderId: number) => {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  return useMutation({
    mutationFn: ({ exchangeId, approved, admin_note }: { exchangeId: number; approved: boolean; admin_note?: string }) =>
      api.post(`/orders/${orderId}/exchanges/${exchangeId}/review/`, { approved, admin_note }).then((r) => r.data),
    onSuccess: (_, vars) => {
      toast(vars.approved ? "Exchange approved." : "Exchange rejected.");
      qc.invalidateQueries({ queryKey: ["order-exchanges", orderId] });
    },
    onError: () => toast("Failed to review exchange.", "error"),
  });
};

// ─────────────────────────────────────────────
// Fulfillment
// ─────────────────────────────────────────────
export const useFulfillOrder = (filters: OrderFilters) => {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: { tracking_number: string; carrier: string; tracking_url?: string } }) =>
      api.post(`/orders/${orderId}/fulfill/`, data).then((r) => r.data),
    onSuccess: () => {
      toast("Order fulfilled with tracking.");
      qc.invalidateQueries({ queryKey: ["admin-orders", filters] });
    },
    onError: () => toast("Fulfillment failed.", "error"),
  });
};

export const useAddTracking = (filters: OrderFilters) => {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: { tracking_number: string; carrier: string; tracking_url?: string } }) =>
      api.patch(`/orders/${orderId}/tracking/`, data).then((r) => r.data),
    onSuccess: () => {
      toast("Tracking number saved.");
      qc.invalidateQueries({ queryKey: ["admin-orders", filters] });
    },
    onError: () => toast("Failed to save tracking.", "error"),
  });
};

// ─────────────────────────────────────────────
// Invoice download
// ─────────────────────────────────────────────
export const downloadInvoice = async (orderId: number, orderNumber: string) => {
  const response = await api.get(`/orders/${orderId}/invoice/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `femvelle-invoice-${orderNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────
export const useAdminProducts = (page = 1, search = "") =>
  useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () =>
      api.get("/products/", { params: { page, page_size: 15, ...(search && { search }) } })
        .then((r) => r.data),
    staleTime: 1000 * 60,
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/products/categories/").then((r) => r.data.results ?? r.data),
    staleTime: 1000 * 60 * 10,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post("/products/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data),
    onSuccess: () => {
      toast("Product created successfully.");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast("Failed to create product.", "error"),
  });
};
