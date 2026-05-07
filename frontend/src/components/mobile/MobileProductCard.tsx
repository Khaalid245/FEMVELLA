import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeartIcon, ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  images: Array<{
    id: number;
    image: string;
    alt_text: string;
    is_primary: boolean;
  }>;
  category: {
    name: string;
    slug: string;
  };
  average_rating?: number;
  review_count?: number;
  variants?: Array<{
    id: number;
    size: string;
    color: string;
    stock_quantity: number;
  }>;
}

interface MobileProductCardProps {
  product: Product;
  onAddToWishlist?: (productId: number) => void;
  onQuickAdd?: (productId: number) => void;
  isInWishlist?: boolean;
  className?: string;
}

const MobileProductCard: React.FC<MobileProductCardProps> = ({
  product,
  onAddToWishlist,
  onQuickAdd,
  isInWishlist = false,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isQuickAddLoading, setIsQuickAddLoading] = useState(false);

  const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
  const hasMultipleImages = product.images.length > 1;
  const secondaryImage = hasMultipleImages ? product.images.find(img => !img.is_primary) || product.images[1] : null;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onAddToWishlist || isWishlistLoading) return;
    
    setIsWishlistLoading(true);
    try {
      await onAddToWishlist(product.id);
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onQuickAdd || isQuickAddLoading) return;
    
    setIsQuickAddLoading(true);
    try {
      await onQuickAdd(product.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsQuickAddLoading(false);
    }
  };

  const formatRating = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
    >
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden group">
          {/* Primary Image */}
          <img
            src={primaryImage?.image}
            alt={primaryImage?.alt_text || product.name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              hasMultipleImages ? 'group-hover:opacity-0' : ''
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          
          {/* Secondary Image (Hover Effect) */}
          {secondaryImage && (
            <img
              src={secondaryImage.image}
              alt={secondaryImage.alt_text || product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              loading="lazy"
            />
          )}

          {/* Loading Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Wishlist Button */}
            {onAddToWishlist && (
              <button
                onClick={handleWishlistClick}
                disabled={isWishlistLoading}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {isWishlistLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-[#C4985A] rounded-full animate-spin" />
                ) : isInWishlist ? (
                  <HeartSolidIcon className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}

            {/* Quick View Button */}
            <button
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              aria-label="Quick view"
            >
              <EyeIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Stock Badge */}
          {product.variants && product.variants.every(v => v.stock_quantity === 0) && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              Out of Stock
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs">
            {product.category.name}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          {product.average_rating && product.review_count && (
            <div className="flex items-center space-x-1 mb-2">
              <span className="text-yellow-400 text-sm">
                {formatRating(product.average_rating)}
              </span>
              <span className="text-xs text-gray-500">
                ({product.review_count})
              </span>
            </div>
          )}

          {/* Price and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-lg font-bold text-[#C4985A]">
                ${product.price}
              </p>
            </div>

            {/* Quick Add Button */}
            {onQuickAdd && (
              <button
                onClick={handleQuickAdd}
                disabled={isQuickAddLoading || (product.variants && product.variants.every(v => v.stock_quantity === 0))}
                className="bg-[#C4985A] text-white p-2 rounded-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Quick add to cart"
              >
                {isQuickAddLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingBagIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Available Sizes (if variants exist) */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {[...new Set(product.variants.map(v => v.size))].slice(0, 4).map((size, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {size}
                </span>
              ))}
              {[...new Set(product.variants.map(v => v.size))].length > 4 && (
                <span className="text-xs text-gray-400">
                  +{[...new Set(product.variants.map(v => v.size))].length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default MobileProductCard;