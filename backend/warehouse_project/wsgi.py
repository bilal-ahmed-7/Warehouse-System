import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'warehouse_project.settings')

application = get_wsgi_application()

# Entry point for Vercel Python Serverless Functions
app = application
