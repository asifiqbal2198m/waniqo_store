from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .models import Product,Category
from .serializers import ProductSerializer,CategorySerializer
from accounts.permissions import IsAdminUser


class ProductListView(APIView):

    def get(self, request):

        product_list = Product.objects.filter(
            is_active=True
        )

        serializer = ProductSerializer(
            product_list,
            many=True
        )

        return Response(
            {
                "status": 200,
                "message": "Products fetched successfully",
                "products": serializer.data,
            },
            status=status.HTTP_200_OK
        )
class ProductDetailView(APIView):
    def get(self,request,product_id):
        try:
            product=Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {
                    "status": 404,
                    "message": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )
        serializer=ProductSerializer(product)
        return Response(
            {
                "status": 200,
                "message": "Product fetched successfully",
                "product": serializer.data,
            },
            status=status.HTTP_200_OK
        )
class AdminProductCreateView(APIView):

    permission_classes = [IsAdminUser]

    def post(self, request):

        serializer = ProductSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

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

    def put(self, request, product_id):

        try:
            product = Product.objects.get(
                id=product_id
            )

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
            data=request.data
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
            product = Product.objects.get(
                id=product_id
            )

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
    permission_classes=[IsAdminUser]
    def post(self,request):
        serializer=CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status":201,
                    "message":"Category Created Successfully",
                    "category":serializer.data,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(

            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
class CategoryListView(APIView):
    def get(self,request):
        categories=Category.objects.filter(is_active=True)
        serializer=CategorySerializer(categories,many=True)
        return Response(
            {
                "status":200,
                "message":"Categories fetched successfully",
                "categories":serializer.data,
            },
            status=status.HTTP_200_OK
        )    
class AdminCategoryUpdateView(APIView):

    permission_classes = [IsAdminUser]

    def put(self, request, category_id):

        try:
            category = Category.objects.get(
                id=category_id
            )
        except Category.DoesNotExist:
            return Response(
                {
                    "status": 404,
                    "message": "Category not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CategorySerializer(
            category,
            data=request.data
        )

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

