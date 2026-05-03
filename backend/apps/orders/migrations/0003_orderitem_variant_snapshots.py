from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_indexes_and_audit_log"),
        ("products", "0004_productvariant"),
    ]

    operations = [
        migrations.AddField(
            model_name="orderitem",
            name="variant",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="order_items",
                to="products.productvariant",
            ),
        ),
        migrations.AddField(
            model_name="orderitem",
            name="size_snapshot",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="orderitem",
            name="color_snapshot",
            field=models.CharField(blank=True, default="", max_length=50),
        ),
    ]
