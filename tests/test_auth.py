from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token

User = get_user_model()


class AuthenticationTestCase(APITestCase):
    def test_user_registration_success(self):
        """Test successful user registration"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = self.client.post('/api/auth/register/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        
        user = User.objects.first()
        self.assertEqual(user.username, 'newuser')
        self.assertEqual(user.email, 'newuser@example.com')
        self.assertFalse(user.is_paid)  # Default is False
        self.assertEqual(user.total_points, 0)  # Default is 0
        
        # Check token was created
        self.assertTrue(Token.objects.filter(user=user).exists())
        
        # Check response contains token and user data
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertIn('message', response.data)
    
    def test_user_registration_password_mismatch(self):
        """Test registration fails with password mismatch"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'testpass123',
            'password_confirm': 'differentpass',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = self.client.post('/api/auth/register/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 0)
        self.assertIn("Passwords don't match", response.data['non_field_errors'])
    
    def test_user_registration_duplicate_username(self):
        """Test registration fails with duplicate username"""
        # Create existing user
        User.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='testpass123'
        )
        
        data = {
            'username': 'existinguser',
            'email': 'newuser@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = self.client.post('/api/auth/register/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
    
    def test_user_login_success_paid_user(self):
        """Test successful login for paid user"""
        user = User.objects.create_user(
            username='paiduser',
            email='paid@example.com',
            password='testpass123',
            is_paid=True
        )
        
        data = {
            'username': 'paiduser',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertIn('message', response.data)
        
        # Check token was created
        self.assertTrue(Token.objects.filter(user=user).exists())
    
    def test_user_login_fails_unpaid_user(self):
        """Test login fails for unpaid user"""
        User.objects.create_user(
            username='unpaiduser',
            email='unpaid@example.com',
            password='testpass123',
            is_paid=False
        )
        
        data = {
            'username': 'unpaiduser',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Awaiting admin payment confirmation', response.data['non_field_errors'])
    
    def test_user_login_fails_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='correctpass',
            is_paid=True
        )
        
        data = {
            'username': 'testuser',
            'password': 'wrongpass'
        }
        
        response = self.client.post('/api/auth/login/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid credentials', response.data['non_field_errors'])
    
    def test_user_login_fails_inactive_user(self):
        """Test login fails for inactive user"""
        User.objects.create_user(
            username='inactiveuser',
            email='inactive@example.com',
            password='testpass123',
            is_paid=True,
            is_active=False
        )
        
        data = {
            'username': 'inactiveuser',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('User account is disabled', response.data['non_field_errors'])
    
    def test_user_logout_success(self):
        """Test successful logout"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_paid=True
        )
        
        # Authenticate
        self.client.force_authenticate(user=user)
        
        response = self.client.post('/api/auth/logout/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Check token was deleted
        self.assertFalse(Token.objects.filter(user=user).exists())
    
    def test_user_profile_access(self):
        """Test user profile access"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            is_paid=True,
            total_points=25
        )
        
        # Authenticate
        self.client.force_authenticate(user=user)
        
        response = self.client.get('/api/auth/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['first_name'], 'Test')
        self.assertEqual(response.data['last_name'], 'User')
        self.assertTrue(response.data['is_paid'])
        self.assertEqual(response.data['total_points'], 25)
    
    def test_user_profile_access_unauthenticated(self):
        """Test profile access fails for unauthenticated user"""
        response = self.client.get('/api/auth/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
