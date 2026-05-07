import React, { createContext, useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  price?: number;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  brand?: string;
  category?: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

interface SEOContextType {
  updateSEO: (data: SEOData) => void;
  resetSEO: () => void;
  currentSEO: SEOData;
}

const SEOContext = createContext<SEOContextType | undefined>(undefined);

const defaultSEO: SEOData = {
  title: 'Femvelle - Modest Luxury Fashion',
  description: 'Discover elegant modest fashion at Femvelle. Premium quality dresses, abayas, and modest wear designed for the modern woman. Free shipping on orders over $75.',
  keywords: 'modest fashion, luxury modest wear, abayas, modest dresses, hijab fashion, Islamic fashion, elegant modest clothing',
  image: '/images/femvelle-og-image.jpg',
  url: 'https://femvelle.com',
  type: 'website',
  brand: 'Femvelle',
};

export const SEOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSEO, setCurrentSEO] = useState<SEOData>(defaultSEO);

  const updateSEO = (data: SEOData) => {
    setCurrentSEO(prev => ({
      ...prev,
      ...data,
      // Ensure title includes brand name if not already present
      title: data.title && !data.title.includes('Femvelle') 
        ? `${data.title} | Femvelle` 
        : data.title || prev.title,
    }));
  };

  const resetSEO = () => {
    setCurrentSEO(defaultSEO);
  };

  // Generate structured data based on current SEO
  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Femvelle',
      url: 'https://femvelle.com',
      logo: 'https://femvelle.com/images/logo.png',
      description: 'Premium modest fashion and luxury Islamic wear',
      sameAs: [
        'https://instagram.com/femvelle',
        'https://facebook.com/femvelle',
        'https://twitter.com/femvelle'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-800-FEMVELLE',
        contactType: 'customer service',
        availableLanguage: ['English', 'Arabic']
      }
    };

    // Add product-specific structured data
    if (currentSEO.type === 'product') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: currentSEO.title?.replace(' | Femvelle', ''),
        description: currentSEO.description,
        image: currentSEO.image,
        brand: {
          '@type': 'Brand',
          name: currentSEO.brand || 'Femvelle'
        },
        category: currentSEO.category,
        sku: currentSEO.sku,
        offers: {
          '@type': 'Offer',
          price: currentSEO.price,
          priceCurrency: currentSEO.currency || 'USD',
          availability: `https://schema.org/${currentSEO.availability === 'in_stock' ? 'InStock' : 'OutOfStock'}`,
          seller: {
            '@type': 'Organization',
            name: 'Femvelle'
          }
        },
        aggregateRating: currentSEO.rating ? {
          '@type': 'AggregateRating',
          ratingValue: currentSEO.rating,
          reviewCount: currentSEO.reviewCount || 0,
          bestRating: 5,
          worstRating: 1
        } : undefined
      };
    }

    // Add article-specific structured data
    if (currentSEO.type === 'article') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: currentSEO.title?.replace(' | Femvelle', ''),
        description: currentSEO.description,
        image: currentSEO.image,
        author: {
          '@type': 'Person',
          name: currentSEO.author || 'Femvelle Editorial Team'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Femvelle',
          logo: {
            '@type': 'ImageObject',
            url: 'https://femvelle.com/images/logo.png'
          }
        },
        datePublished: currentSEO.publishedTime,
        dateModified: currentSEO.modifiedTime || currentSEO.publishedTime
      };
    }

    return baseData;
  };

  return (
    <SEOContext.Provider value={{ updateSEO, resetSEO, currentSEO }}>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{currentSEO.title}</title>
        <meta name="description" content={currentSEO.description} />
        <meta name="keywords" content={currentSEO.keywords} />
        <link rel="canonical" href={currentSEO.url} />

        {/* Open Graph Tags */}
        <meta property="og:title" content={currentSEO.title} />
        <meta property="og:description" content={currentSEO.description} />
        <meta property="og:image" content={currentSEO.image} />
        <meta property="og:url" content={currentSEO.url} />
        <meta property="og:type" content={currentSEO.type} />
        <meta property="og:site_name" content="Femvelle" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@femvelle" />
        <meta name="twitter:creator" content="@femvelle" />
        <meta name="twitter:title" content={currentSEO.title} />
        <meta name="twitter:description" content={currentSEO.description} />
        <meta name="twitter:image" content={currentSEO.image} />

        {/* Product-specific meta tags */}
        {currentSEO.type === 'product' && (
          <>
            <meta property="product:price:amount" content={currentSEO.price?.toString()} />
            <meta property="product:price:currency" content={currentSEO.currency || 'USD'} />
            <meta property="product:availability" content={currentSEO.availability} />
            <meta property="product:brand" content={currentSEO.brand} />
            <meta property="product:category" content={currentSEO.category} />
          </>
        )}

        {/* Article-specific meta tags */}
        {currentSEO.type === 'article' && (
          <>
            <meta property="article:author" content={currentSEO.author} />
            <meta property="article:published_time" content={currentSEO.publishedTime} />
            <meta property="article:modified_time" content={currentSEO.modifiedTime} />
          </>
        )}

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>

        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Language" content="en" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Favicon and App Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#C4985A" />
        <meta name="msapplication-TileColor" content="#C4985A" />
      </Helmet>
      {children}
    </SEOContext.Provider>
  );
};

export const useSEO = () => {
  const context = useContext(SEOContext);
  if (context === undefined) {
    throw new Error('useSEO must be used within a SEOProvider');
  }
  return context;
};