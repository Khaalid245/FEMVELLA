import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Shield, Filter, ChevronDown } from 'lucide-react';
import { StarRating } from './StarRating';
import { useProductReviews, useVoteReviewHelpfulness, ReviewFilters } from '../api/reviews';
import { useAuthStore } from '../store/authStore';

interface ReviewListProps {
  productId: number;
  className?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  productId,
  className = '',
}) => {
  const { isAuthenticated } = useAuthStore();
  const [filters, setFilters] = useState<ReviewFilters>({
    sort: 'newest',
    page: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: reviewsData, isLoading } = useProductReviews(productId, filters);
  const voteHelpfulness = useVoteReviewHelpfulness();

  const handleFilterChange = (newFilters: Partial<ReviewFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleVote = (reviewId: number, isHelpful: boolean) => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      window.location.href = '/login';
      return;
    }

    voteHelpfulness.mutate({ reviewId, isHelpful });
  };

  const loadMore = () => {
    if (reviewsData?.next) {
      setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  };

  if (isLoading && !reviewsData) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const reviews = reviewsData?.results || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filter & Sort Reviews</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
          />
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange({ sort: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4985A] focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="rating_high">Highest Rating</option>
                  <option value="rating_low">Lowest Rating</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) => handleFilterChange({ 
                    rating: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4985A] focus:border-transparent"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Verified Only */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verified_only || false}
                    onChange={(e) => handleFilterChange({ verified_only: e.target.checked })}
                    className="rounded border-gray-300 text-[#C4985A] focus:ring-[#C4985A]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Verified purchases only
                  </span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No reviews match your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#C4985A] rounded-full flex items-center justify-center text-white font-medium">
                    {review.user.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-[#2C2420]">
                        {review.user.display_name}
                      </span>
                      {review.is_verified_purchase && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          <Shield className="w-3 h-3" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <h4 className="font-medium text-[#2C2420] mb-2">
                  {review.title}
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {review.content}
                </p>
              </div>

              {/* Review Images */}
              {review.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {review.images.map((image) => (
                    <img
                      key={image.id}
                      src={image.image}
                      alt={image.caption || 'Review image'}
                      className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        // Open image in modal/lightbox
                        window.open(image.image, '_blank');
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Helpfulness Voting */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Was this review helpful?
                </div>
                
                <div className="flex items-center space-x-4">
                  {review.can_vote && (
                    <>
                      <button
                        onClick={() => handleVote(review.id, true)}
                        disabled={voteHelpfulness.isPending}
                        className={`
                          flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors
                          ${review.user_vote === true
                            ? 'bg-green-100 text-green-700'
                            : 'hover:bg-gray-100 text-gray-600'
                          }
                        `}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{review.helpful_count}</span>
                      </button>
                      
                      <button
                        onClick={() => handleVote(review.id, false)}
                        disabled={voteHelpfulness.isPending}
                        className={`
                          flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors
                          ${review.user_vote === false
                            ? 'bg-red-100 text-red-700'
                            : 'hover:bg-gray-100 text-gray-600'
                          }
                        `}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{review.not_helpful_count}</span>
                      </button>
                    </>
                  )}
                  
                  {!review.can_vote && (
                    <div className="text-sm text-gray-500">
                      {review.helpful_count} of {review.helpful_count + review.not_helpful_count} found helpful
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More */}
      {reviewsData?.next && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-2 border border-[#C4985A] text-[#C4985A] rounded-lg hover:bg-[#C4985A] hover:text-white transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}
    </div>
  );
};