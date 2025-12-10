from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta

from matches.models import Tournament, Team, Match
from predictions.models import Prediction, TwoStarConfig

User = get_user_model()


class PredictionScoringTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_paid=True
        )
        
        self.tournament = Tournament.objects.create(
            name='Test Tournament',
            year=2024
        )
        
        self.team_a = Team.objects.create(name='Team A', country_code='TAA')
        self.team_b = Team.objects.create(name='Team B', country_code='TAB')
        
        # Create a match that's already finished
        self.match = Match.objects.create(
            team_a=self.team_a,
            team_b=self.team_b,
            start_time=timezone.now() - timedelta(hours=2),
            status='finished',
            score_a=2,
            score_b=1,
            tournament=self.tournament
        )
        
        # Enable two-star feature
        self.config = TwoStarConfig.objects.create(
            enabled=True,
            max_per_user_per_tournament=3,
            max_per_user_global=10
        )
    
    def test_exact_score_prediction(self):
        """Test exact score prediction (7 points)"""
        prediction = Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=2,
            predicted_b=1,
            used_two_star=False
        )
        
        points = prediction.calculate_base_points()
        self.assertEqual(points, 7)
    
    def test_one_score_correct_prediction(self):
        """Test one score correct prediction (5 points)"""
        prediction = Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=2,
            predicted_b=0,
            used_two_star=False
        )
        
        points = prediction.calculate_base_points()
        self.assertEqual(points, 5)
    
    def test_correct_winner_only_prediction(self):
        """Test correct winner only prediction (2 points)"""
        prediction = Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=4,
            predicted_b=2,
            used_two_star=False
        )
        
        points = prediction.calculate_base_points()
        self.assertEqual(points, 2)
    
    def test_completely_wrong_prediction(self):
        """Test completely wrong prediction (0 points)"""
        prediction = Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=0,
            predicted_b=2,
            used_two_star=False
        )
        
        points = prediction.calculate_base_points()
        self.assertEqual(points, 0)
    
    def test_draw_prediction(self):
        """Test draw prediction"""
        # Create a draw match
        draw_match = Match.objects.create(
            team_a=self.team_a,
            team_b=self.team_b,
            start_time=timezone.now() - timedelta(hours=1),
            status='finished',
            score_a=1,
            score_b=1,
            tournament=self.tournament
        )
        
        # Exact draw
        prediction = Prediction.objects.create(
            user=self.user,
            match=draw_match,
            predicted_a=1,
            predicted_b=1,
            used_two_star=False
        )
        
        points = prediction.calculate_base_points()
        self.assertEqual(points, 7)
        
        # Wrong draw prediction
        prediction_wrong = Prediction.objects.create(
            user=self.user,
            match=draw_match,
            predicted_a=2,
            predicted_b=2,
            used_two_star=False
        )
        
        points_wrong = prediction_wrong.calculate_base_points()
        self.assertEqual(points_wrong, 2)  # Correct winner (draw)
    
    def test_two_star_doubling(self):
        """Test two-star feature doubles points"""
        prediction = Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=2,
            predicted_b=1,
            used_two_star=True
        )
        
        final_points = prediction.calculate_final_points()
        self.assertEqual(final_points, 14)  # 7 * 2
    
    def test_two_star_no_points_no_doubling(self):
        """Test two-star doesn't double zero points"""
        prediction = Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=0,
            predicted_b=2,
            used_two_star=True
        )
        
        final_points = prediction.calculate_final_points()
        self.assertEqual(final_points, 0)
    
    def test_award_points_updates_user_total(self):
        """Test awarding points updates user total"""
        initial_points = self.user.total_points
        prediction = Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=2,
            predicted_b=1,
            used_two_star=False
        )
        
        points_awarded = prediction.award_points()
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.total_points, initial_points + points_awarded)
        self.assertEqual(prediction.points_awarded, points_awarded)


class PredictionAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_paid=True
        )
        
        self.tournament = Tournament.objects.create(
            name='Test Tournament',
            year=2024
        )
        
        self.team_a = Team.objects.create(name='Team A', country_code='TAA')
        self.team_b = Team.objects.create(name='Team B', country_code='TAB')
        
        # Create an upcoming match
        self.match = Match.objects.create(
            team_a=self.team_a,
            team_b=self.team_b,
            start_time=timezone.now() + timedelta(hours=2),
            status='scheduled',
            tournament=self.tournament
        )
        
        # Enable two-star feature
        self.config = TwoStarConfig.objects.create(
            enabled=True,
            max_per_user_per_tournament=3,
            max_per_user_global=10
        )
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)
    
    def test_create_prediction_success(self):
        """Test successful prediction creation"""
        data = {
            'predicted_a': 2,
            'predicted_b': 1,
            'used_two_star': False
        }
        
        response = self.client.post(
            f'/api/predictions/matches/{self.match.id}/',
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Prediction.objects.count(), 1)
        
        prediction = Prediction.objects.first()
        self.assertEqual(prediction.user, self.user)
        self.assertEqual(prediction.match, self.match)
        self.assertEqual(prediction.predicted_a, 2)
        self.assertEqual(prediction.predicted_b, 1)
    
    def test_create_prediction_locked_match(self):
        """Test prediction creation fails for locked match"""
        # Lock the match by setting it to start in 2 minutes
        self.match.start_time = timezone.now() + timedelta(minutes=2)
        self.match.save()
        
        data = {
            'predicted_a': 2,
            'predicted_b': 1,
            'used_two_star': False
        }
        
        response = self.client.post(
            f'/api/predictions/matches/{self.match.id}/',
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Prediction.objects.count(), 0)
    
    def test_create_duplicate_prediction(self):
        """Test duplicate prediction creation fails"""
        # Create first prediction
        Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=1,
            predicted_b=1,
            used_two_star=False
        )
        
        data = {
            'predicted_a': 2,
            'predicted_b': 1,
            'used_two_star': False
        }
        
        response = self.client.post(
            f'/api/predictions/matches/{self.match.id}/',
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Prediction.objects.count(), 1)
    
    def test_update_prediction_success(self):
        """Test successful prediction update"""
        prediction = Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=1,
            predicted_b=1,
            used_two_star=False
        )
        
        data = {
            'predicted_a': 2,
            'predicted_b': 1,
            'used_two_star': True
        }
        
        response = self.client.put(
            f'/api/predictions/{prediction.id}/update/',
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        prediction.refresh_from_db()
        self.assertEqual(prediction.predicted_a, 2)
        self.assertEqual(prediction.predicted_b, 1)
        self.assertTrue(prediction.used_two_star)
    
    def test_update_prediction_locked_match(self):
        """Test prediction update fails for locked match"""
        prediction = Prediction.objects.create(
            user=self.user,
            match=self.match,
            predicted_a=1,
            predicted_b=1,
            used_two_star=False
        )
        
        # Lock the match
        self.match.start_time = timezone.now() + timedelta(minutes=2)
        self.match.save()
        
        data = {
            'predicted_a': 2,
            'predicted_b': 1,
            'used_two_star': False
        }
        
        response = self.client.put(
            f'/api/predictions/{prediction.id}/update/',
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        prediction.refresh_from_db()
        self.assertEqual(prediction.predicted_a, 1)  # Unchanged
    
    def test_two_star_limit_enforcement(self):
        """Test two-star limit enforcement"""
        # Use up two-star limit
        for _ in range(3):
            Prediction.objects.create(
                user=self.user,
                match=self.match,
                predicted_a=1,
                predicted_b=1,
                used_two_star=True
            )
        
        # Try to create another two-star prediction
        data = {
            'predicted_a': 2,
            'predicted_b': 1,
            'used_two_star': True
        }
        
        response = self.client.post(
            f'/api/predictions/matches/{self.match.id}/',
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('maximum Two-Star predictions', response.data['non_field_errors'][0])
