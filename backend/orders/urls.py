from django.urls import path

from .views import (
    CreateOrderView,
    OrderListView,
    OrderDetailView,
    AdminOrderListView,
    AdminOrderStatusUpdateView
)


urlpatterns = [

    path(
        "create/",
        CreateOrderView.as_view(),
        name="create-order"
    ),

    path(
        "admin/",
        AdminOrderListView.as_view(),
        name="admin-order-list"
    ),

    path(
        "admin/<int:order_id>/status/",
        AdminOrderStatusUpdateView.as_view(),
        name="admin-order-status-update"
    ),

    path(
        "",
        OrderListView.as_view(),
        name="order-list"
    ),

    path(
        "<int:order_id>/",
        OrderDetailView.as_view(),
        name="order-detail"
    ),

]