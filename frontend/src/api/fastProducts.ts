import { useQuery } from "@tanstack/react-query";
import api from "./client";

interface FastProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  category_name: string;
  price: string;
  sale_price: string | null;
  discount_percent: number | null;
  total_stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  is_customizable: boolean;
  images: {
    id: number;
    image: string;
    is_primary: boolean;
    sort_order: number;
  }[];
  variants: {
    id: number;
    size: string;
    color: string;
    stock: number;
    effective_price: string;
  }[];
  created_at: string;
}

export const useFastProduct = (slug: string) => {
  const isValidSlug = !!slug && slug !== 'undefined' && slug !== 'null';
  return useQuery({
    queryKey: ["fast-product", slug],
    queryFn: () => api.get<FastProduct>(`/products/fast/${slug}/`).then((r) => r.data),
    enabled: isValidSlug,
    retry: 1,
    staleTime: 1000 * 60 * 15, // 15 minutes cache
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
  });
};