FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY backend/ backend/
COPY emergency_contacts.txt .

# Expose port (Railway sets $PORT)
EXPOSE 5001

# Start with gunicorn + gevent for WebSocket support
CMD python -c "from backend.db import init_tables; init_tables()" && \
    gunicorn --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker \
    --workers 1 --bind 0.0.0.0:${PORT:-5001} --timeout 120 backend.run:app
