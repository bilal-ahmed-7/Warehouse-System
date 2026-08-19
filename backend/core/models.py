from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db.models import Q, CheckConstraint

class RoleChoices(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER', 'Warehouse Manager'
    BRANCH_MANAGER = 'BRANCH_MANAGER', 'Branch Manager'

class Branch(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    is_warehouse = models.BooleanField(default=False, help_text="True if location acts as a central distribution hub")

    class Meta:
        verbose_name_plural = "Branches"
        ordering = ['name']

    def __str__(self):
        type_str = "Warehouse" if self.is_warehouse else "Branch"
        return f"{self.name} ({self.code}) - {type_str}"

class User(AbstractUser):
    role = models.CharField(
        max_length=30,
        choices=RoleChoices.choices,
        default=RoleChoices.BRANCH_MANAGER
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        help_text="Assigned location. Nullable for Super Admins."
    )

    def clean(self):
        super().clean()
        if self.role == RoleChoices.WAREHOUSE_MANAGER and self.branch:
            if not self.branch.is_warehouse:
                raise ValidationError({"branch": "Warehouse Manager must be assigned to a warehouse location."})
        elif self.role == RoleChoices.BRANCH_MANAGER and self.branch:
            if self.branch.is_warehouse:
                raise ValidationError({"branch": "Branch Manager must be assigned to a retail branch (non-warehouse)."})

    def save(self, *args, **kwargs):
        self.full_clean(exclude=['password'])
        super().save(*args, **kwargs)

    def __str__(self):
        branch_name = self.branch.name if self.branch else "Global"
        return f"{self.username} [{self.get_role_display()}] @ {branch_name}"

class Product(models.Model):
    title = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} (SKU: {self.sku})"

class Stock(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stocks')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stocks')
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('branch', 'product')
        constraints = [
            CheckConstraint(condition=Q(quantity__gte=0), name='non_negative_stock_quantity')
        ]
        ordering = ['branch', 'product']

    def __str__(self):
        return f"{self.product.title} at {self.branch.name}: {self.quantity} units"

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
        ordering = ['-created_at']

    def __str__(self):
        return f"Transfer #{self.id}: {self.from_branch.code} -> {self.to_branch.code} [{self.status}]"

class StockTransferItem(models.Model):
    transfer = models.ForeignKey(StockTransfer, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    class Meta:
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
        ordering = ['-timestamp']

    def save(self, *args, **kwargs):
        # Ledger entries are append-only. Mutation of existing records is forbidden.
        if self.pk is not None:
            raise ValidationError("StockLedger records are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("StockLedger records are immutable and cannot be deleted.")

    def __str__(self):
        sign = "+" if self.quantity_change > 0 else ""
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.branch.code} - {self.product.sku}: {sign}{self.quantity_change} ({self.action})"
