# Match Prediction System

A comprehensive Django-based match prediction system with user authentication, payment verification, two-star predictions, and leaderboard functionality.

## Features

- **User Management**: Registration, login with payment verification
- **Match Management**: Create, schedule, and manage matches with tournaments
- **Prediction System**: Submit predictions with 5-minute lock rule
- **Two-Star Feature**: High-stakes predictions with doubled points
- **Scoring Algorithm**: Exact (7pts), one correct (5pts), winner only (2pts)
- **Leaderboard**: Real-time rankings with detailed statistics
- **Admin Panel**: Complete admin control over users, matches, and settings
- **Bulk Import**: CSV-based match and tournament import
- **API Documentation**: Full OpenAPI/Swagger documentation

## Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL
- **Task Queue**: Celery + Redis
- **Frontend**: React 18 (planned)
- **Authentication**: Token-based auth
- **Documentation**: OpenAPI/Swagger

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Redis 6+
- Node.js 16+ (for frontend)

### Installation

1. **Clone and setup environment**
   ```bash
   git clone <repository-url>
   cd prediction
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb prediction_db
   
   # Run migrations
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create admin user**
   ```bash
   python manage.py create_admin --username admin --email admin@example.com
   ```

5. **Start services**
   ```bash
   # Start Redis
   redis-server
   
   # Start Celery worker (in separate terminal)
   celery -A prediction worker --loglevel=info
   
   # Start Django development server
   python manage.py runserver
   ```

6. **Access the application**
   - API: http://localhost:8000/api/
   - Admin: http://localhost:8000/admin/
   - API Docs: http://localhost:8000/api/docs/

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - User profile

### Matches
- `GET /api/matches/` - List matches
- `GET /api/matches/{id}/` - Match details
- `GET /api/matches/upcoming/` - Upcoming matches

### Predictions
- `POST /api/predictions/matches/{id}/` - Create prediction
- `PUT /api/predictions/{id}/update/` - Update prediction
- `GET /api/predictions/my/` - My predictions
- `GET /api/predictions/two-star-status/` - Two-star usage status

### Leaderboard
- `GET /api/leaderboard/` - Leaderboard
- `GET /api/leaderboard/my-stats/` - User statistics

### Admin
- `GET /api/admin/dashboard/` - Admin dashboard
- `POST /api/admin/users/{id}/mark-paid/` - Mark user as paid
- `POST /api/admin/matches/` - Create match
- `POST /api/admin/matches/{id}/finish/` - Finish match and award points

## Scoring Rules

- **Exact Score**: 7 points
- **One Score Correct**: 5 points  
- **Correct Winner Only**: 2 points
- **Completely Wrong**: 0 points
- **Two-Star Multiplier**: 2x points if base points > 0

## Two-Star Feature

Users can mark predictions as "Two-Star" to double their points, with limits:
- Default: 3 per tournament
- Default: 10 globally
- Configurable via admin panel

## Prediction Locking

- Predictions lock 5 minutes before match start (configurable)
- Admin can override locking per match
- Once locked, predictions cannot be edited or deleted

## Admin Features

- User management and payment verification
- Match creation and bulk import
- Tournament management
- Two-star configuration
- Export functionality (CSV)
- Real-time dashboard

## Bulk Import Format

CSV format for match import:
```csv
team_a,team_b,start_time,tournament,year,venue,match_day
Brazil,Argentina,2024-06-20 20:00:00,World Cup,2024,Maracana Stadium,1
```

## Testing

```bash
# Run tests
python manage.py test

# Run specific app tests
python manage.py test users
python manage.py test predictions
```

## Deployment

### Environment Variables

Set these in production:
- `SECRET_KEY` - Django secret key
- `DEBUG=False` - Disable debug mode
- `ALLOWED_HOSTS` - Your domain
- `DB_*` - Database connection
- `REDIS_URL` - Redis connection

### Production Setup

1. Set `DEBUG=False` in settings
2. Configure production database
3. Set up static files serving
4. Configure Celery for production
5. Set up SSL certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
