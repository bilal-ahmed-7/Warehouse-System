from django.urls import path, include
from rest_framework.routers import DefaultRouter
from branch_api.views import (
    BranchStockViewSet, BranchTransferViewSet, BranchLedgerViewSet
)

router = DefaultRouter()
router.register(r'stock', BranchStockViewSet, basename='branch-stock')
router.register(r'transfers', BranchTransferViewSet, basename='branch-transfers')
router.register(r'ledger', BranchLedgerViewSet, basename='branch-ledger')

urlpatterns = [
    path('', include(router.urls)),
]
