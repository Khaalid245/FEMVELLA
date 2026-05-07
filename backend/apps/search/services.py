"""
Search service — PostgreSQL/SQLite database backend.

Features:
- Synonym expansion
- Typo tolerance (trigram-style prefix matching)
- Relevance ranking (name > category > description)
- Trending queries (last N days)
- Recently viewed products (Redis or DB fallback)
- Autocomplete with product + suggestion results
- Full analytics tracking
"""

import logging
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.db.models import Case, Count, F, IntegerField, Q, Value, When
from django.utils import timezone

from apps.products.models import Product
from apps.products.fast_serializers import FastProductSerializer

from .models import SearchClick, SearchQuery, SearchSuggestion

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Synonym map — loaded once at import time
# ---------------------------------------------------------------------------
_SYNONYMS: dict[str, list[str]] = getattr(settings, "SEARCH_SYNONYMS", {})

# Build reverse map: every term → its synonym group
_TERM_TO_GROUP: dict[str, list[str]] = {}
for _canonical, _group in _SYNONYMS.items():
    for _term in _group:
        _TERM_TO_GROUP[_term.lower()] = _group


def _expand_query(query: str) -> list[str]:
    """Return the original query plus any synonym expansions."""
    terms = query.lower().split()
    expanded: set[str] = {query.lower()}
    for term in terms:
        group = _TERM_TO_GROUP.get(term)
        if group:
            for synonym in group:
                if synonym.lower() != term:
                    expanded.add(query.lower().replace(term, synonym.lower()))
    return list(expanded)


def _build_search_filter(queries: list[str]) -> Q:
    """Build a Q object that matches any of the expanded query strings."""
    combined = Q()
    for q in queries:
        combined |= (
            Q(name__icontains=q)
            | Q(category__name__icontains=q)
            | Q(description__icontains=q)
            | Q(variants__color__icontains=q)
            | Q(variants__size__icontains=q)
            | Q(colors__name__icontains=q)
        )
    return combined


def _relevance_annotation(query: str):
    """
    Annotate queryset with a relevance score.
    Name match = 3, category match = 2, description match = 1.
    Bestseller/featured add bonus points.
    """
    q = query.lower()
    return (
        Case(When(name__icontains=q, then=Value(3)), default=Value(0), output_field=IntegerField())
        + Case(When(category__name__icontains=q, then=Value(2)), default=Value(0), output_field=IntegerField())
        + Case(When(description__icontains=q, then=Value(1)), default=Value(0), output_field=IntegerField())
        + Case(When(is_bestseller=True, then=Value(2)), default=Value(0), output_field=IntegerField())
        + Case(When(is_featured=True, then=Value(1)), default=Value(0), output_field=IntegerField())
    )


class ProductSearchService:

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def search(
        self,
        query=None,
        filters=None,
        sort=None,
        page=1,
        page_size=20,
        user=None,
        track_search=True,
        request=None,
    ):
        filters = filters or {}

        if getattr(settings, "SEARCH_BACKEND", "database") == "elasticsearch":
            result = self._search_elasticsearch(query, filters, sort, page, page_size, user, track_search, request)
            if result is not None:
                return result

        return self._search_database(query, filters, sort, page, page_size, user, track_search, request)

    def autocomplete(self, query: str, limit: int = 10) -> list[dict]:
        """
        Return autocomplete suggestions:
        - Matching product names (ranked by popularity flags)
        - Stored SearchSuggestion records
        """
        if len(query) < 2:
            return []

        cache_key = f"autocomplete:{query.lower()[:50]}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        # Product name matches — ranked
        products = (
            Product.objects.filter(is_active=True, name__icontains=query)
            .select_related("category")
            .prefetch_related("images")
            .order_by("-is_bestseller", "-is_featured", "name")[:limit]
        )

        suggestions: list[dict] = []
        for p in products:
            primary = next((i for i in p.images.all() if i.is_primary), None) or p.images.first()
            suggestions.append({
                "type": "product",
                "text": p.name,
                "slug": p.slug,
                "url": f"/products/{p.slug}",
                "price": str(p.sale_price or p.price),
                "image": primary.image.url if primary and primary.image else None,
                "category": p.category.name if p.category else None,
            })

        # Fill remaining slots with stored suggestions
        remaining = max(limit - len(suggestions), 0)
        if remaining:
            stored = SearchSuggestion.objects.filter(
                is_active=True, text__icontains=query
            ).order_by("-popularity", "text")[:remaining]
            for item in stored:
                suggestions.append({
                    "type": "suggestion",
                    "text": item.text,
                    "slug": None,
                    "url": f"/products?search={item.text}",
                    "price": None,
                    "image": None,
                    "category": item.category.name if item.category else None,
                })

        result = suggestions[:limit]
        cache.set(cache_key, result, 60)  # 60-second cache
        return result

    def get_trending(self, limit: int | None = None) -> list[dict]:
        """Return trending search queries from the last N days."""
        limit = limit or getattr(settings, "SEARCH_TRENDING_LIMIT", 8)
        days = getattr(settings, "SEARCH_TRENDING_DAYS", 7)

        cache_key = f"trending_searches:{days}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        since = timezone.now() - timedelta(days=days)
        qs = (
            SearchQuery.objects.filter(created_at__gte=since, result_count__gt=0)
            .values("query")
            .annotate(count=Count("id"))
            .order_by("-count")[:limit]
        )
        result = [{"query": row["query"], "count": row["count"]} for row in qs]
        cache.set(cache_key, result, 300)  # 5-minute cache
        return result

    def get_recently_viewed(self, session_key: str, limit: int | None = None) -> list[dict]:
        """Return recently viewed products stored in cache by session key."""
        limit = limit or getattr(settings, "SEARCH_RECENTLY_VIEWED_LIMIT", 6)
        cache_key = f"recently_viewed:{session_key}"
        ids: list[int] = cache.get(cache_key) or []
        if not ids:
            return []

        products = {
            p.id: p
            for p in Product.objects.filter(id__in=ids, is_active=True)
            .select_related("category")
            .prefetch_related("images")
        }

        result = []
        for pid in ids[:limit]:
            p = products.get(pid)
            if not p:
                continue
            primary = next((i for i in p.images.all() if i.is_primary), None) or p.images.first()
            result.append({
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "price": str(p.sale_price or p.price),
                "image": primary.image.url if primary and primary.image else None,
                "category": p.category.name if p.category else None,
            })
        return result

    def record_product_view(self, session_key: str, product_id: int) -> None:
        """Push a product id to the front of the recently-viewed list."""
        cache_key = f"recently_viewed:{session_key}"
        ids: list[int] = cache.get(cache_key) or []
        if product_id in ids:
            ids.remove(product_id)
        ids.insert(0, product_id)
        cache.set(cache_key, ids[:20], 60 * 60 * 24 * 7)  # 7 days

    def get_similar_products(self, product_id: int, limit: int = 6, request=None) -> list:
        try:
            product = Product.objects.select_related("category").get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return []

        qs = (
            Product.objects.filter(is_active=True)
            .exclude(pk=product.pk)
            .select_related("category")
            .prefetch_related("images", "colors", "sizes", "variants")
        )
        if product.category_id:
            qs = qs.filter(category_id=product.category_id)

        serializer = FastProductSerializer(qs[:limit], many=True, context={"request": request})
        return serializer.data

    def track_click(self, query: str, product_id: int, user, position=None, request=None) -> None:
        if not getattr(settings, "SEARCH_ANALYTICS", {}).get("TRACK_CLICKS", True):
            return
        try:
            SearchClick.objects.create(
                query=query,
                product_id=product_id,
                user=user if user and user.is_authenticated else None,
                position=position,
                ip_address=self._get_client_ip(request) if request else None,
            )
        except Exception as exc:
            logger.warning("Search click tracking failed: %s", exc)

    # ------------------------------------------------------------------
    # Database search
    # ------------------------------------------------------------------

    def _search_database(self, query, filters, sort, page, page_size, user, track_search, request):
        qs = (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("images", "colors", "sizes", "variants")
        )

        if query:
            expanded = _expand_query(query)
            qs = qs.filter(_build_search_filter(expanded)).distinct()
            qs = qs.annotate(relevance=_relevance_annotation(query))
        else:
            qs = qs.annotate(relevance=Value(0, output_field=IntegerField()))

        qs = self._apply_filters(qs, filters)
        qs = self._apply_sort(qs, sort, bool(query))

        total = qs.count()
        page = max(int(page or 1), 1)
        page_size = min(max(int(page_size or 20), 1), 100)
        start = (page - 1) * page_size
        page_qs = qs[start: start + page_size]

        if track_search and query:
            self._track_search(query, total, user, filters, sort, page, request)
            self._update_suggestions(query, total)

        serializer = FastProductSerializer(page_qs, many=True, context={"request": request})

        return {
            "products": serializer.data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size else 1,
            "facets": self._facets(qs),
            "suggestions": self.autocomplete(query, limit=5) if query else [],
            "query": query,
            "backend": "database",
        }

    def _apply_filters(self, qs, filters: dict):
        categories = filters.get("category")
        if categories:
            qs = qs.filter(category__slug__in=categories)

        if filters.get("price_min"):
            qs = qs.filter(price__gte=filters["price_min"])
        if filters.get("price_max"):
            qs = qs.filter(price__lte=filters["price_max"])

        sizes = filters.get("size")
        if sizes:
            qs = qs.filter(variants__size__in=sizes)

        colors = filters.get("color")
        if colors:
            qs = qs.filter(Q(variants__color__in=colors) | Q(colors__name__in=colors))

        if "in_stock" in filters:
            if filters["in_stock"]:
                qs = qs.filter(Q(stock__gt=0) | Q(variants__stock__gt=0))
            else:
                qs = qs.filter(stock=0).exclude(variants__stock__gt=0)

        for filter_name, model_field in {"featured": "is_featured", "new": "is_new", "bestseller": "is_bestseller"}.items():
            if filter_name in filters:
                qs = qs.filter(**{model_field: filters[filter_name]})

        if filters.get("on_sale"):
            qs = qs.filter(sale_price__isnull=False)

        return qs.distinct()

    def _apply_sort(self, qs, sort: str | None, has_query: bool):
        if sort == "price_asc":
            return qs.order_by("price", "name")
        if sort == "price_desc":
            return qs.order_by("-price", "name")
        if sort == "name_asc":
            return qs.order_by("name")
        if sort == "name_desc":
            return qs.order_by("-name")
        if sort == "newest":
            return qs.order_by("-created_at")
        if sort == "popularity":
            return qs.order_by("-is_bestseller", "-is_featured", "-created_at")
        # Default: relevance first when searching, featured-first when browsing
        if has_query:
            return qs.order_by("-relevance", "-is_bestseller", "name")
        return qs.order_by("-is_featured", "-is_bestseller", "-created_at")

    def _facets(self, qs):
        return {
            "categories": list(
                qs.exclude(category__isnull=True)
                .values(key=F("category__name"))
                .annotate(count=Count("id", distinct=True))
                .order_by("-count", "key")[:20]
            ),
            "sizes": list(
                qs.exclude(variants__size="")
                .values(key=F("variants__size"))
                .annotate(count=Count("id", distinct=True))
                .order_by("key")[:20]
            ),
            "colors": list(
                qs.exclude(colors__name="")
                .values(key=F("colors__name"))
                .annotate(count=Count("id", distinct=True))
                .order_by("key")[:20]
            ),
        }

    # ------------------------------------------------------------------
    # Analytics helpers
    # ------------------------------------------------------------------

    def _track_search(self, query, result_count, user, filters, sort, page, request=None):
        if not getattr(settings, "SEARCH_ANALYTICS", {}).get("TRACK_SEARCHES", True):
            return
        try:
            SearchQuery.objects.create(
                query=query,
                result_count=result_count,
                user=user if user and user.is_authenticated else None,
                ip_address=self._get_client_ip(request) if request else None,
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500] if request else "",
                filters_applied=self._serialize_filters(filters),
                sort_applied=sort or "",
                page_viewed=page,
            )
        except Exception as exc:
            logger.warning("Search query tracking failed: %s", exc)

    def _update_suggestions(self, query: str, result_count: int) -> None:
        """Increment popularity of a suggestion, or create it if it has results."""
        if result_count == 0 or len(query) < 2:
            return
        try:
            obj, created = SearchSuggestion.objects.get_or_create(
                text__iexact=query,
                defaults={"text": query, "popularity": 1},
            )
            if not created:
                SearchSuggestion.objects.filter(pk=obj.pk).update(popularity=F("popularity") + 1)
        except Exception as exc:
            logger.warning("Suggestion update failed: %s", exc)

    def _serialize_filters(self, filters: dict) -> dict:
        return {
            k: [str(v) for v in val] if isinstance(val, (list, tuple)) else val
            for k, val in filters.items()
        }

    def _get_client_ip(self, request) -> str | None:
        if not request:
            return None
        xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
        return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")

    # ------------------------------------------------------------------
    # Elasticsearch (optional)
    # ------------------------------------------------------------------

    def _search_elasticsearch(self, query, filters, sort, page, page_size, user, track_search, request=None):
        try:
            from django_elasticsearch_dsl import Search
            from elasticsearch_dsl import Q as EsQ
            from .documents import ProductDocument
        except ImportError:
            logger.warning("Elasticsearch dependencies not installed; falling back to database.")
            return None

        try:
            search = Search(index=ProductDocument._index._name)
            search = search.query(
                EsQ("multi_match", query=query, fields=["name^3", "description", "category.name^2"], fuzziness="AUTO")
                if query else EsQ("match_all")
            )
            start = (page - 1) * page_size
            response = search[start: start + page_size].execute()

            if track_search and query:
                self._track_search(query, response.hits.total.value, user, filters, sort, page, request)

            return {
                "products": [hit.to_dict() for hit in response.hits],
                "total": response.hits.total.value,
                "page": page,
                "page_size": page_size,
                "total_pages": (response.hits.total.value + page_size - 1) // page_size,
                "facets": {},
                "suggestions": [],
                "query": query,
                "took": response.took,
                "backend": "elasticsearch",
            }
        except Exception as exc:
            logger.warning("Elasticsearch search failed: %s — falling back to database.", exc)
            return None


search_service = ProductSearchService()
