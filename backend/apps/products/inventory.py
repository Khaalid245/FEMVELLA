from django.db import transaction
from django.core.exceptions import ValidationError
from .models import ProductVariant
import logging

logger = logging.getLogger(__name__)

class InventoryService:
    """Enterprise inventory management service with atomic operations"""
    
    @staticmethod
    @transaction.atomic
    def reserve_variant_stock(variant_id: int, quantity: int) -> bool:
        """
        Reserve stock for a variant with atomic operation to prevent overselling
        Returns True if successful, raises exception if not possible
        """
        try:
            # Use select_for_update to lock the row and prevent race conditions
            variant = ProductVariant.objects.select_for_update().get(
                id=variant_id, 
                is_active=True
            )
            
            if not variant.is_in_stock:
                raise ValidationError(f"Variant {variant.sku} is out of stock")
            
            if quantity > variant.available_stock:
                raise ValidationError(
                    f"Cannot reserve {quantity} units of {variant.sku}. "
                    f"Only {variant.available_stock} available."
                )
            
            variant.reserve_stock(quantity)
            
            logger.info(f"Reserved {quantity} units of variant {variant.sku}")
            return True
            
        except ProductVariant.DoesNotExist:
            raise ValidationError(f"Variant with ID {variant_id} not found or inactive")
    
    @staticmethod
    @transaction.atomic
    def release_variant_stock(variant_id: int, quantity: int) -> bool:
        """
        Release reserved stock (e.g., when order is cancelled)
        """
        try:
            variant = ProductVariant.objects.select_for_update().get(id=variant_id)
            variant.release_stock(quantity)
            
            logger.info(f"Released {quantity} units of variant {variant.sku}")
            return True
            
        except ProductVariant.DoesNotExist:
            raise ValidationError(f"Variant with ID {variant_id} not found")
    
    @staticmethod
    @transaction.atomic
    def deduct_variant_stock(variant_id: int, quantity: int) -> bool:
        """
        Deduct stock when order is completed (final sale)
        """
        try:
            variant = ProductVariant.objects.select_for_update().get(id=variant_id)
            variant.deduct_stock(quantity)
            
            logger.info(f"Deducted {quantity} units from variant {variant.sku}")
            return True
            
        except ProductVariant.DoesNotExist:
            raise ValidationError(f"Variant with ID {variant_id} not found")
    
    @staticmethod
    @transaction.atomic
    def bulk_reserve_stock(reservations: list) -> bool:
        """
        Reserve stock for multiple variants atomically
        reservations: [{'variant_id': int, 'quantity': int}, ...]
        """
        try:
            # Lock all variants first to prevent deadlocks
            variant_ids = [r['variant_id'] for r in reservations]
            variants = {
                v.id: v for v in ProductVariant.objects.select_for_update().filter(
                    id__in=variant_ids, 
                    is_active=True
                )
            }
            
            # Validate all reservations first
            for reservation in reservations:
                variant_id = reservation['variant_id']
                quantity = reservation['quantity']
                
                if variant_id not in variants:
                    raise ValidationError(f"Variant {variant_id} not found or inactive")
                
                variant = variants[variant_id]
                if quantity > variant.available_stock:
                    raise ValidationError(
                        f"Cannot reserve {quantity} units of {variant.sku}. "
                        f"Only {variant.available_stock} available."
                    )
            
            # If all validations pass, make the reservations
            for reservation in reservations:
                variant = variants[reservation['variant_id']]
                variant.reserve_stock(reservation['quantity'])
            
            logger.info(f"Bulk reserved stock for {len(reservations)} variants")
            return True
            
        except Exception as e:
            logger.error(f"Bulk stock reservation failed: {str(e)}")
            raise
    
    @staticmethod
    def get_variant_availability(product_id: int) -> dict:
        """
        Get availability matrix for all variants of a product
        Returns: {
            'variants': [...],
            'available_sizes': [...],
            'available_colors': [...],
            'size_color_matrix': {...}
        }
        """
        variants = ProductVariant.objects.filter(
            product_id=product_id,
            is_active=True
        ).select_related('product')
        
        available_variants = []
        available_sizes = set()
        available_colors = set()
        size_color_matrix = {}
        
        for variant in variants:
            variant_data = {
                'id': variant.id,
                'size': variant.size,
                'color': variant.color,
                'stock': variant.available_stock,
                'is_in_stock': variant.is_in_stock,
                'is_low_stock': variant.is_low_stock,
                'stock_status': variant.stock_status,
                'sku': variant.sku,
                'price': float(variant.effective_price)
            }
            available_variants.append(variant_data)
            
            if variant.is_in_stock:
                available_sizes.add(variant.size)
                if variant.color:
                    available_colors.add(variant.color)
                
                # Build size-color matrix
                if variant.size not in size_color_matrix:
                    size_color_matrix[variant.size] = {}
                size_color_matrix[variant.size][variant.color or 'default'] = {
                    'available': True,
                    'stock': variant.available_stock,
                    'variant_id': variant.id
                }
        
        return {
            'variants': available_variants,
            'available_sizes': sorted(list(available_sizes)),
            'available_colors': sorted(list(available_colors)),
            'size_color_matrix': size_color_matrix
        }
    
    @staticmethod
    def get_low_stock_variants(threshold: int = None) -> list:
        """
        Get all variants that are running low on stock
        """
        queryset = ProductVariant.objects.filter(is_active=True)
        
        if threshold:
            queryset = queryset.filter(stock__lte=threshold, stock__gt=0)
        else:
            # Use each variant's individual threshold
            low_stock_variants = []
            for variant in queryset:
                if variant.is_low_stock:
                    low_stock_variants.append({
                        'id': variant.id,
                        'sku': variant.sku,
                        'product_name': variant.product.name,
                        'size': variant.size,
                        'color': variant.color,
                        'stock': variant.available_stock,
                        'threshold': variant.low_stock_threshold
                    })
            return low_stock_variants
        
        return list(queryset.values(
            'id', 'sku', 'product__name', 'size', 'color', 'stock', 'low_stock_threshold'
        ))