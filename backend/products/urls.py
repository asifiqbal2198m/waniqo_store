
from django.urls import path

from .views import (
    ProductListView,
    AdminProductCreateView,
    AdminProductUpdateView,
    AdminProductDeleteView,
    ProductDetailView,AdminCategoryCreateView,
)


urlpatterns = [
    path(
        "",
        ProductListView.as_view(),
        name="productlist",
    ),
    path("<int:product_id>/",ProductDetailView.as_view(),name="productdetail"),
    path(
        "admin/create/",
        AdminProductCreateView.as_view(),
        name="adminproductcreate",
    ),

    path(
        "admin/<int:product_id>/update/",
        AdminProductUpdateView.as_view(),
        name="adminproductupdate",
    ),

    path(
        "admin/<int:product_id>/delete/",
        AdminProductDeleteView.as_view(),
        name="adminproductdelete",
    ),
    path("admin/categories/create/",AdminCategoryCreateView.as_view(),name='admincategorycreate')
    
]