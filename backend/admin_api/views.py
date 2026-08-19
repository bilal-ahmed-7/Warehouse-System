from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from accounts.models import Branch, User
from inventory.models import Product, Stock
from transfers.models import StockTransfer, StockLedger

from core.serializers import (
    BranchSerializer, UserSerializer, ProductSerializer,
    StockSerializer, StockTransferSerializer, StockLedgerSerializer
)
from core.permissions import IsSuperAdmin

class AdminBranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsSuperAdmin]

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('branch').all()
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]

class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsSuperAdmin]

class AdminStockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Stock.objects.select_related('branch', 'product').all()
    serializer_class = StockSerializer
    permission_classes = [IsSuperAdmin]

class AdminStockLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockLedger.objects.select_related('branch', 'product').all()
    serializer_class = StockLedgerSerializer
    permission_classes = [IsSuperAdmin]

class AdminTransferViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockTransfer.objects.select_related('from_branch', 'to_branch', 'created_by').prefetch_related('items__product').all()
    serializer_class = StockTransferSerializer
    permission_classes = [IsSuperAdmin]

class AdminDashboardStatsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        total_branches = Branch.objects.count()
        warehouses_count = Branch.objects.filter(is_warehouse=True).count()
        retail_branches_count = Branch.objects.filter(is_warehouse=False).count()
        total_products = Product.objects.count()
        total_stock_units = sum(s.quantity for s in Stock.objects.all())
        total_users = User.objects.count()
        pending_transfers = StockTransfer.objects.filter(status='PENDING').count()
        completed_transfers = StockTransfer.objects.filter(status='COMPLETED').count()
        recent_ledger_count = StockLedger.objects.count()

        return Response({
            'total_branches': total_branches,
            'warehouses_count': warehouses_count,
            'retail_branches_count': retail_branches_count,
            'total_products': total_products,
            'total_stock_units': total_stock_units,
            'total_users': total_users,
            'pending_transfers': pending_transfers,
            'completed_transfers': completed_transfers,
            'total_ledger_entries': recent_ledger_count,
        }, status=status.HTTP_200_OK)
