from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class CustomerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        email = attrs.get("email", "").strip()
        username = attrs.get("username", "").strip()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "An account with this email address already exists. Please sign in instead."})

        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError({"username": "This username is already taken. Please choose another username."})

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(
            username=validated_data["username"].strip(),
            email=validated_data["email"].strip().lower(),
            password=validated_data["password"],
        )


class CustomerLoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        login_input = attrs.get("email", "").strip()
        password = attrs.get("password")

        try:
            if "@" in login_input:
                user = User.objects.get(email__iexact=login_input)
            else:
                user = User.objects.get(username__iexact=login_input)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email/username or password.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email/username or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")

        if user.is_superuser or user.is_staff:
            raise serializers.ValidationError(
                "Administrator accounts cannot log in through Customer Login. Please use the Admin Portal."
            )

        attrs["user"] = user
        return attrs


class AdminRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError("Passwords do not match")
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_superuser(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_staff=True,
        )


class AdminLoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        login_input = attrs.get("email", "").strip()
        password = attrs.get("password")

        try:
            if "@" in login_input:
                user = User.objects.get(email__iexact=login_input)
            else:
                user = User.objects.get(username__iexact=login_input)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid admin username/email or password.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid admin username/email or password.")

        if not (user.is_superuser or user.is_staff):
            raise serializers.ValidationError("You are not authorized as an administrator.")

        attrs["user"] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone_number",
            "shipping_address",
            "city",
            "pincode",
            "is_admin",
        ]
        read_only_fields = ["id", "username", "email", "is_admin"]

    def get_is_admin(self, obj):
        return bool(obj.is_superuser or obj.is_staff)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("New passwords do not match.")
        return attrs