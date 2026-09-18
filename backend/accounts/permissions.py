from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user.is_staff)
        )

class IsCustomerUser(BasePermission):
    message = "Administrators are restricted from placing orders or modifying shopping carts. Please use a customer account."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            not (request.user.is_superuser or request.user.is_staff)
        )
