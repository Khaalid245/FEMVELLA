from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Currency",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("code", models.CharField(help_text="ISO 4217 e.g. USD, EUR, SAR", max_length=3, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("symbol", models.CharField(max_length=10)),
                ("exchange_rate", models.DecimalField(decimal_places=6, default=1.0, max_digits=12)),
                ("is_active", models.BooleanField(default=True)),
                ("is_default", models.BooleanField(default=False)),
                ("decimal_places", models.PositiveSmallIntegerField(default=2)),
            ],
            options={
                "verbose_name_plural": "Currencies",
                "ordering": ["code"],
            },
        ),
    ]
