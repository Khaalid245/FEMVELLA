import React from 'react';
import { StarRating } from './StarRating';
import { useProductRating } from '../api/reviews';

interface ProductRatingSummaryProps {
  productId: number;
  className?: string;
}

export const ProductRatingSummary: React.FC<ProductRatingSummaryProps> = ({
  productId,
  className = '',
}) => {
  const { data: rating, isLoading } = useProductRating(productId);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-5 h-5 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  if (!rating || rating.total_reviews === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No reviews yet
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Rating */}
      <div className="flex items-center space-x-3">
        <div className="text-3xl font-bold text-[#2C2420]">
          {rating.average_rating.toFixed(1)}
        </div>
        <div>
          <StarRating rating={rating.average_rating} size="lg" />
          <div className="text-sm text-gray-600 mt-1">
            Based on {rating.total_reviews} review{rating.total_reviews !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = rating.rating_distribution[stars.toString()] || 0;
          const percentage = rating.rating_breakdown[stars.toString()] || 0;
          
          return (
            <div key={stars} className="flex items-center space-x-3 text-sm">
              <div className="flex items-center space-x-1 w-12">
                <span className="text-gray-600">{stars}</span>
                <StarRating rating={1} maxRating={1} size="sm" />
              </div>
              
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="text-gray-600 w-12 text-right">
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-[#2C2420]">
            {((rating.rating_breakdown['5'] || 0) + (rating.rating_breakdown['4'] || 0)).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600">Positive Reviews</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-[#2C2420]">
            {Object.values(rating.rating_distribution).reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-xs text-gray-600">Total Reviews</div>
        </div>
      </div>
    </div>
  );
};