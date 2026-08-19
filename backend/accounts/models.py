from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError

class RoleChoices(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER', 'Warehouse Manager'
    BRANCH_MANAGER = 'BRANCH_MANAGER', 'Branch Manager'

class Branch(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    is_warehouse = models.BooleanField(default=False, help_text="True if location acts as a central distribution hub")

    class Meta:
        db_table = 'core_branch'
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

    class Meta:
        db_table = 'core_user'

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
