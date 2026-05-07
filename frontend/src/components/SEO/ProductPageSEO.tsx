import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSEO } from '../../contexts/SEOContext';
import { SEOUtils } from '../../utils/seo';
import { useProductBySlug } from '../../api/products';
import { useProductRating } from '../../api/reviews';

export const ProductPageSEO: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { updateSEO } = useSEO();
  const { data: product, isLoading } = useProductBySlug(slug || '');
  const { data: rating } = useProductRating(product?.id || 0);

  useEffect(() => {
    if (product) {
      const seoData = SEOUtils.generateProductSEO({
        ...product,
        average_rating: rating?.average_rating,
        total_reviews: rating?.total_reviews,
      });
      
      updateSEO(seoData);
    }
  }, [product, rating, updateSEO]);

  // Generate additional structured data for product page
  useEffect(() => {
    if (product) {
      // Add breadcrumb structured data
      const breadcrumbs = [
        { name: 'Home', url: 'https://femvelle.com' },
        { name: 'Products', url: 'https://femvelle.com/products' },
        { name: product.category, url: `https://femvelle.com/categories/${product.category.toLowerCase()}` },
        { name: product.name, url: `https://femvelle.com/products/${product.slug}` },
      ];

      const breadcrumbSchema = SEOUtils.generateBreadcrumbSchema(breadcrumbs);
      
      // Inject breadcrumb schema
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(breadcrumbSchema);
      script.id = 'breadcrumb-schema';
      
      // Remove existing breadcrumb schema
      const existing = document.getElementById('breadcrumb-schema');
      if (existing) {
        existing.remove();
      }
      
      document.head.appendChild(script);

      return () => {
        const scriptToRemove = document.getElementById('breadcrumb-schema');
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [product]);

  if (isLoading || !product) {
    return null;
  }

  return null; // This component only handles SEO, no visual rendering
};

// Hook for easy SEO updates in product components
export const useProductSEO = (product: any, rating?: any) => {
  const { updateSEO } = useSEO();

  useEffect(() => {
    if (product) {
      const seoData = SEOUtils.generateProductSEO({
        ...product,
        average_rating: rating?.average_rating,
        total_reviews: rating?.total_reviews,
      });
      
      updateSEO(seoData);
    }
  }, [product, rating, updateSEO]);
};