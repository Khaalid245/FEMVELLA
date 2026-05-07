import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist, useRemoveFromWishlist, useClearWishlist } from '../api/wishlist';
import { WishlistHeart } from '../components/WishlistHeart';

export const WishlistPage: React.FC = () => {
  const { data: wishlist, isLoading, error } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const clearWishlist = useClearWishlist();

  const handleRemoveItem = (productId: number) => {
    removeFromWishlist.mutate(productId);
  };

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      clearWishlist.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEFCF8] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 space-y-4">
                  <div className="aspect-square bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FEFCF8] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-[#2C2420] mb-2">
              Unable to load wishlist
            </h2>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !wishlist?.items?.length;

  return (
    <div className="min-h-screen bg-[#FEFCF8] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2C2420] font-serif">
              My Wishlist
            </h1>
            {!isEmpty && (
              <p className="text-gray-600 mt-2">
                {wishlist.item_count} item{wishlist.item_count !== 1 ? 's' : ''} • 
                Total value: ${wishlist.total_value.toFixed(2)}
              </p>
            )}
          </div>

          {!isEmpty && (
            <button
              onClick={handleClearWishlist}
              disabled={clearWishlist.isPending}
              className="
                flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700
                border border-red-200 hover:border-red-300 rounded-lg
                transition-colors duration-200 disabled:opacity-50
              "
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Heart className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-[#2C2420] mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start adding items you love to your wishlist. 
              They'll be saved here for easy access later.
            </p>
            <Link
              to="/products"
              className="
                inline-flex items-center space-x-2 bg-[#C4985A] text-white
                px-6 py-3 rounded-lg hover:bg-[#B8894E] transition-colors duration-200
              "
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Start Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Wishlist Items */}
        {!isEmpty && (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="relative group">
                    {/* Product Image */}
                    <Link to={`/products/${item.product.slug}`}>
                      <div className="aspect-square overflow-hidden rounded-t-lg">
                        <img
                          src={item.product.image_url || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Wishlist Heart */}
                    <div className="absolute top-3 right-3">
                      <WishlistHeart productId={item.product.id} />
                    </div>

                    {/* Quick Remove Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRemoveItem(item.product.id)}
                      disabled={removeFromWishlist.isPending}
                      className="
                        absolute top-3 left-3 p-2 bg-white/80 backdrop-blur-sm
                        border border-gray-200 rounded-full opacity-0 group-hover:opacity-100
                        hover:bg-white hover:border-red-300 transition-all duration-200
                        disabled:opacity-50
                      "
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </motion.button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link to={`/products/${item.product.slug}`}>
                      <h3 className="font-medium text-[#2C2420] hover:text-[#C4985A] transition-colors duration-200 line-clamp-2">
                        {item.product.name}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      {item.product.category}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-semibold text-[#2C2420]">
                        ${item.product.price.toFixed(2)}
                      </span>
                      
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="
                          text-sm text-[#C4985A] hover:text-[#B8894E] 
                          font-medium transition-colors duration-200
                        "
                      >
                        View Details
                      </Link>
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Added {new Date(item.added_at).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Continue Shopping */}
        {!isEmpty && (
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="
                inline-flex items-center space-x-2 text-[#C4985A] hover:text-[#B8894E]
                font-medium transition-colors duration-200
              "
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};