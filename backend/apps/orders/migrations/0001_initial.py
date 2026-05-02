from django.db import migrations, models
import django.db.models.deletion
import django.conf


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("products", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("status", models.CharField(
                    choices=[
                        ("pending", "Pending"),
                        ("paid", "Paid"),
                        ("confirmed", "Confirmed"),
                        ("shipped", "Shipped"),
                        ("delivered", "Delivered"),
                        ("cancelled", "Cancelled"),
                        ("failed", "Failed"),
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
                    to="accounts.user",
                )),
            ],
            options={"abstract": False},
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
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
        # MySQL does not support conditional unique constraints.
        # Idempotency uniqueness is enforced at the application layer
        # in services.py via select_for_update + IntegrityError handling.
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["user", "idempotency_key"], name="order_user_idempotency_idx"),
        ),
    ]
