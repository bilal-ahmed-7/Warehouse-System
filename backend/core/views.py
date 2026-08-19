from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.cache import cache

from accounts.models import User, RoleChoices, Branch
from inventory.models import Product
from core.serializers import UserSerializer, BranchSerializer, ProductSerializer

LOCKOUT_THRESHOLD = 3
LOCKOUT_TIME = 60  # 1 minute lockout in seconds

def get_role_redirect_route(role):
    if role == RoleChoices.SUPER_ADMIN:
        return '/admin-dashboard'
    elif role == RoleChoices.WAREHOUSE_MANAGER:
        return '/warehouse'
    elif role == RoleChoices.BRANCH_MANAGER:
        return '/branch'
    return '/'

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client_ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        cache_key = f"login_failed_{username.lower()}_{client_ip}"
        failed_attempts = cache.get(cache_key, 0)

        if failed_attempts >= LOCKOUT_THRESHOLD:
            return Response(
                {
                    'error': 'Too many failed login attempts. Your account is temporarily locked for 1 minute. Please wait before trying again.'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            new_count = failed_attempts + 1
            cache.set(cache_key, new_count, LOCKOUT_TIME)
            remaining = LOCKOUT_THRESHOLD - new_count
            if remaining > 0:
                msg = f'Invalid credentials. {remaining} attempt(s) remaining before 1-minute lockout.'
            else:
                msg = 'Too many failed login attempts. Your account is temporarily locked for 1 minute.'
            return Response({'error': msg}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'User account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        # Successful login: reset failed attempts counter
        cache.delete(cache_key)

        login(request, user)
        serializer = UserSerializer(user)
        redirect_route = get_role_redirect_route(user.role)

        return Response({
            'message': 'Login successful',
            'user': serializer.data,
            'redirect_url': redirect_route
        }, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)

class CurrentUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'authenticated': False}, status=status.HTTP_200_OK)

        serializer = UserSerializer(request.user)
        redirect_route = get_role_redirect_route(request.user.role)
        return Response({
            'authenticated': True,
            'user': serializer.data,
            'redirect_url': redirect_route
        }, status=status.HTTP_200_OK)

class CommonWarehouseListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        warehouses = Branch.objects.filter(is_warehouse=True)
        serializer = BranchSerializer(warehouses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CommonProductListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
