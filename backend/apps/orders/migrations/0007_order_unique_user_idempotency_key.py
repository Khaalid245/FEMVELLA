from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0006_order_carrier_order_delivered_at_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="idempotency_key_unique",
            field=models.CharField(blank=True, default=None, max_length=64, null=True),
        ),
        migrations.AlterUniqueTogether(
            name="order",
            unique_together={("user", "idempotency_key_unique")},
        ),
    ]
