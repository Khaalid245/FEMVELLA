import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { ProductsResponse } from "@/api/products";

export interface ShopFilters {
  category: string;
  size: string;       // comma-separated: "S,M,L"
  min_price: string;
  max_price: string;
  ordering: string;
  search: string;
  page: string;
}

const DEFAULTS: ShopFilters = {
  category: "",
  size: "",
  min_price: "",
  max_price: "",
  ordering: "-created_at",
  search: "",
  page: "1",
};

const PAGE_SIZE = 12;

// ─────────────────────────────────────────────
// URL ↔ filter state sync
// ─────────────────────────────────────────────
export function useShopFilters() {
  const [params, setParams] = useSearchParams();

  const filters: ShopFilters = useMemo(
    () => ({
      category: params.get("category") ?? DEFAULTS.category,
      size:      params.get("size")      ?? DEFAULTS.size,
      min_price: params.get("min_price") ?? DEFAULTS.min_price,
      max_price: params.get("max_price") ?? DEFAULTS.max_price,
      ordering:  params.get("ordering")  ?? DEFAULTS.ordering,
      search:    params.get("search")    ?? DEFAULTS.search,
      page:      params.get("page")      ?? DEFAULTS.page,
    }),
    [params]
  );

  const setFilter = useCallback(
    (key: keyof ShopFilters, value: string) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === "" || value === DEFAULTS[key]) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        // Reset to page 1 on any filter change except page itself
        if (key !== "page") next.delete("page");
        return next;
      });
    },
    [setParams]
  );

  const toggleSize = useCallback(
    (size: string) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        const current = (next.get("size") ?? "").split(",").filter(Boolean);
        const updated = current.includes(size)
          ? current.filter((s) => s !== size)
          : [...current, size];
        if (updated.length === 0) next.delete("size");
        else next.set("size", updated.join(","));
        next.delete("page");
        return next;
      });
    },
    [setParams]
  );

  const clearAll = useCallback(() => setParams({}), [setParams]);

  const hasActiveFilters =
    filters.category !== "" ||
    filters.size !== "" ||
    filters.min_price !== "" ||
    filters.max_price !== "" ||
    filters.search !== "";

  return { filters, setFilter, toggleSize, clearAll, hasActiveFilters };
}

// ─────────────────────────────────────────────
// Data fetching — query key includes all filters
// ─────────────────────────────────────────────
export function useShopProducts(filters: ShopFilters) {
  const params: Record<string, string> = { page_size: String(PAGE_SIZE) };

  if (filters.category)  params["category__slug"] = filters.category;
  if (filters.size)      params["size"]            = filters.size;
  if (filters.min_price) params["min_price"]       = filters.min_price;
  if (filters.max_price) params["max_price"]       = filters.max_price;
  if (filters.ordering)  params["ordering"]        = filters.ordering;
  if (filters.search)    params["search"]          = filters.search;
  if (filters.page)      params["page"]            = filters.page;

  return useQuery({
    queryKey: ["shop-products", params],
    queryFn: () =>
      api.get<ProductsResponse>("/products/", { params }).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev, // keep previous data while fetching new page
  });
}

export { PAGE_SIZE };
