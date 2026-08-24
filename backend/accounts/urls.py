from django.urls import path

from accounts.views import (
    LoginView,
    LogoutView,
    CurrentUserView,
    CommonWarehouseListView,
    CommonProductListView,
)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('common/warehouses/', CommonWarehouseListView.as_view(), name='common-warehouses'),
    path('common/products/', CommonProductListView.as_view(), name='common-products'),
]