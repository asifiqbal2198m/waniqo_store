from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import JsonResponse

def home_view(request):
    return JsonResponse({
        "status": "online",
        "message": "Waniqo Store Backend API is running successfully! 🚀",
        "endpoints": {
            "products": "/api/products/",
            "accounts": "/api/accounts/",
            "cart": "/api/cart/",
            "orders": "/api/orders/",
            "admin": "/admin/"
        }
    })

urlpatterns = [
    path('', home_view, name='backend_root'),
    path('admin/', admin.site.urls),
    path('api/accounts/', include("accounts.urls")),
    path('api/products/', include("products.urls")),
    path("api/cart/", include("cart.urls")),
    path("api/orders/", include("orders.urls")),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

