import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Clock, DollarSign } from 'lucide-react';
import { ShippingMethod } from '../api/shipping';

interface ShippingMethodSelectorProps {
  methods: ShippingMethod[];
  selectedMethod: number | null;
  onMethodSelect: (methodId: number) => void;
  loading?: boolean;
}

export const ShippingMethodSelector: React.FC<ShippingMethodSelectorProps> = ({
  methods,
  selectedMethod,
  onMethodSelect,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!methods.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No shipping methods available for your location</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <motion.div
          key={method.id}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`
            relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
            ${
              selectedMethod === method.id
                ? 'border-[#C4985A] bg-[#C4985A]/5'
                : 'border-gray-200 hover:border-gray-300'
            }
          `}
          onClick={() => onMethodSelect(method.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`
                  w-4 h-4 rounded-full border-2 transition-colors
                  ${
                    selectedMethod === method.id
                      ? 'border-[#C4985A] bg-[#C4985A]'
                      : 'border-gray-300'
                  }
                `}
              >
                {selectedMethod === method.id && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-[#2C2420]">{method.name}</h3>
                  {method.is_free && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      FREE
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{method.delivery_estimate}</span>
                  </div>
                  
                  {method.description && (
                    <span className="text-gray-500">{method.description}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-[#2C2420]">
                  {method.is_free ? 'Free' : `$${method.cost.toFixed(2)}`}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 mt-1 capitalize">
                {method.carrier.replace('_', ' ')}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};