"""
Database Router for Read/Write Splitting
========================================

This router automatically directs read queries to replica databases
and write queries to the primary database for better performance.
"""

import random


class DatabaseRouter:
    """
    A router to control all database operations on models
    """
    
    # Models that should always use the primary database
    PRIMARY_ONLY_MODELS = [
        'audit.auditlog',
        'audit.securityevent', 
        'audit.dataexportrequest',
        'orders.order',
        'payments.payment',
        'sessions.session',
    ]
    
    def db_for_read(self, model, **hints):
        """Suggest the database to read from."""
        
        # Always use primary for certain models
        model_name = f"{model._meta.app_label}.{model._meta.model_name}"
        if model_name in self.PRIMARY_ONLY_MODELS:
            return 'default'
        
        # Use replica for read operations if available
        if 'replica' in self._get_available_databases():
            return 'replica'
        
        return 'default'
    
    def db_for_write(self, model, **hints):
        """Suggest the database to write to."""
        # All writes go to primary database
        return 'default'
    
    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations if models are in the same app."""
        db_set = {'default', 'replica'}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure that migrations only run on the primary database."""
        return db == 'default'
    
    def _get_available_databases(self):
        """Get list of available databases."""
        from django.conf import settings
        return list(settings.DATABASES.keys())


class ReadWriteRouter:
    """
    Alternative router with more sophisticated logic
    """
    
    def db_for_read(self, model, **hints):
        """Reading from the replica database if available."""
        
        # Check if we're in a transaction (should use primary)
        from django.db import transaction
        if transaction.get_connection().in_atomic_block:
            return 'default'
        
        # Use replica for read-heavy models
        read_models = [
            'products.product',
            'products.productimage', 
            'products.category',
            'blog.post',
            'analytics.pageview',
        ]
        
        model_name = f"{model._meta.app_label}.{model._meta.model_name}"
        if model_name in read_models and 'replica' in self._get_available_databases():
            return 'replica'
        
        return 'default'
    
    def db_for_write(self, model, **hints):
        """Writing to the primary database."""
        return 'default'
    
    def allow_relation(self, obj1, obj2, **hints):
        """Relations between objects are allowed."""
        return True
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """All migrations go to primary."""
        return db == 'default'
    
    def _get_available_databases(self):
        """Get list of available databases."""
        from django.conf import settings
        return list(settings.DATABASES.keys())