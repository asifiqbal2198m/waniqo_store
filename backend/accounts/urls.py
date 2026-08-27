
from django.urls import path
from .views import CustomerRegistrationView, CustomerLoginView, CustomerProfileView,AdminRegistrationView,AdminLoginView,AdminDashboardView
urlpatterns=[
    path('register/',CustomerRegistrationView.as_view(),name='register'),
    path('login/',CustomerLoginView.as_view(),name='login'),
    path('profile/',CustomerProfileView.as_view(),name='profile'),
    path('admin/register/',AdminRegistrationView.as_view(),name='adminregister'),   
    path('admin/login/',AdminLoginView.as_view(),name='adminlogin'),
    path('admin/dashboard/',AdminDashboardView.as_view(),name='admindashboard'),
]