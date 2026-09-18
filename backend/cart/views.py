from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsCustomerUser

from .models import Cart, CartItem
from .serializers import (
    AddToCartSerializer,
    CartSerializer,
    UpdateCartItemSerializer
)

from products.models import Product, ProductVariant


class AddToCartView(APIView):

    permission_classes = [IsCustomerUser]

    def post(self, request):

        serializer = AddToCartSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        product_id = serializer.validated_data["product_id"]
        variant_id = serializer.validated_data.get("variant_id")
        quantity = serializer.validated_data["quantity"]

        try:
            product = Product.objects.get(
                id=product_id,
                is_active=True
            )

        except Product.DoesNotExist:

            return Response(
                {
                    "status": 404,
                    "message": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        variant = None
        if variant_id:
            try:
                variant = ProductVariant.objects.get(
                    id=variant_id,
                    product=product,
                    is_active=True
                )
            except ProductVariant.DoesNotExist:
                return Response(
                    {
                        "status": 404,
                        "message": "Selected product variant not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

        available_stock = variant.stock if variant else product.stock

        if quantity > available_stock:

            return Response(
                {
                    "status": 400,
                    "message": "Requested quantity exceeds available stock."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart, created = Cart.objects.get_or_create(
            user=request.user
        )

        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            variant=variant,
            defaults={
                "quantity": quantity
            }
        )

        if not item_created:

            new_quantity = cart_item.quantity + quantity

            if new_quantity > available_stock:

                return Response(
                    {
                        "status": 400,
                        "message": "Requested quantity exceeds available stock."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            cart_item.quantity = new_quantity
            cart_item.save()

        effective_price = variant.effective_price if variant else product.price

        return Response(
            {
                "status": 200,
                "message": "Product added to cart successfully.",
                "cart_item": {
                    "id": cart_item.id,
                    "product": product.id,
                    "product_name": product.name,
                    "variant": variant.id if variant else None,
                    "variant_name": variant.name if variant else None,
                    "price": str(effective_price),
                    "quantity": cart_item.quantity,
                }
            },
            status=status.HTTP_200_OK
        )


class ViewCartView(APIView):

    permission_classes = [IsCustomerUser]

    def get(self, request):

        cart, created = Cart.objects.get_or_create(
            user=request.user
        )

        serializer = CartSerializer(cart)

        return Response(
            {
                "status": 200,
                "message": "Cart fetched successfully.",
                "cart": serializer.data,
            },
            status=status.HTTP_200_OK
        )


class UpdateCartItemView(APIView):

    permission_classes = [IsCustomerUser]

    def put(self, request, item_id):

        serializer = UpdateCartItemSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        quantity = serializer.validated_data["quantity"]

        try:
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )

        except CartItem.DoesNotExist:

            return Response(
                {
                    "status": 404,
                    "message": "Cart item not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if quantity > cart_item.product.stock:

            return Response(
                {
                    "status": 400,
                    "message": "Requested quantity exceeds available stock."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.save()

        return Response(
            {
                "status": 200,
                "message": "Cart item updated successfully.",
                "cart_item": {
                    "id": cart_item.id,
                    "product": cart_item.product.id,
                    "product_name": cart_item.product.name,
                    "price": str(cart_item.product.price),
                    "quantity": cart_item.quantity
                }
            },
            status=status.HTTP_200_OK
        )


class DeleteCartItemView(APIView):

    permission_classes = [IsCustomerUser]

    def delete(self, request, item_id):

        try:
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )

        except CartItem.DoesNotExist:

            return Response(
                {
                    "status": 404,
                    "message": "Cart item not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        cart_item.delete()

        return Response(
            {
                "status": 200,
                "message": "Product removed from cart successfully."
            },
            status=status.HTTP_200_OK
        )