# views.py
from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import Tournament, Group, Team, Match
from .serializers import (
    TournamentSerializer, 
    GroupSerializer, 
    TeamSerializer, 
    MatchSerializer, 
    MatchListSerializer,
    MatchDetailSerializer
)


# Tournament Views
class TournamentListView(generics.ListAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['year', 'name']
    ordering = ['-year']


class TournamentDetailView(generics.RetrieveAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer


# Group Views
class GroupListView(generics.ListAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer


# Team Views
class TeamListView(generics.ListAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'country_code']


# Match Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def match_list_create(request):
    """
    GET: List all matches
    POST: Create a new match (admin only)
    """
    if request.method == 'GET':
        matches = Match.objects.all().order_by('start_time')
        serializer = MatchListSerializer(matches, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Check if user is admin/staff
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can create matches'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MatchSerializer(data=request.data)
        if serializer.is_valid():
            match = serializer.save()
            return Response(
                MatchListSerializer(match).data, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def match_detail(request, pk):
    """
    GET: Retrieve a match
    PUT/PATCH: Update a match (admin only)
    DELETE: Delete a match (admin only)
    """
    match = get_object_or_404(Match, pk=pk)
    
    if request.method == 'GET':
        serializer = MatchDetailSerializer(match)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        # Check if user is admin/staff
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can update matches'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        partial = request.method == 'PATCH'
        serializer = MatchSerializer(match, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(MatchListSerializer(match).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Check if user is admin/staff
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can delete matches'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all predictions for this match before deleting
        from predictions.models import Prediction
        from users.models import User
        
        predictions = Prediction.objects.filter(match=match)
        affected_users = set()
        
        # Store affected users to recalculate their points
        for prediction in predictions:
            affected_users.add(prediction.user)
        
        # Delete the match (predictions will be deleted due to foreign key constraint)
        match.delete()
        
        # Recalculate total points for all affected users
        for user in affected_users:
            user_predictions = Prediction.objects.filter(user=user, points_awarded__gt=0)
            total_points = sum(pred.points_awarded for pred in user_predictions)
            user.total_points = total_points
            user.save()
        
        return Response(
            {'message': 'Match deleted successfully and user points recalculated'}, 
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_matches(request):
    """Get upcoming matches for the current user"""
    matches = Match.objects.filter(
        start_time__gt=timezone.now(),
        status='upcoming'
    ).order_by('start_time')
    
    serializer = MatchListSerializer(matches, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def live_matches(request):
    """Get live matches"""
    matches = Match.objects.filter(status='live').order_by('start_time')
    serializer = MatchListSerializer(matches, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def finished_matches(request):
    """Get finished matches"""
    matches = Match.objects.filter(status='finished').order_by('-start_time')
    serializer = MatchListSerializer(matches, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_predictions_for_match(request, match_id):
    """Get current user's prediction for a specific match"""
    try:
        match = Match.objects.get(id=match_id)
        from predictions.models import Prediction
        
        try:
            prediction = Prediction.objects.get(user=request.user, match=match)
            from predictions.serializers import PredictionSerializer
            serializer = PredictionSerializer(prediction)
            return Response(serializer.data)
        except Prediction.DoesNotExist:
            return Response(
                {'detail': 'No prediction found for this match'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Match.DoesNotExist:
        return Response(
            {'error': 'Match not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_create_matches(request):
    """
    Bulk create multiple matches
    Expected format: { "matches": [...] }
    """
    matches_data = request.data.get('matches', [])
    
    if not matches_data:
        return Response(
            {'error': 'No matches provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    created_matches = []
    errors = []
    
    for idx, match_data in enumerate(matches_data):
        serializer = MatchSerializer(data=match_data)
        if serializer.is_valid():
            match = serializer.save()
            created_matches.append(MatchListSerializer(match).data)
        else:
            errors.append({
                'index': idx,
                'data': match_data,
                'errors': serializer.errors
            })
    
    return Response({
        'created': len(created_matches),
        'failed': len(errors),
        'matches': created_matches,
        'errors': errors
    }, status=status.HTTP_201_CREATED if created_matches else status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def update_match_status(request, pk):
    """Update match status and optionally scores"""
    match = get_object_or_404(Match, pk=pk)
    
    new_status = request.data.get('status')
    score_a = request.data.get('score_a')
    score_b = request.data.get('score_b')
    
    if new_status:
        match.status = new_status
    
    if score_a is not None:
        match.score_a = score_a
    
    if score_b is not None:
        match.score_b = score_b
    
    match.save()


def start_extra_time(match):
    """Start extra time for a match"""
    if match.status != 'live':
        return Response({'error': 'Match must be live to start extra time'}, status=status.HTTP_400_BAD_REQUEST)
    
    match.status = 'extra_time'
    match.save()
    return Response({'message': 'Extra time started', 'status': match.status})


def end_extra_time(match):
    """End extra time and finish the match"""
    if match.status != 'extra_time':
        return Response({'error': 'Match must be in extra time to end'}, status=status.HTTP_400_BAD_REQUEST)
    
    match.status = 'finished'
    match.final_whistle_time = timezone.now()
    match.save()
    return Response({'message': 'Match ended', 'status': match.status})


def add_extra_minutes(match, extra_minutes):
    """Add extra minutes to a match"""
    if match.status not in ['live', 'extra_time']:
        return Response({'error': 'Match must be live or in extra time'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        extra_minutes = int(extra_minutes)
        if extra_minutes < 0:
            return Response({'error': 'Extra minutes must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        
        match.extra_time = extra_minutes
        match.save()
        return Response({'message': f'Added {extra_minutes} minutes extra time', 'extra_time': match.extra_time})
    except ValueError:
        return Response({'error': 'Invalid extra minutes value'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def manage_extra_time(request, pk):
    """Manage extra time for a match"""
    match = get_object_or_404(Match, pk=pk)
    action = request.data.get('action')
    
    action_handlers = {
        'start_extra_time': lambda: start_extra_time(match),
        'end_extra_time': lambda: end_extra_time(match),
        'add_extra_minutes': lambda: add_extra_minutes(match, request.data.get('extra_minutes', 0)),
    }
    
    if action not in action_handlers:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    return action_handlers[action]()