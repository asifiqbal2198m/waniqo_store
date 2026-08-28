from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
# pyrefly: ignore [missing-import]
from accounts.permissions import IsAdminUser

from .models import Order, OrderItem

from cart.models import Cart

from .serializers import OrderSerializer


class CreateOrderView(APIView):

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):

        try:
            cart = Cart.objects.get(
                user=request.user
            )
        except Cart.DoesNotExist:

            return Response(
                {
                    "status": 404,
                    "message": "Cart not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        cart_items = cart.items.select_related(
            "product"
        )

        if not cart_items.exists():

            return Response(
                {
                    "status": 400,
                    "message": "Your cart is empty."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        total_amount = 0

        # Check stock first
        for cart_item in cart_items:

            if cart_item.quantity > cart_item.product.stock:

                return Response(
                    {
                        "status": 400,
                        "message": (
                            f"Not enough stock for "
                            f"{cart_item.product.name}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Create order
        order = Order.objects.create(
            user=request.user,
            total_amount=0,
            status="pending"
        )

        # Create order items
        for cart_item in cart_items:

            product = cart_item.product

            price = product.price
            quantity = cart_item.quantity

            item_total = price * quantity

            total_amount += item_total

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            )

            # Reduce stock
            product.stock -= quantity
            product.save(
                update_fields=["stock"]
            )

        # Update order total
        order.total_amount = total_amount
        order.save(
            update_fields=["total_amount"]
        )

        # Clear cart
        cart.items.all().delete()

        serializer = OrderSerializer(order)

        return Response(
            {
                "status": 201,
                "message": "Order created successfully.",
                "order": serializer.data
            },
            status=status.HTTP_201_CREATED
        )



class OrderListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        orders = Order.objects.filter(
            user=request.user
        ).prefetch_related(
            "items__product"
        ).order_by(
            "-created_at"
        )

        serializer = OrderSerializer(
            orders,
            many=True
        )

        return Response(
            {
                "status": 200,
                "message": "Orders fetched successfully.",
                "orders": serializer.data
            },
            status=status.HTTP_200_OK
        )


class OrderDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):

        try:
            order = Order.objects.prefetch_related(
                "items__product"
            ).get(
                id=order_id,
                user=request.user
            )

        except Order.DoesNotExist:

            return Response(
                {
                    "status": 404,
                    "message": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderSerializer(order)

        return Response(
            {
                "status": 200,
                "message": "Order details fetched successfully.",
                "order": serializer.data
            },
            status=status.HTTP_200_OK
        ) 


class AdminOrderListView(APIView):

    permission_classes = [IsAdminUser]

    def get(self, request):

        orders = Order.objects.all().select_related(
            "user"
        ).prefetch_related(
            "items__product"
        ).order_by(
            "-created_at"
        )

        serializer = OrderSerializer(
            orders,
            many=True
        )

        return Response(
            {
                "status": 200,
                "message": "All orders fetched successfully.",
                "orders": serializer.data
            },
            status=status.HTTP_200_OK
        )


class AdminOrderStatusUpdateView(APIView):

    permission_classes = [IsAdminUser]

    def put(self, request, order_id):

        try:
            order = Order.objects.get(id=order_id)

        except Order.DoesNotExist:

            return Response(
                {
                    "status": 404,
                    "message": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")

        if not new_status:

            return Response(
                {
                    "status": 400,
                    "message": "Status is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled"
        ]

        if new_status not in valid_statuses:

            return Response(
                {
                    "status": 400,
                    "message": "Invalid order status.",
                    "valid_statuses": valid_statuses
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save(update_fields=["status"])

        serializer = OrderSerializer(order)

        return Response(
            {
                "status": 200,
                "message": "Order status updated successfully.",
                "order": serializer.data
            },
            status=status.HTTP_200_OK
        )