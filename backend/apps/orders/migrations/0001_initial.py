from django.db import migrations, models
import django.db.models.deletion
import django.conf


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(django.conf.settings.AUTH_USER_MODEL),
        ("products", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("status", models.CharField(
                    choices=[
                        ("pending", "Pending"),
                        ("confirmed", "Confirmed"),
                        ("shipped", "Shipped"),
                        ("delivered", "Delivered"),
                        ("cancelled", "Cancelled"),
                    ],
                    default="pending",
                    max_length=20,
                )),
                ("total_price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("shipping_address", models.TextField()),
                ("notes", models.TextField(blank=True)),
                ("idempotency_key", models.CharField(blank=True, default="", max_length=64)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="orders",
                    to=django.conf.settings.AUTH_USER_MODEL,
                )),
            ],
            options={"abstract": False},
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField()),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("order", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="items",
                    to="orders.order",
                )),
                ("product", models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to="products.product",
                )),
            ],
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.UniqueConstraint(
                condition=models.Q(idempotency_key__gt=""),
                fields=["user", "idempotency_key"],
                name="unique_order_idempotency_key_per_user",
            ),
        ),
    ]
