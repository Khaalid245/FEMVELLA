import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starRating = index + 1;
        const isFilled = starRating <= rating;
        const isPartial = starRating > rating && starRating - 1 < rating;
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(starRating)}
            disabled={!interactive}
            className={`
              relative transition-colors duration-200
              ${interactive 
                ? 'hover:scale-110 cursor-pointer' 
                : 'cursor-default'
              }
            `}
          >
            <Star
              className={`
                ${sizeClasses[size]} transition-colors duration-200
                ${isFilled 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300'
                }
                ${interactive && 'hover:text-yellow-400'}
              `}
            />
            
            {/* Partial star fill */}
            {isPartial && (
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${(rating - Math.floor(rating)) * 100}%` }}
              >
                <Star
                  className={`
                    ${sizeClasses[size]} text-yellow-400 fill-yellow-400
                  `}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};