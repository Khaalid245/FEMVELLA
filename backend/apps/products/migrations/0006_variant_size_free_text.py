from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0005_product_is_customizable"),
    ]

    operations = [
        migrations.AlterField(
            model_name="productvariant",
            name="size",
            field=models.CharField(max_length=50),
        ),
    ]
