from rest_framework import serializers
from .models import Product,Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model=Category
        fields=[
            "id",
            "name",
            "description",
            "is_active"
        ]



class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "description",
            "price",
            "stock",
            "image",
            "is_active",
        ]