from django.urls import path, include
from rest_framework.routers import DefaultRouter
from admin_api.views import (
    AdminBranchViewSet, AdminUserViewSet, AdminProductViewSet,
    AdminStockViewSet, AdminStockLedgerViewSet, AdminTransferViewSet,
    AdminDashboardStatsView
)

router = DefaultRouter()
router.register(r'branches', AdminBranchViewSet, basename='admin-branches')
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'products', AdminProductViewSet, basename='admin-products')
router.register(r'stock', AdminStockViewSet, basename='admin-stock')
router.register(r'ledger', AdminStockLedgerViewSet, basename='admin-ledger')
router.register(r'transfers', AdminTransferViewSet, basename='admin-transfers')

urlpatterns = [
    path('stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    path('', include(router.urls)),
]
