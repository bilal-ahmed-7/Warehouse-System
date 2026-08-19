from django.db import transaction
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import Branch
from inventory.models import Product, Stock
from transfers.models import StockTransfer, StockTransferItem, StockLedger, TransferStatus

from core.serializers import (
    StockSerializer, StockTransferSerializer, StockLedgerSerializer
)
from core.permissions import IsBranchManager

class BranchStockViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockSerializer
    permission_classes = [IsBranchManager]

    def get_queryset(self):
        user_branch = self.request.user.branch
        if not user_branch or user_branch.is_warehouse:
            return Stock.objects.none()
        return Stock.objects.filter(branch=user_branch).select_related('product', 'branch')

class BranchTransferViewSet(viewsets.ModelViewSet):
    serializer_class = StockTransferSerializer
    permission_classes = [IsBranchManager]

    def get_queryset(self):
        user_branch = self.request.user.branch
        if not user_branch or user_branch.is_warehouse:
            return StockTransfer.objects.none()
        return StockTransfer.objects.filter(to_branch=user_branch).select_related(
            'from_branch', 'to_branch', 'created_by'
        ).prefetch_related('items__product')

    def create(self, request, *args, **kwargs):
        user_branch = request.user.branch
        if not user_branch or user_branch.is_warehouse:
            return Response(
                {'error': 'Only Branch Managers assigned to a retail branch can initiate transfer requests.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from_branch_id = request.data.get('from_branch')
        items_data = request.data.get('items', [])

        if not from_branch_id:
            return Response({'error': 'from_branch (warehouse) is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not items_data or len(items_data) == 0:
            return Response({'error': 'At least one line item is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from_branch = Branch.objects.get(pk=from_branch_id)
            if not from_branch.is_warehouse:
                return Response(
                    {'error': 'from_branch must be a central distribution warehouse.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Branch.DoesNotExist:
            return Response({'error': 'Specified warehouse does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            transfer = StockTransfer.objects.create(
                from_branch=from_branch,
                to_branch=user_branch,
                status=TransferStatus.PENDING,
                created_by=request.user
            )

            for item in items_data:
                product_id = item.get('product')
                qty = item.get('quantity')
                if not product_id or not qty or int(qty) <= 0:
                    transaction.set_rollback(True)
                    return Response(
                        {'error': 'Invalid item data. Each item must have valid product and quantity > 0.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    product = Product.objects.get(pk=product_id)
                except Product.DoesNotExist:
                    transaction.set_rollback(True)
                    return Response({'error': f'Product with id {product_id} not found.'}, status=status.HTTP_400_BAD_REQUEST)

                StockTransferItem.objects.create(
                    transfer=transfer,
                    product=product,
                    quantity=int(qty)
                )

        serializer = StockTransferSerializer(transfer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='receive')
    def receive_transfer(self, request, pk=None):
        user_branch = request.user.branch
        if not user_branch or user_branch.is_warehouse:
            return Response(
                {'error': 'User is not assigned to a valid retail branch.'},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():
            try:
                transfer = StockTransfer.objects.select_for_update().get(pk=pk, to_branch=user_branch)
            except StockTransfer.DoesNotExist:
                return Response({'error': 'Transfer request not found.'}, status=status.HTTP_404_NOT_FOUND)

            if transfer.status != TransferStatus.DISPATCHED:
                return Response(
                    {'error': f'Cannot receive transfer in status {transfer.status}. Only DISPATCHED transfers can be received.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            line_items = transfer.items.select_related('product').all()
            for item in line_items:
                stock_rec, created = Stock.objects.select_for_update().get_or_create(
                    branch=user_branch,
                    product=item.product,
                    defaults={'quantity': 0}
                )

                stock_rec.quantity += item.quantity
                stock_rec.save()

                StockLedger.objects.create(
                    product=item.product,
                    branch=user_branch,
                    quantity_change=item.quantity,
                    action=f'TRANSFER_RECEIVE (Transfer #{transfer.id} from {transfer.from_branch.code})'
                )

            transfer.status = TransferStatus.COMPLETED
            transfer.save()

            serializer = StockTransferSerializer(transfer)
            return Response({
                'message': f'Transfer #{transfer.id} received and added to local stock.',
                'transfer': serializer.data
            }, status=status.HTTP_200_OK)

class BranchLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockLedgerSerializer
    permission_classes = [IsBranchManager]

    def get_queryset(self):
        user_branch = self.request.user.branch
        if not user_branch or user_branch.is_warehouse:
            return StockLedger.objects.none()
        return StockLedger.objects.filter(branch=user_branch).select_related('product', 'branch')
