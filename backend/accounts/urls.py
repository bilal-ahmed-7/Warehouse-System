from accounts.views import LoginView, LogoutView, CurrentUserView, include
from django.urls import path
urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
]