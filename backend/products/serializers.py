from rest_framework import serializers
from django.db.models import Avg
from .models import Product, Category, Review, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "is_active"
        ]


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "username",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["user", "created_at"]


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "product",
            "name",
            "size",
            "color",
            "price_override",
            "effective_price",
            "stock",
            "is_active",
        ]
        read_only_fields = ["product"]


class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    reviews = ReviewSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "description",
            "price",
            "stock",
            "image",
            "is_active",
            "reviews",
            "variants",
            "average_rating",
            "review_count",
        ]

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 5.0

    def get_review_count(self, obj):
        return obj.reviews.count()