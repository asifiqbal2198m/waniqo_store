from django.urls import path

from .views import (
    AddToCartView,
    ViewCartView,
    UpdateCartItemView,
    DeleteCartItemView
)


urlpatterns = [

    path(
        "add/",
        AddToCartView.as_view(),
        name="add-to-cart"
    ),

    path(
        "",
        ViewCartView.as_view(),
        name="view-cart"
    ),

    path(
        "items/<int:item_id>/",
        UpdateCartItemView.as_view(),
        name="update-cart-item"
    ),

    path(
        "items/<int:item_id>/delete/",
        DeleteCartItemView.as_view(),
        name="delete-cart-item"
    ),

]