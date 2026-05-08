import { useQuery } from "@tanstack/react-query";
import api from "./client";

export interface CMSBanner {
  id: number;
  title: string;
  subtitle: string;
  badge_text: string;
  cta_label: string;
  cta_url: string;
  secondary_cta_label: string;
  secondary_cta_url: string;
  image: string | null;
  image_alt: string;
  sort_order: number;
}

export interface CMSCollection {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  image: string | null;
  image_alt: string;
  cta_label: string;
  cta_url: string;
  sort_order: number;
}

export interface CMSLookbookEntry {
  id: number;
  title: string;
  description: string;
  image: string;
  image_alt: string;
  product_url: string;
  sort_order: number;
}

export interface HomepageContent {
  banners: CMSBanner[];
  collections: CMSCollection[];
  lookbook: CMSLookbookEntry[];
}

export function useHomepageContent() {
  return useQuery<HomepageContent>({
    queryKey: ["cms", "homepage"],
    queryFn: async () => {
      const { data } = await api.get("/cms/homepage/");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 min — matches server cache
  });
}

// Admin: reorder items
export async function reorderCMSItems(
  contentType: "banners" | "collections" | "lookbook",
  items: { id: number; sort_order: number }[]
) {
  await api.patch(`/cms/reorder/${contentType}/`, items);
}
