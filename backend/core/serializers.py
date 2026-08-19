from rest_framework import serializers
from accounts.models import Branch, User, RoleChoices
from inventory.models import Product, Stock
from transfers.models import StockTransfer, StockTransferItem, StockLedger, TransferStatus

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'code', 'is_warehouse']

class UserSerializer(serializers.ModelSerializer):
    branch_detail = BranchSerializer(source='branch', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'branch', 'branch_detail', 'is_active']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'title', 'sku', 'price']

class StockSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    branch_detail = BranchSerializer(source='branch', read_only=True)

    class Meta:
        model = Stock
        fields = ['id', 'branch', 'branch_detail', 'product', 'product_detail', 'quantity']

class StockTransferItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = StockTransferItem
        fields = ['id', 'product', 'product_detail', 'quantity']

class StockTransferSerializer(serializers.ModelSerializer):
    from_branch_detail = BranchSerializer(source='from_branch', read_only=True)
    to_branch_detail = BranchSerializer(source='to_branch', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    items = StockTransferItemSerializer(many=True, read_only=True)

    class Meta:
        model = StockTransfer
        fields = [
            'id', 'from_branch', 'from_branch_detail', 'to_branch', 'to_branch_detail',
            'status', 'created_by', 'created_by_username', 'created_at', 'items'
        ]

class StockLedgerSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    branch_detail = BranchSerializer(source='branch', read_only=True)

    class Meta:
        model = StockLedger
        fields = ['id', 'product', 'product_detail', 'branch', 'branch_detail', 'quantity_change', 'action', 'timestamp']
