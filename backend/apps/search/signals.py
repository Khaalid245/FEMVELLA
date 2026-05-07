import logging

from django.conf import settings
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.products.models import Product

logger = logging.getLogger(__name__)


@receiver([post_save, post_delete], sender=Product)
def sync_product_search_document(sender, instance, **kwargs):
    """Best-effort hook for optional Elasticsearch indexing."""
    if getattr(settings, "SEARCH_BACKEND", "database") != "elasticsearch":
        return

    try:
        from .documents import ProductDocument
    except ImportError:
        logger.warning("Elasticsearch dependencies are not installed; skipping product index sync.")
        return

    try:
        if kwargs.get("signal") is post_delete:
            ProductDocument().delete(instance, ignore=404)
        else:
            ProductDocument().update(instance)
    except Exception as exc:
        logger.warning("Product search index sync failed for %s: %s", instance.pk, exc)
