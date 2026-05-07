import { useQuery } from "@tanstack/react-query";
import api from "./client";

export const useSimpleProduct = (slug: string) => {
  return useQuery({
    queryKey: ["simple-product", slug],
    queryFn: () => api.get(`/products/simple/${slug}/`).then((r) => r.data),
    enabled: !!slug,
    retry: 1,
  });
};

export const useTestSpeed = () => {
  return useQuery({
    queryKey: ["test-speed"],
    queryFn: () => api.get(`/products/test/`).then((r) => r.data),
    retry: 1,
  });
};