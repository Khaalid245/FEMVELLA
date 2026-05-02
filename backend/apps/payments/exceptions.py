from rest_framework.exceptions import APIException
from rest_framework import status


class OrderNotPayableError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "order_not_payable"

    def __init__(self, reason: str):
        self.detail = reason


class OrderNotFoundError(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_code = "order_not_found"
    default_detail = "Order not found."


class StripeGatewayError(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_code = "stripe_error"

    def __init__(self, message: str):
        self.detail = f"Payment gateway error: {message}"
