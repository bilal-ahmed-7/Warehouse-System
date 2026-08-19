from rest_framework.permissions import BasePermission
from accounts.models import RoleChoices

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == RoleChoices.SUPER_ADMIN or request.user.is_superuser)
        )

class IsWarehouseManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == RoleChoices.WAREHOUSE_MANAGER
        )

class IsBranchManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == RoleChoices.BRANCH_MANAGER
        )

class IsWarehouseOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in [RoleChoices.SUPER_ADMIN, RoleChoices.WAREHOUSE_MANAGER] or request.user.is_superuser)
        )

class IsBranchOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in [RoleChoices.SUPER_ADMIN, RoleChoices.BRANCH_MANAGER] or request.user.is_superuser)
        )
