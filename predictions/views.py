from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db import transaction

from .models import Prediction, TwoStarConfig
from .serializers import (
    PredictionSerializer, 
    PredictionCreateSerializer, 
    PredictionUpdateSerializer,
    TwoStarConfigSerializer
)
from matches.models import Match


class PredictionListView(generics.ListAPIView):
    serializer_class = PredictionSerializer
    filter_backends = []
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Prediction.objects.all()
        return Prediction.objects.filter(user=user)


class PredictionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Prediction.objects.all()
        return Prediction.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return PredictionUpdateSerializer
        return PredictionSerializer


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_prediction(request, match_id):
    """Create a prediction for a specific match"""
    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user already has a prediction
    if Prediction.objects.filter(user=request.user, match=match).exists():
        return Response(
            {'error': 'You already have a prediction for this match'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if match is still open for predictions
    if not match.can_predict():
        return Response(
            {'error': 'Predictions are locked for this match'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    data = request.data.copy()
    data['match'] = match.id
    
    serializer = PredictionCreateSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        prediction = serializer.save(user=request.user)
        return Response(
            PredictionSerializer(prediction).data, 
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_prediction(request, prediction_id):
    """Update an existing prediction"""
    try:
        prediction = Prediction.objects.get(id=prediction_id, user=request.user)
    except Prediction.DoesNotExist:
        return Response(
            {'error': 'Prediction not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not prediction.can_edit():
        return Response(
            {'error': 'This prediction can no longer be edited'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = PredictionUpdateSerializer(
        prediction, 
        data=request.data, 
        partial=True, 
        context={'request': request}
    )
    
    if serializer.is_valid():
        updated_prediction = serializer.save()
        return Response(PredictionSerializer(updated_prediction).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_prediction(request, prediction_id):
    """Delete a prediction"""
    try:
        prediction = Prediction.objects.get(id=prediction_id, user=request.user)
    except Prediction.DoesNotExist:
        return Response(
            {'error': 'Prediction not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not prediction.can_edit():
        return Response(
            {'error': 'This prediction can no longer be deleted'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    prediction.delete()
    return Response(
        {'message': 'Prediction deleted successfully'}, 
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_predictions(request):
    """Get current user's predictions"""
    predictions = Prediction.objects.filter(user=request.user).order_by('-created_at')
    
    # Filter by tournament if specified
    tournament_id = request.query_params.get('tournament')
    if tournament_id:
        predictions = predictions.filter(match__tournament_id=tournament_id)
    
    # Filter by status if specified
    status_filter = request.query_params.get('status')
    if status_filter:
        if status_filter == 'upcoming':
            predictions = predictions.filter(match__status='scheduled')
        elif status_filter == 'finished':
            predictions = predictions.filter(match__status='finished')
    
    serializer = PredictionSerializer(predictions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def two_star_status(request):
    """Get user's Two-Star usage status"""
    user = request.user
    
    # Get config
    config = TwoStarConfig.objects.first()
    if not config:
        config = TwoStarConfig.objects.create()
    
    # Get usage stats
    from matches.models import Tournament
    
    tournaments = Tournament.objects.all()
    tournament_usage = {}
    
    for tournament in tournaments:
        usage_count = Prediction.get_user_two_star_usage(user, tournament)
        tournament_usage[tournament.id] = {
            'tournament_name': str(tournament),
            'used': usage_count,
            'remaining': max(0, config.max_per_user_per_tournament - usage_count)
        }
    
    global_usage = Prediction.get_user_two_star_usage(user)
    
    data = {
        'enabled': config.enabled,
        'max_per_user_per_tournament': config.max_per_user_per_tournament,
        'max_per_user_global': config.max_per_user_global,
        'global_used': global_usage,
        'global_remaining': max(0, config.max_per_user_global - global_usage),
        'tournament_usage': tournament_usage,
        'description': config.description
    }
    
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def award_points_for_match(request, match_id):
    """Award points for all predictions on a finished match (admin only)"""
    if not request.user.is_staff and not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if match.status != 'finished':
        return Response(
            {'error': 'Match must be finished to award points'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Award points for all predictions on this match
    predictions = Prediction.objects.filter(match=match, points_awarded__isnull=True)
    awarded_count = 0
    total_points = 0
    
    with transaction.atomic():
        for prediction in predictions:
            points = prediction.award_points()
            awarded_count += 1
            total_points += points
    
    return Response({
        'awarded_count': awarded_count,
        'total_points_awarded': total_points,
        'message': f'Points awarded for {awarded_count} predictions'
    })
