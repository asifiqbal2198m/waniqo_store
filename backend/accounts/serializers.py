from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class CustomerRegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    password2 = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password2",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                "Passwords do not match"
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        return user

class CustomerLoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):

        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        attrs["user"] = user

        return attrs

class AdminRegisterSerializer(serializers.ModelSerializer):

    password=serializers.CharField(
        write_only=True,
        min_length=8,
        required=True
    )
    password2 = serializers.CharField(
        write_only=True
    )
    class Meta:
        model=User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "password2",
        ]        
    def validate(self,attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                "Passwords do not match"
            )
        return attrs
    
    def create(self,validated_data):
        validated_data.pop("password2")

        user = User.objects.create_superuser(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_staff=True,
        )

        return user        


class AdminLoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True,
        required=True
    )

    def validate(self, attrs):

        email = attrs["email"]
        password = attrs["password"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_superuser:
            raise serializers.ValidationError(
                "You are not authorized as an admin."
            )

        attrs["user"] = user

        return attrs