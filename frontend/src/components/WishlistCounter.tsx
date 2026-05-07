import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../api/wishlist';
import { useAuthStore } from '../store/authStore';

interface WishlistCounterProps {
  className?: string;
  showCount?: boolean;
}

export const WishlistCounter: React.FC<WishlistCounterProps> = ({
  className = '',
  showCount = true,
}) => {
  const { isAuthenticated } = useAuthStore();
  const { data: wishlist } = useWishlist();

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className={`
          relative p-2 text-gray-600 hover:text-[#C4985A] 
          transition-colors duration-200 ${className}
        `}
        title="Login to view wishlist"
      >
        <Heart className="w-6 h-6" />
      </Link>
    );
  }

  const itemCount = wishlist?.item_count || 0;

  return (
    <Link
      to="/wishlist"
      className={`
        relative p-2 text-gray-600 hover:text-[#C4985A] 
        transition-colors duration-200 ${className}
      `}
      title={`Wishlist (${itemCount} items)`}
    >
      <Heart className="w-6 h-6" />
      
      {/* Count Badge */}
      <AnimatePresence>
        {showCount && itemCount > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="
              absolute -top-1 -right-1 bg-red-500 text-white text-xs
              rounded-full min-w-[18px] h-[18px] flex items-center justify-center
              font-medium leading-none
            "
          >
            {itemCount > 99 ? '99+' : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};