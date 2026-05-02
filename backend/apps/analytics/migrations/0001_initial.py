from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="PageView",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("path", models.CharField(max_length=500)),
                ("referrer", models.CharField(blank=True, max_length=500)),
                ("user_agent", models.TextField(blank=True)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("session_key", models.CharField(blank=True, max_length=100)),
            ],
            options={"abstract": False},
        ),
    ]
