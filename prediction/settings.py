from pathlib import Path
import os
import sys

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
if not os.getenv('DOCKER_ENV') and not os.getenv('VERCEL'):
    # Local development - use .env.local
    try:
        from dotenv import load_dotenv
        load_dotenv(BASE_DIR / '.env.local')
    except ImportError:
        pass

from decouple import config

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0,testserver', cast=lambda v: [s.strip() for s in v.split(',')])
ALLOWED_HOSTS += ['.vercel.app', '.now.sh']
vercel_url = os.getenv('VERCEL_URL')
if vercel_url:
    ALLOWED_HOSTS.append(vercel_url)

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'drf_spectacular',
]

LOCAL_APPS = [
    'users',
    'matches',
    'predictions',
    'admin_panel',
    'messaging',
    'leaderboard',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'prediction.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'prediction/templates', BASE_DIR / 'frontend/build'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'prediction.wsgi.application'

# During Vercel's build-time `collectstatic`, the postgres adapter import
# fails (Vercel installs bare psycopg without a libpq backend). collectstatic
# never touches the DB, so swap in sqlite for that one command.
if 'collectstatic' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'build_collectstatic.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='prediction_db'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432', cast=int),
            'OPTIONS': {
                'options': '-c default_transaction_isolation=serializable'
            }
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

AUTH_USER_MODEL = 'users.User'

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'frontend/build/static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
WHITENOISE_ROOT = BASE_DIR / 'frontend/build'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Match Prediction API',
    'DESCRIPTION': 'API for the World Cup 2026 Match Prediction System',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SECURITY': [{'tokenAuth': []}],
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    'SWAGGER_UI_SETTINGS': {
        'persistAuthorization': True,
    },
    'SECURITY_DEFINITIONS': {
        'tokenAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Token-based authentication. Enter: **Token &lt;your token&gt;**',
        }
    },
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

CORS_ALLOW_CREDENTIALS = True

from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-device-id',
]

# Celery Configuration
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Two-Star Configuration
TWO_STAR_DEFAULT_LIMIT = config('TWO_STAR_DEFAULT_LIMIT', default=3, cast=int)
PREDICTION_LOCK_MINUTES = config('PREDICTION_LOCK_MINUTES', default=5, cast=int)

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='11104002818@rim.edu.bt')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='zspy iunh ygmy ofub')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)

# Admin Email
ADMIN_EMAIL = config('ADMIN_EMAIL', default='admin@example.com')

# WC2026 API
WC2026_API_KEY = config('WC2026_API_KEY', default='')
WC2026_API_URL = config('WC2026_API_URL', default='https://api.wc2026api.com')

# Anthropic API for AI Chatbot
ANTHROPIC_API_KEY = config('ANTHROPIC_API_KEY', default='')

# Admin Payment Details
ADMIN_ACCOUNT_NUMBER = config('ADMIN_ACCOUNT_NUMBER', default='1234567890')
ADMIN_ACCOUNT_NAME = config('ADMIN_ACCOUNT_NAME', default='Admin Account')
ADMIN_BANK_NAME = config('ADMIN_BANK_NAME', default='Bank of Bhutan')
