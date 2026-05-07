import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface WishlistItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string;
    slug: string;
    category: string;
    is_active: boolean;
  };
  added_at: string;
}

export interface Wishlist {
  id: number;
  items: WishlistItem[];
  item_count: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

// Get user's wishlist
export const useWishlist = () => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/wishlist/');
      return data.wishlist as Wishlist;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Check if product is in wishlist
export const useWishlistStatus = (productId: number) => {
  return useQuery({
    queryKey: ['wishlist-status', productId],
    queryFn: async () => {
      const { data } = await api.get(`/wishlist/check/${productId}/`);
      return data;
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Toggle product in wishlist (optimistic)
export const useToggleWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const { data } = await api.post('/wishlist/toggle/', {
        product_id: productId,
      });
      return data;
    },
    onMutate: async (productId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      await queryClient.cancelQueries({ queryKey: ['wishlist-status', productId] });

      // Snapshot previous values
      const previousWishlist = queryClient.getQueryData(['wishlist']);
      const previousStatus = queryClient.getQueryData(['wishlist-status', productId]);

      // Optimistically update wishlist status
      queryClient.setQueryData(['wishlist-status', productId], (old: any) => ({
        ...old,
        in_wishlist: !old?.in_wishlist,
        item_count: old?.in_wishlist ? (old.item_count - 1) : (old.item_count + 1),
      }));

      // Optimistically update wishlist
      queryClient.setQueryData(['wishlist'], (old: any) => {
        if (!old) return old;

        const currentStatus = queryClient.getQueryData(['wishlist-status', productId]) as any;
        
        if (currentStatus?.in_wishlist) {
          // Adding to wishlist - we don't have full product data for optimistic update
          return {
            ...old,
            item_count: old.item_count + 1,
          };
        } else {
          // Removing from wishlist
          return {
            ...old,
            items: old.items.filter((item: WishlistItem) => item.product.id !== productId),
            item_count: old.item_count - 1,
          };
        }
      });

      return { previousWishlist, previousStatus };
    },
    onError: (err, productId, context) => {
      // Revert optimistic updates on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
      }
      if (context?.previousStatus) {
        queryClient.setQueryData(['wishlist-status', productId], context.previousStatus);
      }
    },
    onSettled: (data, error, productId) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-status', productId] });
    },
  });
};

// Add to wishlist
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const { data } = await api.post('/wishlist/add/', {
        product_id: productId,
      });
      return data;
    },
    onSuccess: (data, productId) => {
      // Update wishlist status
      queryClient.setQueryData(['wishlist-status', productId], {
        in_wishlist: true,
        item_count: data.item_count,
      });
      
      // Invalidate wishlist to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

// Remove from wishlist
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const { data } = await api.delete('/wishlist/remove/', {
        data: { product_id: productId },
      });
      return data;
    },
    onMutate: async (productId) => {
      // Optimistically remove from wishlist
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      
      const previousWishlist = queryClient.getQueryData(['wishlist']);
      
      queryClient.setQueryData(['wishlist'], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          items: old.items.filter((item: WishlistItem) => item.product.id !== productId),
          item_count: old.item_count - 1,
        };
      });

      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
      }
    },
    onSuccess: (data, productId) => {
      // Update wishlist status
      queryClient.setQueryData(['wishlist-status', productId], {
        in_wishlist: false,
        item_count: data.item_count,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

// Clear wishlist
export const useClearWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/wishlist/clear/');
      return data;
    },
    onSuccess: () => {
      // Clear all wishlist data
      queryClient.setQueryData(['wishlist'], (old: any) => ({
        ...old,
        items: [],
        item_count: 0,
        total_value: 0,
      }));
      
      // Invalidate all wishlist status queries
      queryClient.invalidateQueries({ queryKey: ['wishlist-status'] });
    },
  });
};