# Use official lightweight Python image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Run the app using uvicorn on the port assigned by Cloud Run (defaults to 8080)
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
