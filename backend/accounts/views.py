from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.cache import cache

from .models import User
from .serializers import UserSerializer

# Include your helper function if it lives in accounts or utils
def get_role_redirect_route(role):
    routes = {
        'SUPER_ADMIN': '/admin/dashboard',
        'WAREHOUSE_MANAGER': '/warehouse/dashboard',
        'BRANCH_MANAGER': '/branch/dashboard',
    }
    return routes.get(role, '/dashboard')

LOCKOUT_THRESHOLD = 5
LOCKOUT_TIME = 60

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
                {'error': 'Too many failed login attempts. Your account is temporarily locked for 1 minute.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            new_count = failed_attempts + 1
            cache.set(cache_key, new_count, LOCKOUT_TIME)
            remaining = LOCKOUT_THRESHOLD - new_count
            msg = f'Invalid credentials. {remaining} attempt(s) remaining.' if remaining > 0 else 'Account locked for 1 minute.'
            return Response({'error': msg}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'User account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        cache.delete(cache_key)
        login(request, user)
        serializer = UserSerializer(user)
        redirect_route = get_role_redirect_route(user.role)

        return Response({
            'message': 'Login successful',
            'user': serializer.data,
            'redirect_url': redirect_route
        }, status=status.HTTP_200_OK)