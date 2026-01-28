from django.db import models
from django.utils import timezone
from django.conf import settings


class Tournament(models.Model):
    name = models.CharField(max_length=100)
    year = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['name', 'year']
        ordering = ['-year', 'name']
    
    def __str__(self):
        return f"{self.name} {self.year}"


class Group(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='groups')
    name = models.CharField(max_length=10)  # A, B, C, etc.
    
    class Meta:
        unique_together = ['tournament', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.tournament.name} {self.tournament.year} - Group {self.name}"


class Team(models.Model):
    name = models.CharField(max_length=100)
    country_code = models.CharField(max_length=3, unique=True)  # ISO country codes
    flag = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Match(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('live', 'Live'),
        ('extra_time', 'Extra Time'),
        ('finished', 'Finished'),
        ('completed', 'Completed'),
        ('postponed', 'Postponed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Match identification
    id = models.AutoField(primary_key=True)
    
    # Teams
    team_a_name = models.CharField(max_length=100)
    team_a_code = models.CharField(max_length=3)
    team_b_name = models.CharField(max_length=100)
    team_b_code = models.CharField(max_length=3)
    
    # Match details
    start_time = models.DateTimeField(help_text="Match start time in UTC")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    venue = models.CharField(max_length=200, null=False, blank=False)
    
    # Tournament details
    tournament_name = models.CharField(max_length=100, null=True, blank=True)
    tournament_year = models.IntegerField(null=True, blank=True)
    group = models.CharField(max_length=20, blank=True, null=True)
    
    # Scores
    score_a = models.IntegerField(null=True, blank=True)
    score_b = models.IntegerField(null=True, blank=True)
    
    # Extra time
    extra_time = models.IntegerField(default=0, help_text="Extra/stoppage time in minutes")
    final_whistle_time = models.DateTimeField(null=True, blank=True, help_text="Time when match actually ended")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Prediction locking
    is_locked = models.BooleanField(default=False, help_text="Admin override for prediction locking")
    lock_override_time = models.DateTimeField(null=True, blank=True, help_text="Custom lock time override")
    
    class Meta:
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.team_a_name} vs {self.team_b_name} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def team_a(self):
        """Return team_a data in format expected by frontend"""
        return {
            "name": self.team_a_name,
            "country_code": self.team_a_code
        }
    
    @property
    def team_b(self):
        """Return team_b data in format expected by frontend"""
        return {
            "name": self.team_b_name,
            "country_code": self.team_b_code
        }
    
    @property
    def tournament(self):
        """Return tournament data in format expected by frontend"""
        return {
            "name": self.tournament_name,
            "year": self.tournament_year
        }
    
    def save(self, *args, **kwargs):
        # Check if this is an update and status is being set to completed
        is_update = self.pk is not None
        old_status = None
        
        if is_update:
            try:
                old_match = Match.objects.get(pk=self.pk)
                old_status = old_match.status
            except Match.DoesNotExist:
                pass
        
        # Save the match
        super().save(*args, **kwargs)
        
        # If status changed to completed, automatically award points
        if is_update and old_status != 'completed' and self.status == 'completed':
                self.award_points_for_all_predictions()
    
    def award_points_for_all_predictions(self):
        """Automatically award points for all predictions on this match"""
        from predictions.models import Prediction
        
        predictions = Prediction.objects.filter(match=self)
        for prediction in predictions:
                try:
                        prediction.award_points()
                except Exception as e:
                        print(f"Failed to award points for prediction {prediction.id}: {e}")
    
    @property
    def is_prediction_locked(self):
        """Check if predictions are locked for this match (5 minutes before start)"""
        if self.is_locked:
            return True
        
        from django.conf import settings
        lock_minutes = getattr(settings, 'PREDICTION_LOCK_MINUTES', 5)
        
        if self.lock_override_time:
            lock_time = self.lock_override_time
        else:
            lock_time = self.start_time - timezone.timedelta(minutes=lock_minutes)
        
        return timezone.now() >= lock_time
    
    @property
    def time_until_lock(self):
        """Return time until predictions are locked"""
        if self.is_locked:
            return timezone.timedelta(0)
        
        from django.conf import settings
        lock_minutes = getattr(settings, 'PREDICTION_LOCK_MINUTES', 5)
        
        if self.lock_override_time:
            lock_time = self.lock_override_time
        else:
            lock_time = self.start_time - timezone.timedelta(minutes=lock_minutes)
        
        if timezone.now() >= lock_time:
            return timezone.timedelta(0)
        
        return lock_time - timezone.now()
    
    def can_predict(self):
        """Check if predictions can be made for this match"""
        return self.status == 'upcoming' and not self.is_prediction_locked
    
    def to_frontend_format(self):
        """Convert match to format expected by frontend"""
        return {
            "id": self.id,
            "team_a": self.team_a,
            "team_b": self.team_b,
            "start_time": self.start_time.isoformat(),
            "status": self.status,
            "venue": self.venue,
            "tournament": self.tournament,
            "group": self.group,
            "score_a": self.score_a,
            "score_b": self.score_b,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
