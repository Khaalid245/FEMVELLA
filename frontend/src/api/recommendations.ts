import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import type { Product } from "./products";

// ── Types ────────────────────────────────────────────────────────────────────

interface RecommendationResponse {
  products: Product[];
}

// ── Raw fetchers ─────────────────────────────────────────────────────────────

const fetchSimilar = (productId: number, limit = 8) =>
  api
    .get<RecommendationResponse>("/search/recommendations/similar/", {
      params: { product_id: productId, limit },
    })
    .then((r) => r.data.products);

const fetchFeed = (limit = 8) =>
  api
    .get<RecommendationResponse>("/search/recommendations/feed/", {
      params: { limit },
    })
    .then((r) => r.data.products);

const fetchTrending = (limit = 8) =>
  api
    .get<RecommendationResponse>("/search/recommendations/trending/", {
      params: { limit },
    })
    .then((r) => r.data.products);

const fetchCategory = (slug: string, limit = 8) =>
  api
    .get<RecommendationResponse>("/search/recommendations/category/", {
      params: { slug, limit },
    })
    .then((r) => r.data.products);

const fetchCompleteTheLook = (productId: number, limit = 4) =>
  api
    .get<RecommendationResponse>("/search/recommendations/complete_the_look/", {
      params: { product_id: productId, limit },
    })
    .then((r) => r.data.products);

const fetchRecentlyViewed = (limit = 6) =>
  api
    .get<RecommendationResponse>("/search/recommendations/recently_viewed/", {
      params: { limit },
    })
    .then((r) => r.data.products);

const fetchNewArrivals = (limit = 8) =>
  api
    .get<RecommendationResponse>("/search/recommendations/new_arrivals/", {
      params: { limit },
    })
    .then((r) => r.data.products);

const postRecordView = (productId: number, pageUrl?: string) =>
  api.post("/search/recommendations/record_view/", {
    product_id: productId,
    page_url: pageUrl ?? window.location.href,
  });

// ── React Query hooks ─────────────────────────────────────────────────────────

export const useSimilarProducts = (productId: number, limit = 8) =>
  useQuery({
    queryKey: ["rec", "similar", productId, limit],
    queryFn: () => fetchSimilar(productId, limit),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });

export const usePersonalizedFeed = (limit = 8) =>
  useQuery({
    queryKey: ["rec", "feed", limit],
    queryFn: () => fetchFeed(limit),
    staleTime: 1000 * 60 * 2,
  });

export const useTrendingProducts = (limit = 8) =>
  useQuery({
    queryKey: ["rec", "trending", limit],
    queryFn: () => fetchTrending(limit),
    staleTime: 1000 * 60 * 5,
  });

export const useCategoryPicks = (slug: string, limit = 8) =>
  useQuery({
    queryKey: ["rec", "category", slug, limit],
    queryFn: () => fetchCategory(slug, limit),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

export const useCompleteTheLook = (productId: number, limit = 4) =>
  useQuery({
    queryKey: ["rec", "look", productId, limit],
    queryFn: () => fetchCompleteTheLook(productId, limit),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });

export const useRecentlyViewed = (limit = 6) =>
  useQuery({
    queryKey: ["rec", "recently-viewed", limit],
    queryFn: () => fetchRecentlyViewed(limit),
    staleTime: 1000 * 30,
  });

export const useNewArrivalsRec = (limit = 8) =>
  useQuery({
    queryKey: ["rec", "new-arrivals", limit],
    queryFn: () => fetchNewArrivals(limit),
    staleTime: 1000 * 60 * 5,
  });

export const useRecordView = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, pageUrl }: { productId: number; pageUrl?: string }) =>
      postRecordView(productId, pageUrl),
    onSuccess: () => {
      // Invalidate recently-viewed so it refreshes
      qc.invalidateQueries({ queryKey: ["rec", "recently-viewed"] });
    },
  });
};
