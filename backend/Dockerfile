# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (include CA certs for TLS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Ensure cert store is available
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Expose port 8000 (Cloud Run will set PORT env var at runtime)
EXPOSE 8000

# Run the application
CMD ["python", "-c", "import uvicorn; import os; from app.main import app; uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))"]
