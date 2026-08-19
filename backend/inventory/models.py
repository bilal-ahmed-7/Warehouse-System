from django.db import models
from django.db.models import Q, CheckConstraint
from accounts.models import Branch

class Product(models.Model):
    title = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'core_product'
        ordering = ['title']

    def __str__(self):
        return f"{self.title} (SKU: {self.sku})"

class Stock(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stocks')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stocks')
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'core_stock'
        unique_together = ('branch', 'product')
        constraints = [
            CheckConstraint(condition=Q(quantity__gte=0), name='non_negative_stock_quantity')
        ]
        ordering = ['branch', 'product']

    def __str__(self):
        return f"{self.product.title} at {self.branch.name}: {self.quantity} units"
