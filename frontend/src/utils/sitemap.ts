interface SitemapUrl {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface Product {
  slug: string;
  updated_at: string;
}

interface BlogPost {
  slug: string;
  updated_at: string;
  published_at: string;
}

interface Category {
  slug: string;
  name: string;
}

export class SitemapGenerator {
  private static readonly SITE_URL = 'https://femvelle.com';

  /**
   * Generate complete sitemap XML
   */
  static generateSitemap(
    products: Product[] = [],
    blogPosts: BlogPost[] = [],
    categories: Category[] = []
  ): string {
    const urls: SitemapUrl[] = [
      // Static pages
      ...this.getStaticUrls(),
      // Dynamic content
      ...this.getProductUrls(products),
      ...this.getBlogUrls(blogPosts),
      ...this.getCategoryUrls(categories),
    ];

    return this.generateSitemapXML(urls);
  }

  /**
   * Generate sitemap index for large sites
   */
  static generateSitemapIndex(): string {
    const sitemaps = [
      {
        loc: `${this.SITE_URL}/sitemap-static.xml`,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        loc: `${this.SITE_URL}/sitemap-products.xml`,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        loc: `${this.SITE_URL}/sitemap-blog.xml`,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        loc: `${this.SITE_URL}/sitemap-categories.xml`,
        lastmod: new Date().toISOString().split('T')[0],
      },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    sitemaps.forEach(sitemap => {
      xml += '  <sitemap>\n';
      xml += `    <loc>${sitemap.loc}</loc>\n`;
      xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      xml += '  </sitemap>\n';
    });

    xml += '</sitemapindex>';
    return xml;
  }

  /**
   * Generate products sitemap
   */
  static generateProductsSitemap(products: Product[]): string {
    const urls = this.getProductUrls(products);
    return this.generateSitemapXML(urls);
  }

  /**
   * Generate blog sitemap
   */
  static generateBlogSitemap(blogPosts: BlogPost[]): string {
    const urls = this.getBlogUrls(blogPosts);
    return this.generateSitemapXML(urls);
  }

  /**
   * Generate categories sitemap
   */
  static generateCategoriesSitemap(categories: Category[]): string {
    const urls = this.getCategoryUrls(categories);
    return this.generateSitemapXML(urls);
  }

  /**
   * Generate static pages sitemap
   */
  static generateStaticSitemap(): string {
    const urls = this.getStaticUrls();
    return this.generateSitemapXML(urls);
  }

  /**
   * Get static page URLs
   */
  private static getStaticUrls(): SitemapUrl[] {
    return [
      {
        url: this.SITE_URL,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/products`,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/categories`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/blog`,
        changefreq: 'daily',
        priority: 0.7,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/about`,
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/contact`,
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/size-guide`,
        changefreq: 'monthly',
        priority: 0.5,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/shipping`,
        changefreq: 'monthly',
        priority: 0.5,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/returns`,
        changefreq: 'monthly',
        priority: 0.5,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/privacy`,
        changefreq: 'yearly',
        priority: 0.3,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${this.SITE_URL}/terms`,
        changefreq: 'yearly',
        priority: 0.3,
        lastmod: new Date().toISOString().split('T')[0],
      },
    ];
  }

  /**
   * Get product URLs
   */
  private static getProductUrls(products: Product[]): SitemapUrl[] {
    return products.map(product => ({
      url: `${this.SITE_URL}/products/${product.slug}`,
      changefreq: 'weekly' as const,
      priority: 0.8,
      lastmod: new Date(product.updated_at).toISOString().split('T')[0],
    }));
  }

  /**
   * Get blog URLs
   */
  private static getBlogUrls(blogPosts: BlogPost[]): SitemapUrl[] {
    return blogPosts.map(post => ({
      url: `${this.SITE_URL}/blog/${post.slug}`,
      changefreq: 'monthly' as const,
      priority: 0.6,
      lastmod: new Date(post.updated_at).toISOString().split('T')[0],
    }));
  }

  /**
   * Get category URLs
   */
  private static getCategoryUrls(categories: Category[]): SitemapUrl[] {
    return categories.map(category => ({
      url: `${this.SITE_URL}/categories/${category.slug}`,
      changefreq: 'weekly' as const,
      priority: 0.7,
      lastmod: new Date().toISOString().split('T')[0],
    }));
  }

  /**
   * Generate sitemap XML from URLs
   */
  private static generateSitemapXML(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(urlData => {
      xml += '  <url>\n';
      xml += `    <loc>${urlData.url}</loc>\n`;
      
      if (urlData.lastmod) {
        xml += `    <lastmod>${urlData.lastmod}</lastmod>\n`;
      }
      
      if (urlData.changefreq) {
        xml += `    <changefreq>${urlData.changefreq}</changefreq>\n`;
      }
      
      if (urlData.priority !== undefined) {
        xml += `    <priority>${urlData.priority.toFixed(1)}</priority>\n`;
      }
      
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
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
Disallow: /login/
Disallow: /register/

# Disallow search and filter URLs to prevent duplicate content
Disallow: /search?
Disallow: /*?sort=
Disallow: /*?filter=
Disallow: /*?page=
Disallow: /*?q=

# Disallow temporary and test pages
Disallow: /test/
Disallow: /temp/
Disallow: /_next/
Disallow: /static/

# Allow important assets
Allow: /images/
Allow: /css/
Allow: /js/
Allow: /*.css
Allow: /*.js
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.gif
Allow: /*.svg
Allow: /*.webp

# Special rules for different bots
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Sitemap locations
Sitemap: ${this.SITE_URL}/sitemap.xml
Sitemap: ${this.SITE_URL}/sitemap-products.xml
Sitemap: ${this.SITE_URL}/sitemap-blog.xml
Sitemap: ${this.SITE_URL}/sitemap-categories.xml

# Host directive (for Google)
Host: ${this.SITE_URL.replace('https://', '')}`;
  }

  /**
   * Generate manifest.json for PWA
   */
  static generateManifest(): object {
    return {
      name: 'Femvelle - Modest Luxury Fashion',
      short_name: 'Femvelle',
      description: 'Premium modest fashion and luxury Islamic wear for the modern woman',
      start_url: '/',
      display: 'standalone',
      background_color: '#FEFCF8',
      theme_color: '#C4985A',
      orientation: 'portrait-primary',
      categories: ['shopping', 'fashion', 'lifestyle'],
      lang: 'en',
      dir: 'ltr',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
        },
        {
          src: '/favicon-32x32.png',
          sizes: '32x32',
          type: 'image/png',
        },
        {
          src: '/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png',
        },
      ],
      screenshots: [
        {
          src: '/screenshots/desktop-home.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide',
        },
        {
          src: '/screenshots/mobile-home.png',
          sizes: '375x667',
          type: 'image/png',
          form_factor: 'narrow',
        },
      ],
    };
  }
}