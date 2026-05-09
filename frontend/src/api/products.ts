import { useQuery } from "@tanstack/react-query";
import api from "./client";

interface ColorOption {
  id: number;
  name: string;
  hex_code: string;
}

interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
  is_primary: boolean;
}

export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  stock: number;
  price_override: string | null;
  effective_price: string;
  in_stock: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  sale_price: string | null;
  discount_percent: number | null;
  stock: number;
  total_stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  is_customizable: boolean;
  images: { id: number; image: string; alt_text?: string; is_primary: boolean }[];
  colors: { id: number; name: string; hex_code: string }[];
  sizes: { id: number; size: string; in_stock: boolean }[];
  variants: ProductVariant[];
  category: { id: number; name: string; slug: string };
  created_at: string;
}

export interface ProductsResponse {
  count: number;
  results: Product[];
}

export const useProducts = (params?: Record<string, string>) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: () =>
      api.get<ProductsResponse>("/products/", { params }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

// Public product detail — used by the product detail page
export const useProductDetail = (slug: string) => {
  const isValidSlug = !!slug && slug !== 'undefined' && slug !== 'null';
  return useQuery({
    queryKey: ["product-detail", slug],
    queryFn: () => api.get<Product>(`/products/detail/${slug}/`).then((r) => r.data),
    enabled: isValidSlug,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
};

// Tab-specific hooks — each has its own stable query key for independent caching
export const useNewArrivals = () =>
  useProducts({ ordering: "-created_at" });

export const useBestsellers = () =>
  useProducts({ is_bestseller: "true", ordering: "-created_at" });

export const useOnSale = () =>
  useProducts({ on_sale: "true" });

export const useFeatured = () =>
  useProducts({ is_featured: "true" });
