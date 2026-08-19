from django.urls import path, include
from rest_framework.routers import DefaultRouter
from warehouse_api.views import (
    WarehouseStockViewSet, WarehouseTransferViewSet,
    WarehouseStockAdjustmentView, WarehouseLedgerViewSet
)

router = DefaultRouter()
router.register(r'stock', WarehouseStockViewSet, basename='warehouse-stock')
router.register(r'transfers', WarehouseTransferViewSet, basename='warehouse-transfers')
router.register(r'ledger', WarehouseLedgerViewSet, basename='warehouse-ledger')

urlpatterns = [
    path('adjust-stock/', WarehouseStockAdjustmentView.as_view(), name='warehouse-adjust-stock'),
    path('', include(router.urls)),
]
