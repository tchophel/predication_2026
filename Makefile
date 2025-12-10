.PHONY: help test run migrate makemigrations superuser shell

help:
	@echo "Available commands:"
	@echo "  make run         - Run development server"
	@echo "  make migrate     - Run database migrations"
	@echo "  make makemigrations - Create new migrations"
	@echo "  make superuser   - Create superuser"
	@echo "  make shell       - Open Django shell"
	@echo "  make test        - Run tests"
	@echo "  make test-coverage - Run tests with coverage"
	@echo "  make lint        - Run linting"
	@echo "  make format      - Format code"
	@echo "  make import-data - Import sample data"
	@echo "  make docker-up   - Start Docker containers"
	@echo "  make docker-down - Stop Docker containers"

run:
	python manage.py runserver

migrate:
	python manage.py migrate

makemigrations:
	python manage.py makemigrations

superuser:
	python manage.py createsuperuser

shell:
	python manage.py shell

test:
	python manage.py test

test-coverage:
	python manage.py test --cov=. --cov-report=html --cov-report=term

lint:
	flake8 . tests/
	black --check .

format:
	black . tests/
	isort . tests/

import-data:
	python manage.py import_matches sample_data/matches.csv

docker-up:
	docker-compose up --build

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

install:
	pip install -r requirements.txt

dev-setup:
	cp .env.example .env
	pip install -r requirements.txt
	python manage.py migrate
	python manage.py create_admin --username admin --email admin@example.com
	python manage.py import_matches sample_data/matches.csv
