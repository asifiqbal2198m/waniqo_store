from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomerRegistrationView,
    CustomerLoginView,
    CustomerProfileView,
    ChangePasswordView,
    AdminRegistrationView,
    AdminLoginView,
    AdminDashboardView,
    AdminUserListView,
)

urlpatterns = [
    path('register/', CustomerRegistrationView.as_view(), name='register'),
    path('login/', CustomerLoginView.as_view(), name='login'),
    path('profile/', CustomerProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/register/', AdminRegistrationView.as_view(), name='adminregister'),   
    path('admin/login/', AdminLoginView.as_view(), name='adminlogin'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admindashboard'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
]