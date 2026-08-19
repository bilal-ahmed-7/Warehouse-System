from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import Branch, User, RoleChoices
from inventory.models import Product, Stock
from transfers.models import StockTransfer, StockTransferItem, StockLedger, TransferStatus

class MultiBranchInventoryTests(TestCase):
    def setUp(self):
        self.wh = Branch.objects.create(name='Central Warehouse', code='WH-01', is_warehouse=True)
        self.br_north = Branch.objects.create(name='North Branch', code='BR-01', is_warehouse=False)
        self.br_south = Branch.objects.create(name='South Branch', code='BR-02', is_warehouse=False)

        self.admin_user = User.objects.create_user(username='admin', password='pass', role=RoleChoices.SUPER_ADMIN)
        self.wh_user = User.objects.create_user(username='wh_mgr', password='pass', role=RoleChoices.WAREHOUSE_MANAGER, branch=self.wh)
        self.bm_north_user = User.objects.create_user(username='bm_north', password='pass', role=RoleChoices.BRANCH_MANAGER, branch=self.br_north)
        self.bm_south_user = User.objects.create_user(username='bm_south', password='pass', role=RoleChoices.BRANCH_MANAGER, branch=self.br_south)

        self.product = Product.objects.create(title='Gaming Laptop', sku='SKU-LAP-01', price=1500.00)
        self.wh_stock = Stock.objects.create(branch=self.wh, product=self.product, quantity=50)
        self.north_stock = Stock.objects.create(branch=self.br_north, product=self.product, quantity=10)

        self.client = APIClient()

    def test_branch_manager_data_scoping_and_cross_branch_prevention(self):
        self.client.force_authenticate(user=self.bm_north_user)

        response = self.client.get('/api/branch/stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['branch'], self.br_north.id)

        admin_resp = self.client.get('/api/admin/branches/')
        self.assertEqual(admin_resp.status_code, status.HTTP_403_FORBIDDEN)

        wh_resp = self.client.get('/api/warehouse/stock/')
        self.assertEqual(wh_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_stock_transfer_dispatch_atomic_deduction(self):
        transfer = StockTransfer.objects.create(
            from_branch=self.wh,
            to_branch=self.br_north,
            status=TransferStatus.PENDING,
            created_by=self.bm_north_user
        )
        item = StockTransferItem.objects.create(transfer=transfer, product=self.product, quantity=20)

        self.client.force_authenticate(user=self.wh_user)
        response = self.client.post(f'/api/warehouse/transfers/{transfer.id}/dispatch/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.wh_stock.refresh_from_db()
        self.assertEqual(self.wh_stock.quantity, 30)

        transfer.refresh_from_db()
        self.assertEqual(transfer.status, TransferStatus.DISPATCHED)

        ledger = StockLedger.objects.filter(branch=self.wh, product=self.product, quantity_change=-20).first()
        self.assertIsNotNone(ledger)
        self.assertIn('TRANSFER_DISPATCH', ledger.action)

    def test_stock_transfer_dispatch_insufficient_stock_rollback(self):
        transfer = StockTransfer.objects.create(
            from_branch=self.wh,
            to_branch=self.br_north,
            status=TransferStatus.PENDING,
            created_by=self.bm_north_user
        )
        StockTransferItem.objects.create(transfer=transfer, product=self.product, quantity=100)

        self.client.force_authenticate(user=self.wh_user)
        response = self.client.post(f'/api/warehouse/transfers/{transfer.id}/dispatch/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Insufficient stock', response.data['error'])

        self.wh_stock.refresh_from_db()
        self.assertEqual(self.wh_stock.quantity, 50)

    def test_stock_transfer_receipt_atomic_increment(self):
        transfer = StockTransfer.objects.create(
            from_branch=self.wh,
            to_branch=self.br_north,
            status=TransferStatus.DISPATCHED,
            created_by=self.bm_north_user
        )
        StockTransferItem.objects.create(transfer=transfer, product=self.product, quantity=15)

        self.client.force_authenticate(user=self.bm_north_user)
        response = self.client.post(f'/api/branch/transfers/{transfer.id}/receive/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.north_stock.refresh_from_db()
        self.assertEqual(self.north_stock.quantity, 25)

        transfer.refresh_from_db()
        self.assertEqual(transfer.status, TransferStatus.COMPLETED)

        ledger = StockLedger.objects.filter(branch=self.br_north, product=self.product, quantity_change=15).first()
        self.assertIsNotNone(ledger)
        self.assertIn('TRANSFER_RECEIVE', ledger.action)

    def test_ledger_immutability(self):
        ledger = StockLedger.objects.create(
            product=self.product,
            branch=self.wh,
            quantity_change=5,
            action='MANUAL_TEST'
        )
        
        with self.assertRaises(ValidationError):
            ledger.quantity_change = 10
            ledger.save()

        with self.assertRaises(ValidationError):
            ledger.delete()

    def test_login_rate_limiting_and_one_minute_lockout(self):
        """Rate limiting test: 3 failed login attempts lock out the user for 1 minute."""
        # Attempt 1: Failed login
        resp1 = self.client.post('/api/auth/login/', {'username': 'wh_mgr', 'password': 'wrongpassword'})
        self.assertEqual(resp1.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('2 attempt(s) remaining', resp1.data['error'])

        # Attempt 2: Failed login
        resp2 = self.client.post('/api/auth/login/', {'username': 'wh_mgr', 'password': 'wrongpassword'})
        self.assertEqual(resp2.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('1 attempt(s) remaining', resp2.data['error'])

        # Attempt 3: Failed login triggering lockout
        resp3 = self.client.post('/api/auth/login/', {'username': 'wh_mgr', 'password': 'wrongpassword'})
        self.assertEqual(resp3.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('temporarily locked for 1 minute', resp3.data['error'])

        # Attempt 4: Blocked by rate limiter (HTTP 429) even if correct password is given during lockout
        resp4 = self.client.post('/api/auth/login/', {'username': 'wh_mgr', 'password': 'pass'})
        self.assertEqual(resp4.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn('temporarily locked for 1 minute', resp4.data['error'])
