import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShippingMethodSelector } from './ShippingMethodSelector';
import { ShippingCalculator } from './ShippingCalculator';
import { useShippingMethods, useShippingRecommendations, CartItem } from '../api/shipping';

interface CheckoutShippingProps {
  countryCode: string;
  orderSubtotal: number;
  cartItems: CartItem[];
  onShippingChange: (cost: number, methodId: number | null, methodName: string) => void;
}

export const CheckoutShipping: React.FC<CheckoutShippingProps> = ({
  countryCode,
  orderSubtotal,
  cartItems,
  onShippingChange,
}) => {
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const { 
    data: methodsData, 
    isLoading: methodsLoading,
    error: methodsError 
  } = useShippingMethods(countryCode, orderSubtotal, cartItems);

  const { 
    data: recommendations 
  } = useShippingRecommendations(countryCode, orderSubtotal, cartItems);

  // Auto-select cheapest method when methods load
  useEffect(() => {
    if (methodsData?.methods?.length && !selectedMethodId) {
      const cheapestMethod = methodsData.methods.reduce((prev: any, current: any) => 
        prev.cost < current.cost ? prev : current
      );
      setSelectedMethodId(cheapestMethod.id);
    }
  }, [methodsData, selectedMethodId]);

  // Reset selection when country changes
  useEffect(() => {
    setSelectedMethodId(null);
    setShippingCost(0);
    setError('');
  }, [countryCode]);

  const handleMethodSelect = (methodId: number) => {
    setSelectedMethodId(methodId);
    setError('');
  };

  const handleShippingCalculated = (cost: number, methodName: string) => {
    setShippingCost(cost);
    onShippingChange(cost, selectedMethodId, methodName);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setShippingCost(0);
    onShippingChange(0, null, '');
  };

  if (methodsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">
          Unable to load shipping methods. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#2C2420]">Shipping Method</h3>
        
        {recommendations && (
          <div className="text-sm text-gray-600">
            {recommendations.cheapest && (
              <span>
                Cheapest: ${recommendations.cheapest.cost.toFixed(2)}
              </span>
            )}
            {recommendations.fastest && recommendations.cheapest && 
             recommendations.fastest.id !== recommendations.cheapest.id && (
              <span className="ml-3">
                Fastest: {recommendations.fastest.delivery_estimate}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Shipping Methods */}
      <ShippingMethodSelector
        methods={methodsData?.methods || []}
        selectedMethod={selectedMethodId}
        onMethodSelect={handleMethodSelect}
        loading={methodsLoading}
      />

      {/* Shipping Calculator */}
      <ShippingCalculator
        countryCode={countryCode}
        orderValue={orderSubtotal}
        cartItems={cartItems}
        selectedMethodId={selectedMethodId}
        onShippingCalculated={handleShippingCalculated}
        onError={handleError}
      />

      {/* Recommendations */}
      {recommendations && methodsData?.methods?.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
          <div className="space-y-2 text-sm">
            {recommendations.cheapest && (
              <div className="flex justify-between">
                <span className="text-blue-700">💰 Cheapest:</span>
                <span className="font-medium">
                  {recommendations.cheapest.name} - ${recommendations.cheapest.cost.toFixed(2)}
                </span>
              </div>
            )}
            {recommendations.fastest && (
              <div className="flex justify-between">
                <span className="text-blue-700">⚡ Fastest:</span>
                <span className="font-medium">
                  {recommendations.fastest.name} - {recommendations.fastest.delivery_estimate}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};