from django.contrib.auth import get_user_model
from .permissions import IsAdminUser

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    CustomerRegisterSerializer,
    CustomerLoginSerializer,
    AdminRegisterSerializer,
    AdminLoginSerializer,
)

# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()


class CustomerRegistrationView(APIView):

    def post(self, request):

        serializer = CustomerRegisterSerializer(
            data=request.data
        )

        if serializer.is_valid():

            user = serializer.save()

            return Response(
                {
                    "status": 201,
                    "message": "User created successfully",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class CustomerLoginView(APIView):

    def post(self, request):

        serializer = CustomerLoginSerializer(
            data=request.data
        )

        if serializer.is_valid():

            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "status": 200,
                    "message": "User logged in successfully",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class CustomerProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response(
            {
                "status": 200,
                "message": "User profile fetched successfully",
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                },
            },
            status=status.HTTP_200_OK
        )


class AdminRegistrationView(APIView):

    def post(self, request):

        # Check whether an admin already exists
        if User.objects.filter(is_superuser=True).exists():

            return Response(
                {
                    "message": "Admin account already exists."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AdminRegisterSerializer(
            data=request.data
        )

        if serializer.is_valid():

            user = serializer.save()

            return Response(
                {
                    "message": "Admin created successfully.",
                    "admin": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    }
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminLoginView(APIView):

    def post(self, request):

        serializer = AdminLoginSerializer(
            data=request.data
        )

        if serializer.is_valid():

            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "status": 200,
                    "message": "Admin logged in successfully.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "admin": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class AdminDashboardView(APIView):
    permission_classes=[IsAdminUser]
    def get(self,request):
        return Response(
            {
                "status":200,
                "message":"Admin dashboard fetched successfully",
                "admin":{
                    "id":request.user.id,
                    "username":request.user.username,
                    "email":request.user.email,
                },
            },
            status=status.HTTP_200_OK
        )