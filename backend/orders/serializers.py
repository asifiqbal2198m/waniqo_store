from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    item_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "variant",
            "variant_name",
            "quantity",
            "price",
            "item_total",
        ]

    def get_item_total(self, obj):
        return obj.price * obj.quantity


class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "total_amount",
            "status",
            "cancel_reason",
            "return_reason",
            "admin_note",
            "payment_method",
            "payment_status",
            "razorpay_order_id",
            "razorpay_payment_id",
            "items",
            "created_at",
            "updated_at",
        ]