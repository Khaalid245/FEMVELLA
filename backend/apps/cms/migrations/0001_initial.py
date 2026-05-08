from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Banner",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=200)),
                ("subtitle", models.CharField(blank=True, max_length=400)),
                ("badge_text", models.CharField(blank=True, help_text="Small label above headline e.g. 'New Season · 2026'", max_length=100)),
                ("cta_label", models.CharField(default="Discover Collection", max_length=80)),
                ("cta_url", models.CharField(default="/products", max_length=500)),
                ("secondary_cta_label", models.CharField(blank=True, max_length=80)),
                ("secondary_cta_url", models.CharField(blank=True, max_length=500)),
                ("image", models.ImageField(blank=True, null=True, upload_to="cms/banners/")),
                ("image_alt", models.CharField(blank=True, max_length=255)),
                ("is_active", models.BooleanField(default=False)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=0)),
            ],
            options={
                "ordering": ["sort_order", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Collection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=200)),
                ("subtitle", models.CharField(blank=True, max_length=400)),
                ("slug", models.SlugField(unique=True)),
                ("image", models.ImageField(blank=True, null=True, upload_to="cms/collections/")),
                ("image_alt", models.CharField(blank=True, max_length=255)),
                ("cta_label", models.CharField(default="Shop Now", max_length=80)),
                ("cta_url", models.CharField(default="/products", max_length=500)),
                ("is_active", models.BooleanField(default=False)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=0)),
            ],
            options={
                "ordering": ["sort_order", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="LookbookEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True)),
                ("image", models.ImageField(upload_to="cms/lookbook/")),
                ("image_alt", models.CharField(blank=True, max_length=255)),
                ("product_url", models.CharField(blank=True, help_text="Optional link to a product", max_length=500)),
                ("is_active", models.BooleanField(default=False)),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=0)),
            ],
            options={
                "verbose_name": "Lookbook Entry",
                "verbose_name_plural": "Lookbook Entries",
                "ordering": ["sort_order", "-created_at"],
            },
        ),
    ]
