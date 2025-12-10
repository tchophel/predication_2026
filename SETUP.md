# Quick Setup Guide

This guide will help you get the Match Prediction System running quickly.

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Redis 6+
- Git

## 1. Clone and Setup

```bash
git clone <repository-url>
cd prediction
```

## 2. Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

## 4. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=prediction_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
```

## 5. Database Setup

```bash
# Create PostgreSQL database
createdb prediction_db

# Run migrations
python manage.py makemigrations
python manage.py migrate
```

## 6. Create Admin User

```bash
python manage.py create_admin --username admin --email admin@example.com
```

## 7. Import Sample Data (Optional)

```bash
# Import sample matches
python manage.py import_matches sample_data/matches.csv
```

## 8. Start Services

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Celery
celery -A prediction worker --loglevel=info

# Terminal 3: Start Django
python manage.py runserver
```

## 9. Access the Application

- **API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/api/docs/

## 10. Test the Setup

```bash
# Run tests
python manage.py test

# Test specific app
python manage.py test predictions
```

## Docker Setup (Alternative)

```bash
# Build and start all services
docker-compose up --build

# Create admin user in another terminal
docker-compose exec web python manage.py create_admin --username admin --email admin@example.com
```

## Next Steps

1. **Create regular users** via registration API
2. **Mark users as paid** via admin panel
3. **Create tournaments and matches**
4. **Set up Two-Star configuration**
5. **Start making predictions!**

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify DB credentials in `.env`
- Ensure database exists: `createdb prediction_db`

### Redis Connection Error
- Check Redis is running: `redis-server`
- Verify Redis URL in `.env`

### Migration Errors
- Delete migrations folder and recreate: `python manage.py makemigrations`
- Check for model conflicts

### Permission Errors
- Ensure admin user has staff/superuser status
- Check user is marked as `is_paid=True` for predictions

## Development Tips

- Use `--dry-run` flag for import commands
- Check API docs at `/api/docs/` for endpoint details
- Monitor Celery logs for background tasks
- Use Django admin for quick data entry
