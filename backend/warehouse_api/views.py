from django.db import transaction
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Branch
from inventory.models import Stock
from transfers.models import StockTransfer, StockTransferItem, StockLedger, TransferStatus

from core.serializers import (
    StockSerializer, StockTransferSerializer, StockLedgerSerializer
)
from core.permissions import IsWarehouseManager

class WarehouseStockViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockSerializer
    permission_classes = [IsWarehouseManager]

    def get_queryset(self):
        user_branch = self.request.user.branch
        if not user_branch or not user_branch.is_warehouse:
            return Stock.objects.none()
        return Stock.objects.filter(branch=user_branch).select_related('product', 'branch')

class WarehouseTransferViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockTransferSerializer
    permission_classes = [IsWarehouseManager]

    def get_queryset(self):
        user_branch = self.request.user.branch
        if not user_branch or not user_branch.is_warehouse:
            return StockTransfer.objects.none()
        return StockTransfer.objects.filter(from_branch=user_branch).select_related(
            'from_branch', 'to_branch', 'created_by'
        ).prefetch_related('items__product')

    @action(detail=True, methods=['post'], url_path='dispatch')
    def dispatch_transfer(self, request, pk=None):
        user_branch = request.user.branch
        if not user_branch or not user_branch.is_warehouse:
            return Response(
                {'error': 'User is not assigned to a valid central warehouse.'},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():
            try:
                transfer = StockTransfer.objects.select_for_update().get(pk=pk, from_branch=user_branch)
            except StockTransfer.DoesNotExist:
                return Response({'error': 'Transfer request not found.'}, status=status.HTTP_404_NOT_FOUND)

            if transfer.status != TransferStatus.PENDING:
                return Response(
                    {'error': f'Cannot dispatch transfer in status {transfer.status}. Only PENDING transfers can be dispatched.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            line_items = transfer.items.select_related('product').all()
            if not line_items.exists():
                return Response({'error': 'Transfer has no items.'}, status=status.HTTP_400_BAD_REQUEST)

            stock_updates = []
            for item in line_items:
                try:
                    stock_rec = Stock.objects.select_for_update().get(branch=user_branch, product=item.product)
                except Stock.DoesNotExist:
                    return Response(
                        {'error': f'Stock record for product "{item.product.title}" (SKU: {item.product.sku}) does not exist in warehouse.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if stock_rec.quantity < item.quantity:
                    return Response(
                        {
                            'error': f'Insufficient stock for product "{item.product.title}". Requested: {item.quantity}, Available: {stock_rec.quantity}.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                stock_updates.append((stock_rec, item.quantity, item.product))

            for stock_rec, qty, product in stock_updates:
                stock_rec.quantity -= qty
                stock_rec.save()

                StockLedger.objects.create(
                    product=product,
                    branch=user_branch,
                    quantity_change=-qty,
                    action=f'TRANSFER_DISPATCH (Transfer #{transfer.id} to {transfer.to_branch.code})'
                )

            transfer.status = TransferStatus.DISPATCHED
            transfer.save()

            serializer = StockTransferSerializer(transfer)
            return Response({
                'message': f'Transfer #{transfer.id} dispatched successfully.',
                'transfer': serializer.data
            }, status=status.HTTP_200_OK)

class WarehouseStockAdjustmentView(APIView):
    permission_classes = [IsWarehouseManager]

    def post(self, request):
        user_branch = request.user.branch
        if not user_branch or not user_branch.is_warehouse:
            return Response(
                {'error': 'User is not assigned to a valid warehouse.'},
                status=status.HTTP_403_FORBIDDEN
            )

        product_id = request.data.get('product_id')
        new_quantity = request.data.get('new_quantity')
        reason = request.data.get('reason', 'MANUAL_ADJUSTMENT')

        if product_id is None or new_quantity is None:
            return Response(
                {'error': 'product_id and new_quantity are required fields.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_qty_int = int(new_quantity)
            if new_qty_int < 0:
                return Response({'error': 'Stock quantity cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'new_quantity must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            stock_rec, created = Stock.objects.select_for_update().get_or_create(
                branch=user_branch,
                product_id=product_id,
                defaults={'quantity': 0}
            )

            old_quantity = stock_rec.quantity
            quantity_change = new_qty_int - old_quantity

            if quantity_change == 0:
                return Response({'message': 'No change in stock quantity.'}, status=status.HTTP_200_OK)

            stock_rec.quantity = new_qty_int
            stock_rec.save()

            StockLedger.objects.create(
                product=stock_rec.product,
                branch=user_branch,
                quantity_change=quantity_change,
                action=f'MANUAL_ADJUSTMENT: {reason}'
            )

            serializer = StockSerializer(stock_rec)
            return Response({
                'message': 'Warehouse stock updated successfully.',
                'stock': serializer.data,
                'change': quantity_change
            }, status=status.HTTP_200_OK)

class WarehouseLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockLedgerSerializer
    permission_classes = [IsWarehouseManager]

    def get_queryset(self):
        user_branch = self.request.user.branch
        if not user_branch or not user_branch.is_warehouse:
            return StockLedger.objects.none()
        return StockLedger.objects.filter(branch=user_branch).select_related('product', 'branch')
