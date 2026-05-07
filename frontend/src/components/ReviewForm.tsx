import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Upload, X, CheckCircle } from 'lucide-react';
import { StarRating } from './StarRating';
import { useCreateReview } from '../api/reviews';

interface ReviewFormProps {
  productId: number;
  productName: string;
  isVerifiedPurchase: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  productName,
  isVerifiedPurchase,
  onSuccess,
  onCancel,
}) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createReview = useCreateReview();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length + images.length > 5) {
      setErrors({ images: 'Maximum 5 images allowed' });
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
    setErrors(prev => ({ ...prev, images: '' }));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    }

    if (content.trim().length < 20) {
      newErrors.content = 'Review must be at least 20 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createReview.mutateAsync({
        productId,
        reviewData: {
          rating,
          title: title.trim(),
          content: content.trim(),
          images: images.length > 0 ? images : undefined,
        },
      });

      onSuccess?.();
    } catch (error: any) {
      if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      } else {
        setErrors({ submit: 'Failed to submit review. Please try again.' });
      }
    }
  };

  if (createReview.isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[#2C2420] mb-2">
          Review Submitted!
        </h3>
        <p className="text-gray-600 mb-4">
          Thank you for your review. It will be published after moderation.
        </p>
        <button
          onClick={onSuccess}
          className="bg-[#C4985A] text-white px-6 py-2 rounded-lg hover:bg-[#B8894E] transition-colors"
        >
          Close
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-[#2C2420]">
          Write a Review
        </h3>
        <p className="text-gray-600 mt-1">
          Reviewing: <span className="font-medium">{productName}</span>
        </p>
        {isVerifiedPurchase && (
          <div className="inline-flex items-center mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Verified Purchase
          </div>
        )}
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-[#2C2420] mb-2">
          Overall Rating *
        </label>
        <div className="flex items-center space-x-3">
          <StarRating
            rating={rating}
            interactive
            onRatingChange={setRating}
            size="lg"
          />
          <span className="text-sm text-gray-600">
            {rating > 0 && `${rating} out of 5 stars`}
          </span>
        </div>
        {errors.rating && (
          <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-[#2C2420] mb-2">
          Review Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4985A] focus:border-transparent"
          maxLength={200}
        />
        <div className="flex justify-between mt-1">
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title}</p>
          )}
          <p className="text-gray-500 text-sm ml-auto">
            {title.length}/200
          </p>
        </div>
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-[#2C2420] mb-2">
          Detailed Review *
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4985A] focus:border-transparent resize-none"
          maxLength={2000}
        />
        <div className="flex justify-between mt-1">
          {errors.content && (
            <p className="text-red-500 text-sm">{errors.content}</p>
          )}
          <p className="text-gray-500 text-sm ml-auto">
            {content.length}/2000
          </p>
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-[#2C2420] mb-2">
          Photos (Optional)
        </label>
        
        {/* Upload Button */}
        <div className="flex items-center space-x-4">
          <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            <span>Add Photos</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={images.length >= 5}
            />
          </label>
          <span className="text-sm text-gray-500">
            Up to 5 images, max 5MB each
          </span>
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {errors.images && (
          <p className="text-red-500 text-sm mt-1">{errors.images}</p>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={createReview.isPending}
          className="px-6 py-2 bg-[#C4985A] text-white rounded-lg hover:bg-[#B8894E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createReview.isPending ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
};