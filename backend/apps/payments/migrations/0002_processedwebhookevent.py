from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProcessedWebhookEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("stripe_event_id", models.CharField(max_length=255, unique=True)),
                ("event_type", models.CharField(max_length=100)),
                ("processed_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"indexes": [models.Index(fields=["stripe_event_id"], name="payments_pr_stripe__idx")]},
        ),
    ]
