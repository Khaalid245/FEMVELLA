from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import cache_page
from django.utils import timezone
from django.conf import settings
from apps.products.models import Product, Category
import xml.etree.ElementTree as ET
from datetime import datetime


@cache_page(60 * 60)  # Cache for 1 hour
@require_http_methods(["GET"])
def sitemap_index(request):
    """Generate sitemap index"""
    root = ET.Element('sitemapindex')
    root.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    base_url = f"https://{request.get_host()}"
    current_date = timezone.now().strftime('%Y-%m-%d')
    
    sitemaps = [
        {'loc': f'{base_url}/sitemap-static.xml', 'lastmod': current_date},
        {'loc': f'{base_url}/sitemap-products.xml', 'lastmod': current_date},
        {'loc': f'{base_url}/sitemap-categories.xml', 'lastmod': current_date},
        {'loc': f'{base_url}/sitemap-blog.xml', 'lastmod': current_date},
    ]
    
    for sitemap_data in sitemaps:
        sitemap_elem = ET.SubElement(root, 'sitemap')
        
        loc_elem = ET.SubElement(sitemap_elem, 'loc')
        loc_elem.text = sitemap_data['loc']
        
        lastmod_elem = ET.SubElement(sitemap_elem, 'lastmod')
        lastmod_elem.text = sitemap_data['lastmod']
    
    xml_str = ET.tostring(root, encoding='unicode', method='xml')
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    response = HttpResponse(xml_declaration + xml_str, content_type='application/xml')
    return response


@cache_page(60 * 60 * 24)  # Cache for 24 hours
@require_http_methods(["GET"])
def sitemap_static(request):
    """Generate static pages sitemap"""
    root = ET.Element('urlset')
    root.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    base_url = f"https://{request.get_host()}"
    current_date = timezone.now().strftime('%Y-%m-%d')
    
    static_pages = [
        {'url': base_url, 'priority': '1.0', 'changefreq': 'daily'},
        {'url': f'{base_url}/products', 'priority': '0.9', 'changefreq': 'daily'},
        {'url': f'{base_url}/categories', 'priority': '0.8', 'changefreq': 'weekly'},
        {'url': f'{base_url}/blog', 'priority': '0.7', 'changefreq': 'daily'},
        {'url': f'{base_url}/about', 'priority': '0.6', 'changefreq': 'monthly'},
        {'url': f'{base_url}/contact', 'priority': '0.6', 'changefreq': 'monthly'},
        {'url': f'{base_url}/size-guide', 'priority': '0.5', 'changefreq': 'monthly'},
        {'url': f'{base_url}/shipping', 'priority': '0.5', 'changefreq': 'monthly'},
        {'url': f'{base_url}/returns', 'priority': '0.5', 'changefreq': 'monthly'},
        {'url': f'{base_url}/privacy', 'priority': '0.3', 'changefreq': 'yearly'},
        {'url': f'{base_url}/terms', 'priority': '0.3', 'changefreq': 'yearly'},
    ]
    
    for page in static_pages:
        url_elem = ET.SubElement(root, 'url')
        
        loc_elem = ET.SubElement(url_elem, 'loc')
        loc_elem.text = page['url']
        
        lastmod_elem = ET.SubElement(url_elem, 'lastmod')
        lastmod_elem.text = current_date
        
        changefreq_elem = ET.SubElement(url_elem, 'changefreq')
        changefreq_elem.text = page['changefreq']
        
        priority_elem = ET.SubElement(url_elem, 'priority')
        priority_elem.text = page['priority']
    
    xml_str = ET.tostring(root, encoding='unicode', method='xml')
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    response = HttpResponse(xml_declaration + xml_str, content_type='application/xml')
    return response


@cache_page(60 * 60 * 6)  # Cache for 6 hours
@require_http_methods(["GET"])
def sitemap_products(request):
    """Generate products sitemap"""
    root = ET.Element('urlset')
    root.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    base_url = f"https://{request.get_host()}"
    
    products = Product.objects.filter(is_active=True).only('slug', 'updated_at')
    
    for product in products:
        url_elem = ET.SubElement(root, 'url')
        
        loc_elem = ET.SubElement(url_elem, 'loc')
        loc_elem.text = f'{base_url}/products/{product.slug}'
        
        lastmod_elem = ET.SubElement(url_elem, 'lastmod')
        lastmod_elem.text = product.updated_at.strftime('%Y-%m-%d')
        
        changefreq_elem = ET.SubElement(url_elem, 'changefreq')
        changefreq_elem.text = 'weekly'
        
        priority_elem = ET.SubElement(url_elem, 'priority')
        priority_elem.text = '0.8'
    
    xml_str = ET.tostring(root, encoding='unicode', method='xml')
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    response = HttpResponse(xml_declaration + xml_str, content_type='application/xml')
    return response


@cache_page(60 * 60 * 24)  # Cache for 24 hours
@require_http_methods(["GET"])
def sitemap_categories(request):
    """Generate categories sitemap"""
    root = ET.Element('urlset')
    root.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    base_url = f"https://{request.get_host()}"
    current_date = timezone.now().strftime('%Y-%m-%d')
    
    categories = Category.objects.all().only('slug')
    
    for category in categories:
        url_elem = ET.SubElement(root, 'url')
        
        loc_elem = ET.SubElement(url_elem, 'loc')
        loc_elem.text = f'{base_url}/categories/{category.slug}'
        
        lastmod_elem = ET.SubElement(url_elem, 'lastmod')
        lastmod_elem.text = current_date
        
        changefreq_elem = ET.SubElement(url_elem, 'changefreq')
        changefreq_elem.text = 'weekly'
        
        priority_elem = ET.SubElement(url_elem, 'priority')
        priority_elem.text = '0.7'
    
    xml_str = ET.tostring(root, encoding='unicode', method='xml')
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    response = HttpResponse(xml_declaration + xml_str, content_type='application/xml')
    return response


@cache_page(60 * 60 * 12)  # Cache for 12 hours
@require_http_methods(["GET"])
def sitemap_blog(request):
    """Generate blog sitemap"""
    root = ET.Element('urlset')
    root.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    base_url = f"https://{request.get_host()}"
    
    try:
        from apps.blog.models import BlogPost
        blog_posts = BlogPost.objects.filter(is_published=True).only('slug', 'updated_at')
        
        for post in blog_posts:
            url_elem = ET.SubElement(root, 'url')
            
            loc_elem = ET.SubElement(url_elem, 'loc')
            loc_elem.text = f'{base_url}/blog/{post.slug}'
            
            lastmod_elem = ET.SubElement(url_elem, 'lastmod')
            lastmod_elem.text = post.updated_at.strftime('%Y-%m-%d')
            
            changefreq_elem = ET.SubElement(url_elem, 'changefreq')
            changefreq_elem.text = 'monthly'
            
            priority_elem = ET.SubElement(url_elem, 'priority')
            priority_elem.text = '0.6'
    except:
        # Handle case where blog app doesn't exist
        pass
    
    xml_str = ET.tostring(root, encoding='unicode', method='xml')
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    response = HttpResponse(xml_declaration + xml_str, content_type='application/xml')
    return response


@cache_page(60 * 60 * 24)  # Cache for 24 hours
@require_http_methods(["GET"])
def robots_txt(request):
    """Generate robots.txt"""
    base_url = f"https://{request.get_host()}"
    
    robots_content = f"""User-agent: *
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
Sitemap: {base_url}/sitemap.xml
Sitemap: {base_url}/sitemap-products.xml
Sitemap: {base_url}/sitemap-blog.xml
Sitemap: {base_url}/sitemap-categories.xml

# Host directive (for Google)
Host: {request.get_host()}"""

    return HttpResponse(robots_content, content_type='text/plain')


@cache_page(60 * 60 * 24)  # Cache for 24 hours
@require_http_methods(["GET"])
def manifest_json(request):
    """Generate manifest.json for PWA"""
    import json
    
    base_url = f"https://{request.get_host()}"
    
    manifest = {
        "name": "Femvelle - Modest Luxury Fashion",
        "short_name": "Femvelle",
        "description": "Premium modest fashion and luxury Islamic wear for the modern woman",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#FEFCF8",
        "theme_color": "#C4985A",
        "orientation": "portrait-primary",
        "categories": ["shopping", "fashion", "lifestyle"],
        "lang": "en",
        "dir": "ltr",
        "icons": [
            {
                "src": "/android-chrome-192x192.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "maskable any"
            },
            {
                "src": "/android-chrome-512x512.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "maskable any"
            },
            {
                "src": "/apple-touch-icon.png",
                "sizes": "180x180",
                "type": "image/png"
            },
            {
                "src": "/favicon-32x32.png",
                "sizes": "32x32",
                "type": "image/png"
            },
            {
                "src": "/favicon-16x16.png",
                "sizes": "16x16",
                "type": "image/png"
            }
        ]
    }
    
    return HttpResponse(json.dumps(manifest, indent=2), content_type='application/json')