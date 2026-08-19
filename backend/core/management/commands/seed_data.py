from django.core.management.base import BaseCommand
from accounts.models import Branch, User, RoleChoices
from inventory.models import Product, Stock
from transfers.models import StockTransfer, StockTransferItem, StockLedger, TransferStatus

class Command(BaseCommand):
    help = 'Seeds initial multi-branch inventory data, users, stock, and sample transfer workflows.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # 1. Create Branches
        wh, _ = Branch.objects.get_or_create(
            code='WH-01',
            defaults={'name': 'Central Distribution Hub', 'is_warehouse': True}
        )
        br_downtown, _ = Branch.objects.get_or_create(
            code='BR-01',
            defaults={'name': 'Downtown Retail Store', 'is_warehouse': False}
        )
        br_westside, _ = Branch.objects.get_or_create(
            code='BR-02',
            defaults={'name': 'Westside Retail Store', 'is_warehouse': False}
        )

        # 2. Create Users
        superadmin, created = User.objects.get_or_create(
            username='superadmin',
            defaults={
                'email': 'admin@warehouse.com',
                'first_name': 'Sarah',
                'last_name': 'Conner',
                'role': RoleChoices.SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            superadmin.set_password('admin123')
            superadmin.save()

        wh_mgr, created = User.objects.get_or_create(
            username='wh_manager',
            defaults={
                'email': 'warehouse@warehouse.com',
                'first_name': 'Marcus',
                'last_name': 'Vance',
                'role': RoleChoices.WAREHOUSE_MANAGER,
                'branch': wh
            }
        )
        if created:
            wh_mgr.set_password('pass123')
            wh_mgr.save()

        bm_downtown, created = User.objects.get_or_create(
            username='bm_downtown',
            defaults={
                'email': 'downtown@warehouse.com',
                'first_name': 'Elena',
                'last_name': 'Rostova',
                'role': RoleChoices.BRANCH_MANAGER,
                'branch': br_downtown
            }
        )
        if created:
            bm_downtown.set_password('pass123')
            bm_downtown.save()

        bm_westside, created = User.objects.get_or_create(
            username='bm_westside',
            defaults={
                'email': 'westside@warehouse.com',
                'first_name': 'Liam',
                'last_name': 'Nakamura',
                'role': RoleChoices.BRANCH_MANAGER,
                'branch': br_westside
            }
        )
        if created:
            bm_westside.set_password('pass123')
            bm_westside.save()

        # 3. Create Products
        products_data = [
            {'title': 'Laptop Pro 15"', 'sku': 'TECH-LAP-001', 'price': 1299.99},
            {'title': 'Ergonomic Desk Chair', 'sku': 'FURN-CHR-002', 'price': 349.50},
            {'title': 'UltraWide Monitor 34"', 'sku': 'TECH-MON-003', 'price': 699.00},
            {'title': 'Wireless Mechanical Keyboard', 'sku': 'TECH-KBD-004', 'price': 119.99},
            {'title': 'Motorized Standing Desk', 'sku': 'FURN-DSK-005', 'price': 550.00},
        ]
        products = []
        for pdata in products_data:
            p, _ = Product.objects.get_or_create(sku=pdata['sku'], defaults=pdata)
            products.append(p)

        # 4. Create Initial Stock & Audit Logs
        stock_configs = [
            (wh, products[0], 120),
            (wh, products[1], 80),
            (wh, products[2], 50),
            (wh, products[3], 200),
            (wh, products[4], 40),

            (br_downtown, products[0], 15),
            (br_downtown, products[1], 10),
            (br_downtown, products[2], 5),
            (br_downtown, products[3], 25),

            (br_westside, products[0], 8),
            (br_westside, products[1], 12),
            (br_westside, products[3], 30),
            (br_westside, products[4], 6),
        ]

        for branch, prod, qty in stock_configs:
            stock, created = Stock.objects.get_or_create(branch=branch, product=prod, defaults={'quantity': qty})
            if created:
                StockLedger.objects.create(
                    product=prod,
                    branch=branch,
                    quantity_change=qty,
                    action='INITIAL_STOCK_SEED'
                )

        # 5. Create Sample Transfer Workflows
        if not StockTransfer.objects.filter(to_branch=br_downtown, status=TransferStatus.PENDING).exists():
            t1 = StockTransfer.objects.create(
                from_branch=wh,
                to_branch=br_downtown,
                status=TransferStatus.PENDING,
                created_by=bm_downtown
            )
            StockTransferItem.objects.create(transfer=t1, product=products[0], quantity=5)
            StockTransferItem.objects.create(transfer=t1, product=products[2], quantity=3)

        if not StockTransfer.objects.filter(to_branch=br_westside, status=TransferStatus.DISPATCHED).exists():
            t2 = StockTransfer.objects.create(
                from_branch=wh,
                to_branch=br_westside,
                status=TransferStatus.DISPATCHED,
                created_by=bm_westside
            )
            StockTransferItem.objects.create(transfer=t2, product=products[1], quantity=4)
            StockTransferItem.objects.create(transfer=t2, product=products[3], quantity=10)
            StockLedger.objects.create(
                product=products[1],
                branch=wh,
                quantity_change=-4,
                action=f'TRANSFER_DISPATCH (Transfer #{t2.id} to {br_westside.code})'
            )
            StockLedger.objects.create(
                product=products[3],
                branch=wh,
                quantity_change=-10,
                action=f'TRANSFER_DISPATCH (Transfer #{t2.id} to {br_westside.code})'
            )

        self.stdout.write(self.style.SUCCESS("Database successfully seeded!"))
