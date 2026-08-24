# Change this:
# from core.views import LoginView

# To this:
from sys import path

from accounts.views import LoginView,include

urlpatterns = [
    # ...
    path('api/login/', LoginView.as_view(), name='login'),
]