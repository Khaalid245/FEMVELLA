import { useQuery } from "@tanstack/react-query";
import api from "./client";

interface MinimalProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: { name: string };
  price: string;
  sale_price: string | null;
  total_stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
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
  }[];
}

export const useMinimalProduct = (slug: string) => {
  const isValidSlug = !!slug && slug !== 'undefined' && slug !== 'null';
  return useQuery({
    queryKey: ["minimal-product", slug],
    queryFn: () => api.get<MinimalProduct>(`/products/minimal/${slug}/`).then((r) => r.data),
    enabled: isValidSlug,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useMinimalProducts = () => {
  return useQuery({
    queryKey: ["minimal-products"],
    queryFn: () => api.get<{results: any[]}>(`/products/minimal/`).then((r) => r.data),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};