from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductVariantSerializer


class AddToCartSerializer(serializers.Serializer):

    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)

    quantity = serializers.IntegerField(
        min_value=1
    )


class UpdateCartItemSerializer(serializers.Serializer):

    quantity = serializers.IntegerField(
        min_value=1
    )


class CartItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    variant_details = ProductVariantSerializer(
        source="variant",
        read_only=True
    )

    price = serializers.SerializerMethodField()
    item_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_name",
            "variant",
            "variant_details",
            "price",
            "quantity",
            "item_total",
        ]

    def get_price(self, obj):
        if obj.variant and obj.variant.price_override is not None:
            return obj.variant.price_override
        return obj.product.price

    def get_item_total(self, obj):
        price = self.get_price(obj)
        return price * obj.quantity


class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True
    )

    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "subtotal",
            "created_at",
            "updated_at",
        ]

    def get_subtotal(self, obj):
        total = 0
        for item in obj.items.all():
            price = item.variant.price_override if (item.variant and item.variant.price_override is not None) else item.product.price
            total += price * item.quantity
        return total