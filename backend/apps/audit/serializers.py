from rest_framework import serializers
from .models import DataExportRequest, AuditLog, SecurityEvent


class DataExportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataExportRequest
        fields = [
            'id', 'request_type', 'status', 'file_size', 
            'download_count', 'expires_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'status', 'file_size', 'download_count', 
            'expires_at', 'created_at'
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    content_object_str = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_email', 'action_type', 'action_description',
            'content_object_str', 'ip_address', 'request_method',
            'request_path', 'risk_level', 'is_suspicious', 'created_at'
        ]
    
    def get_content_object_str(self, obj):
        return str(obj.content_object) if obj.content_object else None


class SecurityEventSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = SecurityEvent
        fields = [
            'id', 'event_type', 'severity', 'ip_address', 'user_email',
            'description', 'country', 'city', 'is_resolved', 'created_at'
        ]


class UserDataExportSerializer(serializers.Serializer):
    """
    Serializer for complete user data export
    """
    personal_info = serializers.DictField()
    orders = serializers.ListField()
    audit_logs = serializers.ListField()
    security_events = serializers.ListField()
    export_metadata = serializers.DictField()