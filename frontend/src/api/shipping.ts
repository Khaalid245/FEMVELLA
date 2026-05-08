import { useMutation, useQuery } from '@tanstack/react-query';
import api from './client';

export interface CartItem {
  id: number;
  quantity: number;
  weight?: number;
}

export interface ShippingMethod {
  id: number;
  name: string;
  carrier: string;
  description: string;
  cost: number;
  delivery_estimate: string;
  min_days: number;
  max_days: number;
  is_free: boolean;
}

export interface ShippingCalculation {
  method_id: number;
  method_name: string;
  cost: number;
  delivery_estimate: string;
  is_free: boolean;
}

export interface ShippingRecommendations {
  cheapest: ShippingMethod | null;
  fastest: ShippingMethod | null;
}

// Get available shipping methods
export const useShippingMethods = (
  countryCode: string,
  orderValue: number,
  cartItems: CartItem[] = []
) => {
  return useQuery({
    queryKey: ['shipping-methods', countryCode, orderValue, cartItems.length],
    queryFn: async () => {
      const { data } = await api.post('/shipping/methods/', {
        country_code: countryCode,
        order_value: orderValue,
        cart_items: cartItems,
      });
      return data;
    },
    enabled: !!countryCode && orderValue > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Calculate shipping cost for specific method
export const useCalculateShipping = () => {
  return useMutation({
    mutationFn: async ({
      methodId,
      countryCode,
      orderValue,
      cartItems = [],
    }: {
      methodId: number;
      countryCode: string;
      orderValue: number;
      cartItems?: CartItem[];
    }) => {
      const { data } = await api.post('/shipping/calculate/', {
        method_id: methodId,
        country_code: countryCode,
        order_value: orderValue,
        cart_items: cartItems,
      });
      return data.shipping as ShippingCalculation;
    },
  });
};

// Get shipping recommendations (cheapest/fastest)
export const useShippingRecommendations = (
  countryCode: string,
  orderValue: number,
  cartItems: CartItem[] = []
) => {
  return useQuery({
    queryKey: ['shipping-recommendations', countryCode, orderValue, cartItems.length],
    queryFn: async () => {
      const { data } = await api.post('/shipping/recommendations/', {
        country_code: countryCode,
        order_value: orderValue,
        cart_items: cartItems,
      });
      return data.recommendations as ShippingRecommendations;
    },
    enabled: !!countryCode && orderValue > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};