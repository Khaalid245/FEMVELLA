import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsTracker } from '../api/analytics';

// Hook for automatic page view tracking
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when location changes
    const trackPageView = async () => {
      try {
        await analyticsTracker.trackPageView(
          window.location.href,
          document.referrer
        );
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [location]);
};

// Hook for product tracking
export const useProductTracking = () => {
  const trackProductView = useCallback(async (
    productId: number,
    productName: string,
    productPrice: number,
    categoryName: string
  ) => {
    try {
      await analyticsTracker.trackProductView(
        productId,
        productName,
        productPrice,
        categoryName
      );
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  }, []);

  const trackAddToCart = useCallback(async (
    productId: number,
    productName: string,
    productPrice: number,
    categoryName: string
  ) => {
    try {
      await analyticsTracker.trackAddToCart(
        productId,
        productName,
        productPrice,
        categoryName
      );
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }
  }, []);

  const trackRemoveFromCart = useCallback(async (
    productId: number,
    productName: string
  ) => {
    try {
      await analyticsTracker.trackRemoveFromCart(productId, productName);
    } catch (error) {
      console.error('Failed to track remove from cart:', error);
    }
  }, []);

  const trackWishlistAdd = useCallback(async (
    productId: number,
    productName: string
  ) => {
    try {
      await analyticsTracker.trackWishlistAdd(productId, productName);
    } catch (error) {
      console.error('Failed to track wishlist add:', error);
    }
  }, []);

  return {
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackWishlistAdd,
  };
};

// Hook for checkout tracking
export const useCheckoutTracking = () => {
  const trackCheckoutStart = useCallback(async () => {
    try {
      await analyticsTracker.trackCheckoutStart();
    } catch (error) {
      console.error('Failed to track checkout start:', error);
    }
  }, []);

  const trackCheckoutComplete = useCallback(async (orderId?: number) => {
    try {
      await analyticsTracker.trackCheckoutComplete(orderId);
    } catch (error) {
      console.error('Failed to track checkout complete:', error);
    }
  }, []);

  return {
    trackCheckoutStart,
    trackCheckoutComplete,
  };
};

// Hook for search tracking
export const useSearchTracking = () => {
  const trackSearch = useCallback(async (query: string, resultsCount: number) => {
    try {
      await analyticsTracker.trackSearch(query, resultsCount);
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, []);

  return {
    trackSearch,
  };
};

// Hook for user action tracking
export const useUserTracking = () => {
  const trackUserRegistration = useCallback(async () => {
    try {
      await analyticsTracker.trackUserRegistration();
    } catch (error) {
      console.error('Failed to track user registration:', error);
    }
  }, []);

  const trackUserLogin = useCallback(async () => {
    try {
      await analyticsTracker.trackUserLogin();
    } catch (error) {
      console.error('Failed to track user login:', error);
    }
  }, []);

  return {
    trackUserRegistration,
    trackUserLogin,
  };
};

// Combined analytics hook
export const useAnalytics = () => {
  const productTracking = useProductTracking();
  const checkoutTracking = useCheckoutTracking();
  const searchTracking = useSearchTracking();
  const userTracking = useUserTracking();

  return {
    ...productTracking,
    ...checkoutTracking,
    ...searchTracking,
    ...userTracking,
  };
};