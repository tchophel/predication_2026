from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
import csv
import io

from matches.models import Tournament, Team, Match
from predictions.models import Prediction, TwoStarConfig
from users.models import PaymentLog

User = get_user_model()


class AdminPanelTestCase(APITestCase):
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            is_staff=True,
            is_superuser=True
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='userpass123',
            is_paid=False
        )
        
        self.paid_user = User.objects.create_user(
            username='paiduser',
            email='paid@example.com',
            password='paidpass123',
            is_paid=True,
            total_points=25
        )
        
        self.tournament = Tournament.objects.create(
            name='Test Tournament',
            year=2024
        )
        
        self.team_a = Team.objects.create(name='Team A', country_code='TAA')
        self.team_b = Team.objects.create(name='Team B', country_code='TAB')
        
        self.match = Match.objects.create(
            team_a=self.team_a,
            team_b=self.team_b,
            start_time=timezone.now() + timedelta(hours=2),
            tournament=self.tournament
        )
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
    
    def test_admin_dashboard_stats(self):
        """Test admin dashboard statistics"""
        response = self.client.get('/api/admin/dashboard/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(data['total_users'], 3)
        self.assertEqual(data['paid_users'], 2)
        self.assertEqual(data['unpaid_users'], 1)
        self.assertEqual(data['total_matches'], 1)
        self.assertEqual(data['scheduled_matches'], 1)
        self.assertEqual(data['finished_matches'], 0)
        self.assertEqual(data['total_predictions'], 0)
        self.assertEqual(data['total_points_awarded'], 0)
    
    def test_mark_user_paid(self):
        """Test marking user as paid"""
        response = self.client.post(
            f'/api/admin/users/{self.regular_user.id}/mark-paid/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.is_paid)
    
    def test_mark_user_paid_nonexistent(self):
        """Test marking nonexistent user as paid"""
        response = self.client.post('/api/admin/users/999/mark-paid/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_create_match(self):
        """Test creating a match"""
        data = {
            'team_a': self.team_a.id,
            'team_b': self.team_b.id,
            'start_time': (timezone.now() + timedelta(hours=4)).isoformat(),
            'tournament': self.tournament.id,
            'venue': 'Test Stadium'
        }
        
        response = self.client.post('/api/admin/matches/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Match.objects.count(), 2)
        
        match = Match.objects.latest('created_at')
        self.assertEqual(match.venue, 'Test Stadium')
    
    def test_finish_match_and_award_points(self):
        """Test finishing match and awarding points"""
        # Create a prediction
        prediction = Prediction.objects.create(
            user=self.paid_user,
            match=self.match,
            predicted_a=2,
            predicted_b=1,
            used_two_star=False
        )
        
        # Finish the match
        data = {
            'score_a': 2,
            'score_b': 1
        }
        
        response = self.client.post(
            f'/api/admin/matches/{self.match.id}/finish/',
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.match.refresh_from_db()
        self.assertEqual(self.match.status, 'finished')
        self.assertEqual(self.match.score_a, 2)
        self.assertEqual(self.match.score_b, 1)
        
        prediction.refresh_from_db()
        self.assertIsNotNone(prediction.points_awarded)
        self.assertEqual(prediction.points_awarded, 7)  # Exact score
        
        self.paid_user.refresh_from_db()
        self.assertEqual(self.paid_user.total_points, 32)  # 25 + 7
    
    def test_export_leaderboard(self):
        """Test exporting leaderboard to CSV"""
        response = self.client.get('/api/admin/export/leaderboard/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename="leaderboard.csv"', response['Content-Disposition'])
        
        # Check CSV content
        content = response.content.decode('utf-8')
        lines = content.split('\n')
        
        # Should have header + 2 paid users
        self.assertGreaterEqual(len(lines), 3)
        self.assertIn('Rank,Username,Email,Total Points', lines[0])
    
    def test_export_predictions(self):
        """Test exporting predictions to CSV"""
        # Create a prediction
        Prediction.objects.create(
            user=self.paid_user,
            match=self.match,
            predicted_a=2,
            predicted_b=1,
            used_two_star=False
        )
        
        response = self.client.get('/api/admin/export/predictions/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename="predictions.csv"', response['Content-Disposition'])
        
        # Check CSV content
        content = response.content.decode('utf-8')
        lines = content.split('\n')
        
        self.assertGreater(len(lines), 1)
        self.assertIn('User,Match,Team A,Team B', lines[0])
    
    def test_two_star_config_get(self):
        """Test getting two-star configuration"""
        response = self.client.get('/api/admin/two-star-config/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertIn('enabled', data)
        self.assertIn('max_per_user_per_tournament', data)
        self.assertIn('max_per_user_global', data)
        self.assertIn('description', data)
    
    def test_two_star_config_update(self):
        """Test updating two-star configuration"""
        data = {
            'enabled': False,
            'max_per_user_per_tournament': 5,
            'max_per_user_global': 15,
            'description': 'Updated description'
        }
        
        response = self.client.post('/api/admin/two-star-config/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        config = TwoStarConfig.objects.first()
        self.assertFalse(config.enabled)
        self.assertEqual(config.max_per_user_per_tournament, 5)
        self.assertEqual(config.max_per_user_global, 15)
        self.assertEqual(config.description, 'Updated description')
    
    def test_bulk_import_matches_success(self):
        """Test bulk importing matches from CSV"""
        csv_content = """team_a,team_b,start_time,tournament,year,venue,match_day
Team A,Team C,2024-06-20 20:00:00,Test Tournament,2024,Stadium A,1
Team B,Team C,2024-06-21 18:00:00,Test Tournament,2024,Stadium B,2"""
        
        csv_file = io.StringIO(csv_content)
        csv_file.name = 'test.csv'
        
        response = self.client.post('/api/admin/bulk-import-matches/', {
            'file': ('test.csv', csv_file, 'text/csv')
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(data['message'], 'Successfully imported 2 matches')
        self.assertEqual(Match.objects.count(), 3)  # 1 existing + 2 new
    
    def test_bulk_import_matches_invalid_format(self):
        """Test bulk import with invalid CSV format"""
        csv_content = """invalid,header,format
Team A,Team B"""
        
        csv_file = io.StringIO(csv_content)
        csv_file.name = 'test.csv'
        
        response = self.client.post('/api/admin/bulk-import-matches/', {
            'file': ('test.csv', csv_file, 'text/csv')
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Error processing file', response.data['error'])
    
    def test_admin_access_required(self):
        """Test that admin endpoints require admin access"""
        self.client.force_authenticate(user=self.regular_user)
        
        endpoints = [
            '/api/admin/dashboard/',
            f'/api/admin/users/{self.regular_user.id}/mark-paid/',
            '/api/admin/matches/',
            '/api/admin/export/leaderboard/',
            '/api/admin/two-star-config/',
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint) if 'GET' in endpoint else self.client.post(endpoint, {})
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthorized_access(self):
        """Test that unauthenticated users cannot access admin endpoints"""
        self.client.force_authenticate(user=None)
        
        response = self.client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
