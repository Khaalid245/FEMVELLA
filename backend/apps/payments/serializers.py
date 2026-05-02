from rest_framework import serializers


class CreatePaymentIntentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(min_value=1)
