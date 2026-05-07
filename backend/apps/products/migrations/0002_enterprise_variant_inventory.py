# Generated migration for enterprise variant inventory system

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),  # Replace with your latest migration
    ]

    operations = [
        migrations.AddField(
            model_name='productvariant',
            name='low_stock_threshold',
            field=models.PositiveIntegerField(default=5, help_text='Alert when stock falls below this number'),
        ),
        migrations.AddField(
            model_name='productvariant',
            name='sku',
            field=models.CharField(help_text='Stock Keeping Unit - must be unique', max_length=100, unique=True, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='productvariant',
            name='is_active',
            field=models.BooleanField(default=True, help_text='Disable variant without deleting'),
        ),
        migrations.AddField(
            model_name='productvariant',
            name='reserved_stock',
            field=models.PositiveIntegerField(default=0, help_text='Stock reserved for pending orders'),
        ),
        migrations.AddField(
            model_name='productvariant',
            name='total_sold',
            field=models.PositiveIntegerField(default=0, help_text='Total units sold (for analytics)'),
        ),
        migrations.AddField(
            model_name='productvariant',
            name='last_restocked',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='productvariant',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='productvariant',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddIndex(
            model_name='productvariant',
            index=models.Index(fields=['sku'], name='products_pr_sku_idx'),
        ),
        migrations.AddIndex(
            model_name='productvariant',
            index=models.Index(fields=['stock'], name='products_pr_stock_idx'),
        ),
        migrations.AddIndex(
            model_name='productvariant',
            index=models.Index(fields=['is_active'], name='products_pr_active_idx'),
        ),
    ]