interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  slug: string;
  image_url?: string;
  sku?: string;
  average_rating?: number;
  total_reviews?: number;
  is_active: boolean;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  featured_image?: string;
  author: string;
  published_at: string;
  updated_at: string;
}

export class SEOUtils {
  private static readonly SITE_URL = 'https://femvelle.com';
  private static readonly BRAND_NAME = 'Femvelle';
  private static readonly DEFAULT_IMAGE = '/images/femvelle-og-image.jpg';

  /**
   * Generate SEO data for product pages
   */
  static generateProductSEO(product: Product) {
    const title = `${product.name} - Premium Modest Fashion`;
    const description = this.truncateDescription(
      product.description || `Discover the ${product.name} from Femvelle's ${product.category} collection. Premium quality modest fashion with elegant design and superior craftsmanship.`,
      160
    );

    return {
      title,
      description,
      keywords: this.generateProductKeywords(product),
      image: product.image_url || this.DEFAULT_IMAGE,
      url: `${this.SITE_URL}/products/${product.slug}`,
      type: 'product' as const,
      price: product.price,
      currency: 'USD',
      availability: product.is_active ? 'in_stock' as const : 'out_of_stock' as const,
      brand: this.BRAND_NAME,
      category: product.category,
      sku: product.sku,
      rating: product.average_rating,
      reviewCount: product.total_reviews,
    };
  }

  /**
   * Generate SEO data for blog posts
   */
  static generateBlogSEO(post: BlogPost) {
    const title = `${post.title} - Femvelle Fashion Blog`;
    const description = this.truncateDescription(
      post.excerpt || this.extractTextFromHTML(post.content),
      160
    );

    return {
      title,
      description,
      keywords: this.generateBlogKeywords(post),
      image: post.featured_image || this.DEFAULT_IMAGE,
      url: `${this.SITE_URL}/blog/${post.slug}`,
      type: 'article' as const,
      author: post.author,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    };
  }

  /**
   * Generate SEO data for category pages
   */
  static generateCategorySEO(categoryName: string, categorySlug: string, productCount: number) {
    const title = `${categoryName} - Modest Fashion Collection`;
    const description = `Explore our ${categoryName.toLowerCase()} collection featuring ${productCount} premium modest fashion pieces. Elegant designs crafted for the modern woman who values style and modesty.`;

    return {
      title,
      description,
      keywords: `${categoryName.toLowerCase()}, modest ${categoryName.toLowerCase()}, Islamic ${categoryName.toLowerCase()}, hijab ${categoryName.toLowerCase()}, modest fashion, luxury modest wear`,
      image: this.DEFAULT_IMAGE,
      url: `${this.SITE_URL}/categories/${categorySlug}`,
      type: 'website' as const,
    };
  }

  /**
   * Generate SEO data for search results pages
   */
  static generateSearchSEO(query: string, resultCount: number) {
    const title = `Search Results for "${query}"`;
    const description = `Found ${resultCount} products matching "${query}". Discover modest fashion pieces from Femvelle's premium collection.`;

    return {
      title,
      description,
      keywords: `${query}, modest fashion search, ${query} modest wear, Islamic fashion ${query}`,
      image: this.DEFAULT_IMAGE,
      url: `${this.SITE_URL}/search?q=${encodeURIComponent(query)}`,
      type: 'website' as const,
    };
  }

  /**
   * Generate breadcrumb structured data
   */
  static generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  /**
   * Generate FAQ structured data
   */
  static generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
    return {
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
  }

  /**
   * Generate website structured data
   */
  static generateWebsiteSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.BRAND_NAME,
      url: this.SITE_URL,
      description: 'Premium modest fashion and luxury Islamic wear for the modern woman',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.SITE_URL}/search?q={search_term_string}`,
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
  }

  /**
   * Generate local business structured data
   */
  static generateLocalBusinessSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'ClothingStore',
      name: this.BRAND_NAME,
      image: `${this.SITE_URL}/images/logo.png`,
      '@id': this.SITE_URL,
      url: this.SITE_URL,
      telephone: '+1-800-FEMVELLE',
      address: {
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
      openingHoursSpecification: [
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
  }

  /**
   * Generate product keywords
   */
  private static generateProductKeywords(product: Product): string {
    const baseKeywords = [
      'modest fashion',
      'Islamic fashion',
      'hijab fashion',
      'modest wear',
      'luxury modest clothing',
    ];

    const categoryKeywords = [
      `modest ${product.category.toLowerCase()}`,
      `Islamic ${product.category.toLowerCase()}`,
      `${product.category.toLowerCase()} modest fashion`,
    ];

    const productKeywords = [
      product.name.toLowerCase(),
      `${this.BRAND_NAME.toLowerCase()} ${product.category.toLowerCase()}`,
    ];

    return [...baseKeywords, ...categoryKeywords, ...productKeywords].join(', ');
  }

  /**
   * Generate blog keywords
   */
  private static generateBlogKeywords(post: BlogPost): string {
    const baseKeywords = [
      'modest fashion blog',
      'Islamic fashion tips',
      'hijab styling',
      'modest fashion advice',
      'Femvelle blog',
    ];

    // Extract keywords from title
    const titleKeywords = post.title
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5);

    return [...baseKeywords, ...titleKeywords].join(', ');
  }

  /**
   * Truncate description to specified length
   */
  private static truncateDescription(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  /**
   * Extract plain text from HTML content
   */
  private static extractTextFromHTML(html: string): string {
    // Simple HTML tag removal (in production, use a proper HTML parser)
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return this.truncateDescription(text, 200);
  }

  /**
   * Generate sitemap URLs
   */
  static generateSitemapUrls() {
    const staticUrls = [
      { url: this.SITE_URL, priority: 1.0, changefreq: 'daily' },
      { url: `${this.SITE_URL}/products`, priority: 0.9, changefreq: 'daily' },
      { url: `${this.SITE_URL}/categories`, priority: 0.8, changefreq: 'weekly' },
      { url: `${this.SITE_URL}/blog`, priority: 0.7, changefreq: 'daily' },
      { url: `${this.SITE_URL}/about`, priority: 0.6, changefreq: 'monthly' },
      { url: `${this.SITE_URL}/contact`, priority: 0.6, changefreq: 'monthly' },
      { url: `${this.SITE_URL}/privacy`, priority: 0.3, changefreq: 'yearly' },
      { url: `${this.SITE_URL}/terms`, priority: 0.3, changefreq: 'yearly' },
    ];

    return staticUrls;
  }

  /**
   * Generate robots.txt content
   */
  static generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /account/
Disallow: /cart/
Disallow: /wishlist/

# Disallow search and filter URLs
Disallow: /search?
Disallow: /*?sort=
Disallow: /*?filter=
Disallow: /*?page=

# Allow important assets
Allow: /images/
Allow: /css/
Allow: /js/
Allow: /*.css
Allow: /*.js

# Sitemap location
Sitemap: ${this.SITE_URL}/sitemap.xml

# Crawl delay for respectful crawling
Crawl-delay: 1`;
  }
}