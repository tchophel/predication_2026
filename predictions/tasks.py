from celery import shared_task
from django.db import transaction, models
from .models import Prediction
from matches.models import Match


@shared_task
def award_points_for_finished_matches():
    """Background task to award points for all finished matches"""
    finished_matches = Match.objects.filter(status='finished')
    
    total_awarded = 0
    total_predictions = 0
    
    for match in finished_matches:
        predictions = Prediction.objects.filter(match=match, points_awarded__isnull=True)
        
        with transaction.atomic():
            for prediction in predictions:
                prediction.award_points()
                total_predictions += 1
                total_awarded += prediction.points_awarded
    
    return {
        'matches_processed': finished_matches.count(),
        'predictions_processed': total_predictions,
        'total_points_awarded': total_awarded
    }


@shared_task
def recalculate_all_user_points():
    """Recalculate total points for all users"""
    from users.models import User
    
    users = User.objects.all()
    
    with transaction.atomic():
        for user in users:
            # Sum all awarded points for this user
            total_points = Prediction.objects.filter(
                user=user, 
                points_awarded__isnull=False
            ).aggregate(total=models.Sum('points_awarded'))['total'] or 0
            
            user.total_points = total_points
            user.save()
    
    return {'users_updated': users.count()}
