#!/usr/bin/env python3
"""
Test authentication endpoints
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prediction.settings')
django.setup()

from django.test import Client
from users.models import User
from rest_framework.authtoken.models import Token

def test_auth():
    client = Client()
    
    # Check if admin user exists
    try:
        admin = User.objects.get(username='admin')
        print(f"Admin user exists: {admin.username}")
        print(f"Admin email: {admin.email}")
        
        # Check admin token
        token, created = Token.objects.get_or_create(user=admin)
        print(f"Admin token: {token.key}")
    except User.DoesNotExist:
        print("Admin user does not exist, creating...")
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Admin user created")
    
    # Test registration
    print("\nTesting registration...")
    register_data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123',
        'password_confirm': 'testpass123'
    }
    
    response = client.post('/api/auth/register/', register_data, content_type='application/json')
    print(f"Register status: {response.status_code}")
    try:
        print(f"Register response: {response.json()}")
    except:
        print(f"Register content: {response.content.decode()}")
    
    # Test login
    print("\nTesting login...")
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    response = client.post('/api/auth/login/', login_data, content_type='application/json')
    print(f"Login status: {response.status_code}")
    try:
        print(f"Login response: {response.json()}")
    except:
        print(f"Login content: {response.content.decode()}")

if __name__ == '__main__':
    test_auth()
