from django.urls import path

from .views import (
    CreateOrderView,
    OrderListView,
    OrderDetailView,
    AdminOrderListView,
    AdminOrderStatusUpdateView,
    CreateRazorpayOrderView,
    VerifyRazorpayPaymentView,
    CancelOrderView,
    RequestReturnView,
    AdminProcessReturnView
)


urlpatterns = [

    path(
        "create/",
        CreateOrderView.as_view(),
        name="create-order"
    ),

    path(
        "create-razorpay-order/",
        CreateRazorpayOrderView.as_view(),
        name="create-razorpay-order"
    ),

    path(
        "verify-razorpay-payment/",
        VerifyRazorpayPaymentView.as_view(),
        name="verify-razorpay-payment"
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
        "admin/<int:order_id>/process-return/",
        AdminProcessReturnView.as_view(),
        name="admin-process-return"
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

    path(
        "<int:order_id>/cancel/",
        CancelOrderView.as_view(),
        name="cancel-order"
    ),

    path(
        "<int:order_id>/return/",
        RequestReturnView.as_view(),
        name="request-return"
    ),

]