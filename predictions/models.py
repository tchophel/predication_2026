from django.db import models
from django.db import transaction
from django.conf import settings
from matches.models import Match


class TwoStarConfig(models.Model):
    enabled = models.BooleanField(default=True)
    max_per_user_per_tournament = models.IntegerField(default=3)
    max_per_user_global = models.IntegerField(default=10)
    description = models.TextField(blank=True, help_text="Description shown to users about 2-Star feature")
    
    class Meta:
        verbose_name = "Two-Star Configuration"
        verbose_name_plural = "Two-Star Configuration"
    
    def __str__(self):
        return f"2-Star Config (Enabled: {self.enabled})"


class Prediction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='predictions')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='predictions')
    predicted_a = models.IntegerField()
    predicted_b = models.IntegerField()
    used_two_star = models.BooleanField(default=False)
    points_awarded = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'match']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.match.team_a.name} vs {self.match.team_b.name} - {self.predicted_a}:{self.predicted_b}"
    
    def can_edit(self):
        return self.match.can_predict()
    
    def calculate_base_points(self):
        if self.match.status != 'finished' or self.match.score_a is None:
            return 0
        
        actual_a = self.match.score_a
        actual_b = self.match.score_b
        pred_a = self.predicted_a
        pred_b = self.predicted_b
        
        # Exact score
        if actual_a == pred_a and actual_b == pred_b:
            return 7
        
        # One score correct
        if actual_a == pred_a or actual_b == pred_b:
            return 5
        
        # Correct winner only
        if actual_a > actual_b:
            actual_winner = 'A'
        elif actual_b > actual_a:
            actual_winner = 'B'
        else:
            actual_winner = 'DRAW'
            
        if pred_a > pred_b:
            pred_winner = 'A'
        elif pred_b > pred_a:
            pred_winner = 'B'
        else:
            pred_winner = 'DRAW'
        
        if actual_winner == pred_winner:
            return 2
        
        # Completely wrong
        return 0
    
    def calculate_final_points(self):
        base_points = self.calculate_base_points()
        
        if base_points > 0 and self.used_two_star:
            return base_points * 2
        
        return base_points
    
    def award_points(self):
        points = self.calculate_final_points()
        self.points_awarded = points
        self.save()
        
        # Update user's total points
        with transaction.atomic():
            user = self.user
            user.total_points += points
            user.save()
        
        return points
    
    @classmethod
    def get_user_two_star_usage(cls, user, tournament=None):
        from matches.models import Tournament
        
        if tournament:
            return cls.objects.filter(
                user=user,
                used_two_star=True,
                match__tournament=tournament
            ).count()
        else:
            return cls.objects.filter(user=user, used_two_star=True).count()
    
    def can_use_two_star(self):
        if not self.used_two_star:
            return False
        
        config = TwoStarConfig.objects.first()
        if not config or not config.enabled:
            return False
        
        tournament_usage = self.get_user_two_star_usage(self.user, self.match.tournament)
        global_usage = self.get_user_two_star_usage(self.user)
        
        # Check if this prediction would exceed limits
        if tournament_usage >= config.max_per_user_per_tournament:
            return False
        
        if global_usage >= config.max_per_user_global:
            return False
        
        return True
