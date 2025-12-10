from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import models
from django.db.models import F, Window, Count, Sum
from django.db.models.functions import Rank

from users.models import User
from predictions.models import Prediction
from matches.models import Tournament


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    """Get overall leaderboard"""
    tournament_id = request.query_params.get('tournament')
    
    # Base queryset
    users = User.objects.filter(is_paid=True, total_points__gt=0)
    
    if tournament_id:
        # Filter by tournament-specific points
        users = users.annotate(
            tournament_points=Sum(
                'predictions__points_awarded',
                filter=models.Q(predictions__match__tournament_id=tournament_id)
            )
        ).filter(tournament_points__gt=0).order_by('-tournament_points')
        
        # Add rank based on tournament points
        users = users.annotate(
            rank=Window(
                expression=Rank(),
                order_by=F('tournament_points').desc()
            )
        )
        
        leaderboard_data = []
        for user in users:
            predictions = Prediction.objects.filter(
                user=user, 
                match__tournament_id=tournament_id
            )
            
            exact_count = predictions.filter(
                points_awarded__in=[7, 14]
            ).count()
            
            two_star_success = predictions.filter(
                used_two_star=True,
                points_awarded__in=[14, 10, 4]  # 2x points for successful predictions
            ).count()
            
            leaderboard_data.append({
                'rank': user.rank,
                'user_id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar': user.avatar.url if user.avatar else None,
                'total_points': user.tournament_points,
                'matches_predicted': predictions.count(),
                'exact_predictions': exact_count,
                'two_star_used': predictions.filter(used_two_star=True).count(),
                'two_star_success': two_star_success,
            })
    else:
        # Overall leaderboard
        users = users.order_by('-total_points')
        
        # Add rank
        users = users.annotate(
            rank=Window(
                expression=Rank(),
                order_by=F('total_points').desc()
            )
        )
        
        leaderboard_data = []
        for user in users:
            predictions = Prediction.objects.filter(user=user)
            
            exact_count = predictions.filter(
                points_awarded__in=[7, 14]
            ).count()
            
            two_star_success = predictions.filter(
                used_two_star=True,
                points_awarded__in=[14, 10, 4]
            ).count()
            
            leaderboard_data.append({
                'rank': user.rank,
                'user_id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar': user.avatar.url if user.avatar else None,
                'total_points': user.total_points,
                'matches_predicted': predictions.count(),
                'exact_predictions': exact_count,
                'two_star_used': predictions.filter(used_two_star=True).count(),
                'two_star_success': two_star_success,
            })
    
    return Response(leaderboard_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """Get detailed statistics for the current user"""
    user = request.user
    
    # Overall stats
    predictions = Prediction.objects.filter(user=user)
    finished_predictions = predictions.filter(match__status='finished')
    
    # Points breakdown
    exact_predictions = finished_predictions.filter(points_awarded__in=[7, 14])
    one_correct_predictions = finished_predictions.filter(points_awarded__in=[5, 10])
    winner_only_predictions = finished_predictions.filter(points_awarded__in=[2, 4])
    wrong_predictions = finished_predictions.filter(points_awarded=0)
    
    # Two-star stats
    two_star_predictions = predictions.filter(used_two_star=True)
    successful_two_star = two_star_predictions.filter(points_awarded__gt=0)
    
    # Tournament-wise stats
    tournaments = Tournament.objects.all()
    tournament_stats = []
    
    for tournament in tournaments:
        tournament_predictions = predictions.filter(match__tournament=tournament)
        tournament_finished = tournament_predictions.filter(match__status='finished')
        tournament_points = tournament_finished.aggregate(
            total=Sum('points_awarded')
        )['total'] or 0
        
        if tournament_points > 0:
            tournament_stats.append({
                'tournament_id': tournament.id,
                'tournament_name': str(tournament),
                'points': tournament_points,
                'matches_predicted': tournament_predictions.count(),
                'matches_finished': tournament_finished.count(),
                'exact_predictions': tournament_finished.filter(
                    points_awarded__in=[7, 14]
                ).count(),
            })
    
    # Ranking
    overall_rank = User.objects.filter(
        is_paid=True, 
        total_points__gt=user.total_points
    ).count() + 1
    
    stats = {
        'user': {
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'avatar': user.avatar.url if user.avatar else None,
            'total_points': user.total_points,
            'is_paid': user.is_paid,
        },
        'predictions': {
            'total': predictions.count(),
            'finished': finished_predictions.count(),
            'upcoming': predictions.filter(match__status='scheduled').count(),
        },
        'points_breakdown': {
            'exact_predictions': exact_predictions.count(),
            'one_correct_predictions': one_correct_predictions.count(),
            'winner_only_predictions': winner_only_predictions.count(),
            'wrong_predictions': wrong_predictions.count(),
        },
        'two_star_stats': {
            'total_used': two_star_predictions.count(),
            'successful': successful_two_star.count(),
            'success_rate': (successful_two_star.count() / two_star_predictions.count() * 100) 
                          if two_star_predictions.count() > 0 else 0,
        },
        'tournament_stats': tournament_stats,
        'ranking': {
            'overall_rank': overall_rank,
            'total_users': User.objects.filter(is_paid=True).count(),
        }
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_predictions(request):
    """Get top predictions (most points awarded)"""
    limit = int(request.query_params.get('limit', 10))
    
    predictions = Prediction.objects.filter(
        points_awarded__gt=0
    ).select_related('user', 'match', 'match__team_a', 'match__team_b').order_by('-points_awarded')[:limit]
    
    top_predictions_data = []
    for prediction in predictions:
        top_predictions_data.append({
            'id': prediction.id,
            'user': prediction.user.username,
            'match': str(prediction.match),
            'predicted_score': f"{prediction.predicted_a}-{prediction.predicted_b}",
            'actual_score': f"{prediction.match.score_a}-{prediction.match.score_b}",
            'points_awarded': prediction.points_awarded,
            'used_two_star': prediction.used_two_star,
            'created_at': prediction.created_at,
        })
    
    return Response(top_predictions_data)
