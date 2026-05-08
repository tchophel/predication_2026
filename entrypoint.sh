#!/bin/bash

cd /code
export PYTHONPATH=/code

# Use DB_HOST env var (set to 'db' in Docker Compose, or full K8s name in Kubernetes)
POSTGRES_HOST="${DB_HOST:-db}"
REDIS_HOST="${REDIS_HOST:-redis}"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:5432..."
while ! nc -z "$POSTGRES_HOST" 5432; do
  sleep 0.1
done
echo "PostgreSQL is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis at ${REDIS_HOST}:6379..."
while ! nc -z "$REDIS_HOST" 6379; do
  sleep 0.1
done
echo "Redis is ready!"

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

# Load master data (creates admin user with correct permissions)
echo "Loading master data..."
python manage.py load_master_data

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the Django development server
echo "Starting Django server..."
exec python manage.py runserver 0.0.0.0:8000
