from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Custom SessionAuthentication that skips CSRF validation for REST API calls.
    Ideal for React / Single Page Application frontends communicating via API endpoints.
    """
    def enforce_csrf(self, request):
        return  # Do not enforce CSRF check
