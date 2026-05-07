import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBagIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface ProductVariant {
  id: number;
  size: string;
  color: string;
  stock_quantity: number;
  price: string;
}

interface StickyAddToCartProps {
  product: {
    id: number;
    name: string;
    price: string;
    variants: ProductVariant[];
    images: Array<{ image: string; alt_text: string }>;
  };
  selectedVariant: ProductVariant | null;
  onAddToCart: (variant: ProductVariant, quantity: number) => void;
  onAddToWishlist: () => void;
  isInWishlist: boolean;
  isVisible: boolean;
}

const StickyAddToCart: React.FC<StickyAddToCartProps> = ({
  product,
  selectedVariant,
  onAddToCart,
  onAddToWishlist,
  isInWishlist,
  isVisible
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      setShowVariantSelector(true);
      return;
    }

    setIsAdding(true);
    
    try {
      await onAddToCart(selectedVariant, quantity);
      setShowSuccess(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const incrementQuantity = () => {
    if (selectedVariant && quantity < selectedVariant.stock_quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <>
      {/* Sticky Bottom Bar */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between space-x-3">
                {/* Product Info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={product.images[0]?.image}
                      alt={product.images[0]?.alt_text}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-lg font-bold text-[#C4985A]">
                      ${selectedVariant?.price || product.price}
                    </p>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                  >
                    <span className="text-lg font-medium">−</span>
                  </button>
                  
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  
                  <button
                    onClick={incrementQuantity}
                    disabled={!selectedVariant || quantity >= selectedVariant.stock_quantity}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                  >
                    <span className="text-lg font-medium">+</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {/* Wishlist Button */}
                  <button
                    onClick={onAddToWishlist}
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                    aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isInWishlist ? (
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Share product"
                  >
                    <ShareIcon className="w-5 h-5 text-gray-600" />
                  </button>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || (selectedVariant && selectedVariant.stock_quantity === 0)}
                    className="bg-[#C4985A] text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform min-w-[120px] justify-center"
                  >
                    {isAdding ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShoppingBagIcon className="w-5 h-5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Variant Selection Hint */}
              {!selectedVariant && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  Please select size and color options above
                </div>
              )}

              {/* Stock Warning */}
              {selectedVariant && selectedVariant.stock_quantity <= 5 && selectedVariant.stock_quantity > 0 && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  Only {selectedVariant.stock_quantity} left in stock
                </div>
              )}

              {/* Out of Stock */}
              {selectedVariant && selectedVariant.stock_quantity === 0 && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  This variant is currently out of stock
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-20 left-4 right-4 z-50"
          >
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Added to cart!</p>
                <p className="text-sm opacity-90">{quantity} × {product.name}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variant Selector Modal */}
      <AnimatePresence>
        {showVariantSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowVariantSelector(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white w-full rounded-t-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Options
              </h3>
              
              <p className="text-gray-600 mb-6">
                Please select size and color options to add this item to your cart.
              </p>
              
              <button
                onClick={() => setShowVariantSelector(false)}
                className="w-full bg-[#C4985A] text-white py-3 rounded-lg font-medium active:scale-95 transition-transform"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StickyAddToCart;