from rest_framework.exceptions import APIException
from rest_framework import status


class OutOfStockError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "out_of_stock"

    def __init__(self, product_name: str, available: int):
        self.detail = (
            f"'{product_name}' only has {available} unit(s) in stock."
        )


class InsufficientStockError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "insufficient_stock"

    def __init__(self, product_name: str, requested: int, available: int):
        self.detail = (
            f"'{product_name}' requested {requested} but only {available} available."
        )


class InvalidProductError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "invalid_product"

    def __init__(self, product_id: int):
        self.detail = f"Product with id={product_id} does not exist or is inactive."


class EmptyCartError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "empty_cart"
    default_detail = "Cart must contain at least one item."
