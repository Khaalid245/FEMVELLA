import { useQuery } from "@tanstack/react-query";
import api from "./client";

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  sale_price: string | null;
  stock: number;
  is_featured: boolean;
  images: { id: number; image: string; is_primary: boolean }[];
  category: { id: number; name: string; slug: string };
}

export const useProducts = (params?: Record<string, string>) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: () => api.get<{ results: Product[] }>("/products/", { params }).then((r) => r.data),
  });

export const useProduct = (slug: string) =>
  useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<Product>(`/products/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });
