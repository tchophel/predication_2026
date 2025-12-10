from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.decorators import user_passes_test
from django.utils import timezone
from django.db import transaction, models
from django.http import HttpResponse
from django.core.mail import send_mail
from django.conf import settings
import csv
from io import StringIO

from users.models import User, PaymentLog
from matches.models import Match, Tournament, Team, Group
from predictions.models import Prediction, TwoStarConfig

# Constants
USER_NOT_FOUND = 'User not found'


def is_admin(user):
    return user.is_staff or user.is_superuser


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def list_users(request):
    """List all users with their payment status"""
    users = User.objects.all().order_by('-date_joined')
    data = []
    
    for user in users:
        data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_paid': getattr(user, 'is_paid', False),
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None
        })
    
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def create_user(request):
    """Create a new user"""
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        is_paid = request.data.get('is_paid', False)
        is_staff = request.data.get('is_staff', False)
        
        if not all([username, email, password]):
            return Response({'error': 'Username, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username or email already exists
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=is_staff
        )
        
        # Set is_paid status
        if hasattr(user, 'is_paid'):
            user.is_paid = is_paid
            user.save()
        
        return Response({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_paid': getattr(user, 'is_paid', False)
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def update_user(request, user_id):
    """Update a user"""
    try:
        user = User.objects.get(id=user_id)
        
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        is_paid = request.data.get('is_paid')
        is_staff = request.data.get('is_staff')
        
        # Update username if provided
        if username and username != user.username:
            if User.objects.filter(username=username).exclude(id=user_id).exists():
                return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username
        
        # Update email if provided
        if email and email != user.email:
            if User.objects.filter(email=email).exclude(id=user_id).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email
        
        # Update password if provided
        if password:
            user.set_password(password)
        
        # Update boolean fields if provided
        if is_paid is not None and hasattr(user, 'is_paid'):
            user.is_paid = is_paid
        
        if is_staff is not None:
            user.is_staff = is_staff
        
        user.save()
        
        return Response({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_paid': getattr(user, 'is_paid', False)
            }
        })
        
    except User.DoesNotExist:
        return Response({'error': USER_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def toggle_payment_status(request, user_id):
    """Toggle user payment status"""
    try:
        user = User.objects.get(id=user_id)
        
        if hasattr(user, 'is_paid'):
            was_unpaid = not user.is_paid
            user.is_paid = not user.is_paid
            user.save()
            
            # Create payment log
            PaymentLog.objects.create(
                user=user,
                amount=0,  # Admin toggle, no payment
                payment_method='admin_toggle',
                status='completed'
            )
            
            # Send email notification if user was just marked as paid
            if was_unpaid and user.is_paid:
                print(f"Sending payment confirmation email to {user.email} for user {user.username}")
                print(f"Email settings: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, USER={settings.EMAIL_HOST_USER}")
                try:
                    subject = 'Payment Confirmed - Your Account is Now Active'
                    message = f'''
Dear {user.username},

Great news! Your payment has been confirmed and your account is now active.

You can now login to the Match Predictor system and start making predictions.

Login URL: http://localhost:3000/login
Username: {user.username}

If you have any questions, please contact the admin.

Best regards,
Match Predictor Team
                    '''
                    result = send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [user.email],
                        fail_silently=False,
                    )
                    print(f"Email send result: {result}")
                except Exception as email_error:
                    print(f"Error sending payment confirmation email: {email_error}")
                    # Log email error but don't fail the payment status update
            else:
                print(f"Not sending email. was_unpaid={was_unpaid}, user.is_paid={user.is_paid}")
        else:
            return Response({'error': 'Payment status not supported for this user'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'Payment status updated successfully',
            'is_paid': user.is_paid
        })
        
    except User.DoesNotExist:
        return Response({'error': USER_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def delete_user(request, user_id):
    """Delete a user"""
    try:
        user = User.objects.get(id=user_id)
        
        # Don't allow deleting self
        if user.id == request.user.id:
            return Response({'error': 'Cannot delete yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.delete()
        
        return Response({'message': 'User deleted successfully'})
        
    except User.DoesNotExist:
        return Response({'error': USER_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def admin_dashboard(request):
    data = {
        'total_users': User.objects.count(),
        'paid_users': User.objects.filter(is_paid=True).count(),
        'unpaid_users': User.objects.filter(is_paid=False).count(),
        'total_matches': Match.objects.count(),
        'scheduled_matches': Match.objects.filter(status='scheduled').count(),
        'finished_matches': Match.objects.filter(status='finished').count(),
        'total_predictions': Prediction.objects.count(),
        'total_points_awarded': Prediction.objects.filter(points_awarded__gt=0).aggregate(
            total=models.Sum('points_awarded'))['total'] or 0,
    }
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def mark_user_paid(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        user.is_paid = True
        user.save()
        return Response({'message': f'User {user.username} marked as paid'})
    except User.DoesNotExist:
        return Response({'error': USER_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def create_match(request):
    serializer = MatchCreateSerializer(data=request.data)
    if serializer.is_valid():
        match = serializer.save()
        return Response(MatchSerializer(match).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def finish_match(request, match_id):
    try:
        match = Match.objects.get(id=match_id)
        score_a = request.data.get('score_a')
        score_b = request.data.get('score_b')
        
        if score_a is None or score_b is None:
            return Response({'error': 'Both scores are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        match.score_a = int(score_a)
        match.score_b = int(score_b)
        match.status = 'finished'
        match.save()
        
        # Award points for all predictions on this match
        predictions = Prediction.objects.filter(match=match, points_awarded__isnull=True)
        awarded_count = 0
        for prediction in predictions:
            prediction.award_points()
            awarded_count += 1
        
        return Response({
            'message': f'Match finished and points awarded for {awarded_count} predictions',
            'match': MatchSerializer(match).data
        })
    except Match.DoesNotExist:
        return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def test_email(request):
    """Test email functionality"""
    try:
        # Log email settings for debugging
        print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        
        subject = 'Test Email - Match Predictor System'
        message = '''
This is a test email to verify that the email system is working.

If you receive this email, the email configuration is correct.

Best regards,
Match Predictor Team
        '''
        
        result = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [request.user.email],  # Send to admin's email
            fail_silently=False,
        )
        
        print(f"Send mail result: {result}")
        
        return Response({
            'message': 'Test email sent successfully',
            'sent_to': request.user.email,
            'email_settings': {
                'host': settings.EMAIL_HOST,
                'port': settings.EMAIL_PORT,
                'use_tls': settings.EMAIL_USE_TLS,
                'from_email': settings.DEFAULT_FROM_EMAIL
            }
        })
    except Exception as e:
        print(f"Email error: {str(e)}")
        return Response({
            'error': f'Failed to send test email: {str(e)}',
            'email_settings': {
                'host': settings.EMAIL_HOST,
                'port': settings.EMAIL_PORT,
                'use_tls': settings.EMAIL_USE_TLS,
                'from_email': settings.DEFAULT_FROM_EMAIL,
                'host_user': settings.EMAIL_HOST_USER
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def export_leaderboard(request):
    users = User.objects.filter(is_paid=True).order_by('-total_points')
    
    output = StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['Rank', 'Username', 'Email', 'Total Points', 'Matches Predicted', 'Exact Predictions'])
    
    for rank, user in enumerate(users, 1):
        matches_predicted = Prediction.objects.filter(user=user).count()
        exact_predictions = Prediction.objects.filter(
            user=user, 
            points_awarded__in=[7, 14]  # 7 points for exact, 14 for exact with 2-star
        ).count()
        
        writer.writerow([
            rank,
            user.username,
            user.email,
            user.total_points,
            matches_predicted,
            exact_predictions
        ])
    
    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="leaderboard.csv"'
    return response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def export_predictions(request):
    match_id = request.query_params.get('match_id')
    tournament_id = request.query_params.get('tournament_id')
    
    predictions = Prediction.objects.all()
    
    if match_id:
        predictions = predictions.filter(match_id=match_id)
    if tournament_id:
        predictions = predictions.filter(match__tournament_id=tournament_id)
    
    predictions = predictions.select_related('user', 'match', 'match__team_a', 'match__team_b')
    
    output = StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        'User', 'Match', 'Team A', 'Team B', 'Predicted A', 'Predicted B', 
        'Actual A', 'Actual B', 'Used 2-Star', 'Points Awarded', 'Created At'
    ])
    
    for prediction in predictions:
        writer.writerow([
            prediction.user.username,
            str(prediction.match),
            prediction.match.team_a.name,
            prediction.match.team_b.name,
            prediction.predicted_a,
            prediction.predicted_b,
            prediction.match.score_a or '',
            prediction.match.score_b or '',
            prediction.used_two_star,
            prediction.points_awarded or '',
            prediction.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="predictions.csv"'
    return response


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def two_star_config(request):
    config = TwoStarConfig.objects.first()
    if not config:
        config = TwoStarConfig.objects.create()
    
    if request.method == 'GET':
        return Response({
            'enabled': config.enabled,
            'max_per_user_per_tournament': config.max_per_user_per_tournament,
            'max_per_user_global': config.max_per_user_global,
            'description': config.description,
        })
    
    elif request.method == 'POST':
        config.enabled = request.data.get('enabled', config.enabled)
        config.max_per_user_per_tournament = request.data.get('max_per_user_per_tournament', config.max_per_user_per_tournament)
        config.max_per_user_global = request.data.get('max_per_user_global', config.max_per_user_global)
        config.description = request.data.get('description', config.description)
        config.save()
        
        return Response({
            'message': 'Two-Star configuration updated',
            'config': {
                'enabled': config.enabled,
                'max_per_user_per_tournament': config.max_per_user_per_tournament,
                'max_per_user_global': config.max_per_user_global,
                'description': config.description,
            }
        })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def create_tournament(request):
    try:
        name = request.data.get('name')
        year = request.data.get('year')
        
        if not name or not year:
            return Response({'error': 'Name and year are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        tournament = Tournament.objects.create(
            name=name,
            year=int(year),
            is_active=request.data.get('is_active', True)
        )
        
        return Response({
            'message': 'Tournament created successfully',
            'tournament': {
                'id': tournament.id,
                'name': tournament.name,
                'year': tournament.year,
                'is_active': tournament.is_active
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def create_group(request):
    try:
        tournament_id = request.data.get('tournament_id')
        name = request.data.get('name')
        
        if not tournament_id or not name:
            return Response({'error': 'Tournament ID and group name are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        tournament = Tournament.objects.get(id=tournament_id)
        group = Group.objects.create(
            tournament=tournament,
            name=name.upper()
        )
        
        return Response({
            'message': 'Group created successfully',
            'group': {
                'id': group.id,
                'name': group.name,
                'tournament': group.tournament.name
            }
        }, status=status.HTTP_201_CREATED)
        
    except Tournament.DoesNotExist:
        return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def get_tournaments_and_groups(request):
    tournaments = Tournament.objects.all().prefetch_related('groups')
    
    data = []
    for tournament in tournaments:
        groups = [{'id': g.id, 'name': g.name} for g in tournament.groups.all()]
        data.append({
            'id': tournament.id,
            'name': tournament.name,
            'year': tournament.year,
            'is_active': tournament.is_active,
            'groups': groups
        })
    
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def create_match_with_group(request):
    try:
        team_a_id = request.data.get('team_a')
        team_b_id = request.data.get('team_b')
        start_time = request.data.get('start_time')
        tournament_id = request.data.get('tournament')
        group_id = request.data.get('group')
        
        if not all([team_a_id, team_b_id, start_time, tournament_id]):
            return Response({'error': 'team_a, team_b, start_time, and tournament are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get objects
        team_a = Team.objects.get(id=team_a_id)
        team_b = Team.objects.get(id=team_b_id)
        tournament = Tournament.objects.get(id=tournament_id)
        
        # Parse start_time
        start_time_dt = timezone.datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
        start_time_dt = timezone.make_aware(start_time_dt)
        
        # Create match
        match_data = {
            'team_a': team_a,
            'team_b': team_b,
            'start_time': start_time_dt,
            'tournament': tournament,
            'venue': request.data.get('venue', ''),
            'match_day': request.data.get('match_day'),
        }
        
        if group_id:
            group = Group.objects.get(id=group_id)
            match_data['group'] = group
        
        match = Match.objects.create(**match_data)
        
        return Response({
            'message': 'Match created successfully',
            'match': {
                'id': match.id,
                'team_a': match.team_a.name,
                'team_b': match.team_b.name,
                'start_time': match.start_time.strftime('%Y-%m-%d %H:%M:%S'),
                'tournament': match.tournament.name,
                'group': match.group.name if match.group else None,
                'venue': match.venue,
                'match_day': match.match_day
            }
        }, status=status.HTTP_201_CREATED)
        
    except Team.DoesNotExist:
        return Response({'error': 'Team not found'}, status=status.HTTP_404_NOT_FOUND)
    except Tournament.DoesNotExist:
        return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
    except Group.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def get_teams(request):
    teams = Team.objects.all().order_by('name')
    data = [{'id': team.id, 'name': team.name, 'country_code': team.country_code} for team in teams]
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def create_team(request):
    try:
        name = request.data.get('name')
        country_code = request.data.get('country_code')
        flag = request.data.get('flag', '')
        
        if not name or not country_code:
            return Response({'error': 'Name and country code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        team = Team.objects.create(
            name=name,
            country_code=country_code.upper(),
            flag=flag
        )
        
        return Response({
            'message': 'Team created successfully',
            'team': {
                'id': team.id,
                'name': team.name,
                'country_code': team.country_code,
                'flag': team.flag
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@user_passes_test(is_admin)
def bulk_import_matches(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    if not file.name.endswith('.csv'):
        return Response({'error': 'File must be a CSV'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        csv_file = file.read().decode('utf-8').splitlines()
        reader = csv.DictReader(csv_file)
        
        created_count = 0
        errors = []
        
        for row_num, row in enumerate(reader, 2):  # Start at 2 to account for header
            try:
                # Create or get teams
                team_a, _ = Team.objects.get_or_create(name=row['team_a'])
                team_b, _ = Team.objects.get_or_create(name=row['team_b'])
                
                # Create or get tournament
                tournament, _ = Tournament.objects.get_or_create(
                    name=row['tournament'],
                    year=int(row['year'])
                )
                
                # Parse start time
                start_time = timezone.datetime.strptime(row['start_time'], '%Y-%m-%d %H:%M:%S')
                start_time = timezone.make_aware(start_time)
                
                # Create match
                Match.objects.create(
                    team_a=team_a,
                    team_b=team_b,
                    start_time=start_time,
                    tournament=tournament,
                    venue=row.get('venue', ''),
                    match_day=int(row.get('match_day', 1))
                )
                
                created_count += 1
                
            except Exception as e:
                errors.append(f'Row {row_num}: {str(e)}')
        
        return Response({
            'message': f'Successfully imported {created_count} matches',
            'errors': errors
        })
        
    except Exception as e:
        return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
