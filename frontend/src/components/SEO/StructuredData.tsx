import React from 'react';
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  data: object;
  id?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ data, id }) => {
  return (
    <Helmet>
      <script type="application/ld+json" id={id}>
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
};

// Specific structured data components
export const WebsiteStructuredData: React.FC = () => {
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Femvelle',
    url: 'https://femvelle.com',
    description: 'Premium modest fashion and luxury Islamic wear for the modern woman',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://femvelle.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    sameAs: [
      'https://instagram.com/femvelle',
      'https://facebook.com/femvelle',
      'https://twitter.com/femvelle',
      'https://pinterest.com/femvelle',
    ],
  };

  return <StructuredData data={websiteData} id="website-schema" />;
};

export const OrganizationStructuredData: React.FC = () => {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Femvelle',
    url: 'https://femvelle.com',
    logo: 'https://femvelle.com/images/logo.png',
    description: 'Premium modest fashion and luxury Islamic wear',
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: 'Femvelle Founder',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Fashion Avenue',
      addressLocality: 'New York',
      addressRegion: 'NY',
      postalCode: '10001',
      addressCountry: 'US',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+1-800-FEMVELLE',
        contactType: 'customer service',
        availableLanguage: ['English', 'Arabic'],
        areaServed: 'Worldwide',
      },
      {
        '@type': 'ContactPoint',
        email: 'support@femvelle.com',
        contactType: 'customer support',
        availableLanguage: ['English', 'Arabic'],
      },
    ],
    sameAs: [
      'https://instagram.com/femvelle',
      'https://facebook.com/femvelle',
      'https://twitter.com/femvelle',
      'https://pinterest.com/femvelle',
      'https://linkedin.com/company/femvelle',
    ],
  };

  return <StructuredData data={organizationData} id="organization-schema" />;
};

interface BreadcrumbStructuredDataProps {
  breadcrumbs: Array<{ name: string; url: string }>;
}

export const BreadcrumbStructuredData: React.FC<BreadcrumbStructuredDataProps> = ({ breadcrumbs }) => {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  return <StructuredData data={breadcrumbData} id="breadcrumb-schema" />;
};

interface ProductStructuredDataProps {
  product: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency?: string;
    availability: 'in_stock' | 'out_of_stock' | 'preorder';
    brand?: string;
    category?: string;
    sku?: string;
    rating?: number;
    reviewCount?: number;
  };
}

export const ProductStructuredData: React.FC<ProductStructuredDataProps> = ({ product }) => {
  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Femvelle',
    },
    category: product.category,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: `https://schema.org/${product.availability === 'in_stock' ? 'InStock' : 'OutOfStock'}`,
      seller: {
        '@type': 'Organization',
        name: 'Femvelle',
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 0,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };

  return <StructuredData data={productData} id="product-schema" />;
};

interface ArticleStructuredDataProps {
  article: {
    title: string;
    description: string;
    image: string;
    author: string;
    publishedTime: string;
    modifiedTime?: string;
    url: string;
  };
}

export const ArticleStructuredData: React.FC<ArticleStructuredDataProps> = ({ article }) => {
  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Femvelle',
      logo: {
        '@type': 'ImageObject',
        url: 'https://femvelle.com/images/logo.png',
      },
    },
    datePublished: article.publishedTime,
    dateModified: article.modifiedTime || article.publishedTime,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };

  return <StructuredData data={articleData} id="article-schema" />;
};

interface FAQStructuredDataProps {
  faqs: Array<{ question: string; answer: string }>;
}

export const FAQStructuredData: React.FC<FAQStructuredDataProps> = ({ faqs }) => {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <StructuredData data={faqData} id="faq-schema" />;
};

interface LocalBusinessStructuredDataProps {
  business?: {
    name?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    phone?: string;
    hours?: Array<{
      days: string[];
      opens: string;
      closes: string;
    }>;
  };
}

export const LocalBusinessStructuredData: React.FC<LocalBusinessStructuredDataProps> = ({ business }) => {
  const businessData = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: business?.name || 'Femvelle',
    image: 'https://femvelle.com/images/logo.png',
    '@id': 'https://femvelle.com',
    url: 'https://femvelle.com',
    telephone: business?.phone || '+1-800-FEMVELLE',
    address: business?.address ? {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.state,
      postalCode: business.address.zip,
      addressCountry: business.address.country,
    } : {
      '@type': 'PostalAddress',
      streetAddress: '123 Fashion Avenue',
      addressLocality: 'New York',
      addressRegion: 'NY',
      postalCode: '10001',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.7128,
      longitude: -74.0060,
    },
    openingHoursSpecification: business?.hours?.map(hour => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hour.days,
      opens: hour.opens,
      closes: hour.closes,
    })) || [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '10:00',
        closes: '16:00',
      },
    ],
    sameAs: [
      'https://instagram.com/femvelle',
      'https://facebook.com/femvelle',
      'https://twitter.com/femvelle',
    ],
  };

  return <StructuredData data={businessData} id="local-business-schema" />;
};