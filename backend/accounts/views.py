from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    CustomerRegisterSerializer,
    CustomerLoginSerializer,
    AdminRegisterSerializer,
    AdminLoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)
from .permissions import IsAdminUser

User = get_user_model()


class CustomerRegistrationView(APIView):

    def post(self, request):
        serializer = CustomerRegisterSerializer(
            data=request.data
        )

        if serializer.is_valid():
            try:
                user = serializer.save()
                return Response(
                    {
                        "message": "User registered successfully.",
                        "user": {
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                        }
                    },
                    status=status.HTTP_201_CREATED
                )
            except Exception as err:
                return Response(
                    {"detail": f"Registration error: {str(err)}"},
                    status=status.HTTP_400_BAD_REQUEST
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
                    "message": "Login successful.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "is_admin": bool(user.is_superuser or user.is_staff),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "is_admin": bool(user.is_superuser or user.is_staff),
                    }
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
        serializer = UserProfileSerializer(request.user)
        return Response(
            {
                "status": 200,
                "message": "Profile fetched successfully",
                "profile": serializer.data,
            },
            status=status.HTTP_200_OK
        )

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": 200,
                    "message": "Profile updated successfully!",
                    "profile": serializer.data,
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):

    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data["old_password"]):
                return Response(
                    {"old_password": ["Incorrect current password."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            return Response(
                {"status": 200, "message": "Password changed successfully!"},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminRegistrationView(APIView):

    def post(self, request):

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
                        "is_admin": True,
                    },
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(
            {
                "status": 200,
                "message": "Admin dashboard fetched successfully",
                "admin": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                },
            },
            status=status.HTTP_200_OK
        )


class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('-id')
        data = [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_superuser": u.is_superuser,
                "is_active": u.is_active,
                "date_joined": u.date_joined,
            }
            for u in users
        ]
        return Response({"status": 200, "users": data}, status=status.HTTP_200_OK)