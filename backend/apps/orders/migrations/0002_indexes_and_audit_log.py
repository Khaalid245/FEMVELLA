from django.db import migrations, models
import django.db.models.deletion
import django.conf


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0001_initial"),
        migrations.swappable_dependency(django.conf.settings.AUTH_USER_MODEL),
    ]

    operations = [
        # New indexes on Order
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["created_at"], name="order_created_at_idx"),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["status", "created_at"], name="order_status_created_idx"),
        ),
        # db_index on status field
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"), ("paid", "Paid"), ("confirmed", "Confirmed"),
                    ("shipped", "Shipped"), ("delivered", "Delivered"),
                    ("cancelled", "Cancelled"), ("failed", "Failed"),
                ],
                default="pending",
                max_length=20,
                db_index=True,
            ),
        ),
        # Audit log model
        migrations.CreateModel(
            name="OrderStatusHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("old_status", models.CharField(max_length=20)),
                ("new_status", models.CharField(max_length=20)),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("order", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="history",
                    to="orders.order",
                )),
                ("changed_by", models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="order_status_changes",
                    to=django.conf.settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["-timestamp"]},
        ),
    ]
