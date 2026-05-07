"""
Search services.

The production search path can use Elasticsearch when the optional package and
cluster are available. The default path uses the relational database so Phase 2
works immediately in local and CI environments.
"""

import logging

from django.conf import settings
from django.db.models import Count, F, Q

from apps.products.models import Product
from apps.products.serializers import ProductSerializer

from .models import SearchClick, SearchQuery, SearchSuggestion

logger = logging.getLogger(__name__)


class ProductSearchService:
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
            elastic_result = self._search_elasticsearch(query, filters, sort, page, page_size, user, track_search, request)
            if elastic_result is not None:
                return elastic_result

        return self._search_database(query, filters, sort, page, page_size, user, track_search, request)

    def autocomplete(self, query, limit=10):
        if len(query) < 2:
            return []

        product_matches = Product.objects.filter(
            is_active=True,
            name__icontains=query,
        ).order_by("name")[:limit]

        suggestions = [
            {
                "type": "product",
                "text": product.name,
                "url": f"/products/{product.slug}/",
            }
            for product in product_matches
        ]

        remaining = max(limit - len(suggestions), 0)
        if remaining:
            stored = SearchSuggestion.objects.filter(
                is_active=True,
                text__icontains=query,
            ).order_by("-popularity", "text")[:remaining]
            suggestions.extend(
                {"type": "suggestion", "text": item.text, "url": f"/products/?search={item.text}"}
                for item in stored
            )

        return suggestions[:limit]

    def get_similar_products(self, product_id, limit=6, request=None):
        try:
            product = Product.objects.select_related("category").get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return []

        queryset = Product.objects.filter(is_active=True).exclude(pk=product.pk)
        if product.category_id:
            queryset = queryset.filter(category_id=product.category_id)

        queryset = queryset.select_related("category").prefetch_related("images", "colors", "sizes", "variants")
        serializer = ProductSerializer(queryset[:limit], many=True, context={"request": request})
        return serializer.data

    def track_click(self, query, product_id, user, position=None, request=None):
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

    def _search_database(self, query, filters, sort, page, page_size, user, track_search, request):
        queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related(
            "images", "colors", "sizes", "variants"
        )

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(category__name__icontains=query)
                | Q(variants__size__icontains=query)
                | Q(variants__color__icontains=query)
                | Q(colors__name__icontains=query)
            ).distinct()

        queryset = self._apply_database_filters(queryset, filters)
        queryset = self._apply_database_sorting(queryset, sort, bool(query))

        total = queryset.count()
        page = max(int(page or 1), 1)
        page_size = min(max(int(page_size or 20), 1), 100)
        start = (page - 1) * page_size
        page_queryset = queryset[start : start + page_size]

        if track_search and query:
            self._track_search(query, total, user, filters, sort, page, request)

        serializer = ProductSerializer(page_queryset, many=True, context={"request": request})

        return {
            "products": serializer.data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
            "facets": self._database_facets(queryset),
            "suggestions": self.autocomplete(query, limit=5) if query else [],
            "query": query,
            "backend": "database",
        }

    def _apply_database_filters(self, queryset, filters):
        categories = filters.get("category")
        if categories:
            queryset = queryset.filter(category__slug__in=categories)

        if filters.get("price_min"):
            queryset = queryset.filter(price__gte=filters["price_min"])
        if filters.get("price_max"):
            queryset = queryset.filter(price__lte=filters["price_max"])

        sizes = filters.get("size")
        if sizes:
            queryset = queryset.filter(variants__size__in=sizes)

        colors = filters.get("color")
        if colors:
            queryset = queryset.filter(Q(variants__color__in=colors) | Q(colors__name__in=colors))

        if "in_stock" in filters:
            if filters["in_stock"]:
                queryset = queryset.filter(Q(stock__gt=0) | Q(variants__stock__gt=0))
            else:
                queryset = queryset.filter(stock=0).exclude(variants__stock__gt=0)

        flag_map = {
            "featured": "is_featured",
            "new": "is_new",
            "bestseller": "is_bestseller",
        }
        for filter_name, model_field in flag_map.items():
            if filter_name in filters:
                queryset = queryset.filter(**{model_field: filters[filter_name]})

        if filters.get("on_sale"):
            queryset = queryset.filter(sale_price__isnull=False)

        return queryset.distinct()

    def _apply_database_sorting(self, queryset, sort, has_query):
        if sort == "price_asc":
            return queryset.order_by("price", "name")
        if sort == "price_desc":
            return queryset.order_by("-price", "name")
        if sort == "name_asc":
            return queryset.order_by("name")
        if sort == "name_desc":
            return queryset.order_by("-name")
        if sort == "newest":
            return queryset.order_by("-created_at")
        if sort == "oldest":
            return queryset.order_by("created_at")
        if sort == "popularity":
            return queryset.order_by("-is_bestseller", "-is_featured", "-created_at")

        if has_query:
            return queryset.order_by("-is_bestseller", "-is_featured", "name")
        return queryset.order_by("-is_featured", "-is_bestseller", "-created_at")

    def _database_facets(self, queryset):
        return {
            "categories": list(
                queryset.exclude(category__isnull=True)
                .values(key=F("category__name"))
                .annotate(count=Count("id", distinct=True))
                .order_by("-count", "key")[:20]
            ),
            "sizes": list(
                queryset.exclude(variants__size="")
                .values(key=F("variants__size"))
                .annotate(count=Count("id", distinct=True))
                .order_by("key")[:20]
            ),
            "colors": list(
                queryset.exclude(colors__name="")
                .values(key=F("colors__name"))
                .annotate(count=Count("id", distinct=True))
                .order_by("key")[:20]
            ),
        }

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

    def _serialize_filters(self, filters):
        serialized = {}
        for key, value in filters.items():
            if isinstance(value, (list, tuple)):
                serialized[key] = [str(item) for item in value]
            else:
                serialized[key] = value if isinstance(value, (bool, int, float, str)) else str(value)
        return serialized

    def _get_client_ip(self, request):
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "") if request else ""
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR") if request else None

    def _search_elasticsearch(self, query, filters, sort, page, page_size, user, track_search, request=None):
        try:
            from django_elasticsearch_dsl import Search
            from elasticsearch_dsl import Q as EsQ

            from .documents import ProductDocument
        except ImportError:
            logger.warning("SEARCH_BACKEND=elasticsearch but Elasticsearch dependencies are not installed.")
            return None

        search = Search(index=ProductDocument._index._name)
        search = search.query(
            EsQ(
                "multi_match",
                query=query,
                fields=["name^3", "description", "category.name^2"],
                fuzziness="AUTO",
            )
            if query
            else EsQ("match_all")
        )

        start = (page - 1) * page_size
        response = search[start : start + page_size].execute()

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


search_service = ProductSearchService()
