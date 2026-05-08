from django.db import migrations


CURRENCIES = [
    {"code": "USD", "name": "US Dollar",     "symbol": "$",   "exchange_rate": 1.000000, "is_default": True},
    {"code": "EUR", "name": "Euro",           "symbol": "€",   "exchange_rate": 0.920000, "is_default": False},
    {"code": "GBP", "name": "British Pound",  "symbol": "£",   "exchange_rate": 0.790000, "is_default": False},
    {"code": "SAR", "name": "Saudi Riyal",    "symbol": "﷼",   "exchange_rate": 3.750000, "is_default": False},
    {"code": "AED", "name": "UAE Dirham",     "symbol": "د.إ", "exchange_rate": 3.670000, "is_default": False},
]


def seed_currencies(apps, schema_editor):
    Currency = apps.get_model("currency", "Currency")
    for c in CURRENCIES:
        Currency.objects.get_or_create(code=c["code"], defaults=c)


def unseed_currencies(apps, schema_editor):
    Currency = apps.get_model("currency", "Currency")
    Currency.objects.filter(code__in=[c["code"] for c in CURRENCIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("currency", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_currencies, unseed_currencies),
    ]
