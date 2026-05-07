from django.urls import path
from . import views

app_name = 'seo'

urlpatterns = [
    path('sitemap.xml', views.sitemap_index, name='sitemap_index'),
    path('sitemap-static.xml', views.sitemap_static, name='sitemap_static'),
    path('sitemap-products.xml', views.sitemap_products, name='sitemap_products'),
    path('sitemap-categories.xml', views.sitemap_categories, name='sitemap_categories'),
    path('sitemap-blog.xml', views.sitemap_blog, name='sitemap_blog'),
    path('robots.txt', views.robots_txt, name='robots_txt'),
    path('manifest.json', views.manifest_json, name='manifest_json'),
]