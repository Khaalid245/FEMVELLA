import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useToggleWishlist, useWishlistStatus } from '../api/wishlist';
import { useAuthStore } from '../store/authStore';

interface WishlistHeartProps {
  productId: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const WishlistHeart: React.FC<WishlistHeartProps> = ({
  productId,
  size = 'md',
  className = '',
  showTooltip = true,
}) => {
  const { isAuthenticated } = useAuthStore();
  const { data: status, isLoading } = useWishlistStatus(productId);
  const toggleWishlist = useToggleWishlist();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect to login or show login modal
      window.location.href = '/login';
      return;
    }

    toggleWishlist.mutate(productId);
  };

  if (!isAuthenticated) {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className={`
          relative p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200
          hover:bg-white hover:border-gray-300 transition-all duration-200
          ${className}
        `}
        title={showTooltip ? 'Login to add to wishlist' : undefined}
      >
        <Heart className={`${sizeClasses[size]} text-gray-400`} />
      </motion.button>
    );
  }

  const isInWishlist = status?.in_wishlist || false;
  const isProcessing = toggleWishlist.isPending || isLoading;

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      disabled={isProcessing}
      className={`
        relative p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200
        hover:bg-white hover:border-gray-300 transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={showTooltip ? (isInWishlist ? 'Remove from wishlist' : 'Add to wishlist') : undefined}
    >
      <motion.div
        animate={{
          scale: isProcessing ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          repeat: isProcessing ? Infinity : 0,
        }}
      >
        <Heart
          className={`
            ${sizeClasses[size]} transition-colors duration-200
            ${isInWishlist 
              ? 'text-red-500 fill-red-500' 
              : 'text-gray-400 hover:text-red-400'
            }
          `}
        />
      </motion.div>

      {/* Floating heart animation on add */}
      {toggleWishlist.isSuccess && isInWishlist && (
        <motion.div
          initial={{ opacity: 1, scale: 1, y: 0 }}
          animate={{ opacity: 0, scale: 1.5, y: -20 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
        >
          <Heart className={`${sizeClasses[size]} text-red-500 fill-red-500`} />
        </motion.div>
      )}
    </motion.button>
  );
};