import api from "./client";

export interface AutocompleteSuggestion {
  type: "product" | "suggestion";
  text: string;
  slug: string | null;
  url: string;
  price: string | null;
  image: string | null;
  category: string | null;
}

export interface TrendingQuery {
  query: string;
  count: number;
}

export interface RecentlyViewedProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  category: string | null;
}

export interface SearchResults {
  products: any[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  facets: Record<string, any[]>;
  suggestions: AutocompleteSuggestion[];
  query: string;
  backend: string;
}

export const searchApi = {
  autocomplete: async (q: string, limit = 8): Promise<AutocompleteSuggestion[]> => {
    if (q.length < 2) return [];
    const { data } = await api.get("/search/autocomplete/", { params: { q, limit } });
    return data.suggestions ?? [];
  },

  search: async (params: {
    q?: string;
    page?: number;
    page_size?: number;
    sort?: string;
    category?: string;
  }): Promise<SearchResults> => {
    const { data } = await api.get("/search/", { params });
    return data;
  },

  trending: async (limit = 8): Promise<TrendingQuery[]> => {
    const { data } = await api.get("/search/trending/", { params: { limit } });
    return data.queries ?? [];
  },

  recentlyViewed: async (): Promise<RecentlyViewedProduct[]> => {
    const { data } = await api.get("/search/recently_viewed/");
    return data.products ?? [];
  },

  recordView: async (productId: number): Promise<void> => {
    await api.post("/search/record_view/", { product_id: productId });
  },

  trackClick: async (query: string, productId: number, position?: number): Promise<void> => {
    await api.post("/search/track_click/", { query, product: productId, position });
  },
};
