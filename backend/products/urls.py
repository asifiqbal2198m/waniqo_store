from django.urls import path

from .views import (
    ProductListView,
    AdminProductCreateView,
    AdminProductUpdateView,
    AdminProductDeleteView,
    ProductDetailView,
    ProductReviewCreateView,
    WishlistToggleView,
    WishlistListView,
    AdminCategoryCreateView,
    CategoryListView,
    AdminCategoryUpdateView,
    AdminCategoryDeleteView,
    AdminProductVariantCreateView,
    AdminProductVariantDeleteView,
)

urlpatterns = [
    path("", ProductListView.as_view(), name="productlist"),
    path("wishlist/", WishlistListView.as_view(), name="wishlistlist"),
    path("<int:product_id>/", ProductDetailView.as_view(), name="productdetail"),
    path("<int:product_id>/reviews/create/", ProductReviewCreateView.as_view(), name="productreviewcreate"),
    path("<int:product_id>/wishlist/", WishlistToggleView.as_view(), name="wishlisttoggle"),

    path("admin/create/", AdminProductCreateView.as_view(), name="adminproductcreate"),
    path("admin/<int:product_id>/update/", AdminProductUpdateView.as_view(), name="adminproductupdate"),
    path("admin/<int:product_id>/delete/", AdminProductDeleteView.as_view(), name="adminproductdelete"),

    # Variant Endpoints
    path("admin/<int:product_id>/variants/create/", AdminProductVariantCreateView.as_view(), name="adminvariantcreate"),
    path("admin/variants/<int:variant_id>/delete/", AdminProductVariantDeleteView.as_view(), name="adminvariantdelete"),

    # Category endpoints (support both plural 'categories' and singular 'category')
    path("categories/", CategoryListView.as_view(), name='categorylist'),
    path("admin/categories/create/", AdminCategoryCreateView.as_view(), name='admincategorycreate'),
    path("admin/category/create/", AdminCategoryCreateView.as_view(), name='admincategorycreate_alias'),
    path("admin/categories/<int:category_id>/update/", AdminCategoryUpdateView.as_view(), name="admin-category-update"),
    path("admin/category/<int:category_id>/update/", AdminCategoryUpdateView.as_view(), name="admin-category-update_alias"),
    path("admin/categories/<int:category_id>/delete/", AdminCategoryDeleteView.as_view(), name="admin-category-delete"),
    path("admin/category/<int:category_id>/delete/", AdminCategoryDeleteView.as_view(), name="admin-category-delete_alias"),
]
