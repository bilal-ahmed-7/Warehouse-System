from django.db import models
from django.core.exceptions import ValidationError
from accounts.models import Branch, User
from inventory.models import Product

class TransferStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    DISPATCHED = 'DISPATCHED', 'Dispatched'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class StockTransfer(models.Model):
    from_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='outgoing_transfers')
    to_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='incoming_transfers')
    status = models.CharField(
        max_length=20,
        choices=TransferStatus.choices,
        default=TransferStatus.PENDING
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_transfers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_stocktransfer'
        ordering = ['-created_at']

    def __str__(self):
        return f"Transfer #{self.id}: {self.from_branch.code} -> {self.to_branch.code} [{self.status}]"

class StockTransferItem(models.Model):
    transfer = models.ForeignKey(StockTransfer, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    class Meta:
        db_table = 'core_stocktransferitem'
        ordering = ['product']

    def __str__(self):
        return f"{self.quantity} x {self.product.title} in Transfer #{self.transfer_id}"

class StockLedger(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ledger_entries')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='ledger_entries')
    quantity_change = models.IntegerField(help_text="Signed integer: positive for additions, negative for deductions")
    action = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_stockledger'
        ordering = ['-timestamp']

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValidationError("StockLedger records are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("StockLedger records are immutable and cannot be deleted.")

    def __str__(self):
        sign = "+" if self.quantity_change > 0 else ""
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.branch.code} - {self.product.sku}: {sign}{self.quantity_change} ({self.action})"
