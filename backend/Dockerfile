FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Bind directly to port 8000
CMD ["gunicorn", "warehouse_project.wsgi:application", "--bind", "0.0.0.0:8000"]