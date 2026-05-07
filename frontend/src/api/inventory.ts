import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";

// Types
export interface VariantAvailability {
  id: number;
  size: string;
  color: string;
  stock: number;
  is_in_stock: boolean;
  is_low_stock: boolean;
  stock_status: string;
  sku: string;
  price: number;
}

export interface ProductAvailability {
  product_id: number;
  product_name: string;
  availability: {
    variants: VariantAvailability[];
    available_sizes: string[];
    available_colors: string[];
    size_color_matrix: Record<string, Record<string, {
      available: boolean;
      stock: number;
      variant_id: number;
    }>>;
  };
}

export interface StockCheckItem {
  variant_id: number;
  quantity: number;
}

export interface StockCheckResult {
  variant_id: number;
  sku: string;
  requested_quantity: number;
  available_stock: number;
  is_available: boolean;
  stock_status: string;
  error?: string;
}

// Hooks
export const useProductAvailability = (productId: number) => {
  return useQuery({
    queryKey: ["product-availability", productId],
    queryFn: () => 
      api.get<ProductAvailability>(`/products/inventory/availability/${productId}/`)
        .then((r) => r.data),
    enabled: !!productId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useStockCheck = () => {
  return useMutation({
    mutationFn: (items: StockCheckItem[]) =>
      api.post<{ results: StockCheckResult[] }>("/products/inventory/check/", { items })
        .then((r) => r.data),
  });
};

export const useReserveStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reservations: StockCheckItem[]) =>
      api.post("/products/inventory/reserve/", { reservations })
        .then((r) => r.data),
    onSuccess: () => {
      // Invalidate availability queries
      queryClient.invalidateQueries({ queryKey: ["product-availability"] });
    },
  });
};

export const useLowStockReport = () => {
  return useQuery({
    queryKey: ["low-stock-report"],
    queryFn: () =>
      api.get<{ count: number; variants: any[] }>("/products/inventory/low-stock/")
        .then((r) => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateVariantStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ variantId, action, quantity }: {
      variantId: number;
      action: 'add' | 'set';
      quantity: number;
    }) =>
      api.post(`/products/inventory/variant/${variantId}/update/`, { action, quantity })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-availability"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-report"] });
    },
  });
};