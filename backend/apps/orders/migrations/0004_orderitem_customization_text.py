from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0003_orderitem_variant_snapshots"),
        ("products", "0005_product_is_customizable"),
    ]

    operations = [
        migrations.AddField(
            model_name="orderitem",
            name="customization_text",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
    ]
