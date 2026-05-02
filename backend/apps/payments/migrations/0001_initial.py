from django.db import migrations, models
import django.db.models.deletion
import django.conf


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Payment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("status", models.CharField(
                    choices=[
                        ("pending", "Pending"),
                        ("completed", "Completed"),
                        ("failed", "Failed"),
                        ("refunded", "Refunded"),
                    ],
                    default="pending",
                    max_length=20,
                )),
                ("provider", models.CharField(default="stripe", max_length=50)),
                ("stripe_payment_intent_id", models.CharField(blank=True, default="", max_length=255, unique=True)),
                ("order", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="payment",
                    to="orders.order",
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    to="accounts.user",
                )),
            ],
            options={"abstract": False},
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["stripe_payment_intent_id"], name="payments_stripe_pi_idx"),
        ),
    ]
