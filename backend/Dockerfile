FROM python:3.12-slim

WORKDIR /app

# Copy requirements from the backend folder into container
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files into container
COPY backend/ .

# Start Gunicorn
CMD ["gunicorn", "warehouse_project.wsgi:application", "--bind", "0.0.0.0:8000"]