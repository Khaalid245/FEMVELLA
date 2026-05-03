from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0003_productcolor_productsize"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductVariant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("size", models.CharField(
                    choices=[("XS","XS"),("S","S"),("M","M"),("L","L"),("XL","XL"),("XXL","XXL"),("One Size","One Size")],
                    max_length=10,
                )),
                ("color", models.CharField(blank=True, default="", max_length=50)),
                ("stock", models.PositiveIntegerField(default=0)),
                ("price_override", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("product", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="variants",
                    to="products.product",
                )),
            ],
            options={"ordering": ["size"], "unique_together": {("product", "size", "color")}},
        ),
    ]
