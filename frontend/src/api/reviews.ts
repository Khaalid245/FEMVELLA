import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './client';

export interface ReviewUser {
  display_name: string;
}

export interface ReviewImage {
  id: number;
  image: string;
  caption: string;
  created_at: string;
}

export interface Review {
  id: number;
  rating: number;
  title: string;
  content: string;
  user: ReviewUser;
  is_verified_purchase: boolean;
  helpful_count: number;
  not_helpful_count: number;
  helpfulness_ratio: number;
  images: ReviewImage[];
  created_at: string;
  updated_at: string;
  can_vote: boolean;
  user_vote: boolean | null;
}

export interface ProductRating {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
  rating_breakdown: Record<string, number>;
}

export interface CreateReviewData {
  rating: number;
  title: string;
  content: string;
  images?: File[];
}

export interface ReviewFilters {
  rating?: number;
  verified_only?: boolean;
  sort?: 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
  page?: number;
}

// Get product reviews with filters
export const useProductReviews = (productId: number, filters: ReviewFilters = {}) => {
  return useQuery({
    queryKey: ['product-reviews', productId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.rating) params.append('rating', filters.rating.toString());
      if (filters.verified_only) params.append('verified_only', 'true');
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.page) params.append('page', filters.page.toString());
      
      const { data } = await api.get(`/reviews/product/${productId}/?${params}`);
      return data;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get product rating summary
export const useProductRating = (productId: number) => {
  return useQuery({
    queryKey: ['product-rating', productId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/product/${productId}/rating/`);
      return data.rating_summary as ProductRating;
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Check review eligibility
export const useReviewEligibility = (productId: number) => {
  return useQuery({
    queryKey: ['review-eligibility', productId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/product/${productId}/eligibility/`);
      return data;
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create review
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, reviewData }: { productId: number; reviewData: CreateReviewData }) => {
      const formData = new FormData();
      formData.append('rating', reviewData.rating.toString());
      formData.append('title', reviewData.title);
      formData.append('content', reviewData.content);
      
      if (reviewData.images) {
        reviewData.images.forEach((image, index) => {
          formData.append('images', image);
        });
      }

      const { data } = await api.post(`/reviews/product/${productId}/create/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: (data, { productId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-rating', productId] });
      queryClient.invalidateQueries({ queryKey: ['review-eligibility', productId] });
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
    },
  });
};

// Vote on review helpfulness
export const useVoteReviewHelpfulness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, isHelpful }: { reviewId: number; isHelpful: boolean }) => {
      const { data } = await api.post(`/reviews/${reviewId}/vote/`, {
        is_helpful: isHelpful,
      });
      return data;
    },
    onSuccess: (data, { reviewId }) => {
      // Update the specific review in all relevant queries
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
    },
  });
};

// Get user's reviews
export const useUserReviews = () => {
  return useQuery({
    queryKey: ['user-reviews'],
    queryFn: async () => {
      const { data } = await api.get('/reviews/my-reviews/');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Delete review
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: number) => {
      const { data } = await api.delete(`/reviews/${reviewId}/delete/`);
      return data;
    },
    onSuccess: () => {
      // Invalidate all review-related queries
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product-rating'] });
    },
  });
};