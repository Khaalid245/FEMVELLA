"""
Elasticsearch Document Definitions
==================================

Defines how Django models are indexed in Elasticsearch for search functionality.
"""

from django_elasticsearch_dsl import Document, Index, fields
from django_elasticsearch_dsl.registries import registry
from apps.products.models import Product, Category, ProductImage


# Define indices
products_index = Index('products')
products_index.settings(
    number_of_shards=1,
    number_of_replicas=0,
    analysis={
        'analyzer': {
            'product_analyzer': {
                'type': 'custom',
                'tokenizer': 'standard',
                'filter': [
                    'lowercase',
                    'stop',
                    'snowball',
                    'word_delimiter'
                ]
            },
            'autocomplete_analyzer': {
                'type': 'custom',
                'tokenizer': 'keyword',
                'filter': [
                    'lowercase',
                    'edge_ngram_filter'
                ]
            }
        },
        'filter': {
            'edge_ngram_filter': {
                'type': 'edge_ngram',
                'min_gram': 2,
                'max_gram': 20
            }
        }
    }
)


@registry.register_document
class ProductDocument(Document):
    """
    Product document for Elasticsearch indexing
    """
    
    # Basic fields
    id = fields.IntegerField()
    name = fields.TextField(
        analyzer='product_analyzer',
        fields={
            'raw': fields.KeywordField(),
            'suggest': fields.TextField(analyzer='autocomplete_analyzer')
        }
    )
    slug = fields.KeywordField()
    description = fields.TextField(analyzer='product_analyzer')
    
    # Category information
    category = fields.ObjectField(
        properties={
            'id': fields.IntegerField(),
            'name': fields.TextField(
                analyzer='product_analyzer',
                fields={'raw': fields.KeywordField()}
            ),
            'slug': fields.KeywordField(),
        }
    )
    
    # Pricing
    price = fields.FloatField()
    sale_price = fields.FloatField()
    discount_percent = fields.IntegerField()
    
    # Inventory
    stock = fields.IntegerField()
    total_stock = fields.IntegerField()
    in_stock = fields.BooleanField()
    
    # Status flags
    is_active = fields.BooleanField()
    is_featured = fields.BooleanField()
    is_new = fields.BooleanField()
    is_bestseller = fields.BooleanField()
    is_customizable = fields.BooleanField()
    
    # Images
    images = fields.ObjectField(
        properties={
            'id': fields.IntegerField(),
            'image': fields.KeywordField(),
            'alt_text': fields.TextField(),
            'is_primary': fields.BooleanField(),
        }
    )
    primary_image = fields.KeywordField()
    
    # Variants and colors
    variants = fields.ObjectField(
        properties={
            'id': fields.IntegerField(),
            'size': fields.KeywordField(),
            'color': fields.KeywordField(),
            'stock': fields.IntegerField(),
            'price': fields.FloatField(),
        }
    )
    
    colors = fields.ObjectField(
        properties={
            'name': fields.KeywordField(),
            'hex_code': fields.KeywordField(),
        }
    )
    
    available_sizes = fields.KeywordField(multi=True)
    available_colors = fields.KeywordField(multi=True)
    
    # Timestamps
    created_at = fields.DateField()
    updated_at = fields.DateField()
    
    # Computed fields for search
    search_text = fields.TextField(analyzer='product_analyzer')
    popularity_score = fields.FloatField()
    
    class Index:
        name = 'products'
        settings = products_index._settings
    
    class Django:
        model = Product
        fields = []  # We define all fields explicitly above
        
        # Related models to watch for updates
        related_models = [Category, ProductImage]
    
    def get_queryset(self):
        """Return the queryset that should be indexed"""
        return super().get_queryset().select_related(
            'category'
        ).prefetch_related(
            'images', 'variants', 'colors'
        ).filter(is_active=True)
    
    def prepare_category(self, instance):
        """Prepare category data for indexing"""
        if instance.category:
            return {
                'id': instance.category.id,
                'name': instance.category.name,
                'slug': instance.category.slug,
            }
        return None
    
    def prepare_images(self, instance):
        """Prepare images data for indexing"""
        return [
            {
                'id': img.id,
                'image': img.image.url if img.image else '',
                'alt_text': img.alt_text or '',
                'is_primary': img.is_primary,
            }
            for img in instance.images.all()
        ]
    
    def prepare_primary_image(self, instance):
        """Get primary image URL"""
        primary_img = instance.images.filter(is_primary=True).first()
        if primary_img and primary_img.image:
            return primary_img.image.url
        
        # Fallback to first image
        first_img = instance.images.first()
        if first_img and first_img.image:
            return first_img.image.url
        
        return ''
    
    def prepare_variants(self, instance):
        """Prepare variants data for indexing"""
        return [
            {
                'id': variant.id,
                'size': variant.size,
                'color': variant.color,
                'stock': variant.stock,
                'price': float(variant.effective_price),
            }
            for variant in instance.variants.all()
        ]
    
    def prepare_colors(self, instance):
        """Prepare colors data for indexing"""
        return [
            {
                'name': color.name,
                'hex_code': color.hex_code,
            }
            for color in instance.colors.all()
        ]
    
    def prepare_available_sizes(self, instance):
        """Get list of available sizes"""
        return list(instance.variants.values_list('size', flat=True).distinct())
    
    def prepare_available_colors(self, instance):
        """Get list of available colors"""
        colors = set()
        # From variants
        colors.update(instance.variants.exclude(color='').values_list('color', flat=True))
        # From color objects
        colors.update(instance.colors.values_list('name', flat=True))
        return list(colors)
    
    def prepare_in_stock(self, instance):
        """Check if product is in stock"""
        return instance.total_stock > 0
    
    def prepare_search_text(self, instance):
        """Prepare combined search text"""
        text_parts = [instance.name]
        
        if instance.description:
            text_parts.append(instance.description)
        
        if instance.category:
            text_parts.append(instance.category.name)
        
        # Add variant information
        sizes = instance.variants.values_list('size', flat=True).distinct()
        if sizes:
            text_parts.extend(sizes)
        
        colors = instance.colors.values_list('name', flat=True)
        if colors:
            text_parts.extend(colors)
        
        return ' '.join(text_parts)
    
    def prepare_popularity_score(self, instance):
        """Calculate popularity score for ranking"""
        score = 0.0
        
        # Base score from flags
        if instance.is_featured:
            score += 10.0
        if instance.is_bestseller:
            score += 8.0
        if instance.is_new:
            score += 5.0
        
        # Stock availability
        if instance.total_stock > 0:
            score += 3.0
        
        # Discount boost
        if instance.sale_price and instance.price:
            discount = (instance.price - instance.sale_price) / instance.price
            score += discount * 5.0
        
        return score
    
    def get_instances_from_related(self, related_instance):
        """
        If related_instance is of type Category or ProductImage,
        return all Products that should be updated in Elasticsearch.
        """
        if isinstance(related_instance, Category):
            return related_instance.products.filter(is_active=True)
        elif isinstance(related_instance, ProductImage):
            return Product.objects.filter(
                id=related_instance.product_id,
                is_active=True
            )
        return []


# Category document for search suggestions
@registry.register_document  
class CategoryDocument(Document):
    """
    Category document for search suggestions
    """
    
    id = fields.IntegerField()
    name = fields.TextField(
        analyzer='product_analyzer',
        fields={
            'raw': fields.KeywordField(),
            'suggest': fields.TextField(analyzer='autocomplete_analyzer')
        }
    )
    slug = fields.KeywordField()
    product_count = fields.IntegerField()
    
    class Index:
        name = 'categories'
    
    class Django:
        model = Category
        fields = []
    
    def prepare_product_count(self, instance):
        """Count active products in category"""
        return instance.products.filter(is_active=True).count()