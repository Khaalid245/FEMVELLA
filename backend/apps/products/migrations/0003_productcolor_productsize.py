from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0002_product_is_new_is_bestseller"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductColor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=50)),
                ("hex_code", models.CharField(max_length=7)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="colors", to="products.product")),
            ],
        ),
        migrations.CreateModel(
            name="ProductSize",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("size", models.CharField(choices=[("XS", "XS"), ("S", "S"), ("M", "M"), ("L", "L"), ("XL", "XL"), ("XXL", "XXL")], max_length=5)),
                ("in_stock", models.BooleanField(default=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sizes", to="products.product")),
            ],
            options={"unique_together": {("product", "size")}},
        ),
    ]
