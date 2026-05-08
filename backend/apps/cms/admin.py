from django.contrib import admin
from django.utils.html import format_html
from .models import Banner, Collection, LookbookEntry


class SortableAdminMixin:
    """Adds sort_order to list_display and makes it editable inline."""
    list_editable = ("sort_order", "is_active")

    def move_up(self, request, queryset):
        for obj in queryset.order_by("sort_order"):
            if obj.sort_order > 0:
                obj.sort_order -= 1
                obj.save(update_fields=["sort_order"])
    move_up.short_description = "Move selected up"

    def move_down(self, request, queryset):
        for obj in queryset.order_by("-sort_order"):
            obj.sort_order += 1
            obj.save(update_fields=["sort_order"])
    move_down.short_description = "Move selected down"

    def publish(self, request, queryset):
        queryset.update(is_active=True)
    publish.short_description = "Publish selected"

    def unpublish(self, request, queryset):
        queryset.update(is_active=False)
    unpublish.short_description = "Unpublish selected"


@admin.register(Banner)
class BannerAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ("sort_order", "title", "badge_text", "is_active", "published_at", "expires_at", "preview")
    list_display_links = ("title",)
    list_filter = ("is_active",)
    search_fields = ("title", "subtitle")
    actions = ["publish", "unpublish", "move_up", "move_down"]
    fieldsets = (
        ("Content", {"fields": ("title", "subtitle", "badge_text")}),
        ("Call to Action", {"fields": ("cta_label", "cta_url", "secondary_cta_label", "secondary_cta_url")}),
        ("Media", {"fields": ("image", "image_alt")}),
        ("Scheduling", {"fields": ("is_active", "published_at", "expires_at", "sort_order")}),
    )

    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:48px;border-radius:4px;" />', obj.image.url)
        return "—"
    preview.short_description = "Preview"


@admin.register(Collection)
class CollectionAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ("sort_order", "title", "slug", "is_active", "published_at", "expires_at", "preview")
    list_display_links = ("title",)
    list_filter = ("is_active",)
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    actions = ["publish", "unpublish", "move_up", "move_down"]
    fieldsets = (
        ("Content", {"fields": ("title", "subtitle", "slug")}),
        ("Call to Action", {"fields": ("cta_label", "cta_url")}),
        ("Media", {"fields": ("image", "image_alt")}),
        ("Scheduling", {"fields": ("is_active", "published_at", "expires_at", "sort_order")}),
    )

    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:48px;border-radius:4px;" />', obj.image.url)
        return "—"
    preview.short_description = "Preview"


@admin.register(LookbookEntry)
class LookbookEntryAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ("sort_order", "title", "is_active", "product_url", "preview")
    list_display_links = ("title",)
    list_filter = ("is_active",)
    search_fields = ("title",)
    actions = ["publish", "unpublish", "move_up", "move_down"]
    fieldsets = (
        ("Content", {"fields": ("title", "description", "product_url")}),
        ("Media", {"fields": ("image", "image_alt")}),
        ("Display", {"fields": ("is_active", "sort_order")}),
    )

    def preview(self, obj):
        return format_html('<img src="{}" style="height:48px;border-radius:4px;" />', obj.image.url)
    preview.short_description = "Preview"
