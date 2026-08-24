from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('accounts.urls')),
    # Role-specific modular API endpoints
    path('api/admin/', include('admin_api.urls')),
    path('api/warehouse/', include('warehouse_api.urls')),
    path('api/branch/', include('branch_api.urls')),
]
