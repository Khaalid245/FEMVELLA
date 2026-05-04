from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0004_productvariant"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="is_customizable",
            field=models.BooleanField(default=False),
        ),
    ]
