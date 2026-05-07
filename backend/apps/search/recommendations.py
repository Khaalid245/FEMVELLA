"""
Recommendation service for Femvelle.

Strategies (all database-native, no external dependencies):
  1. similar_to_product   — same category, ranked by shared attributes
  2. personalized_feed    — based on user's viewed/purchased categories
  3. trending_now         — most-viewed products in last N days
  4. category_picks       — top products per category
  5. complete_the_look    — complementary categories
  6. recently_viewed      — session-based, stored in Redis/cache
"""

import logging
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.db.models import Count, F, Q
from django.utils import timezone

from apps.products.models import Product
from apps.products.fast_serializers import FastProductSerializer

logger = logging.getLogger(__name__)

# Complementary category pairs  (slug → list of complementary slugs)
_COMPLEMENTARY: dict[str, list[str]] = {
    "abayas":    ["hijabs", "accessories", "bags"],
    "dresses":   ["accessories", "bags", "shoes"],
    "tops":      ["bottoms", "accessories"],
    "bottoms":   ["tops", "accessories"],
    "hijabs":    ["abayas", "dresses", "accessories"],
    "sets":      ["accessories", "bags"],
    "outerwear": ["dresses", "tops", "accessories"],
}


class RecommendationService:

    # ------------------------------------------------------------------ #
    # 1. Similar products                                                  #
    # ------------------------------------------------------------------ #

    def similar_to_product(self, product_id: int, limit: int = 8, request=None) -> list:
        """
        Products in the same category, ranked by:
          - shared price tier (±30 %)
          - same is_new / is_bestseller flags
          - most recently added
        """
        cache_key = f"rec:similar:{product_id}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            source = Product.objects.select_related("category").get(
                pk=product_id, is_active=True
            )
        except Product.DoesNotExist:
            return []

        price = float(source.price)
        low, high = price * 0.7, price * 1.3

        qs = (
            Product.objects.filter(is_active=True)
            .exclude(pk=source.pk)
            .select_related("category")
            .prefetch_related("images")
        )

        if source.category_id:
            qs = qs.filter(category_id=source.category_id)

        # Prefer same price tier, then bestsellers, then newest
        qs = qs.filter(price__gte=low, price__lte=high).order_by(
            "-is_bestseller", "-is_featured", "-created_at"
        )

        # If not enough, relax price filter
        if qs.count() < limit and source.category_id:
            qs = (
                Product.objects.filter(is_active=True, category_id=source.category_id)
                .exclude(pk=source.pk)
                .select_related("category")
                .prefetch_related("images")
                .order_by("-is_bestseller", "-is_featured", "-created_at")
            )

        data = FastProductSerializer(qs[:limit], many=True, context={"request": request}).data
        cache.set(cache_key, data, 300)
        return data

    # ------------------------------------------------------------------ #
    # 2. Personalized feed                                                 #
    # ------------------------------------------------------------------ #

    def personalized_feed(
        self, user=None, session_key: str = "", limit: int = 8, request=None
    ) -> list:
        """
        For authenticated users: products from their most-purchased categories.
        For anonymous users: products from their recently-viewed categories.
        Falls back to trending if no signal.
        """
        cache_key = f"rec:feed:{getattr(user, 'id', 'anon')}:{session_key[:20]}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        category_ids: list[int] = []

        # Signal 1 — purchase history
        if user and user.is_authenticated:
            try:
                from apps.orders.models import OrderItem
                category_ids = list(
                    OrderItem.objects.filter(
                        order__user=user,
                        order__status__in=["confirmed", "shipped", "delivered"],
                    )
                    .values_list("product_variant__product__category_id", flat=True)
                    .distinct()[:5]
                )
            except Exception:
                pass

        # Signal 2 — recently viewed
        if not category_ids and session_key:
            rv_ids = cache.get(f"recently_viewed:{session_key}") or []
            if rv_ids:
                category_ids = list(
                    Product.objects.filter(id__in=rv_ids[:10], is_active=True)
                    .values_list("category_id", flat=True)
                    .distinct()
                )

        if category_ids:
            qs = (
                Product.objects.filter(is_active=True, category_id__in=category_ids)
                .select_related("category")
                .prefetch_related("images")
                .order_by("-is_bestseller", "-is_featured", "-created_at")
            )
            # Exclude already-viewed products
            rv_ids = cache.get(f"recently_viewed:{session_key}") or []
            if rv_ids:
                qs = qs.exclude(id__in=rv_ids[:20])
        else:
            # Fallback: trending
            return self.trending_now(limit=limit, request=request)

        data = FastProductSerializer(qs[:limit], many=True, context={"request": request}).data
        cache.set(cache_key, data, 120)  # 2-minute cache (personalised)
        return data

    # ------------------------------------------------------------------ #
    # 3. Trending now                                                      #
    # ------------------------------------------------------------------ #

    def trending_now(self, limit: int = 8, request=None) -> list:
        """
        Most-viewed products in the last 7 days, ranked by view count.
        Falls back to featured + bestsellers if no analytics data.
        """
        cache_key = f"rec:trending:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        days = getattr(settings, "SEARCH_TRENDING_DAYS", 7)
        since = timezone.now() - timedelta(days=days)

        # Try analytics events
        try:
            from apps.analytics.models import AnalyticsEvent
            top_ids = list(
                AnalyticsEvent.objects.filter(
                    event_type="product_view",
                    timestamp__gte=since,
                    product_id__isnull=False,
                )
                .values("product_id")
                .annotate(views=Count("id"))
                .order_by("-views")
                .values_list("product_id", flat=True)[:limit * 2]
            )
        except Exception:
            top_ids = []

        if top_ids:
            # Preserve order
            products = {
                p.id: p
                for p in Product.objects.filter(id__in=top_ids, is_active=True)
                .select_related("category")
                .prefetch_related("images")
            }
            ordered = [products[pid] for pid in top_ids if pid in products][:limit]
        else:
            ordered = list(
                Product.objects.filter(is_active=True)
                .select_related("category")
                .prefetch_related("images")
                .order_by("-is_bestseller", "-is_featured", "-created_at")[:limit]
            )

        data = FastProductSerializer(ordered, many=True, context={"request": request}).data
        cache.set(cache_key, data, 300)
        return data

    # ------------------------------------------------------------------ #
    # 4. Category picks                                                    #
    # ------------------------------------------------------------------ #

    def category_picks(self, category_slug: str, limit: int = 8, request=None) -> list:
        """Top products in a given category."""
        cache_key = f"rec:cat:{category_slug}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        qs = (
            Product.objects.filter(is_active=True, category__slug=category_slug)
            .select_related("category")
            .prefetch_related("images")
            .order_by("-is_bestseller", "-is_featured", "-created_at")[:limit]
        )
        data = FastProductSerializer(qs, many=True, context={"request": request}).data
        cache.set(cache_key, data, 300)
        return data

    # ------------------------------------------------------------------ #
    # 5. Complete the look                                                 #
    # ------------------------------------------------------------------ #

    def complete_the_look(self, product_id: int, limit: int = 4, request=None) -> list:
        """
        Products from complementary categories.
        E.g. viewing an abaya → suggest hijabs + accessories.
        """
        cache_key = f"rec:look:{product_id}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            source = Product.objects.select_related("category").get(
                pk=product_id, is_active=True
            )
        except Product.DoesNotExist:
            return []

        cat_slug = source.category.slug if source.category else ""
        complementary_slugs = _COMPLEMENTARY.get(cat_slug, [])

        if not complementary_slugs:
            return []

        qs = (
            Product.objects.filter(
                is_active=True, category__slug__in=complementary_slugs
            )
            .exclude(pk=source.pk)
            .select_related("category")
            .prefetch_related("images")
            .order_by("-is_featured", "-is_bestseller", "-created_at")[:limit]
        )
        data = FastProductSerializer(qs, many=True, context={"request": request}).data
        cache.set(cache_key, data, 300)
        return data

    # ------------------------------------------------------------------ #
    # 6. Recently viewed                                                   #
    # ------------------------------------------------------------------ #

    def get_recently_viewed(self, session_key: str, limit: int = 6, request=None) -> list:
        """Return recently viewed products for a session."""
        if not session_key:
            return []

        ids: list[int] = cache.get(f"recently_viewed:{session_key}") or []
        if not ids:
            return []

        products = {
            p.id: p
            for p in Product.objects.filter(id__in=ids[:limit], is_active=True)
            .select_related("category")
            .prefetch_related("images")
        }
        ordered = [products[pid] for pid in ids[:limit] if pid in products]
        return FastProductSerializer(ordered, many=True, context={"request": request}).data

    def record_view(self, session_key: str, product_id: int) -> None:
        """Push product_id to the front of the session's recently-viewed list."""
        if not session_key:
            return
        key = f"recently_viewed:{session_key}"
        ids: list[int] = cache.get(key) or []
        if product_id in ids:
            ids.remove(product_id)
        ids.insert(0, product_id)
        cache.set(key, ids[:30], 60 * 60 * 24 * 7)  # 7 days

    # ------------------------------------------------------------------ #
    # 7. New arrivals for homepage                                         #
    # ------------------------------------------------------------------ #

    def new_arrivals(self, limit: int = 8, request=None) -> list:
        cache_key = f"rec:new:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        qs = (
            Product.objects.filter(is_active=True, is_new=True)
            .select_related("category")
            .prefetch_related("images")
            .order_by("-created_at")[:limit]
        )
        data = FastProductSerializer(qs, many=True, context={"request": request}).data
        cache.set(cache_key, data, 300)
        return data


recommendation_service = RecommendationService()
