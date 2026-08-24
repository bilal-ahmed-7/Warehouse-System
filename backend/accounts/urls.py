from accounts.views import LoginView, LogoutView, CurrentUserView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
]