FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Run Gunicorn
CMD ["gunicorn", "warehouse_project.wsgi:application", "--bind", "0.0.0.0:8000"]