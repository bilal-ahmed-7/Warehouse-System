# Change this:
# from core.views import LoginView

# To this:
from accounts.views import LoginView

urlpatterns = [
    # ...
    path('api/login/', LoginView.as_view(), name='login'),
]