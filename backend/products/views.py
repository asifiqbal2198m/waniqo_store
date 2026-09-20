from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny

from .models import Product, Category, Review, Wishlist, ProductVariant
from .serializers import ProductSerializer, CategorySerializer, ReviewSerializer, ProductVariantSerializer
from accounts.permissions import IsAdminUser, IsCustomerUser


class ProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            product_list = Product.objects.filter(is_active=True).order_by('-id')
            serializer = ProductSerializer(
                product_list,
                many=True,
                context={'request': request}
            )
            return Response(
                {
                    "status": 200,
                    "message": "Products fetched successfully",
                    "products": serializer.data,
                },
                status=status.HTTP_200_OK
            )
        except Exception as err:
            return Response(
                {
                    "status": 200,
                    "message": f"Notice: {str(err)}",
                    "products": [],
                },
                status=status.HTTP_200_OK
            )


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {
                    "status": 404,
                    "message": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProductSerializer(product, context={'request': request})
        return Response(
            {
                "status": 200,
                "message": "Product fetched successfully",
                "product": serializer.data,
            },
            status=status.HTTP_200_OK
        )


class ProductReviewCreateView(APIView):
    permission_classes = [IsCustomerUser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {"status": 404, "message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        rating = request.data.get("rating")
        comment = request.data.get("comment", "")

        if not rating or not (1 <= int(rating) <= 5):
            return Response(
                {"status": 400, "message": "Rating must be an integer between 1 and 5."},
                status=status.HTTP_400_BAD_REQUEST
            )

        review, created = Review.objects.update_or_create(
            product=product,
            user=request.user,
            defaults={
                "rating": int(rating),
                "comment": str(comment).strip()
            }
        )

        serializer = ReviewSerializer(review)
        return Response(
            {
                "status": 201 if created else 200,
                "message": "Review submitted successfully!" if created else "Review updated successfully!",
                "review": serializer.data
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class WishlistToggleView(APIView):
    permission_classes = [IsCustomerUser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {"status": 404, "message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product=product
        )

        if not created:
            wishlist_item.delete()
            return Response(
                {
                    "status": 200,
                    "message": f"Removed {product.name} from Wishlist.",
                    "is_wishlisted": False
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "status": 201,
                "message": f"Saved {product.name} to Wishlist ❤️",
                "is_wishlisted": True
            },
            status=status.HTTP_201_CREATED
        )


class WishlistListView(APIView):
    permission_classes = [IsCustomerUser]

    def get(self, request):
        wishlist_items = Wishlist.objects.filter(user=request.user).select_related('product')
        products = [item.product for item in wishlist_items if item.product.is_active]
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(
            {
                "status": 200,
                "message": "Wishlist fetched successfully.",
                "products": serializer.data
            },
            status=status.HTTP_200_OK
        )


class AdminProductCreateView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = ProductSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save(is_active=True)
            return Response(
                {
                    "status": 201,
                    "message": "Product created successfully",
                    "product": serializer.data,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminProductUpdateView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def put(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {
                    "status": 404,
                    "message": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProductSerializer(
            product,
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": 200,
                    "message": "Product updated successfully.",
                    "product": serializer.data,
                },
                status=status.HTTP_200_OK
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminProductDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {
                    "status": 404,
                    "message": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        product.is_active = False
        product.save()

        return Response(
            {
                "status": 200,
                "message": "Product deactivated successfully."
            },
            status=status.HTTP_200_OK
        )


class AdminCategoryCreateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": 201,
                    "message": "Category Created Successfully",
                    "category": serializer.data,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(
            {
                "status": 200,
                "message": "Categories fetched successfully",
                "categories": serializer.data,
            },
            status=status.HTTP_200_OK
        )


class AdminCategoryUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, category_id):
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return Response(
                {
                    "status": 404,
                    "message": "Category not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": 200,
                    "message": "Category updated successfully.",
                    "category": serializer.data,
                },
                status=status.HTTP_200_OK
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminCategoryDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, category_id):
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return Response(
                {
                    "status": 404,
                    "message": "Category not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        category.is_active = False
        category.save()

        return Response(
            {
                "status": 200,
                "message": "Category deactivated successfully."
            },
            status=status.HTTP_200_OK
        )


class AdminProductVariantCreateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"status": 404, "message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        name = request.data.get("name", "").strip()
        size = request.data.get("size", "").strip() or None
        color = request.data.get("color", "").strip() or None
        price_override = request.data.get("price_override")
        stock = int(request.data.get("stock", 10))

        if not name:
            name_parts = []
            if size: name_parts.append(f"Size: {size}")
            if color: name_parts.append(f"Color: {color}")
            name = " | ".join(name_parts) if name_parts else "Default Variant"

        variant = ProductVariant.objects.create(
            product=product,
            name=name,
            size=size,
            color=color,
            price_override=float(price_override) if price_override else None,
            stock=stock,
            is_active=True
        )

        serializer = ProductVariantSerializer(variant)
        return Response(
            {
                "status": 201,
                "message": "Product variant created successfully!",
                "variant": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class AdminProductVariantDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, variant_id):
        try:
            variant = ProductVariant.objects.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return Response(
                {"status": 404, "message": "Variant not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        variant.delete()
        return Response(
            {
                "status": 200,
                "message": "Product variant removed successfully."
            },
            status=status.HTTP_200_OK
        )
