import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Truck, AlertCircle } from 'lucide-react';
import { useShippingMethods, useCalculateShipping, CartItem } from '../api/shipping';

interface ShippingCalculatorProps {
  countryCode: string;
  orderValue: number;
  cartItems: CartItem[];
  selectedMethodId: number | null;
  onShippingCalculated: (cost: number, methodName: string) => void;
  onError?: (error: string) => void;
}

export const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  countryCode,
  orderValue,
  cartItems,
  selectedMethodId,
  onShippingCalculated,
  onError,
}) => {
  const [calculatedCost, setCalculatedCost] = useState<number>(0);
  const [methodName, setMethodName] = useState<string>('');
  
  const { data: methodsData, isLoading: methodsLoading } = useShippingMethods(
    countryCode,
    orderValue,
    cartItems
  );
  
  const calculateShipping = useCalculateShipping();

  useEffect(() => {
    if (selectedMethodId && countryCode && orderValue > 0) {
      calculateShipping.mutate(
        {
          methodId: selectedMethodId,
          countryCode,
          orderValue,
          cartItems,
        },
        {
          onSuccess: (data) => {
            setCalculatedCost(data.cost);
            setMethodName(data.method_name);
            onShippingCalculated(data.cost, data.method_name);
          },
          onError: (error: any) => {
            const errorMessage = error.response?.data?.error || 'Failed to calculate shipping';
            onError?.(errorMessage);
          },
        }
      );
    } else {
      setCalculatedCost(0);
      setMethodName('');
      onShippingCalculated(0, '');
    }
  }, [selectedMethodId, countryCode, orderValue, cartItems]);

  if (!countryCode) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <Truck className="w-4 h-4" />
        <span>Select country to calculate shipping</span>
      </div>
    );
  }

  if (methodsLoading || calculateShipping.isPending) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <Calculator className="w-4 h-4 animate-spin" />
        <span>Calculating shipping...</span>
      </div>
    );
  }

  if (calculateShipping.isError) {
    return (
      <div className="flex items-center space-x-2 text-red-500 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>Error calculating shipping</span>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {selectedMethodId && calculatedCost >= 0 ? (
        <motion.div
          key="calculated"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-gray-50 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#C4985A]" />
              <span className="text-sm font-medium text-[#2C2420]">
                {methodName}
              </span>
            </div>
            
            <div className="text-right">
              <span className="font-semibold text-[#2C2420]">
                {calculatedCost === 0 ? 'FREE' : `$${calculatedCost.toFixed(2)}`}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="select"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center space-x-2 text-gray-500 text-sm"
        >
          <Truck className="w-4 h-4" />
          <span>Select shipping method</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};