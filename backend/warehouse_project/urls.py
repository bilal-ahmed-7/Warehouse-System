from django.contrib import admin
from django.urls import path, include
from core.views import LoginView, LogoutView, CurrentUserView, CommonWarehouseListView, CommonProductListView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Shared authentication & session endpoints
    path('api/auth/login/', LoginView.as_view(), name='auth-login'),
    path('api/auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('api/auth/me/', CurrentUserView.as_view(), name='auth-me'),

    # Shared common dropdown lookup endpoints
    path('api/common/warehouses/', CommonWarehouseListView.as_view(), name='common-warehouses'),
    path('api/common/products/', CommonProductListView.as_view(), name='common-products'),

    # Role-specific modular API endpoints
    path('api/admin/', include('admin_api.urls')),
    path('api/warehouse/', include('warehouse_api.urls')),
    path('api/branch/', include('branch_api.urls')),
]
