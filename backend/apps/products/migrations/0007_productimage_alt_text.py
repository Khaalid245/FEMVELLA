from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0006_variant_size_free_text"),
    ]

    operations = [
        migrations.AddField(
            model_name="productimage",
            name="alt_text",
            field=models.CharField(blank=True, default="", help_text="Alternative text for accessibility", max_length=255),
        ),
    ]