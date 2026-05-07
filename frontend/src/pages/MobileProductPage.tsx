import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartIcon, 
  ShareIcon, 
  StarIcon,
  ChevronDownIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

import MobileProductGallery from '../components/mobile/MobileProductGallery';
import StickyAddToCart from '../components/mobile/StickyAddToCart';
import MobileLayout, { MobileSection, MobileButton } from '../components/mobile/MobileLayout';
import { useSwipeGesture, hapticFeedback } from '../hooks/useGestures';
import { useAnalytics } from '../hooks/useAnalytics';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  images: Array<{
    id: number;
    image: string;
    alt_text: string;
    is_primary: boolean;
  }>;
  variants: Array<{
    id: number;
    size: string;
    color: string;
    stock_quantity: number;
    price: string;
  }>;
  category: {
    name: string;
    slug: string;
  };
  average_rating: number;
  review_count: number;
  reviews: Array<{
    id: number;
    user: { first_name: string };
    rating: number;
    title: string;
    content: string;
    created_at: string;
  }>;
}

const MobileProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const pageRef = useRef<HTMLDivElement>(null);
  const productInfoRef = useRef<HTMLDivElement>(null);
  const { trackProductView, trackAddToCart, trackWishlistAdd } = useAnalytics();

  // Swipe gesture for navigation
  useSwipeGesture(pageRef, {
    onSwipeRight: () => {
      window.history.back();
    }
  });

  // Intersection observer for sticky cart
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyCart(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (productInfoRef.current) {
      observer.observe(productInfoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        // Simulate API call
        const mockProduct: Product = {
          id: 1,
          name: 'Elegant Modest Dress',
          slug: slug || '',
          description: 'A beautiful and elegant modest dress perfect for any occasion. Made with high-quality fabric and attention to detail.',
          price: '89.99',
          images: [
            {
              id: 1,
              image: '/api/placeholder/400/600',
              alt_text: 'Elegant Modest Dress - Front View',
              is_primary: true
            },
            {
              id: 2,
              image: '/api/placeholder/400/600',
              alt_text: 'Elegant Modest Dress - Side View',
              is_primary: false
            }
          ],
          variants: [
            { id: 1, size: 'S', color: 'Navy', stock_quantity: 5, price: '89.99' },
            { id: 2, size: 'M', color: 'Navy', stock_quantity: 3, price: '89.99' },
            { id: 3, size: 'L', color: 'Navy', stock_quantity: 8, price: '89.99' },
            { id: 4, size: 'S', color: 'Black', stock_quantity: 2, price: '89.99' },
            { id: 5, size: 'M', color: 'Black', stock_quantity: 0, price: '89.99' },
            { id: 6, size: 'L', color: 'Black', stock_quantity: 4, price: '89.99' },
          ],
          category: { name: 'Dresses', slug: 'dresses' },
          average_rating: 4.5,
          review_count: 23,
          reviews: [
            {
              id: 1,
              user: { first_name: 'Sarah' },
              rating: 5,
              title: 'Perfect fit!',
              content: 'Love this dress, fits perfectly and the quality is amazing.',
              created_at: '2024-01-15'
            }
          ]
        };

        setProduct(mockProduct);
        
        // Track product view
        await trackProductView(
          mockProduct.id,
          mockProduct.name,
          parseFloat(mockProduct.price),
          mockProduct.category.name
        );
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug, trackProductView]);

  // Update selected variant when size/color changes
  useEffect(() => {
    if (product && selectedSize && selectedColor) {
      const variant = product.variants.find(
        v => v.size === selectedSize && v.color === selectedColor
      );
      setSelectedVariant(variant || null);
    }
  }, [product, selectedSize, selectedColor]);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    hapticFeedback.light();
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    hapticFeedback.light();
  };

  const handleAddToCart = async (variant: any, quantity: number) => {
    if (!product) return;
    
    hapticFeedback.success();
    await trackAddToCart(
      product.id,
      product.name,
      parseFloat(variant.price),
      product.category.name
    );
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    
    setIsInWishlist(!isInWishlist);
    hapticFeedback.medium();
    
    if (!isInWishlist) {
      await trackWishlistAdd(product.id, product.name);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
    hapticFeedback.light();
  };

  const formatRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C4985A]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const availableSizes = [...new Set(product.variants.map(v => v.size))];
  const availableColors = [...new Set(product.variants.map(v => v.color))];

  return (
    <div ref={pageRef} className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 rounded-lg active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddToWishlist}
              className="p-2 rounded-lg active:scale-95 transition-transform"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isInWishlist ? (
                <HeartSolidIcon className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-gray-700" />
              )}
            </button>
            
            <button
              className="p-2 rounded-lg active:scale-95 transition-transform"
              aria-label="Share product"
            >
              <ShareIcon className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      <MobileLayout padding="none">
        {/* Product Gallery */}
        <div className="px-4 pt-4">
          <MobileProductGallery
            images={product.images}
            productName={product.name}
          />
        </div>

        {/* Product Info */}
        <div ref={productInfoRef} className="px-4 pt-6">
          <MobileSection background="transparent" padding="sm">
            {/* Category */}
            <p className="text-sm text-[#C4985A] font-medium mb-2">
              {product.category.name}
            </p>

            {/* Product Name */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center space-x-1">
                {formatRating(product.average_rating)}
              </div>
              <span className="text-sm text-gray-600">
                {product.average_rating} ({product.review_count} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-[#C4985A]">
                ${selectedVariant?.price || product.price}
              </span>
            </div>
          </MobileSection>

          {/* Size Selection */}
          <MobileSection title="Size" className="mb-4">
            <div className="grid grid-cols-4 gap-3">
              {availableSizes.map((size) => {
                const isAvailable = product.variants.some(
                  v => v.size === size && v.stock_quantity > 0
                );
                const isSelected = selectedSize === size;
                
                return (
                  <button
                    key={size}
                    onClick={() => isAvailable && handleSizeSelect(size)}
                    disabled={!isAvailable}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-all active:scale-95 ${
                      isSelected
                        ? 'border-[#C4985A] bg-[#C4985A] text-white'
                        : isAvailable
                        ? 'border-gray-300 text-gray-700 hover:border-[#C4985A]'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </MobileSection>

          {/* Color Selection */}
          <MobileSection title="Color" className="mb-6">
            <div className="flex space-x-3">
              {availableColors.map((color) => {
                const isAvailable = product.variants.some(
                  v => v.color === color && v.stock_quantity > 0
                );
                const isSelected = selectedColor === color;
                
                return (
                  <button
                    key={color}
                    onClick={() => isAvailable && handleColorSelect(color)}
                    disabled={!isAvailable}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all active:scale-95 ${
                      isSelected
                        ? 'border-[#C4985A] bg-[#C4985A] text-white'
                        : isAvailable
                        ? 'border-gray-300 text-gray-700 hover:border-[#C4985A]'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </MobileSection>

          {/* Features */}
          <MobileSection className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <TruckIcon className="w-5 h-5 text-[#C4985A]" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                  <p className="text-xs text-gray-600">Orders over $75</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <ShieldCheckIcon className="w-5 h-5 text-[#C4985A]" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Easy Returns</p>
                  <p className="text-xs text-gray-600">30-day policy</p>
                </div>
              </div>
            </div>
          </MobileSection>

          {/* Expandable Sections */}
          <div className="space-y-4 mb-20">
            {/* Description */}
            <div className="bg-white rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('description')}
                className="w-full flex items-center justify-between p-4 text-left active:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">Description</span>
                <ChevronDownIcon 
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedSection === 'description' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <AnimatePresence>
                {expandedSection === 'description' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <p className="text-gray-600 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('reviews')}
                className="w-full flex items-center justify-between p-4 text-left active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">Reviews</span>
                  <span className="text-sm text-gray-500">({product.review_count})</span>
                </div>
                <ChevronDownIcon 
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedSection === 'reviews' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <AnimatePresence>
                {expandedSection === 'reviews' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {product.reviews.map((review) => (
                        <div key={review.id} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-center">
                              {formatRating(review.rating)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {review.user.first_name}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {review.title}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {review.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </MobileLayout>

      {/* Sticky Add to Cart */}
      <StickyAddToCart
        product={product}
        selectedVariant={selectedVariant}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
        isInWishlist={isInWishlist}
        isVisible={showStickyCart}
      />
    </div>
  );
};

export default MobileProductPage;